import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { access } from 'node:fs/promises';
import { preparePublicContent, readPublicContent } from './content-pipeline.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

try {
  const sourceFile = path.join(root, 'content', 'editorial.json');
  const publicFile = path.join(root, 'public', 'content.json');
  try {
    await access(sourceFile);
    await preparePublicContent({ sourceFile, publicFile });
    console.log('Private editorial source validated and projected to public content.');
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    await readPublicContent(publicFile);
    console.log('Public content validated without private editorial records.');
  }
} catch (error) {
  console.error(`Content validation failed: ${error.message}`);
  process.exitCode = 1;
}
