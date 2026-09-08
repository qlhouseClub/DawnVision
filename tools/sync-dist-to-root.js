// 将 web/dist/ 下的文件同步到项目根目录（GitHub Pages 从根目录服务）
const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, '..', 'web', 'dist');
const rootDir = path.join(__dirname, '..');

// 要跳过的目录/文件（不复制到根目录）
const skipItems = ['chunks', 'pages', 'CNAME'];

// 要先删除的旧目录
const dirsToClean = ['_astro', 'articles', 'cao', 'about', 'pagefind', '502', '503', '504', 'chunks', 'pages'];

console.log('清理根目录旧构建产物...');
for (const dir of dirsToClean) {
  const dirPath = path.join(rootDir, dir);
  if (fs.existsSync(dirPath)) {
    fs.rmSync(dirPath, { recursive: true, force: true });
    console.log(`  ✓ 已删除 ${dir}/`);
  }
}

// 也清理根目录下可能存在的零散文件（除了特定文件外）
const rootFilesToKeep = [
  '.git', '.gitignore', 'README.md', 'CNAME',
  'web', 'tools', 'deploy-cn',
  'package.json', 'package-lock.json',
  '.github',
  'node_modules'
];

console.log('\n复制 dist/ 到根目录...');

function copyRecursive(src, dest, skipList) {
  if (!fs.existsSync(src)) return;
  
  const stats = fs.statSync(src);
  
  if (stats.isDirectory()) {
    const basename = path.basename(src);
    if (skipList.includes(basename)) {
      console.log(`  ⏭  跳过 ${basename}/`);
      return;
    }
    
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    
    const items = fs.readdirSync(src);
    for (const item of items) {
      copyRecursive(path.join(src, item), path.join(dest, item), skipList);
    }
  } else {
    const basename = path.basename(src);
    if (skipList.includes(basename)) {
      console.log(`  ⏭  跳过 ${basename}`);
      return;
    }
    fs.copyFileSync(src, dest);
  }
}

copyRecursive(distDir, rootDir, skipItems);

console.log('\n✅ 同步完成！');
