# 六子棋游戏部署文档

本文档将指导你如何将前端部署到 Cloudflare Pages，并将联机服务部署到阿里云服务器。

## 目录
- [前端部署 (Cloudflare Pages)](#前端部署-cloudflare-pages)
- [后端服务部署 (阿里云)](#后端服务部署-阿里云)
- [环境变量配置](#环境变量配置)
- [验证部署](#验证部署)

---

## 前端部署 (Cloudflare Pages)

### 1. 准备工作

确保你已经有一个 Cloudflare 账号，如果没有请先注册：https://dash.cloudflare.com/sign-up

### 2. 构建前端项目

在项目根目录下运行：

```bash
npm install
npm run build
```

构建成功后会在 `dist` 目录生成静态文件。

### 3. 部署到 Cloudflare Pages

#### 方式一：通过 Cloudflare Dashboard（推荐新手）

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 点击左侧菜单的 **Workers & Pages**
3. 点击 **Create application** → **Pages** → **Connect to Git**
4. 授权并选择你的 GitHub 仓库
5. 配置构建设置：
   - **Framework preset**: `Vite`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Root directory**: `/` (保持默认)
6. 点击 **Save and Deploy**

#### 方式二：通过 Wrangler CLI（推荐进阶用户）

1. 安装 Wrangler CLI：
```bash
npm install -g wrangler
```

2. 登录 Cloudflare：
```bash
wrangler login
```

3. 部署项目：
```bash
wrangler pages deploy dist --project-name=connect6-game
```

### 4. 配置环境变量

在 Cloudflare Pages 项目设置中添加环境变量：

1. 进入你的 Pages 项目
2. 点击 **Settings** → **Environment variables**
3. 添加以下变量：

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `VITE_PEER_HOST` | `your-aliyun-server-ip` | 阿里云服务器的公网 IP |
| `VITE_PEER_PORT` | `9000` | PeerJS 服务端口 |
| `VITE_PEER_PATH` | `/myapp` | PeerJS 路径 |
| `VITE_PEER_SECURE` | `true` | 使用 HTTPS (需配置 SSL) |
| `VITE_ROOM_API_URL` | `https://your-aliyun-domain.com:9001` | 房间 API 地址 |

4. 点击 **Save** 后重新部署

---

## 后端服务部署 (阿里云)

### 1. 准备阿里云 ECS 服务器

#### 1.1 购买 ECS 实例
- 登录 [阿里云控制台](https://www.aliyun.com/)
- 选择 **云服务器 ECS**
- 推荐配置：
  - **实例规格**: 1核2G 即可
  - **操作系统**: Ubuntu 22.04 LTS 或 CentOS 8
  - **带宽**: 1Mbps 起步

#### 1.2 配置安全组规则
在 ECS 实例的安全组中添加入站规则：

| 端口 | 协议 | 说明 |
|------|------|------|
| 22 | TCP | SSH 连接 |
| 9000 | TCP | PeerJS 信令服务器 |
| 9001 | TCP | 房间 API 服务器 |
| 80 | TCP | HTTP (可选) |
| 443 | TCP | HTTPS (可选) |

### 2. 连接到服务器

使用 SSH 连接到你的阿里云服务器：

```bash
ssh root@your-server-ip
```

### 3. 安装 Node.js

#### Ubuntu/Debian:
```bash
# 更新包管理器
sudo apt update

# 安装 Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 验证安装
node -v
npm -v
```

#### CentOS:
```bash
# 安装 Node.js 18.x
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# 验证安装
node -v
npm -v
```

### 4. 安装 PM2 进程管理器

```bash
sudo npm install -g pm2
```

### 5. 上传项目文件

#### 方式一：使用 Git（推荐）

```bash
# 在服务器上克隆项目
cd /opt
git clone https://github.com/your-username/SixRowGame.git
cd SixRowGame

# 安装依赖
npm install
```

#### 方式二：使用 SCP 上传

在本地终端运行：

```bash
# 上传整个项目（排除 node_modules）
scp -r /Users/zstar/code/SixRowGame root@your-server-ip:/opt/
```

然后在服务器上：
```bash
cd /opt/SixRowGame
npm install
```

### 6. 配置环境变量

创建 `.env.production` 文件：

```bash
cd /opt/SixRowGame
nano .env.production
```

添加以下内容：

```bash
# PeerJS 配置
VITE_PEER_HOST=0.0.0.0
VITE_PEER_PORT=9000

# 房间服务器配置
VITE_ROOM_SERVER_PORT=9001
```

保存并退出（Ctrl+X, Y, Enter）

### 7. 启动后端服务

#### 7.1 使用 PM2 启动 PeerJS 服务器

```bash
cd /opt/SixRowGame
pm2 start peerserver.cjs --name peerjs-server
```

#### 7.2 使用 PM2 启动房间 API 服务器

```bash
pm2 start roomserver.cjs --name room-api-server
```

#### 7.3 查看服务状态

```bash
pm2 list
pm2 logs
```

#### 7.4 设置开机自启

```bash
pm2 startup
pm2 save
```

### 8. 配置防火墙（如果启用了 firewalld/ufw）

#### Ubuntu (ufw):
```bash
sudo ufw allow 9000/tcp
sudo ufw allow 9001/tcp
sudo ufw reload
```

#### CentOS (firewalld):
```bash
sudo firewall-cmd --permanent --add-port=9000/tcp
sudo firewall-cmd --permanent --add-port=9001/tcp
sudo firewall-cmd --reload
```

### 9. 配置 HTTPS（可选但推荐）

#### 9.1 安装 Nginx

**Ubuntu:**
```bash
sudo apt install nginx
```

**CentOS:**
```bash
sudo yum install nginx
```

#### 9.2 安装 Certbot（Let's Encrypt）

**Ubuntu:**
```bash
sudo apt install certbot python3-certbot-nginx
```

**CentOS:**
```bash
sudo yum install certbot python3-certbot-nginx
```

#### 9.3 获取 SSL 证书

```bash
sudo certbot --nginx -d your-domain.com
```

#### 9.4 配置 Nginx 反向代理

编辑 Nginx 配置：

```bash
sudo nano /etc/nginx/sites-available/connect6
```

添加以下内容：

```nginx
# PeerJS 服务
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    location /myapp {
        proxy_pass http://localhost:9000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# 房间 API 服务
server {
    listen 443 ssl http2;
    server_name api.your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:9001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # CORS 配置
        add_header Access-Control-Allow-Origin *;
        add_header Access-Control-Allow-Methods 'GET, POST, PUT, DELETE, OPTIONS';
        add_header Access-Control-Allow-Headers 'Content-Type';
    }
}
```

启用配置并重启 Nginx：

```bash
sudo ln -s /etc/nginx/sites-available/connect6 /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## 环境变量配置

### 前端环境变量（Cloudflare Pages）

在 Cloudflare Pages 项目设置中配置：

#### 使用 HTTP（不推荐用于生产环境）
```env
VITE_PEER_HOST=123.456.789.100
VITE_PEER_PORT=9000
VITE_PEER_PATH=/myapp
VITE_PEER_SECURE=false
VITE_ROOM_API_URL=http://123.456.789.100:9001
```

#### 使用 HTTPS（推荐）
```env
VITE_PEER_HOST=your-domain.com
VITE_PEER_PORT=443
VITE_PEER_PATH=/myapp
VITE_PEER_SECURE=true
VITE_ROOM_API_URL=https://api.your-domain.com
```

### 本地开发环境变量

创建 `.env.local` 文件：

```env
VITE_PEER_HOST=localhost
VITE_PEER_PORT=9000
VITE_PEER_PATH=/myapp
VITE_ROOM_SERVER_PORT=9001
```

---

## 验证部署

### 1. 验证 PeerJS 服务

在浏览器中访问：
```
http://your-server-ip:9000/myapp
```

应该看到 PeerJS 服务器的响应。

### 2. 验证房间 API 服务

在浏览器中访问：
```
http://your-server-ip:9001/rooms
```

应该返回空数组 `[]` 或房间列表。

### 3. 测试完整流程

1. 访问你的 Cloudflare Pages 网址
2. 点击"创建房间"
3. 等待房间创建成功
4. 复制房间链接
5. 在另一个浏览器/设备中打开链接
6. 验证能否成功连接并开始游戏

---

## 常见问题

### Q1: 无法连接到 PeerJS 服务器
**检查项**:
- 确认阿里云安全组已开放 9000 端口
- 确认服务器防火墙已允许 9000 端口
- 使用 `pm2 logs peerjs-server` 查看日志
- 使用 `telnet your-server-ip 9000` 测试端口连通性

### Q2: 房间列表一直为空
**检查项**:
- 确认房间 API 服务正常运行：`pm2 logs room-api-server`
- 确认前端的 `VITE_ROOM_API_URL` 配置正确
- 检查浏览器控制台是否有 CORS 错误

### Q3: HTTPS 下无法连接 WebSocket
**解决方案**:
- HTTPS 页面只能连接 WSS (WebSocket Secure)
- 确保已配置 Nginx 反向代理和 SSL 证书
- 设置 `VITE_PEER_SECURE=true`

### Q4: PM2 服务重启后无法自动恢复
**解决方案**:
```bash
pm2 save
pm2 startup
```

---

## 维护命令

### PM2 常用命令

```bash
# 查看所有服务
pm2 list

# 查看日志
pm2 logs

# 重启服务
pm2 restart peerjs-server
pm2 restart room-api-server

# 停止服务
pm2 stop peerjs-server
pm2 stop room-api-server

# 删除服务
pm2 delete peerjs-server

# 查看详细信息
pm2 info peerjs-server

# 监控
pm2 monit
```

### 更新部署

#### 更新前端（Cloudflare Pages）
```bash
# 如果使用 Git 集成，直接 push 即可自动部署
git add .
git commit -m "Update"
git push

# 如果使用 Wrangler CLI
npm run build
wrangler pages deploy dist --project-name=connect6-game
```

#### 更新后端（阿里云）
```bash
# SSH 到服务器
ssh root@your-server-ip

# 拉取最新代码
cd /opt/SixRowGame
git pull

# 安装新依赖（如果有）
npm install

# 重启服务
pm2 restart all
```

---

## 性能优化建议

### 1. 启用 Gzip 压缩
在 Nginx 配置中添加：
```nginx
gzip on;
gzip_types text/plain text/css application/json application/javascript;
```

### 2. 配置缓存
```nginx
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### 3. CDN 加速
- Cloudflare Pages 自带 CDN，前端资源已自动加速
- 考虑为后端 API 也配置 CDN（如果流量大）

### 4. 数据库优化（未来）
如果需要持久化房间数据，可以集成 Redis 或 MongoDB

---

## 安全建议

1. **定期更新系统和依赖**
   ```bash
   sudo apt update && sudo apt upgrade
   npm update
   ```

2. **配置防火墙只允许必要端口**

3. **使用 fail2ban 防止暴力破解**
   ```bash
   sudo apt install fail2ban
   ```

4. **定期备份**
   ```bash
   # 备份项目
   tar -czf backup-$(date +%Y%m%d).tar.gz /opt/SixRowGame
   ```

5. **监控服务器资源**
   ```bash
   # 安装监控工具
   sudo apt install htop iotop
   ```

---

## 总结

完成以上步骤后，你的六子棋游戏将会：
- ✅ 前端托管在 Cloudflare Pages（全球 CDN 加速）
- ✅ 后端服务运行在阿里云服务器（稳定可靠）
- ✅ 支持 HTTPS 安全连接
- ✅ 支持多人在线对战
- ✅ 自动重启和故障恢复

如有问题，请查看日志文件或联系技术支持。
