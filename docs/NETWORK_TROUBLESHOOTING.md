# 🔧 WebRTC 连接问题诊断

## 问题现象

```
[PeerJS Internal] Error: Negotiation of connection to xxx failed.
{"type":"negotiation-failed"}
```

## 问题原因

WebRTC 连接协商失败，通常是以下原因之一：

1. **防火墙阻止 UDP 连接** - WebRTC 默认使用 UDP 传输数据
2. **路由器 NAT 配置** - 即使在同一局域网，某些路由器也会阻止直接连接
3. **ICE 候选收集失败** - 无法找到合适的网络路径

## 解决方案

### 方案 1: 检查防火墙（推荐首先尝试）

#### macOS:
```bash
# 检查防火墙状态
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --getglobalstate

# 临时关闭防火墙测试
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --setglobalstate off

# 测试后重新开启
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --setglobalstate on
```

#### Windows:
```
控制面板 > Windows Defender 防火墙 > 启用或关闭 Windows Defender 防火墙
临时关闭"专用网络"防火墙
```

### 方案 2: 路由器配置

在路由器管理页面中：
1. 查找 "UPnP" 或 "NAT-PMP" 设置
2. 确保这些功能已启用
3. 重启路由器

### 方案 3: 使用同一 WiFi 网络

确保两台设备连接到**完全相同**的 WiFi 网络：
- 不要一个连 5GHz，一个连 2.4GHz
- 不要使用"访客网络"
- 某些路由器的"设备隔离"功能会阻止局域网设备互相通信

### 方案 4: 测试网络连通性

#### 在客户端设备上测试:

```bash
# 测试能否访问主机的 PeerJS 服务器
curl http://192.168.31.21:9000/myapp

# 测试能否 ping 通主机
ping 192.168.31.21

# 测试端口是否开放
nc -zv 192.168.31.21 9000
```

### 方案 5: 检查是否是手机系统限制

某些手机（特别是 iPhone）在省电模式或后台时会限制 WebRTC 连接。

**解决办法：**
- 关闭省电模式
- 保持应用在前台
- 允许浏览器使用所有网络权限

## 当前代码已包含的优化

✅ 添加了多个 STUN 服务器（提高连接成功率）
✅ 增加了 ICE 候选池大小
✅ 启用了可靠数据通道
✅ 添加了详细的 ICE 连接状态日志

## 测试步骤

1. **重启服务器**
   ```bash
   npm start
   ```

2. **查看新的日志输出**

   现在客户端会显示详细的 ICE 连接状态：
   ```
   [PeerService] ICE connection state: checking
   [PeerService] ICE gathering state: gathering
   [PeerService] Signaling state: stable
   ```

3. **分析日志**

   - `ICE connection state: checking` → 正在尝试建立连接
   - `ICE connection state: connected` → 连接成功！
   - `ICE connection state: failed` → 连接失败，需要检查防火墙/路由器

4. **如果看到 "failed"**

   说明 WebRTC 无法在你的网络环境下工作，需要：
   - 检查防火墙（见方案 1）
   - 检查路由器设置（见方案 2）
   - 确认 WiFi 网络配置（见方案 3）

## 下一步

请重新测试并提供以下信息：

1. **ICE connection state** 的完整变化过程
2. **ICE gathering state** 的状态
3. 是否关闭了防火墙
4. 两台设备是否连接到同一个 WiFi（包括频段）
5. 路由器型号和 UPnP 是否启用

## 紧急备选方案

如果以上都无法解决，可以考虑：
- 使用 TURN 服务器中继数据（需要额外配置）
- 改用 WebSocket 直接通信（放弃 P2P，所有数据通过服务器）
- 使用云端 PeerJS 服务器（需要公网访问）
