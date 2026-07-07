# Dawn Vision 微信小程序

基于 Taro 4.x + React 18 + TypeScript 开发的 Dawn Vision AI 深度观察日刊小程序。
样式1:1复刻现有网站 dawnvision.net，使用相同的Klein Blue设计语言。

## 快速开始

### 1. 导入微信开发者工具

打开微信开发者工具，导入项目目录：`d:\WorkSpace\DawnVision\miniprogram`
- AppID：使用测试号或你自己的小程序AppID
- 项目名称：Dawn Vision

### 2. 预览

无需任何额外配置，导入后即可在模拟器中看到完整效果：
- 首页：Klein Blue全屏Hero区域
- Articles：文章列表（Focus焦点 + Briefs简报）
- Cao：吐槽专栏（深色主题）
- About：关于页面
- 点击文章可进入详情页阅读

## 内容同步机制

小程序直接复用web项目的JSON数据文件，实现内容零成本同步。

### 数据位置

- **Web数据源**：`d:\WorkSpace\DawnVision\web\src\content\issues\*.json`
- **小程序数据**：`d:\WorkSpace\DawnVision\miniprogram\src\content\issues\*.json`

### 同步方法

当你在web项目中发布新一期内容后，运行同步脚本：

```powershell
cd d:\WorkSpace\DawnVision\miniprogram
.\sync-content.ps1
```

然后重新构建小程序：

```bash
npm run build:weapp
```

最后在微信开发者工具中点击「上传」即可发布新版本。

### 数据格式

与web项目完全一致，使用相同的JSON Schema：
- `issue`：期数信息（number, date, date_display）
- `cover`：封面焦点文章（1篇）
- `briefs`：简报文章列表（约6-7篇）
- `cao`：吐槽专栏（可选）

每篇文章包含：title、deck、body_html、sources、pull_quote等字段。

## 项目结构

```
miniprogram/
├── src/
│   ├── components/
│   │   ├── SiteHeader/     # 顶部品牌导航栏（home/inner/dark三种变体）
│   │   ├── SiteFooter/     # 页脚
│   │   └── BottomNav/      # 底部固定导航（开发阶段使用）
│   ├── pages/
│   │   ├── index/          # 首页 - Klein Blue Hero
│   │   ├── articles/       # 文章列表页
│   │   ├── article-detail/ # 文章详情页
│   │   ├── cao/            # 吐槽专栏（深色主题）
│   │   └── about/          # 关于页
│   ├── content/issues/     # 文章数据JSON（与web项目同步）
│   ├── utils/
│   │   ├── data.ts         # 数据加载模块
│   │   └── html.ts         # HTML富文本处理
│   ├── app.tsx
│   ├── app.config.ts       # 页面路由配置
│   └── app.scss            # 全局样式/设计Token
├── sync-content.ps1        # 内容同步脚本
└── dist/                   # 构建产物（微信开发者工具导入此目录）
```

## 设计Token

与web项目完全一致的设计系统：

- **品牌色**：#002FA7（International Klein Blue 国际克莱因蓝）
- **字体**：标题使用无衬线大字+字距，正文使用衬线字体（系统宋体替代）
- **排版**：斜体用于标题和deck，首行缩进2字符，strong为品牌蓝色
- **组件**：蓝色标签、蓝色左边框引用、Klein Blue Hero区域

## 上线流程

1. 注册微信小程序账号（个人主体免费）
2. 完成实名认证
3. 配置服务器域名（如果后续需要从服务器拉取数据）
4. 在开发者工具中点击「上传」
5. 在微信公众平台提交审核
6. 审核通过后发布

## 后续扩展

目前所有内容打包在小程序中（静态数据）。后续可以扩展为：
- 使用腾讯云开发CloudBase，内容更新无需重新发布小程序
- 添加搜索功能
- 添加分享功能
- 添加收藏功能
