import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

export const ALLOWED_PUBLIC_KEYS = [
  'claim_id',
  'site_section_id',
  'content_type',
  'translations',
];
const ALLOWED_PUBLIC_LINK_KEYS = [...ALLOWED_PUBLIC_KEYS, 'url'];

const ALLOWED_TRANSLATION_KEYS = ['pt-BR', 'en'];
const ALLOWED_LOCALE_KEYS = ['text'];
const SECTION_IDS = new Set([
  'opening',
  'context-problem',
  'living-lab-concepts',
  'environment-project-distinction',
  'methodology',
  'framework-contribution',
  'results-implications',
  'full-thesis',
  'author-profile',
  'references',
]);
const EDITORIAL_KEYS = new Set([
  'schema_version',
  'items',
]);
const ITEM_KEYS = new Set([
  'claim_id',
  'site_section_id',
  'content_type',
  'url',
  'source',
  'translations',
  'verification_status',
  'approval_status',
  'publication_status',
  'review_note',
]);
const THESIS_SOURCE_KEYS = new Set(['thesis_identifier', 'locator', 'excerpt_or_note']);
const AUTHOR_LINK_SOURCE_KEYS = new Set(['source_type', 'attribution', 'locator', 'excerpt_or_note']);
const TRANSLATION_KEYS = new Set(['text', 'translation_status']);
const INTERNAL_FIELD_NAMES = [
  'verification_status',
  'translation_status',
  'approval_status',
  'publication_status',
  'review_note',
  'excerpt_or_note',
  'thesis_identifier',
  'source_locator',
  'source_excerpt',
  'source_type',
  'attribution',
];
const INTERNAL_SOURCE_KEY_PATTERN = /["'](?:source|locator)["']\s*:/u;

function hasOnlyKeys(value, allowed, label) {
  const unknown = Object.keys(value).filter((key) => !allowed.has(key));
  if (unknown.length) {
    throw new Error(`${label} has unknown field(s): ${unknown.join(', ')}`);
  }
}

function requireText(value, label) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`${label} must be a non-empty string`);
  }
}

function validateHttpsUrl(value, label) {
  requireText(value, label);
  if (value !== value.trim()) throw new Error(`${label} must not contain surrounding whitespace`);
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`${label} must be a valid HTTPS URL`);
  }
  if (parsed.protocol !== 'https:' || !parsed.hostname || parsed.username || parsed.password) {
    throw new Error(`${label} must be a valid HTTPS URL without credentials`);
  }
}

function validateLocale(translation, locale, claimId) {
  if (!translation || typeof translation !== 'object' || Array.isArray(translation)) {
    throw new Error(`${claimId}: missing translation object for ${locale}`);
  }
  hasOnlyKeys(translation, new Set(TRANSLATION_KEYS), `${claimId} translations.${locale}`);
  requireText(translation.text, `${claimId} translations.${locale}.text`);
  if (translation.translation_status !== 'translated') {
    throw new Error(`${claimId}: ${locale} translation is not marked translated`);
  }
}

export function validateEditorial(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error('Editorial root must be an object');
  }
  hasOnlyKeys(data, EDITORIAL_KEYS, 'Editorial root');
  if (data.schema_version !== '1.1') {
    throw new Error('schema_version must be 1.1');
  }
  if (!Array.isArray(data.items)) {
    throw new Error('items must be an array');
  }

  const ids = new Set();
  for (const [index, item] of data.items.entries()) {
    const label = `items[${index}]`;
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      throw new Error(`${label} must be an object`);
    }
    hasOnlyKeys(item, ITEM_KEYS, label);
    requireText(item.claim_id, `${label}.claim_id`);
    if (ids.has(item.claim_id)) {
      throw new Error(`Duplicate claim_id: ${item.claim_id}`);
    }
    ids.add(item.claim_id);
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.claim_id)) {
      throw new Error(`${label}.claim_id must be a stable lowercase slug`);
    }
    if (!SECTION_IDS.has(item.site_section_id)) {
      throw new Error(`${item.claim_id}: unknown site_section_id ${item.site_section_id}`);
    }
    requireText(item.content_type, `${item.claim_id}.content_type`);

    if (!item.source || typeof item.source !== 'object' || Array.isArray(item.source)) {
      throw new Error(`${item.claim_id}: source reference is required`);
    }
    if (item.content_type === 'link') {
      hasOnlyKeys(item.source, AUTHOR_LINK_SOURCE_KEYS, `${item.claim_id}.source`);
      if (item.source.source_type !== 'author-provided') {
        throw new Error(`${item.claim_id}: link source must be author-provided`);
      }
      requireText(item.source.attribution, `${item.claim_id}.source.attribution`);
      requireText(item.source.locator, `${item.claim_id}.source.locator`);
      requireText(item.source.excerpt_or_note, `${item.claim_id}.source.excerpt_or_note`);
      validateHttpsUrl(item.url, `${item.claim_id}.url`);
    } else {
      hasOnlyKeys(item.source, THESIS_SOURCE_KEYS, `${item.claim_id}.source`);
      requireText(item.source.thesis_identifier, `${item.claim_id}.source.thesis_identifier`);
      requireText(item.source.locator, `${item.claim_id}.source.locator`);
      requireText(item.source.excerpt_or_note, `${item.claim_id}.source.excerpt_or_note`);
      if (item.url !== undefined && item.content_type !== 'reference') {
        throw new Error(`${item.claim_id}: url is only allowed for link or reference content`);
      }
      if (item.url !== undefined) validateHttpsUrl(item.url, `${item.claim_id}.url`);
    }

    if (!item.translations || typeof item.translations !== 'object' || Array.isArray(item.translations)) {
      throw new Error(`${item.claim_id}: translations are required`);
    }
    hasOnlyKeys(item.translations, new Set(ALLOWED_TRANSLATION_KEYS), `${item.claim_id}.translations`);
    for (const locale of ALLOWED_TRANSLATION_KEYS) {
      validateLocale(item.translations[locale], locale, item.claim_id);
    }
    const validVerification = item.content_type === 'link'
      ? item.verification_status === 'not_applicable'
      : item.verification_status === 'verified_in_thesis';
    if (!validVerification) {
      throw new Error(`${item.claim_id}: source verification is pending`);
    }
    if (item.approval_status !== 'approved') {
      throw new Error(`${item.claim_id}: author approval is pending`);
    }
    if (item.publication_status !== 'eligible') {
      throw new Error(`${item.claim_id}: item is restricted or not eligible for publication`);
    }
    if (item.review_note !== undefined && typeof item.review_note !== 'string') {
      throw new Error(`${item.claim_id}: review_note must be a string`);
    }
  }
  return data;
}

export function projectPublicContent(data) {
  validateEditorial(data);
  return {
    schema_version: '1.1',
    items: data.items.map((item) => ({
      claim_id: item.claim_id,
      site_section_id: item.site_section_id,
      content_type: item.content_type,
      translations: {
        'pt-BR': { text: item.translations['pt-BR'].text },
        en: { text: item.translations.en.text },
      },
      ...(item.url !== undefined ? { url: item.url } : {}),
    })),
  };
}

function assertPublicShape(publicData) {
  if (!publicData || typeof publicData !== 'object' || Array.isArray(publicData)
    || Object.keys(publicData).sort().join(',') !== 'items,schema_version'
    || publicData.schema_version !== '1.1' || !Array.isArray(publicData.items)) {
    throw new Error('Public content has an invalid root shape');
  }
  const ids = new Set();
  for (const item of publicData.items) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      throw new Error('Public item must be an object');
    }
    const keys = Object.keys(item);
    const allowedKeys = Object.hasOwn(item, 'url') ? ALLOWED_PUBLIC_LINK_KEYS : ALLOWED_PUBLIC_KEYS;
    if (keys.length !== allowedKeys.length || keys.some((key) => !allowedKeys.includes(key))) {
      throw new Error('Public item contains a forbidden or missing field');
    }
    requireText(item.claim_id, 'Public item claim_id');
    if (ids.has(item.claim_id)) throw new Error(`Duplicate public claim_id: ${item.claim_id}`);
    ids.add(item.claim_id);
    if (!SECTION_IDS.has(item.site_section_id)) {
      throw new Error(`${item.claim_id}: unknown public site_section_id ${item.site_section_id}`);
    }
    requireText(item.content_type, `${item.claim_id}.content_type`);
    if (item.content_type === 'link' && !Object.hasOwn(item, 'url')) {
      throw new Error(`${item.claim_id}: public link is missing its URL`);
    }
    if (Object.hasOwn(item, 'url')) {
      if (!['link', 'reference'].includes(item.content_type)) {
        throw new Error(`${item.claim_id}: URL is not allowed for this content type`);
      }
      validateHttpsUrl(item.url, `${item.claim_id}.url`);
    }
    if (!item.translations || Object.keys(item.translations).sort().join(',') !== 'en,pt-BR') {
      throw new Error('Public item must contain exactly pt-BR and en translations');
    }
    for (const locale of ALLOWED_TRANSLATION_KEYS) {
      const translation = item.translations[locale];
      if (!translation || Object.keys(translation).length !== 1 || typeof translation.text !== 'string'
        || translation.text.trim() === '') {
        throw new Error('Public translation contains forbidden or missing fields');
      }
    }
  }
}

export function validatePublicContent(publicData) {
  assertPublicShape(publicData);
  return publicData;
}

async function listFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const absolute = path.join(directory, entry.name);
    return entry.isDirectory() ? listFiles(absolute) : [absolute];
  }));
  return nested.flat();
}

export async function inspectArtifact(distDirectory, expectedPublic, editorialData) {
  assertPublicShape(expectedPublic);
  const contentFile = path.join(distDirectory, 'content.json');
  let builtContent;
  try {
    builtContent = JSON.parse(await readFile(contentFile, 'utf8'));
  } catch {
    throw new Error('Final artifact is missing a valid content.json');
  }
  assertPublicShape(builtContent);
  if (JSON.stringify(builtContent) !== JSON.stringify(expectedPublic)) {
    throw new Error('Final artifact content differs from the validated public projection');
  }

  const forbiddenValues = [];
  for (const item of editorialData?.items ?? []) {
    forbiddenValues.push(
      item.source.thesis_identifier,
      item.source.locator,
      item.source.excerpt_or_note,
      item.review_note,
    );
  }
  const files = await listFiles(distDirectory);
  for (const file of files) {
    const contents = await readFile(file);
    const text = contents.toString('utf8');
    for (const fieldName of INTERNAL_FIELD_NAMES) {
      if (text.includes(fieldName)) {
        throw new Error(`Final artifact contains forbidden editorial field: ${fieldName}`);
      }
    }
    if (INTERNAL_SOURCE_KEY_PATTERN.test(text)) {
      throw new Error('Final artifact contains a forbidden source metadata field');
    }
    for (const value of forbiddenValues) {
      if (value && text.includes(value)) {
        throw new Error('Final artifact contains internal editorial metadata');
      }
    }
  }
  return true;
}

export async function preparePublicContent({ sourceFile, publicFile }) {
  const data = JSON.parse(await readFile(sourceFile, 'utf8'));
  const publicContent = projectPublicContent(data);
  await mkdir(path.dirname(publicFile), { recursive: true });
  await writeFile(publicFile, `${JSON.stringify(publicContent, null, 2)}\n`, 'utf8');
  return publicContent;
}

export async function readPublicContent(publicFile) {
  const publicData = JSON.parse(await readFile(publicFile, 'utf8'));
  return validatePublicContent(publicData);
}

export async function clearPublicContent(publicFile) {
  await rm(publicFile, { force: true });
}
