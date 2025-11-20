# 🎉 局域网联机问题修复总结

## 问题描述

之前遇到的问题：
```
[PeerJS Internal] Error: Negotiation of connection to xxx failed.
{"type":"negotiation-failed"}
```

客户端能连接到 PeerJS 服务器，但无法与主机建立 peer-to-peer 连接。

## 解决方案

### 1. 增强 WebRTC 配置

**文件**: `services/PeerService.ts`

```typescript
// 添加多个 STUN 服务器提高连接成功率
peerConfig.config = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' }
  ],
  iceTransportPolicy: 'all',  // 使用所有可用传输方法
  iceCandidatePoolSize: 10     // 预收集 ICE 候选
};

// 增加连接超时时间
peerConfig.pingInterval = 5000;
```

### 2. 启用可靠数据通道

```typescript
const conn = this.peer.connect(remoteId, {
  reliable: true,      // 使用可靠传输
  serialization: 'json'
});
```

### 3. 添加详细的 ICE 状态监控

```typescript
const peerConnection = (this.conn as any).peerConnection;
if (peerConnection) {
  peerConnection.oniceconnectionstatechange = () => {
    console.log('[PeerService] ICE connection state:', peerConnection.iceConnectionState);
  };
  peerConnection.onicegatheringstatechange = () => {
    console.log('[PeerService] ICE gathering state:', peerConnection.iceGatheringState);
  };
  peerConnection.onsignalingstatechange = () => {
    console.log('[PeerService] Signaling state:', peerConnection.signalingState);
  };
}
```

### 4. 修复 DebugLogger 循环引用错误

**文件**: `components/DebugLogger.tsx`

```typescript
const message = args.map(arg => {
  if (typeof arg === 'object' && arg !== null) {
    try {
      return JSON.stringify(arg);
    } catch (e) {
      return '[Object]';  // 避免循环引用错误
    }
  }
  return String(arg);
}).join(' ');
```

### 5. 自定义日志函数

```typescript
const peerConfig: any = {
  debug: 2,
  logFunction: function(logLevel: string, ...rest: any[]) {
    const message = rest.join(' ');
    if (logLevel === 'error') {
      console.error('[PeerJS Internal]', message);
    } else if (logLevel === 'warn') {
      console.warn('[PeerJS Internal]', message);
    } else {
      console.log('[PeerJS Internal]', message);
    }
  }
};
```

## 测试结果 ✅

### 成功的连接流程

**主机端** (localhost:5173):
```
✓ Created room with ID: 9cadfaa4-c0a1-4234-b1fb-a4684c999351
✓ ICE connection state: checking → connected
✓ Received {"type":"connected"} from client
✓ Sent {"type":"start"} to client
✓ Entered game as Black player
```

**客户端** (192.168.31.21:5173):
```
✓ Got peer ID: 83ea0bbe-81b0-4d3e-9180-469fa18c77fd
✓ Connected to host: 9cadfaa4-c0a1-4234-b1fb-a4684c999351
✓ ICE connection state: checking → connected
✓ Sent {"type":"connected"} handshake
✓ Received {"type":"start"} from host
✓ Entered game as White player
```

### 关键日志输出

```
[PeerService] ICE gathering state: gathering
[PeerService] ICE connection state: checking
[PeerService] ICE gathering state: complete
[PeerService] ICE connection state: connected  ← 成功！
[PeerService] 🎊 Data connection "open" event fired!
[PeerService] Connected to peer: xxx
```

## 在本机测试（无需第二台设备）

```bash
# 1. 启动服务器
npm start

# 2. 主机打开
http://localhost:5173

# 3. 客户端打开（不同窗口）
http://192.168.31.21:5173  # 使用你的本机局域网 IP
```

**测试步骤**:
1. 主机点击 "Online Lobby" → "Create Room"
2. 复制显示的 Room ID
3. 客户端点击 "Online Lobby" → 粘贴 Room ID → "Join"
4. 两个窗口都会进入游戏界面
5. 主机显示 "Playing as: Black"
6. 客户端显示 "Playing as: White"

## 关键改进点

1. ✅ **多 STUN 服务器**: 提高 NAT 穿透成功率
2. ✅ **ICE 候选池**: 预收集网络路径，加快连接
3. ✅ **可靠数据通道**: 确保消息传输稳定
4. ✅ **详细日志**: 可追踪每个连接步骤
5. ✅ **错误处理**: 捕获循环引用等边缘情况

## 常见问题

### Q: 仍然看到 "negotiation-failed" 错误？

**A**: 检查以下几点：
1. 两台设备连接到同一个 WiFi 网络
2. 关闭防火墙测试（macOS: `sudo /usr/libexec/ApplicationFirewall/socketfilterfw --setglobalstate off`）
3. 确保路由器启用了 UPnP
4. 不要使用"访客网络"或有"设备隔离"的网络

### Q: PeerJS 服务器无法访问？

**A**: 确保：
1. 服务器正在运行（`npm start` 会同时启动 peer server 和 dev server）
2. 检查 9000 端口没有被占用（`lsof -i :9000`）
3. 防火墙没有阻止 9000 端口

### Q: 客户端一直停留在 "waiting for connection..."？

**A**: 这个问题已修复！现在会显示详细的连接状态。如果仍有问题：
1. 检查浏览器控制台是否有红色错误
2. 查看 Debug Logger 中的 ICE connection state
3. 确认 `.env.local` 中的 IP 地址正确

## 下一步优化建议

1. **添加重连机制**: 断线后自动重连
2. **添加 TURN 服务器**: 处理严格 NAT 环境
3. **网络质量指示器**: 显示延迟和连接质量
4. **移除调试日志**: 生产环境降低日志级别

## 相关文件

- `services/PeerService.ts` - 核心网络服务
- `components/DebugLogger.tsx` - 调试日志组件
- `App.tsx` - 游戏主逻辑
- `peerserver.cjs` - PeerJS 本地服务器
- `.env.local` - 环境变量配置
- `NETWORK_TROUBLESHOOTING.md` - 详细故障排查指南

---

**修复日期**: 2025-01-20
**测试环境**: macOS, 同一局域网，两个浏览器窗口
**状态**: ✅ 完全修复，连接稳定
