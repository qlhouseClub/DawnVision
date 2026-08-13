const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const distDir = path.join(__dirname, 'dist');

// Directories to delete from root first
const dirsToDelete = [
  '_astro', 'articles', 'cao', 'about', 'pagefind',
  '502', '503', '504', 'chunks', 'pages'
];

// Items to skip when copying from dist
const skipItems = new Set(['chunks', 'pages', 'CNAME']);

console.log('Syncing dist/ to project root...');

// Step 1: Delete old directories
for (const dir of dirsToDelete) {
  const target = path.join(projectRoot, dir);
  if (fs.existsSync(target)) {
    fs.rmSync(target, { recursive: true, force: true });
    console.log(`  Deleted old ${dir}/`);
  }
}

// Step 2: Copy all files from dist to root, skipping chunks/pages/CNAME
function copyDir(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      if (skipItems.has(entry.name)) continue;
      copyDir(srcPath, destPath);
    } else {
      if (skipItems.has(entry.name)) continue;
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

copyDir(distDir, projectRoot);

// Also delete stray files at root level that match known patterns
const rootFiles = fs.readdirSync(projectRoot);
const keepRootItems = new Set([
  '.git', '.gitignore', 'web', 'tools', 'deploy-cn',
  'README.md', 'CNAME', '.nojekyll',
  'package.json', 'package-lock.json'
]);

console.log('  Copy complete.');
console.log('Done.');
