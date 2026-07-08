# DawnVision 部署指南

## 为什么反向代理超时？

你当前配置的Nginx反向代理到 `dawnvision.net`（Cloudflare CDN），但从腾讯云国内服务器访问Cloudflare经常被阻断或速度极慢，导致超时。

**最佳方案：直接在腾讯云服务器上部署静态文件**，Nginx直接serve，不需要代理。

---

## 架构

```
本地开发 (web/) → npm run build → 静态文件 → scp上传到腾讯云服务器 → Nginx serve
                                                          ↓
                                               dawnvision.cn (HTTPS)
                                                          ↓
                                              小程序 web-view 加载
```

---

## 第一步：配置SSH密钥免密登录（只需做一次）

在PowerShell中运行：
```powershell
# 1. 生成SSH密钥（如果还没有的话）
ssh-keygen -t ed25519 -C "dawnvision-deploy" -f "$env:USERPROFILE\.ssh\dawnvision_deploy" -N '""'

# 2. 把公钥复制到服务器（需要输入一次服务器密码）
# 运行下面这行命令，当提示输入密码时，输入：@ArbatelQl3736
Get-Content "$env:USERPROFILE\.ssh\dawnvision_deploy.pub" | ssh -o StrictHostKeyChecking=no ubuntu@110.42.236.22 "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys && echo 'Key added successfully'"

# 3. 配置SSH config，方便后续连接
$sshConfig = @"
Host dawnvision
    HostName 110.42.236.22
    User ubuntu
    IdentityFile ~/.ssh/dawnvision_deploy
    StrictHostKeyChecking no
"@
Add-Content -Path "$env:USERPROFILE\.ssh\config" -Value $sshConfig

# 4. 测试免密登录（不需要输密码了）
ssh dawnvision "echo 'SSH key auth works!' && whoami"
```

---

## 第二步：初始化服务器（只需做一次）

```powershell
# 上传服务器初始化脚本
scp "$PSScriptRoot\server-setup.sh" dawnvision:~/

# SSH到服务器执行初始化
ssh dawnvision "bash ~/server-setup.sh"
```

这会自动安装Nginx、certbot、创建网站目录、配置Nginx。

---

## 第三步：域名解析

在你的域名服务商（dawnvision.cn在哪里买的？阿里云/腾讯云/其他？）添加DNS记录：

| 类型 | 主机记录 | 记录值 |
|------|---------|--------|
| A | @ | 110.42.236.22 |
| A | www | 110.42.236.22 |

等待DNS生效（通常几分钟到几小时），可以用 `ping dawnvision.cn` 验证。

---

## 第四步：部署网站（每次更新内容后运行）

```powershell
# 在 DawnVision 目录下运行
.\deploy\deploy.ps1
```

这个脚本会：
1. 在 `web/` 目录执行 `npm run build` 构建站点
2. 用 scp/rsync 将构建产物上传到服务器 `/var/www/dawnvision/`
3. 网站立即更新

---

## 第五步：配置HTTPS证书（域名解析生效后）

```powershell
ssh dawnvision "sudo certbot --nginx -d dawnvision.cn -d www.dawnvision.cn --non-interactive --agree-tos -m hello@dawnvision.net"
```

certbot会自动：
- 申请Let's Encrypt免费SSL证书
- 修改Nginx配置启用HTTPS
- 配置HTTP自动跳转HTTPS
- 设置自动续期

---

## 第六步：更新小程序web-view地址

等HTTPS配置好后，将小程序 `pages/index/index.wxml` 中的URL改为：
```xml
<web-view src="https://www.dawnvision.cn"></web-view>
```

然后在微信开发者工具中重新打开项目即可。

---

## 日常更新流程

1. 本地写文章、修改代码
2. 运行 `.\deploy\deploy.ps1` 一键构建+部署
3. 网站和小程序自动看到最新内容
