# ✅ 局域网联机 - 快速测试指南

## 🚀 第一步: 启动服务器

在项目根目录运行:

```bash
npm start
```

或者使用自动配置脚本:

```bash
./start-lan.sh
```

**期望输出**:
```
[0] PeerJS Server is running on port 9000
[0] Path: /myapp
[1] VITE v6.x.x  ready in xxx ms
[1] ➜  Local:   http://localhost:5173/
[1] ➜  Network: http://192.168.31.21:5173/
```

✅ 看到这两行说明启动成功:
- `[0]` 是 PeerJS 服务器 (端口 9000)
- `[1]` 是 Vite 开发服务器 (端口 5173)

---

## 🧪 第二步: 测试主机端

1. 打开浏览器访问: `http://localhost:5173`

2. 打开浏览器控制台 (按 F12 或 Cmd+Option+I)

3. 点击 "Online Lobby"

4. 在控制台查看日志:
   ```
   [PeerService] Connecting to LAN server: 192.168.31.21:9000/myapp
   My peer ID is: xxxxxxxx
   ```

5. 页面应该显示:
   - 加载动画 "Initializing room..."
   - 几秒后显示一个随机 Room ID
   - "Copy" 按钮可用

✅ 如果看到 Room ID,说明主机端配置正确!

---

## 📱 第三步: 测试客户端 (同一台电脑)

### 选项 A: 使用隐身模式测试

1. 打开**新的隐身窗口** (Cmd+Shift+N)
2. 访问: `http://localhost:5173`
3. 点击 "Online Lobby"
4. 在 "Join a Game" 输入主机的 Room ID
5. 点击 "Join"

✅ 如果主机和客户端都进入游戏界面,说明本地连接成功!

### 选项 B: 使用不同浏览器测试

1. 主机用 Chrome 浏览器
2. 客户端用 Safari/Firefox
3. 重复上述步骤

---

## 📱 第四步: 测试真实的局域网设备 (手机/iPad)

### 前提条件
- ✅ 手机/iPad 连接到**同一个 WiFi** (与 Mac 相同)
- ✅ Mac 防火墙已关闭或允许端口 9000 和 5173

### 步骤

1. **在手机浏览器输入**:
   ```
   http://192.168.31.21:5173
   ```

   ⚠️ **注意**: 必须使用 Mac 的 IP 地址,不能用 localhost!

2. 如果无法访问页面,检查:
   - 手机是否连接到相同 WiFi
   - Mac 防火墙是否阻止
   - IP 地址是否正确

3. 页面加载成功后:
   - 点击 "Online Lobby"
   - 输入 Mac 端显示的 Room ID
   - 点击 "Join"

✅ 如果能看到 3D 棋盘并且可以互相下棋,说明局域网联机完全成功!

---

## 🐛 常见问题排查

### 问题 1: "Network Error: Unknown Error"

**可能原因**: PeerJS 服务器未启动

**检查方法**:
```bash
lsof -i :9000
```

**解决方案**:
- 确保使用 `npm start` 而不是 `npm run dev`
- 检查终端是否有 `[0] PeerJS Server is running` 的输出

---

### 问题 2: "Failed to fetch" / "ERR_CONNECTION_REFUSED"

**可能原因**:
1. `.env.local` 中的 `VITE_PEER_HOST` 配置不正确
2. PeerJS 服务器未启动
3. 防火墙阻止连接

**解决方案**:

1. 检查 `.env.local`:
```bash
cat .env.local | grep VITE_PEER_HOST
```
应该显示你的本机 IP,不是 localhost!

2. 重启服务器:
```bash
# 停止当前服务 (Ctrl+C)
# 重新运行
./start-lan.sh
```

3. 清除浏览器缓存并强制刷新 (Cmd+Shift+R)

---

### 问题 3: 客户端设备无法访问页面

**检查步骤**:

1. **Ping 测试** (在客户端设备):
   - macOS/Linux: `ping 192.168.31.21`
   - Windows: `ping 192.168.31.21`
   - 手机: 下载 "Network Ping" 之类的 app

2. **检查 WiFi**:
   - 主机和客户端必须在同一网络
   - 不能是访客网络 (Guest Network)
   - 某些公司/学校 WiFi 会隔离设备

3. **Mac 防火墙设置**:

   临时关闭测试:
   ```bash
   # 系统设置 > 网络 > 防火墙 > 关闭
   ```

   或允许端口:
   ```bash
   # 当 Node.js 首次运行时,macOS 会弹窗询问
   # 点击 "允许" 即可
   ```

---

### 问题 4: Room ID 显示但无法 Join

**可能原因**: Room ID 复制不完整或包含空格

**解决方案**:
1. 使用 "Copy" 按钮而不是手动复制
2. 检查粘贴的 ID 前后没有空格
3. 确保完整复制整个 ID

---

### 问题 5: 连接后立即断开

**可能原因**: WebRTC 连接失败

**解决方案**:
1. 检查浏览器控制台的错误信息
2. 确保两边都使用现代浏览器
3. 某些企业网络可能阻止 WebRTC,尝试使用手机热点测试

---

## 🎯 成功的标志

当一切正常时,你应该看到:

### 主机端 (Mac):
- ✅ 终端显示: `[0] PeerJS Server is running on port 9000`
- ✅ 终端显示: `[1] Local: http://localhost:5173/`
- ✅ 浏览器显示 Room ID
- ✅ 控制台显示: `My peer ID is: xxxxxxxx`
- ✅ 当客户端加入时,控制台显示: `[PeerServer] Client connected`

### 客户端端 (手机/其他设备):
- ✅ 能访问 `http://192.168.31.21:5173`
- ✅ 点击 Online Lobby 后页面不报错
- ✅ 输入 Room ID 并 Join
- ✅ 几秒内进入游戏界面
- ✅ 看到 3D 棋盘
- ✅ 能正常下棋,双方实时同步

---

## 📊 网络连接测试清单

```bash
# 1. 检查 PeerJS 服务器
lsof -i :9000
# 期望: 显示 node 进程占用端口 9000

# 2. 检查 Vite 服务器
lsof -i :5173
# 期望: 显示 node 进程占用端口 5173

# 3. 检查本机 IP
ifconfig | grep "inet " | grep -v 127.0.0.1
# 期望: inet 192.168.31.21 ...

# 4. 检查配置
cat .env.local | grep VITE_PEER_HOST
# 期望: VITE_PEER_HOST=192.168.31.21

# 5. 测试端口连通性 (从客户端设备)
nc -zv 192.168.31.21 9000
nc -zv 192.168.31.21 5173
# 期望: Connection to ... succeeded!
```

---

## 🎮 开始游戏!

一切正常后:

1. 主机玩家: 复制 Room ID
2. 客户端玩家: 输入 Room ID 并 Join
3. 双方进入游戏界面
4. 黑棋先走,轮流下棋
5. 享受 3D 六子棋的乐趣! 🎉

---

## 📞 需要帮助?

如果遇到问题:

1. 查看详细指南: `LAN_SETUP_GUIDE.md`
2. 检查浏览器控制台 (F12) 的错误信息
3. 检查终端输出是否有错误
4. 确认完成了上述所有测试步骤

**调试技巧**:
- 先在同一台电脑测试 (隐身模式)
- 确认本地能工作后,再测试局域网设备
- 逐步排查,不要跳过步骤
