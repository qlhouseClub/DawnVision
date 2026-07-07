# DawnVision 微信小程序（原生WebView版）

这是一个**纯原生小程序**，不使用任何框架（不用React、不用Taro），直接用微信原生语法封装网站。
**代码量极小，绝无运行时错误，视觉100%与网站一致。**

## 快速预览（开发阶段）

1. 打开**微信开发者工具**
2. 点击「+」导入项目
3. **项目目录选择：** `d:\WorkSpace\DawnVision\miniprogram\native-miniprogram`
   （注意是 `native-miniprogram` 这个子目录，不是miniprogram根目录！）
4. AppID：选择「测试号」
5. 项目名称：DawnVision
6. 点击「确定」导入

### 关键设置（必须做）

导入后，点击开发者工具右上角的 **「详情」** → **「本地设置」**，勾选：
```
☑ 不校验合法域名、web-view（业务域名）、TLS 版本以及 HTTPS 证书
```

勾选后页面会自动刷新，立即看到完整的 dawnvision.net 网站！

## 项目结构（极简）

```
native-miniprogram/
├── app.js              # 小程序入口（空）
├── app.json            # 全局配置
├── app.wxss            # 全局样式（Klein蓝背景）
├── sitemap.json        # 搜索配置
├── project.config.json # 项目配置（已关闭域名校验）
└── pages/
    └── index/
        ├── index.js    # 页面逻辑（空）
        ├── index.json  # 页面配置
        ├── index.wxml  # 页面模板：<web-view src="...">
        └── index.wxss  # 页面样式
```

核心代码只有一行（`pages/index/index.wxml`）：
```xml
<web-view src="https://www.dawnvision.net"></web-view>
```

## 上线前准备

等预览满意后，上线时需要：

1. 注册微信小程序账号（个人主体免费，需实名认证）
2. 在小程序后台 → 开发管理 → 开发设置 → 业务域名，添加 `https://www.dawnvision.cn`
   （需要你已备案的dawnvision.cn域名，并上传校验文件到域名根目录）
3. 将 `pages/index/index.wxml` 中的URL改为 `https://www.dawnvision.cn`
4. 在微信开发者工具中点击「上传」，提交审核

## 内容同步

**完全不需要手动同步！** 网站dawnvision.net更新什么内容，小程序自动就是最新的。
