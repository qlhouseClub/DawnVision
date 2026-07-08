<#
.SYNOPSIS
    DawnVision 国内服务器一键部署脚本
.DESCRIPTION
    使用国内域名(www.dawnvision.cn)构建Astro站点，部署到腾讯云服务器
    流程: 校验内容 -> 构建(国内域名) -> 上传服务器 -> 切换Nginx -> 验证
.PARAMETER SkipBuild
    跳过构建，使用已有的web/dist目录
.PARAMETER NoReload
    只上传文件，不切换Nginx配置
.EXAMPLE
    .\deploy-cn\deploy.ps1                  # 完整构建+部署
    .\deploy-cn\deploy.ps1 -SkipBuild       # 跳过构建，直接部署已有产物
#>

param(
    [switch]$SkipBuild,
    [switch]$NoReload
)

$ErrorActionPreference = "Stop"

# ── 配置 ──
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$WebDir = Join-Path $ProjectRoot "web"
$DistDir = Join-Path $WebDir "dist"
$CnDeployDir = Join-Path $ProjectRoot "deploy-cn"
$ServerHost = "ubuntu@110.42.236.22"
$ServerAlias = "dawnvision"
$WebRoot = "/var/www/dawnvision"

# 国内域名
$env:SITE_URL = "https://www.dawnvision.cn"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  DawnVision 国内服务器部署" -ForegroundColor Cyan
Write-Host "  域名: www.dawnvision.cn" -ForegroundColor Cyan
Write-Host "  服务器: 110.42.236.22" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ── Step 1: 构建 ──
if (-not $SkipBuild) {
    Write-Host "[1/4] 构建国内版站点 (SITE_URL=$env:SITE_URL)..." -ForegroundColor Yellow

    Push-Location $WebDir

    # 清理旧构建
    if (Test-Path $DistDir) {
        Remove-Item -Recurse -Force $DistDir
    }

    # 检查依赖
    if (-not (Test-Path (Join-Path $WebDir "node_modules"))) {
        Write-Host "  安装依赖..." -ForegroundColor Gray
        npm install
    }

    # 构建（设置环境变量）
    Write-Host "  运行 astro build..." -ForegroundColor Gray
    $env:SITE_URL = "https://www.dawnvision.cn"
    npx astro build

    if ($LASTEXITCODE -ne 0) {
        Write-Host "  ✗ 构建失败" -ForegroundColor Red
        Pop-Location
        exit 1
    }

    Pop-Location

    # 验证构建产物
    Write-Host "  验证构建产物..." -ForegroundColor Gray
    $requiredFiles = @("index.html", "articles/index.html", "about/index.html", "cao/index.html", "404.html")
    $allExist = $true
    foreach ($f in $requiredFiles) {
        $fp = Join-Path $DistDir $f
        if (-not (Test-Path $fp)) {
            Write-Host "  ✗ 缺少: $f" -ForegroundColor Red
            $allExist = $false
        }
    }
    if (-not $allExist) {
        Write-Host "  ✗ 构建产物不完整" -ForegroundColor Red
        exit 1
    }

    # 删除CNAME文件（国内部署不需要GitHub Pages的CNAME）
    $cnameFile = Join-Path $DistDir "CNAME"
    if (Test-Path $cnameFile) {
        Remove-Item $cnameFile
        Write-Host "  已移除CNAME文件（GitHub Pages专用）" -ForegroundColor Gray
    }

    $articleCount = (Get-ChildItem -Path (Join-Path $DistDir "articles") -Directory -ErrorAction SilentlyContinue).Count
    Write-Host "  ✓ 构建完成，共 $articleCount 篇文章" -ForegroundColor Green
}
else {
    Write-Host "[1/4] 跳过构建，使用已有产物: $DistDir" -ForegroundColor Yellow
    if (-not (Test-Path $DistDir)) {
        Write-Host "  ✗ 构建产物目录不存在，请先构建或去掉 -SkipBuild" -ForegroundColor Red
        exit 1
    }
}

# ── Step 2: 测试服务器连接 ──
Write-Host ""
Write-Host "[2/4] 连接服务器..." -ForegroundColor Yellow

$sshTest = ssh -o ConnectTimeout=10 -o BatchMode=yes $ServerAlias "echo ok" 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ✗ SSH连接失败，请检查密钥配置" -ForegroundColor Red
    Write-Host "  尝试使用密码连接: ssh $ServerHost" -ForegroundColor Gray
    exit 1
}
Write-Host "  ✓ 服务器连接正常" -ForegroundColor Green

# ── Step 3: 上传文件 ──
Write-Host ""
Write-Host "[3/4] 上传网站文件..." -ForegroundColor Yellow

# 确保网站目录存在
ssh $ServerAlias "sudo mkdir -p $WebRoot && sudo chown -R ubuntu:ubuntu $WebRoot"

# 使用rsync同步（高效，只传变更文件）
$rsyncAvailable = Get-Command rsync -ErrorAction SilentlyContinue

if ($rsyncAvailable) {
    Write-Host "  使用rsync同步..." -ForegroundColor Gray
    rsync -avz --delete -e "ssh" "$DistDir/" "${ServerAlias}:$WebRoot/"
}
else {
    Write-Host "  使用scp上传..." -ForegroundColor Gray
    # 清空目标目录
    ssh $ServerAlias "rm -rf $WebRoot/*"
    # 上传所有文件
    scp -r "$DistDir"/* "${ServerAlias}:$WebRoot/"
}

# 设置正确权限
ssh $ServerAlias "sudo chown -R www-data:www-data $WebRoot"

Write-Host "  ✓ 文件上传完成" -ForegroundColor Green

# ── Step 4: 配置Nginx ──
if (-not $NoReload) {
    Write-Host ""
    Write-Host "[4/4] 更新Nginx配置..." -ForegroundColor Yellow

    # 上传Nginx配置
    $nginxConfLocal = Join-Path $CnDeployDir "nginx-dawnvision-cn.conf"
    scp $nginxConfLocal "${ServerAlias}:/tmp/nginx-dawnvision-cn.conf"

    # 备份旧配置并替换
    ssh $ServerAlias "sudo cp /etc/nginx/sites-available/dawnvision-proxy /etc/nginx/sites-available/dawnvision-proxy.bak && sudo cp /tmp/nginx-dawnvision-cn.conf /etc/nginx/sites-available/dawnvision-proxy"

    # 测试配置
    $nginxTest = ssh $ServerAlias "sudo nginx -t 2>&1"
    if ($nginxTest -notmatch "successful|ok") {
        Write-Host "  ✗ Nginx配置测试失败:" -ForegroundColor Red
        Write-Host $nginxTest
        # 回滚
        Write-Host "  回滚到旧配置..." -ForegroundColor Yellow
        ssh $ServerAlias "sudo cp /etc/nginx/sites-available/dawnvision-proxy.bak /etc/nginx/sites-available/dawnvision-proxy && sudo systemctl reload nginx"
        exit 1
    }

    # 重载Nginx
    ssh $ServerAlias "sudo systemctl restart nginx"
    Write-Host "  ✓ Nginx已重启，静态站点模式生效" -ForegroundColor Green
}
else {
    Write-Host ""
    Write-Host "[4/4] 跳过Nginx重载 (-NoReload)" -ForegroundColor Yellow
}

# ── 完成 ──
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  ✓ 部署完成!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "访问地址:" -ForegroundColor Cyan
Write-Host "  https://dawnvision.cn" -ForegroundColor White
Write-Host "  https://www.dawnvision.cn" -ForegroundColor White
Write-Host ""
Write-Host "验证命令:" -ForegroundColor Gray
Write-Host "  curl -I https://www.dawnvision.cn" -ForegroundColor Gray
Write-Host ""
