// Sync web/dist to project root for GitHub Pages
const fs = require('fs');
const path = require('path');

const root = __dirname;
const distDir = path.join(root, 'web', 'dist');
const skipDirs = ['chunks', 'pages'];
const skipFiles = ['CNAME'];

// Delete old directories in root
const oldDirs = ['_astro', 'articles', 'cao', 'about', 'pagefind', '502', '503', '504', 'chunks', 'pages'];
for (const dir of oldDirs) {
  const fullPath = path.join(root, dir);
  if (fs.existsSync(fullPath)) {
    fs.rmSync(fullPath, { recursive: true, force: true });
    console.log(`🗑️  Deleted old dir: ${dir}/`);
  }
}

// Delete old files from previous builds (html files at root level with known patterns)
const rootFiles = fs.readdirSync(root);
const oldRootFiles = rootFiles.filter(f => 
  f.endsWith('.html') && !f.startsWith('.') && 
  !['README.md', 'LICENSE', '.gitignore'].includes(f) &&
  fs.statSync(path.join(root, f)).isFile()
);
// Be careful - only delete files we know are from the site build
const safeToDeleteRootFiles = ['index.html', 'rss.xml', 'sitemap.xml', 'version.json'];
for (const f of safeToDeleteRootFiles) {
  const fp = path.join(root, f);
  if (fs.existsSync(fp)) {
    fs.unlinkSync(fp);
    console.log(`🗑️  Deleted old file: ${f}`);
  }
}

// Copy dist contents to root
function copyDir(src, dest, skipDirs = [], skipFiles = []) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  const entries = fs.readdirSync(src, { withFileTypes: true });
  let count = 0;
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      if (skipDirs.includes(entry.name)) continue;
      count += copyDir(srcPath, destPath, skipDirs, skipFiles);
    } else {
      if (skipFiles.includes(entry.name)) continue;
      fs.copyFileSync(srcPath, destPath);
      count++;
    }
  }
  return count;
}

const count = copyDir(distDir, root, skipDirs, skipFiles);
console.log(`\n✅ Copied ${count} files from web/dist/ to project root`);
console.log(`   Skipped dirs: ${skipDirs.join(', ')}`);
console.log(`   Skipped files: ${skipFiles.join(', ')}`);
