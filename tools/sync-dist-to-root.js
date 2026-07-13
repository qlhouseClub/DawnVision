// Sync web/dist -> project root (for GitHub Pages)
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const distDir = path.resolve(rootDir, 'web', 'dist');

// Directories to delete from root before syncing
const dirsToDelete = ['_astro', 'articles', 'cao', 'about', 'pagefind', '502', '503', '504', 'chunks', 'pages', 'images'];

// Items to skip when copying from dist
const skipItems = new Set(['chunks', 'pages', 'CNAME']);

console.log('=== Sync dist -> root ===');

// Delete old directories
for (const dir of dirsToDelete) {
  const fullPath = path.join(rootDir, dir);
  if (fs.existsSync(fullPath)) {
    fs.rmSync(fullPath, { recursive: true, force: true });
    console.log(`  Deleted: ${dir}/`);
  }
}

// Also delete old root-level files (HTML files and other files from previous builds
const rootFilesToKeep = new Set([
  '.git', '.gitignore', 'README.md', 'tools', 'web', 'deploy-cn',
  'package.json', 'package-lock.json',
  // Keep project source files
]);

const rootEntries = fs.readdirSync(rootDir);
for (const entry of rootEntries) {
  const fullPath = path.join(rootDir, entry);
  const stat = fs.statSync(fullPath);
  if (stat.isFile()) {
    // Don't delete project config files
    if (entry.endsWith('.html') || entry === 'robots.txt' || entry === 'sitemap.xml' || 
        entry === 'rss.xml' || entry === 'version.json' || entry === 'favicon.ico' || 
        entry === 'favicon.svg' || entry === '.nojekyll') {
      fs.unlinkSync(fullPath);
      console.log(`  Deleted: ${entry}`);
    }
  }
}

// Copy everything from dist to root
function copyDir(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  const entries = fs.readdirSync(src);
  for (const entry of entries) {
    const srcPath = path.join(src, entry);
    const destPath = path.join(dest, entry);
    const stat = fs.statSync(srcPath);
    if (stat.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

const distEntries = fs.readdirSync(distDir);
let copiedCount = 0;
for (const entry of distEntries) {
  if (skipItems.has(entry)) {
    console.log(`  Skipped: ${entry}`);
    continue;
  }
  const srcPath = path.join(distDir, entry);
  const destPath = path.join(rootDir, entry);
  const stat = fs.statSync(srcPath);
  if (stat.isDirectory()) {
    copyDir(srcPath, destPath);
    console.log(`  Copied dir: ${entry}/`);
  } else {
    fs.copyFileSync(srcPath, destPath);
    console.log(`  Copied file: ${entry}`);
  }
  copiedCount++;
}

console.log(`\n✅ Sync complete. Copied ${copiedCount} items from dist to root.`);
