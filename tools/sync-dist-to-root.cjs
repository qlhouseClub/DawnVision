// 同步 web/dist/ 到项目根目录（GitHub Pages 从根目录服务）
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const distDir = path.resolve(__dirname, '..', 'web', 'dist');

// 要先删除的旧目录
const dirsToRemove = [
  '_astro', 'articles', 'cao', 'about', 'pagefind',
  '502', '503', '504', 'chunks', 'pages', 'rss', 'sitemap.xml'
];

console.log('=== 同步 dist → 根目录 ===\n');

// 1. 清理旧的静态资源目录
for (const dir of dirsToRemove) {
  const fullPath = path.join(rootDir, dir);
  if (fs.existsSync(fullPath)) {
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      fs.rmSync(fullPath, { recursive: true, force: true });
      console.log(`  删除目录: ${dir}/`);
    } else if (stat.isFile()) {
      fs.unlinkSync(fullPath);
      console.log(`  删除文件: ${dir}`);
    }
  }
}

// 2. 复制 dist 下所有文件（跳过 chunks、pages、CNAME）
const skipDirs = new Set(['chunks', 'pages']);
const skipFiles = new Set(['CNAME']);

function copyDir(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      if (skipDirs.has(entry.name)) {
        console.log(`  跳过目录: ${entry.name}/`);
        continue;
      }
      copyDir(srcPath, destPath);
    } else {
      if (skipFiles.has(entry.name)) {
        console.log(`  跳过文件: ${entry.name}`);
        continue;
      }
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

copyDir(distDir, rootDir);

console.log('\n✅ 同步完成');
