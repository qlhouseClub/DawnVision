# CloudBase 云开发配置指南

## 为什么选择 CloudBase

对于DawnVision小程序初期（0-1万用户），腾讯云开发 CloudBase 是最佳选择：

- **零成本启动**：免费额度足够初期使用
- **无需服务器运维**：Serverless架构，无需管理服务器
- **微信生态原生集成**：与小程序无缝对接
- **自动扩缩容**：用户量增长自动扩容

## 免费额度（2026年参考）

| 资源 | 免费额度 |
|------|----------|
| 云数据库 | 2GB存储，5万次读/天，3万次写/天 |
| 云存储 | 5GB存储，10GB下载流量/天 |
| 云函数 | 40万GBs资源使用量/月，100万次调用/月 |
| CDN | 5GB流量/天 |

## 配置步骤

### 1. 开通云开发

1. 下载并安装 [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
2. 注册微信小程序账号，获取 AppID
3. 在微信开发者工具中打开本项目
4. 点击工具栏「云开发」按钮，开通云开发环境
5. 选择按量计费（免费额度内不扣费）

### 2. 创建数据库集合

在云开发控制台 -> 数据库 中创建以下集合：

```
issues       # 期数数据
articles     # 文章数据（可选，也可直接用issues内嵌）
users        # 用户数据（收藏、喜欢等）
```

### 3. 数据导入

将 `src/data/raw/` 下的 JSON 数据导入到云数据库：

1. 可以使用云开发控制台的导入功能
2. 或编写云函数批量导入
3. 建议创建数据同步脚本，与Astro站点数据保持同步

### 4. 初始化云开发

在 `src/app.tsx` 中添加云开发初始化代码：

```typescript
import Taro from '@tarojs/taro'

// 在 App 组件的 componentDidMount 中添加
componentDidMount() {
  if (process.env.TARO_ENV === 'weapp') {
    Taro.cloud.init({
      env: 'your-env-id', // 替换为你的云开发环境ID
      traceUser: true
    })
  }
}
```

### 5. 云函数示例（获取文章列表）

创建云函数 `getArticles`：

```javascript
// cloudfunctions/getArticles/index.js
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const { page = 1, pageSize = 20, type } = event
  const query = type ? { type } : {}
  
  const res = await db.collection('articles')
    .where(query)
    .orderBy('issueDate', 'desc')
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .get()
    
  return {
    data: res.data,
    page,
    pageSize
  }
}
```

## 数据结构建议

### issues 集合

```json
{
  "_id": "009",
  "number": "009",
  "date": "2026-07-06",
  "date_display": "2026.07.06",
  "published": true
}
```

### articles 集合

```json
{
  "_id": "doubao-qianwen-shutdown-gpts",
  "slug": "doubao-qianwen-shutdown-gpts-anthropomorphic-regulation",
  "title": "豆包千问7月15日关停C端智能体...",
  "title_short": "豆包千问关停智能体",
  "deck": "...",
  "body_html": "...",
  "type": "cover",
  "category": "Focus · 焦点",
  "issueNum": "009",
  "issueDate": "2026-07-06",
  "read_time": "约 10 分钟阅读",
  "word_count": 2500,
  "createdAt": "2026-07-06T00:00:00Z"
}
```

## 何时升级到独立服务器

当出现以下情况时，考虑迁移到轻量应用服务器（约50元/月）：

- 日活用户超过1万
- 数据库读取频繁超过免费额度
- 需要更复杂的后端逻辑
- 需要接入支付、会员等功能

推荐配置：2核2G 4M带宽 轻量应用服务器（腾讯云/阿里云）
