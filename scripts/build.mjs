import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { access, readFile, rm } from 'node:fs/promises';
import { build as viteBuild } from 'vite';
import { inspectArtifact, preparePublicContent, readPublicContent } from './content-pipeline.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceFile = path.join(root, 'content', 'editorial.json');
const publicFile = path.join(root, 'public', 'content.json');
const distDirectory = path.join(root, 'dist');
let editorialData;
let publicContent;

try {
  await rm(distDirectory, { recursive: true, force: true });
  try {
    await access(sourceFile);
    editorialData = JSON.parse(await readFile(sourceFile, 'utf8'));
    publicContent = await preparePublicContent({ sourceFile, publicFile });
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    publicContent = await readPublicContent(publicFile);
  }
  await viteBuild({ root });
  await inspectArtifact(distDirectory, publicContent, editorialData);
  console.log('Production artifact validation passed.');
} catch (error) {
  console.error(`Build blocked: ${error.message}`);
  process.exitCode = 1;
}
