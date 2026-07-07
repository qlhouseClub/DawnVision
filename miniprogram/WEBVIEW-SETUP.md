# WebView 封装版小程序部署指南

本版本直接通过 `<web-view>` 组件加载现有网站 https://www.dawnvision.net ，效果与网站100%一致。

## ⚠️ 重要前提：业务域名配置

微信小程序的 web-view 组件**只能打开已配置的业务域名**，要求：
1. 域名必须经过 ICP 备案（你的 `dawnvision.cn` 已备案）
2. 必须在微信公众平台后台配置业务域名
3. 必须下载校验文件并放置到域名根目录

## 域名方案建议

### 方案A（推荐）：使用 dawnvision.cn 做国内镜像

`dawnvision.net` 是 GitHub Pages（境外），`dawnvision.cn` 是已备案国内域名。

推荐做法：
1. 将 dawnvision.cn 解析到国内 CDN 或服务器
2. 将 dawnvision.net 的内容同步部署到 dawnvision.cn（可以做反向代理或同步部署）
3. 将小程序里的 URL 改为 `https://www.dawnvision.cn`
4. 配置 dawnvision.cn 为业务域名

### 方案B：在 dawnvision.net 上放置校验文件

如果 dawnvision.net 可以放置微信校验文件，可以直接配置 dawnvision.net 为业务域名。但注意：
- dawnvision.net 必须支持 HTTPS（GitHub Pages 已支持）
- 微信可能要求域名备案，dawnvision.net 如未备案可能无法通过审核

## 配置步骤

### 1. 注册微信小程序

1. 访问 https://mp.weixin.qq.com/ 注册小程序账号
2. 完成主体认证（个人主体免费，需要实名认证）
3. 获取 AppID

### 2. 配置业务域名

1. 登录微信公众平台
2. 进入「开发」->「开发管理」->「开发设置」
3. 找到「业务域名」，点击「修改」
4. 添加你的域名（推荐 `www.dawnvision.cn`）
5. 按照提示下载校验文件（文件名类似 `xxx.txt`）
6. 将校验文件上传到网站根目录，确保可以通过 `https://www.dawnvision.cn/xxx.txt` 访问
7. 保存配置

### 3. 修改小程序中的网址

如果使用 dawnvision.cn，编辑 `src/pages/index/index.tsx`，将 targetUrl 改为：

```typescript
const targetUrl = 'https://www.dawnvision.cn'
```

然后重新构建：

```bash
npm run build:weapp
```

### 4. 导入微信开发者工具

1. 下载并安装微信开发者工具：https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html
2. 导入项目，目录选择 `d:\WorkSpace\DawnVision\miniprogram`
3. 填入你的 AppID
4. 在开发者工具中：
   - 点击右上角「详情」->「本地设置」
   - 勾选「不校验合法域名、web-view（业务域名）、TLS版本以及HTTPS证书」（开发阶段用）
   - 这样开发阶段可以直接加载 dawnvision.net 预览
5. 即可看到完整网站效果！

### 5. 提交审核前

1. 确保业务域名已配置好（使用 dawnvision.cn）
2. 确保小程序基本信息填写完整：
   - 小程序名称：DawnVision 或 Dawn Vision
   - 小程序头像：克莱因蓝背景 + DV标志
   - 小程序介绍：AI深度观察日刊，穿越嘈杂，洞见留声
   - 服务类目：选择「资讯」->「资讯信息」
3. 上传代码，提交审核

## 关于服务器成本

WebView 封装方案**不需要额外采购服务器**（如果网站已经在运行）：
- dawnvision.net 继续在 GitHub Pages 运行（免费）
- dawnvision.cn 可以用：
  - 腾讯云/阿里云 CDN 回源到 dawnvision.net（成本约 0-10元/月，流量小的话免费额度够用）
  - 或者直接在国内服务器部署静态站点（轻量服务器约 50元/月）

## 优缺点

### 优点
- ✅ 100% 与网站效果一致
- ✅ 开发量极小，维护成本为0
- ✅ 网站更新后小程序自动同步
- ✅ 所有功能（搜索、导航、动画）全部保留

### 缺点
- ❌ 需要配置业务域名（需要放校验文件）
- ❌ 体验略差于原生小程序（加载稍慢、没有原生流畅）
- ❌ 无法调用部分小程序原生能力
- ❌ 苹果用户可能会被要求「在浏览器打开」（实际测试web-view是可以正常使用的）

## 项目结构（极简版）

```
miniprogram/
├── src/
│   ├── pages/
│   │   └── index/
│   │       ├── index.tsx      # 仅一个页面，web-view加载网站
│   │       ├── index.scss
│   │       └── index.config.ts
│   ├── app.tsx
│   ├── app.config.ts
│   └── app.scss
├── dist/                     # 构建产物，导入微信开发者工具
└── WEBVIEW-SETUP.md          # 本文档
```
