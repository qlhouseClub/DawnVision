<#
.SYNOPSIS
    DawnVision CN server deploy script
.DESCRIPTION
    Build with SITE_URL=https://www.dawnvision.cn and deploy to Tencent Cloud
    During ICP filing: HTTP mode, IP 110.42.236.22 accessible
    After ICP filing: run certbot for SSL, enable HTTPS
#>

param(
    [switch]$SkipBuild,
    [switch]$NoReload
)

$ErrorActionPreference = "Stop"

$ProjectRoot = Split-Path -Parent $PSScriptRoot
$WebDir = Join-Path $ProjectRoot "web"
$DistDir = Join-Path $WebDir "dist"
$CnDeployDir = Join-Path $ProjectRoot "deploy-cn"
$ServerAlias = "dawnvision"
$WebRoot = "/var/www/dawnvision"
$NginxSite = "dawnvision"

$env:SITE_URL = "https://www.dawnvision.cn"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  DawnVision CN Deploy" -ForegroundColor Cyan
Write-Host "  Domain: www.dawnvision.cn (ICP filing in progress)" -ForegroundColor Cyan
Write-Host "  IP: http://110.42.236.22" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Build
if (-not $SkipBuild) {
    Write-Host "[1/4] Building CN site (SITE_URL=$env:SITE_URL)..." -ForegroundColor Yellow
    Push-Location $WebDir
    if (Test-Path $DistDir) { Remove-Item -Recurse -Force $DistDir }
    if (-not (Test-Path (Join-Path $WebDir "node_modules"))) {
        Write-Host "  Installing dependencies..." -ForegroundColor Gray
        npm install
    }
    Write-Host "  Running astro build..." -ForegroundColor Gray
    $env:SITE_URL = "https://www.dawnvision.cn"
    npx astro build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  Build failed" -ForegroundColor Red
        Pop-Location; exit 1
    }
    Pop-Location

    Write-Host "  Verifying build output..." -ForegroundColor Gray
    $requiredFiles = @("index.html", "articles/index.html", "about/index.html", "cao/index.html", "404.html")
    $allExist = $true
    foreach ($f in $requiredFiles) {
        $fp = Join-Path $DistDir $f
        if (-not (Test-Path $fp)) { Write-Host "  Missing: $f" -ForegroundColor Red; $allExist = $false }
    }
    if (-not $allExist) { Write-Host "  Build incomplete" -ForegroundColor Red; exit 1 }

    $cnameFile = Join-Path $DistDir "CNAME"
    if (Test-Path $cnameFile) { Remove-Item $cnameFile }

    $articleCount = (Get-ChildItem -Path (Join-Path $DistDir "articles") -Directory -ErrorAction SilentlyContinue).Count
    Write-Host "  Build complete: $articleCount articles" -ForegroundColor Green
} else {
    Write-Host "[1/4] Skipping build, using existing: $DistDir" -ForegroundColor Yellow
    if (-not (Test-Path $DistDir)) { Write-Host "  dist not found" -ForegroundColor Red; exit 1 }
}

# Step 2: Test SSH
Write-Host ""
Write-Host "[2/4] Connecting to server..." -ForegroundColor Yellow
$null = ssh -o ConnectTimeout=10 -o BatchMode=yes $ServerAlias "echo ok" 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "  SSH connection failed" -ForegroundColor Red; exit 1
}
Write-Host "  SSH OK" -ForegroundColor Green

# Step 3: Upload
Write-Host ""
Write-Host "[3/4] Uploading files..." -ForegroundColor Yellow
ssh $ServerAlias "sudo mkdir -p $WebRoot && sudo chown -R ubuntu:ubuntu $WebRoot"
Write-Host "  Uploading via scp..." -ForegroundColor Gray
ssh $ServerAlias "rm -rf $WebRoot/* $WebRoot/.[!.]* 2>/dev/null; echo cleaned"
$items = Get-ChildItem -Path $DistDir
foreach ($item in $items) {
    Write-Host "  -> $($item.Name)" -ForegroundColor Gray
    scp -r -q $item.FullName "${ServerAlias}:$WebRoot/"
}
ssh $ServerAlias "sudo chown -R www-data:www-data $WebRoot && sudo chmod -R 755 $WebRoot"
Write-Host "  Upload complete" -ForegroundColor Green

# Step 4: Nginx
if (-not $NoReload) {
    Write-Host ""
    Write-Host "[4/4] Updating Nginx config..." -ForegroundColor Yellow
    $nginxConfLocal = Join-Path $CnDeployDir "nginx-dawnvision-cn.conf"
    scp $nginxConfLocal "${ServerAlias}:/tmp/nginx-dawnvision-cn.conf"
    ssh $ServerAlias "sudo cp /etc/nginx/sites-available/$NginxSite /etc/nginx/sites-available/${NginxSite}.bak 2>/dev/null; sudo cp /tmp/nginx-dawnvision-cn.conf /etc/nginx/sites-available/$NginxSite; sudo ln -sf /etc/nginx/sites-available/$NginxSite /etc/nginx/sites-enabled/$NginxSite; sudo rm -f /etc/nginx/sites-enabled/default"
    $nginxTest = ssh $ServerAlias "sudo nginx -t 2>&1"
    if ($nginxTest -notmatch "successful|ok") {
        Write-Host "  Nginx test failed:" -ForegroundColor Red
        Write-Host $nginxTest
        ssh $ServerAlias "sudo cp /etc/nginx/sites-available/${NginxSite}.bak /etc/nginx/sites-available/$NginxSite 2>/dev/null; sudo systemctl reload nginx"
        exit 1
    }
    ssh $ServerAlias "sudo systemctl restart nginx"
    Write-Host "  Nginx restarted" -ForegroundColor Green
} else {
    Write-Host "[4/4] Skipping Nginx reload" -ForegroundColor Yellow
}

# Verify
Write-Host ""
Write-Host "  Verifying deployment..." -ForegroundColor Gray
$checkUrls = @("http://110.42.236.22/", "http://110.42.236.22/articles/")
foreach ($url in $checkUrls) {
    $result = ssh $ServerAlias "curl -s -o /dev/null -w '%{http_code}' $url"
    if ($result -eq "200") { Write-Host "  OK $url -> 200" -ForegroundColor Green }
    else { Write-Host "  FAIL $url -> $result" -ForegroundColor Red }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  CN Deploy Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Access (during ICP filing):" -ForegroundColor Cyan
Write-Host "  http://110.42.236.22" -ForegroundColor White
Write-Host ""
Write-Host "After ICP filing:" -ForegroundColor Cyan
Write-Host "  1. sudo certbot --nginx -d dawnvision.cn -d www.dawnvision.cn" -ForegroundColor Gray
Write-Host "  2. Edit /etc/nginx/sites-available/dawnvision to enable HTTPS block" -ForegroundColor Gray
Write-Host "  3. sudo systemctl restart nginx" -ForegroundColor Gray
Write-Host ""