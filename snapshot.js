import fs from 'fs';
import path from 'path';

const srcDir = path.join(process.cwd(), 'src');
const outputFile = path.join(process.cwd(), 'source-snapshot.txt');

function generateSnapshot() {
  let content = '=== Source Code Snapshot ===\n';
  content += `Generated at: ${new Date().toLocaleString()}\n\n`;

  function readDirRecursive(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        readDirRecursive(fullPath);
      } else if (file.endsWith('.ts') || file.endsWith('.js') || file.endsWith('.json')) {
        const relativePath = path.relative(process.cwd(), fullPath);
        content += `\n\n------------------------------------------------\n`;
        content += `File: ${relativePath}\n`;
        content += `------------------------------------------------\n\n`;
        content += fs.readFileSync(fullPath, 'utf-8');
      }
    }
  }

  try {
    readDirRecursive(srcDir);
    
    // Include package.json as well
    content += `\n\n------------------------------------------------\n`;
    content += `File: package.json\n`;
    content += `------------------------------------------------\n\n`;
    content += fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf-8');

    fs.writeFileSync(outputFile, content, 'utf-8');
    console.log(`[Snapshot] source-snapshot.txt updated at ${new Date().toLocaleTimeString()}`);
  } catch (err) {
    console.error('[Snapshot] Error generating snapshot:', err);
  }
}

// Generate once initially
generateSnapshot();

// Watch mode if flag is provided
if (process.argv.includes('--watch')) {
  console.log(`Watching for changes in ${srcDir}...`);
  
  // Use a simple debounce to avoid generating multiple snapshots for a single save
  let debounceTimeout;
  fs.watch(srcDir, { recursive: true }, (eventType, filename) => {
    if (filename) {
      clearTimeout(debounceTimeout);
      debounceTimeout = setTimeout(() => {
        generateSnapshot();
      }, 500);
    }
  });
}
