#!/usr/bin/env node
/**
 * DawnVision CN Deploy Script
 * Builds with SITE_URL=https://www.dawnvision.cn and deploys to Tencent Cloud
 * Usage: node deploy-cn/deploy.js [--skip-build] [--no-reload]
 */
const { execSync, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const WEB_DIR = path.join(PROJECT_ROOT, 'web');
const DIST_DIR = path.join(WEB_DIR, 'dist');
const SERVER_ALIAS = 'dawnvision';
const WEB_ROOT = '/var/www/dawnvision';
const SITE_URL = 'https://www.dawnvision.cn';

const args = process.argv.slice(2);
const skipBuild = args.includes('--skip-build');
const noReload = args.includes('--no-reload');

function sh(cmd, opts = {}) {
  console.log(`  $ ${cmd}`);
  try {
    return execSync(cmd, {
      cwd: opts.cwd || PROJECT_ROOT,
      stdio: opts.silent ? 'pipe' : 'inherit',
      env: { ...process.env, ...opts.env },
      encoding: 'utf-8',
      timeout: opts.timeout || 300000,
    });
  } catch (e) {
    if (opts.ignoreError) return e.stdout || '';
    console.error(`Command failed: ${cmd}`);
    if (opts.silent) console.error(e.stdout, e.stderr);
    process.exit(1);
  }
}

function ssh(remoteCmd, opts = {}) {
  return sh(`ssh ${SERVER_ALIAS} "${remoteCmd.replace(/"/g, '\\"')}"`, opts);
}

function scpUp(localPath, remotePath) {
  sh(`scp -r -q "${localPath}" "${SERVER_ALIAS}:${remotePath}"`, { silent: false });
}

function rimraf(p) {
  if (fs.existsSync(p)) {
    try {
      fs.rmSync(p, { recursive: true, force: true, maxRetries: 3, retryDelay: 200 });
    } catch (e) {
      // Some files may be locked on Windows; try again after a delay
      try {
        const wait = (ms) => new Promise(r => setTimeout(r, ms));
        // Sync retry
        execSync(`ping -n 2 127.0.0.1 >nul`, { windowsHide: true });
        fs.rmSync(p, { recursive: true, force: true });
      } catch (e2) {
        // ignore - we'll filter it out during upload
      }
    }
  }
}

console.log('');
console.log('========================================');
console.log('  DawnVision CN Deploy');
console.log(`  Domain: ${SITE_URL}`);
console.log('  Server: 110.42.236.22 (Tencent Cloud)');
console.log('========================================');
console.log('');

// Step 1: Build
if (!skipBuild) {
  console.log('[1/4] Building CN site...');
  rimraf(DIST_DIR);
  rimraf(path.join(WEB_DIR, '.astro'));

  process.env.SITE_URL = SITE_URL;
  console.log(`  SITE_URL=${SITE_URL}`);

  try {
    sh('npx astro build', { cwd: WEB_DIR, env: { SITE_URL }, timeout: 120000, ignoreError: false });
  } catch (e) {
    // Astro on Windows sometimes crashes in the cleanup phase with ENOENT on stale SSR files
    // Check if build output actually exists and is valid
    const indexHtml = path.join(DIST_DIR, 'index.html');
    if (!fs.existsSync(indexHtml)) {
      console.error('Build failed: index.html not found');
      process.exit(1);
    }
    console.log('  (Astro cleanup warning ignored - build output exists)');
  }

  // Clean SSR artifacts and GitHub Pages files
  ['chunks', 'pages', 'CNAME'].forEach(f => rimraf(path.join(DIST_DIR, f)));

  // Verify build
  const required = ['index.html', 'articles/index.html', 'about/index.html', 'cao/index.html', '404.html'];
  let allExist = true;
  for (const f of required) {
    if (!fs.existsSync(path.join(DIST_DIR, f))) {
      console.error(`  Missing: ${f}`);
      allExist = false;
    }
  }
  if (!allExist) process.exit(1);

  // Count articles
  const articlesDir = path.join(DIST_DIR, 'articles');
  const articleCount = fs.existsSync(articlesDir)
    ? fs.readdirSync(articlesDir).filter(d => fs.statSync(path.join(articlesDir, d)).isDirectory() && d !== 'page').length
    : 0;
  console.log(`  Build complete: ${articleCount} articles`);
} else {
  console.log('[1/4] Skipping build (--skip-build)');
  if (!fs.existsSync(DIST_DIR)) {
    console.error('dist/ not found');
    process.exit(1);
  }
  // Still clean SSR artifacts
  ['chunks', 'pages', 'CNAME'].forEach(f => rimraf(path.join(DIST_DIR, f)));
}

// Step 2: Test SSH
console.log('');
console.log('[2/4] Testing server connection...');
try {
  const out = sh(`ssh -o ConnectTimeout=10 -o BatchMode=yes ${SERVER_ALIAS} "echo ok"`, { silent: true });
  if (!out.includes('ok')) throw new Error('unexpected response');
  console.log('  SSH connection OK');
} catch (e) {
  console.error('  SSH connection failed. Try: ssh dawnvision');
  process.exit(1);
}

// Step 3: Upload
console.log('');
console.log('[3/4] Uploading files...');
ssh(`sudo mkdir -p ${WEB_ROOT} && sudo chown -R ubuntu:ubuntu ${WEB_ROOT} && rm -rf ${WEB_ROOT}/* ${WEB_ROOT}/.[!.]* 2>/dev/null && echo cleaned`);

const items = fs.readdirSync(DIST_DIR).filter(item => {
    // Skip SSR artifacts and GitHub Pages files
    const skip = ['chunks', 'pages', 'CNAME'];
    return !skip.includes(item);
  });
for (const item of items) {
  const fullPath = path.join(DIST_DIR, item);
  console.log(`  -> ${item}`);
  scpUp(fullPath, WEB_ROOT + '/');
}

ssh(`sudo chown -R www-data:www-data ${WEB_ROOT} && sudo chmod -R 755 ${WEB_ROOT} && echo permissions_set`);
console.log('  Upload complete');

// Step 4: Nginx
if (!noReload) {
  console.log('');
  console.log('[4/4] Updating Nginx config...');
  const nginxLocal = path.join(__dirname, 'nginx-dawnvision-cn.conf');
  scpUp(nginxLocal, '/tmp/nginx-dawnvision-cn.conf');
  ssh(`sudo cp /tmp/nginx-dawnvision-cn.conf /etc/nginx/sites-available/dawnvision && sudo ln -sf /etc/nginx/sites-available/dawnvision /etc/nginx/sites-enabled/dawnvision && sudo rm -f /etc/nginx/sites-enabled/default && sudo nginx -t && sudo systemctl restart nginx && echo nginx_reloaded`);
  console.log('  Nginx reloaded');
} else {
  console.log('[4/4] Skipping Nginx reload (--no-reload)');
}

// Verify
console.log('');
console.log('  Verifying deployment...');
const urls = ['/', '/articles/', '/about/', '/cao/'];
let allOk = true;
for (const url of urls) {
  try {
    const code = sh(`ssh ${SERVER_ALIAS} "curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1${url}"`, { silent: true }).trim();
    if (code === '200') {
      console.log(`  OK  ${url} -> 200`);
    } else {
      console.log(`  FAIL ${url} -> ${code}`);
      allOk = false;
    }
  } catch (e) {
    console.log(`  FAIL ${url} -> error`);
    allOk = false;
  }
}

console.log('');
console.log('========================================');
if (allOk) {
  console.log('  CN Deploy Complete!');
} else {
  console.log('  Deploy finished with warnings');
}
console.log('========================================');
console.log('');
console.log('Access (during ICP filing):');
console.log('  http://110.42.236.22');
console.log('');
console.log('After ICP filing:');
console.log('  1. sudo certbot --nginx -d dawnvision.cn -d www.dawnvision.cn');
console.log('  2. Edit /etc/nginx/sites-available/dawnvision to enable HTTPS');
console.log('  3. sudo systemctl restart nginx');
console.log('');
