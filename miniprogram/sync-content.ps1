# DawnVision 内容同步脚本
# 用法：在PowerShell中运行 .\sync-content.ps1
# 功能：将web项目的最新内容JSON同步到小程序中并重新生成TS数据模块

Write-Host "=== DawnVision 内容同步 ===" -ForegroundColor Blue

# 1. 复制JSON文件
$sourceDir = "d:\WorkSpace\DawnVision\web\src\content\issues"
$targetDir = "d:\WorkSpace\DawnVision\miniprogram\src\content\issues"

if (-not (Test-Path $sourceDir)) {
    Write-Host "错误：源目录不存在 $sourceDir" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $targetDir)) {
    New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
}

$files = Get-ChildItem -Path $sourceDir -Filter "*.json"
$count = 0
foreach ($file in $files) {
    Copy-Item -Path $file.FullName -Destination $targetDir -Force
    Write-Host "已复制: $($file.Name)" -ForegroundColor Green
    $count++
}

# 2. 用Node.js重新生成TS数据模块
Write-Host "`n正在生成TS数据模块..." -ForegroundColor Yellow
node generate-data.js

Write-Host ""
Write-Host "同步完成！共 $count 期内容。" -ForegroundColor Blue
Write-Host ""
Write-Host "下一步：运行 npm run build:weapp 重新构建小程序" -ForegroundColor Yellow
