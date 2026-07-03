#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Dawn Vision 部署脚本
.DESCRIPTION
    构建 Astro 站点并部署到 GitHub Pages。
    执行: astro build -> 验证构建产物 -> git commit & push
.PARAMETER NoDeploy
    仅构建不部署
.PARAMETER NoValidate
    跳过构建产物验证
.EXAMPLE
    ./tools/deploy.ps1              # 构建并部署
    ./tools/deploy.ps1 -NoDeploy    # 仅构建
#>

param(
    [switch]$NoDeploy,
    [switch]$NoValidate
)

$ErrorActionPreference = "Stop"

# ── 路径配置 ──
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$WebDir = Join-Path $ProjectRoot "web"
$DistDir = Join-Path $WebDir "dist"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Dawn Vision 部署脚本" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ── Step 1: 校验 ──
if (-not $NoValidate) {
    Write-Host "[1/3] 校验内容..." -ForegroundColor Yellow

    # 检查 content/issues 目录
    $issuesDir = Join-Path $WebDir "src\content\issues"
    if (-not (Test-Path $issuesDir)) {
        Write-Host "  ✗ 内容目录不存在: $issuesDir" -ForegroundColor Red
        exit 1
    }

    $issueFiles = Get-ChildItem -Path $issuesDir -Filter "*.json" | Sort-Object Name
    if ($issueFiles.Count -eq 0) {
        Write-Host "  ✗ 未找到任何 issue JSON 文件" -ForegroundColor Red
        exit 1
    }

    Write-Host "  ✓ 找到 $($issueFiles.Count) 期内容" -ForegroundColor Green

    # 运行 validate.py
    $validateScript = Join-Path $PSScriptRoot "validate.py"
    if (Test-Path $validateScript) {
        Write-Host "  运行内容校验..." -ForegroundColor Gray
        Push-Location $ProjectRoot
        python $validateScript --all --no-copy
        if ($LASTEXITCODE -ne 0) {
            Write-Host "  ✗ 内容校验失败，请修复后重试" -ForegroundColor Red
            Pop-Location
            exit 1
        }
        Pop-Location
        Write-Host "  ✓ 内容校验通过" -ForegroundColor Green
    }
}

# ── Step 2: 构建 ──
Write-Host ""
Write-Host "[2/3] 构建 Astro 站点..." -ForegroundColor Yellow

Push-Location $WebDir

# 清理旧的构建产物
if (Test-Path $DistDir) {
    Write-Host "  清理旧构建产物..." -ForegroundColor Gray
    Remove-Item -Recurse -Force $DistDir
}

# 安装依赖（如果需要）
if (-not (Test-Path (Join-Path $WebDir "node_modules"))) {
    Write-Host "  安装依赖..." -ForegroundColor Gray
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  ✗ npm install 失败" -ForegroundColor Red
        Pop-Location
        exit 1
    }
}

# 构建
Write-Host "  运行 astro build..." -ForegroundColor Gray
npx astro build
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ✗ 构建失败" -ForegroundColor Red
    Pop-Location
    exit 1
}

Pop-Location

# 验证构建产物
if (-not $NoValidate) {
    Write-Host "  验证构建产物..." -ForegroundColor Gray

    $requiredFiles = @(
        "index.html",
        "articles/index.html",
        "about/index.html",
        "cao/index.html",
        "404.html"
    )

    $distChecks = 0
    foreach ($f in $requiredFiles) {
        $fp = Join-Path $DistDir $f
        if (Test-Path $fp) {
            $distChecks++
        } else {
            Write-Host "  ✗ 缺少: $f" -ForegroundColor Red
        }
    }

    # 检查文章页面数量
    $articlesDir = Join-Path $DistDir "articles"
    if (Test-Path $articlesDir) {
        $articleCount = (Get-ChildItem -Path $articlesDir -Directory).Count
        Write-Host "  ✓ 文章页面: $articleCount 篇" -ForegroundColor Green
    }

    if ($distChecks -eq $requiredFiles.Count) {
        Write-Host "  ✓ 构建产物验证通过" -ForegroundColor Green
    } else {
        Write-Host "  ⚠ 部分页面缺失，请检查" -ForegroundColor Yellow
    }
}

Write-Host "  ✓ 构建完成: $DistDir" -ForegroundColor Green

# ── Step 3: 部署 ──
if ($NoDeploy) {
    Write-Host ""
    Write-Host "[3/3] 跳过部署 (--NoDeploy)" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "构建产物位于: $DistDir" -ForegroundColor Cyan
    Write-Host "可手动部署或运行: ./tools/deploy.ps1" -ForegroundColor Cyan
    exit 0
}

Write-Host ""
Write-Host "[3/3] 部署到 GitHub Pages..." -ForegroundColor Yellow

Push-Location $ProjectRoot

# 检查 git 状态
$status = git status --porcelain
if ($status) {
    Write-Host "  发现未提交的更改:" -ForegroundColor Yellow
    Write-Host $status
    $confirm = Read-Host "  是否继续部署? (y/N)"
    if ($confirm -ne "y" -and $confirm -ne "Y") {
        Write-Host "  部署已取消" -ForegroundColor Yellow
        Pop-Location
        exit 0
    }
}

# 这里可以根据实际部署方式调整:
# 方式1: gh-pages 分支部署
# 方式2: 直接推送到 main 分支（如果使用 GitHub Pages 从根目录服务）
# 方式3: 使用 npx gh-pages -d dist

Write-Host "  提交更改..." -ForegroundColor Gray
$dateStr = Get-Date -Format "yyyy-MM-dd HH:mm"
git add -A
git commit -m "deploy: build $dateStr" 2>$null

Write-Host "  推送到远程..." -ForegroundColor Gray
git push

if ($LASTEXITCODE -ne 0) {
    Write-Host "  ✗ 推送失败" -ForegroundColor Red
    Pop-Location
    exit 1
}

Pop-Location

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  ✓ 部署完成!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
