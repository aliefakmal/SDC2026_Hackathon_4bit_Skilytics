const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '../..');
const srcDir = path.resolve(rootDir, 'src/artifacts/reskill-ai/dist/public');
const destDir = path.resolve(rootDir, 'dist');

if (fs.existsSync(srcDir)) {
  fs.cpSync(srcDir, destDir, { recursive: true });
  console.log('[build] Successfully copied reskill-ai build to /dist');
} else {
  console.warn('[build] Source directory not found:', srcDir);
}
