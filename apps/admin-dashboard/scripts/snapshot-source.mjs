import { readdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

const rootDir = process.cwd();
const outputFile = 'source-code-snapshot.txt';
const outputPath = path.join(rootDir, outputFile);

const ignoredDirectories = new Set([
  '.git',
  '.idea',
  '.vscode',
  'dist',
  'dist-ssr',
  'node_modules',
]);

const ignoredFiles = new Set([
  outputFile,
  'package-lock.json',
]);

const allowedExtensions = new Set([
  '.css',
  '.html',
  '.js',
  '.json',
  '.jsx',
  '.md',
  '.mjs',
  '.svg',
  '.ts',
  '.tsx',
]);

const allowedFileNames = new Set([
  '.env.example',
  '.gitignore',
]);

function toRelativePath(filePath) {
  return path.relative(rootDir, filePath).replaceAll(path.sep, '/');
}

function shouldIncludeFile(filePath) {
  const fileName = path.basename(filePath);
  const extension = path.extname(filePath);

  return (
    !ignoredFiles.has(fileName) &&
    (allowedExtensions.has(extension) || allowedFileNames.has(fileName))
  );
}

async function collectSourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      if (!ignoredDirectories.has(entry.name)) {
        files.push(...(await collectSourceFiles(fullPath)));
      }

      continue;
    }

    if (entry.isFile() && shouldIncludeFile(fullPath)) {
      files.push(fullPath);
    }
  }

  return files;
}

function formatFileBlock(relativePath, content) {
  return [
    '='.repeat(80),
    `FILE: ${relativePath}`,
    '='.repeat(80),
    content.trimEnd(),
    '',
  ].join('\n');
}

async function snapshotSourceCode() {
  const files = (await collectSourceFiles(rootDir)).sort((a, b) =>
    toRelativePath(a).localeCompare(toRelativePath(b)),
  );

  const blocks = [];

  for (const filePath of files) {
    const fileStats = await stat(filePath);

    if (fileStats.size === 0) {
      continue;
    }

    const relativePath = toRelativePath(filePath);
    const content = await readFile(filePath, 'utf8');
    blocks.push(formatFileBlock(relativePath, content));
  }

  const snapshot = [
    `Source code snapshot for ${path.basename(rootDir)}`,
    `Generated at: ${new Date().toISOString()}`,
    `Files included: ${blocks.length}`,
    '',
    ...blocks,
  ].join('\n');

  await writeFile(outputPath, snapshot, 'utf8');
  console.log(`Snapshot written to ${outputFile}`);
  console.log(`Files included: ${blocks.length}`);
}

await snapshotSourceCode();
