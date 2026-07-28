# Dawn Vision 数据库 + API 部署指南

## 架构总览

```
GitHub Push
  └─ GitHub Actions（CI）
       ├─ astro build
       ├─ generate-api.cjs（已有，生成静态 JSON）
       ├─ pagefind（已有，搜索索引）
       └─ sync-to-db.cjs（新增，写入 MySQL）  ← 构建时注入
            │
            ▼
     腾讯云 MySQL（110.42.236.22）
            │
            ▼
     api-server.cjs（Node.js，端口 3100）
            │
            ▼
     微信小程序（wx.request 调 API）
```

## 第一部分：服务器端（腾讯云）

### 1. 安装 MySQL

```bash
sudo apt update
sudo apt install mysql-server -y

# 安全初始化
sudo mysql_secure_installation

# 登录 MySQL
sudo mysql
```

### 2. 创建数据库和用户

```sql
CREATE DATABASE dawnvision CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'dawnvision'@'localhost' IDENTIFIED BY '你的密码';
GRANT ALL PRIVILEGES ON dawnvision.* TO 'dawnvision'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 3. 导入表结构

```bash
mysql -u dawnvision -p dawnvision < /path/to/schema.sql
```

### 4. 安装 Node.js（如果还没有）

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install nodejs -y
```

### 5. 部署 API 服务

```bash
# 创建目录
mkdir -p /opt/dawnvision-api
cd /opt/dawnvision-api

# 复制 api-server.cjs 到此目录
# 安装依赖
npm init -y
npm install mysql2

# 创建环境变量文件
cat > .env << 'EOF'
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=dawnvision
DB_PASSWORD=你的密码
DB_NAME=dawnvision
PORT=3100
EOF

# 测试运行
node api-server.cjs

# 用 PM2 守护进程
sudo npm install -g pm2
pm2 start api-server.cjs --name dawnvision-api
pm2 save
pm2 startup
```

### 6. Nginx 反向代理（API 路径）

在现有的 Nginx 配置中添加 `/api2/` 路径（避免和静态文件的 `/api/` 冲突）：

```nginx
location /api2/ {
    proxy_pass http://127.0.0.1:3100/api/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

重载 Nginx：
```bash
sudo nginx -t && sudo nginx -s reload
```

## 第二部分：GitHub Actions CI 配置

### 1. 在 GitHub 仓库设置 Secrets

进入仓库 -> Settings -> Secrets and variables -> Actions，添加：

| Secret 名 | 值 |
|---|---|
| `DB_HOST` | `127.0.0.1`（或服务器内网IP） |
| `DB_PORT` | `3306` |
| `DB_USER` | `dawnvision` |
| `DB_PASSWORD` | 你的数据库密码 |
| `DB_NAME` | `dawnvision` |
| `DB_SYNC` | `true` |

**注意**：GitHub Actions 运行在云端，需要能访问到你的腾讯云 MySQL。
两种方式：
- **方式A**：MySQL 绑定公网IP（简单，但安全风险高）
- **方式B**（推荐）：在服务器上部署一个轻量同步脚本，GitHub Actions 通过 SSH 触发执行

### 2. 方式B：SSH 触发同步（推荐）

在服务器上创建同步脚本：

```bash
# /opt/dawnvision-sync/sync.sh
#!/bin/bash
cd /opt/dawnvision-web
git pull origin main
npm install
npm run build  # 这里会自动执行 sync-to-db.cjs
```

GitHub Actions 中添加 SSH 步骤：

```yaml
- name: Trigger server sync
  uses: appleboy/ssh-action@v1.0.0
  with:
    host: 110.42.236.22
    username: ubuntu
    key: ${{ secrets.SERVER_SSH_KEY }}
    script: bash /opt/dawnvision-sync/sync.sh
```

### 3. 服务器本地构建方式（最简方案）

如果直接在服务器上构建（不用 GitHub Actions）：

```bash
cd /opt/dawnvision-web
git pull origin main

# 设置环境变量
export DB_HOST=127.0.0.1
export DB_PORT=3306
export DB_USER=dawnvision
export DB_PASSWORD=你的密码
export DB_NAME=dawnvision
export DB_SYNC=true

npm install
npm run build  # 自动执行 sync-to-db.cjs
```

## 第三部分：小程序端配置

### 1. 微信公众平台配置服务器域名

进入小程序后台 -> 开发管理 -> 开发设置 -> 服务器域名：
- request 合法域名添加：`https://dawnvision.cn`

### 2. 修改小程序 API 地址

修改 `utils/api.js` 中的 `BASE_URL`：

```javascript
const BASE_URL = 'https://dawnvision.cn/api2';
```

## API 接口文档

| 接口 | 方法 | 路径 | 参数 | 说明 |
|---|---|---|---|---|
| 期数列表 | GET | `/api2/issues` | - | 所有期数概要 |
| 最新一期 | GET | `/api2/latest` | - | 最新封面信息 |
| 单期内容 | GET | `/api2/issue/001` | - | 该期全部文章 |
| 文章详情 | GET | `/api2/article/001/slug` | - | 单篇完整内容 |
| 槽点列表 | GET | `/api2/cao/list` | - | 所有 cao 文章 |
| 搜索 | GET | `/api2/search?q=Agent` | q | 全文搜索 |

## 文件清单

| 文件 | 位置 | 用途 |
|---|---|---|
| `schema.sql` | miniprogram/database/ | MySQL 建表脚本 |
| `sync-to-db.cjs` | web/scripts/ | 构建时同步脚本 |
| `api-server.cjs` | miniprogram/server/ | API 服务 |
