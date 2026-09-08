// 同步 web/dist/ 到项目根目录（GitHub Pages 从根目录服务）
const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const distDir = path.join(__dirname, '..', 'web', 'dist');

// 要从根目录删除的旧目录
const dirsToDelete = ['_astro', 'articles', 'cao', 'about', 'pagefind', '502', '503', '504', 'chunks', 'pages'];

// 要跳过的文件/目录（从 dist 复制到根目录时跳过）
const skipItems = ['chunks', 'pages', 'CNAME'];

console.log('🔄 同步 dist/ 到项目根目录...\n');

// 1. 删除根目录旧文件
console.log('1/3 清理旧构建产物...');
for (const dir of dirsToDelete) {
  const dirPath = path.join(projectRoot, dir);
  if (fs.existsSync(dirPath)) {
    fs.rmSync(dirPath, { recursive: true, force: true });
    console.log(`   ✓ 删除 ${dir}/`);
  }
}

// 也删除根目录下的一些常见构建文件
const filesToDelete = ['rss.xml', 'sitemap.xml', 'version.json', 'favicon.svg', 'site.webmanifest'];
for (const file of filesToDelete) {
  const filePath = path.join(projectRoot, file);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

// 2. 复制 dist 内容到根目录
console.log('\n2/3 复制新构建产物...');

function copyDir(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const items = fs.readdirSync(src);
  for (const item of items) {
    if (skipItems.includes(item)) continue;
    
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

copyDir(distDir, projectRoot);
console.log('   ✓ 复制完成');

// 3. 验证
console.log('\n3/3 验证...');
const checkFiles = ['index.html', 'rss.xml', 'sitemap.xml'];
for (const f of checkFiles) {
  const exists = fs.existsSync(path.join(projectRoot, f));
  console.log(`   ${exists ? '✓' : '✗'} ${f}`);
}

const checkDirs = ['articles', 'cao', 'about', '_astro'];
for (const d of checkDirs) {
  const exists = fs.existsSync(path.join(projectRoot, d));
  console.log(`   ${exists ? '✓' : '✗'} ${d}/`);
}

console.log('\n✅ 同步完成！');
