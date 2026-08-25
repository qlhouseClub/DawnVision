// Sync web/dist/ to project root (for GitHub Pages)
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const distDir = path.resolve(__dirname, '..', 'web', 'dist');

// Directories to delete from root first
const dirsToDelete = ['_astro', 'articles', 'cao', 'about', 'pagefind', '502', '503', '504', 'chunks', 'pages'];

console.log('=== Sync dist -> root ===');

// Step 1: Delete old directories
for (const dir of dirsToDelete) {
  const fullPath = path.join(rootDir, dir);
  if (fs.existsSync(fullPath)) {
    fs.rmSync(fullPath, { recursive: true, force: true });
    console.log(`  Deleted: ${dir}/`);
  }
}

// Also delete old top-level HTML files (index, etc.)
const topLevelFiles = ['index.html', 'rss.xml', 'sitemap.xml', 'version.json', 'favicon.svg', 'og-image.png'];
for (const file of topLevelFiles) {
  const fullPath = path.join(rootDir, file);
  if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
    fs.unlinkSync(fullPath);
    console.log(`  Deleted: ${file}`);
  }
}

// Step 2: Copy all files from dist/, skip chunks, pages, CNAME
const skipItems = new Set(['chunks', 'pages', 'CNAME']);

function copyDir(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  const items = fs.readdirSync(src);
  for (const item of items) {
    if (skipItems.has(item)) continue;
    const srcPath = path.join(src, item);
    const destPath = path.join(dest, item);
    const stat = fs.statSync(srcPath);
    if (stat.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

copyDir(distDir, rootDir);
console.log('  Copy complete.');

// Count files
function countFiles(dir) {
  let count = 0;
  if (!fs.existsSync(dir)) return 0;
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const fullPath = path.join(dir, item);
    if (fs.statSync(fullPath).isDirectory()) {
      count += countFiles(fullPath);
    } else {
      count++;
    }
  }
  return count;
}

const fileCount = countFiles(rootDir) - countFiles(path.join(rootDir, 'web')) - countFiles(path.join(rootDir, 'tools')) - countFiles(path.join(rootDir, 'deploy-cn'));
console.log(`\n✅ Sync complete. Root directory now contains site files.`);
