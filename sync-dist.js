// Sync web/dist/ to project root for GitHub Pages
const fs = require('fs');
const path = require('path');

const rootDir = __dirname;
const distDir = path.join(rootDir, 'web', 'dist');

// Directories to delete from root before syncing
const dirsToDelete = [
  '_astro', 'articles', 'cao', 'about', 'pagefind',
  '502', '503', '504', 'chunks', 'pages'
];

// Files/dirs to skip when copying from dist
const skipItems = new Set(['chunks', 'pages', 'CNAME']);

console.log('=== Syncing dist to project root ===\n');

// Step 1: Delete old directories
for (const dir of dirsToDelete) {
  const fullPath = path.join(rootDir, dir);
  if (fs.existsSync(fullPath)) {
    fs.rmSync(fullPath, { recursive: true, force: true });
    console.log(`  Deleted: ${dir}/`);
  }
}

// Also delete old top-level files (index.html, 404.html, etc.)
const topLevelFiles = ['index.html', '404.html', '500.html', 'favicon.ico', 'favicon.svg', 'robots.txt', 'rss.xml', 'sitemap.xml', 'version.json', '.nojekyll'];
for (const file of topLevelFiles) {
  const fullPath = path.join(rootDir, file);
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
    console.log(`  Deleted: ${file}`);
  }
}

// Also delete images directory
const imagesDir = path.join(rootDir, 'images');
if (fs.existsSync(imagesDir)) {
  fs.rmSync(imagesDir, { recursive: true, force: true });
  console.log(`  Deleted: images/`);
}

// Step 2: Copy everything from dist to root (skip chunks, pages, CNAME)
function copyDir(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    if (skipItems.has(entry.name)) continue;
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
      console.log(`  Copied dir: ${path.relative(rootDir, destPath)}/`);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

copyDir(distDir, rootDir);

console.log('\n=== Sync complete ===');
