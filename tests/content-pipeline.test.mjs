import { afterEach, describe, expect, it } from 'vitest';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {
  inspectArtifact,
  projectPublicContent,
  readPublicContent,
  validateEditorial,
} from '../scripts/content-pipeline.mjs';

const tempDirectories = [];

function validItem(overrides = {}) {
  // Synthetic validator fixture only; it is not thesis content or a real citation.
  return {
    claim_id: 'test-item',
    site_section_id: 'opening',
    content_type: 'test',
    source: {
      thesis_identifier: 'fixture-only-not-a-real-thesis',
      locator: 'fixture-only-not-a-real-page',
      excerpt_or_note: 'internal-test-note-sentinel',
    },
    translations: {
      'pt-BR': { text: 'test text pt', translation_status: 'translated' },
      en: { text: 'test text en', translation_status: 'translated' },
    },
    verification_status: 'verified_in_thesis',
    approval_status: 'approved',
    publication_status: 'eligible',
    review_note: 'internal-review-sentinel',
    ...overrides,
  };
}

function validEditorial(items = [validItem()]) {
  return { schema_version: '1.1', items };
}

async function createTempDirectory() {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'living-labs-validation-'));
  tempDirectories.push(directory);
  return directory;
}

afterEach(async () => {
  await Promise.all(tempDirectories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })));
});

describe('editorial data validation and public projection', () => {
  it('accepts complete bilingual content and projects only allowlisted fields', () => {
    const editorial = validEditorial();
    const projected = projectPublicContent(editorial);
    expect(projected.items[0]).toEqual({
      claim_id: 'test-item',
      site_section_id: 'opening',
      content_type: 'test',
      translations: {
        'pt-BR': { text: 'test text pt' },
        en: { text: 'test text en' },
      },
    });
    expect(JSON.stringify(projected)).not.toContain('internal-test-note-sentinel');
    expect(() => validateEditorial(editorial)).not.toThrow();
  });

  it('projects approved author-provided links without their editorial provenance', () => {
    const link = validItem({
      claim_id: 'author-link',
      site_section_id: 'full-thesis',
      content_type: 'link',
      source: {
        source_type: 'author-provided',
        attribution: 'author',
        locator: 'integration notes',
        excerpt_or_note: 'private-link-provenance-sentinel',
      },
      verification_status: 'not_applicable',
      url: 'https://example.org/thesis',
    });
    const projected = projectPublicContent(validEditorial([link]));
    expect(projected.items[0]).toEqual({
      claim_id: 'author-link',
      site_section_id: 'full-thesis',
      content_type: 'link',
      translations: { 'pt-BR': { text: 'test text pt' }, en: { text: 'test text en' } },
      url: 'https://example.org/thesis',
    });
    expect(JSON.stringify(projected)).not.toContain('private-link-provenance-sentinel');
  });

  it('rejects unsafe URLs and URLs attached to non-link content', () => {
    const link = validItem({
      content_type: 'link',
      source: { source_type: 'author-provided', attribution: 'author', locator: 'notes', excerpt_or_note: 'private' },
      verification_status: 'not_applicable',
      url: 'javascript:alert(1)',
    });
    expect(() => validateEditorial(validEditorial([link]))).toThrow(/valid HTTPS URL/);
    expect(() => validateEditorial(validEditorial([validItem({ url: 'https://example.org' })]))).toThrow(/only allowed for link or reference content/);
  });

  it('projects a thesis-traceable reference URL as a public clickable citation', () => {
    const reference = validItem({
      claim_id: 'thesis-reference',
      site_section_id: 'references',
      content_type: 'reference',
      url: 'https://doi.org/10.0000/example',
    });
    expect(projectPublicContent(validEditorial([reference])).items[0].url).toBe('https://doi.org/10.0000/example');
  });

  it('rejects a scientific item without a source locator', () => {
    const item = validItem({ source: { thesis_identifier: 'thesis', locator: '', excerpt_or_note: 'note' } });
    expect(() => validateEditorial(validEditorial([item]))).toThrow(/source\.locator/);
  });

  it('rejects duplicate stable identifiers', () => {
    expect(() => validateEditorial(validEditorial([validItem(), validItem()]))).toThrow(/Duplicate claim_id/);
  });

  it('rejects a missing stable identifier', () => {
    const item = validItem({ claim_id: '' });
    expect(() => validateEditorial(validEditorial([item]))).toThrow(/claim_id must be a non-empty string/);
  });

  it('rejects references to unknown interface sections', () => {
    expect(() => validateEditorial(validEditorial([validItem({ site_section_id: 'missing-section' })]))).toThrow(/unknown site_section_id/);
  });

  it('rejects restricted and non-eligible content selected for publication', () => {
    expect(() => validateEditorial(validEditorial([validItem({ publication_status: 'restricted' })]))).toThrow(/restricted or not eligible/);
    expect(() => validateEditorial(validEditorial([validItem({ publication_status: 'not-eligible' })]))).toThrow(/restricted or not eligible/);
  });

  it('rejects pending scientific verification, translation, and author approval', () => {
    expect(() => validateEditorial(validEditorial([validItem({ verification_status: 'pending' })]))).toThrow(/verification is pending/);
    const pendingTranslation = validItem({
      translations: {
        'pt-BR': { text: 'test text pt', translation_status: 'pending' },
        en: { text: 'test text en', translation_status: 'translated' },
      },
    });
    expect(() => validateEditorial(validEditorial([pendingTranslation]))).toThrow(/translation is not marked translated/);
    expect(() => validateEditorial(validEditorial([validItem({ approval_status: 'pending' })]))).toThrow(/author approval is pending/);
  });

  it('rejects missing language text and unknown editorial fields', () => {
    const missingLanguage = validItem({ translations: { 'pt-BR': { text: 'test', translation_status: 'translated' } } });
    expect(() => validateEditorial(validEditorial([missingLanguage]))).toThrow(/missing translation object for en/);
    expect(() => validateEditorial({ ...validEditorial(), unexpected: true })).toThrow(/unknown field/);
  });
});

describe('final production artifact inspection', () => {
  it('validates checked-in public content without needing private editorial records', async () => {
    const directory = await createTempDirectory();
    const publicFile = path.join(directory, 'content.json');
    const projected = projectPublicContent(validEditorial());
    await writeFile(publicFile, JSON.stringify(projected));
    await expect(readPublicContent(publicFile)).resolves.toEqual(projected);

    await writeFile(publicFile, JSON.stringify({
      ...projected,
      items: [{ ...projected.items[0], verification_status: 'verified_in_thesis' }],
    }));
    await expect(readPublicContent(publicFile)).rejects.toThrow(/forbidden or missing field/);
  });

  it('inspects an artifact built from public content without private editorial records', async () => {
    const directory = await createTempDirectory();
    const projected = projectPublicContent(validEditorial());
    await writeFile(path.join(directory, 'content.json'), JSON.stringify(projected));
    await expect(inspectArtifact(directory, projected)).resolves.toBe(true);
  });

  it('accepts the exact public projection and rejects internal metadata in the artifact', async () => {
    const directory = await createTempDirectory();
    const editorial = validEditorial();
    const projected = projectPublicContent(editorial);
    await writeFile(path.join(directory, 'content.json'), JSON.stringify(projected));
    await expect(inspectArtifact(directory, projected, editorial)).resolves.toBe(true);

    await writeFile(path.join(directory, 'bundle.js'), 'internal-review-sentinel');
    await expect(inspectArtifact(directory, projected, editorial)).rejects.toThrow(/internal editorial metadata/);
  });

  it('allows the approved public URL field only on link records in production artifacts', async () => {
    const directory = await createTempDirectory();
    const editorial = validEditorial([validItem({
      claim_id: 'public-link',
      content_type: 'link',
      source: { source_type: 'author-provided', attribution: 'author', locator: 'notes', excerpt_or_note: 'private-link-note' },
      verification_status: 'not_applicable',
      url: 'https://example.org/resource',
    })]);
    const projected = projectPublicContent(editorial);
    await writeFile(path.join(directory, 'content.json'), JSON.stringify(projected));
    await expect(inspectArtifact(directory, projected, editorial)).resolves.toBe(true);
  });

  it('rejects forbidden editorial fields in the final public content file', async () => {
    const directory = await createTempDirectory();
    const editorial = validEditorial();
    const projected = projectPublicContent(editorial);
    await writeFile(path.join(directory, 'content.json'), JSON.stringify({
      ...projected,
      items: [{ ...projected.items[0], approval_status: 'approved' }],
    }));
    await expect(inspectArtifact(directory, projected, editorial)).rejects.toThrow(/forbidden or missing field/);
  });

  it('rejects editorial metadata keys anywhere in the final artifact', async () => {
    const directory = await createTempDirectory();
    const editorial = validEditorial();
    const projected = projectPublicContent(editorial);
    await mkdir(path.join(directory, 'assets'));
    await writeFile(path.join(directory, 'content.json'), JSON.stringify(projected));
    await writeFile(path.join(directory, 'assets', 'leak.json'), JSON.stringify({ verification_status: 'verified_in_thesis' }));
    await expect(inspectArtifact(directory, projected, editorial)).rejects.toThrow(/forbidden editorial field/);
  });

  it('rejects source and locator keys in sidecar production files', async () => {
    const directory = await createTempDirectory();
    const editorial = validEditorial();
    const projected = projectPublicContent(editorial);
    await writeFile(path.join(directory, 'content.json'), JSON.stringify(projected));
    await writeFile(path.join(directory, 'leak.json'), JSON.stringify({ source: { locator: 'private-location' } }));
    await expect(inspectArtifact(directory, projected, editorial)).rejects.toThrow(/source metadata field/);
  });
});
