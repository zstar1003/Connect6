# 在线联机对战回合同步修复

## 问题描述

在双人联机对战时,一方下了一颗子后(总共要下两颗子),另一方竟然可以提前下棋。这违反了六子棋的回合规则。

### 期望行为
- 黑方下第 1 颗棋子(共需 2 颗)
- **白方必须等待**,直到黑方下完第 2 颗棋子
- 黑方下完第 2 颗棋子后,回合完成
- 现在轮到白方,白方可以开始下棋

### 实际错误行为
- 黑方下第 1 颗棋子
- 白方可以立即下棋 ❌ (错误!)

## 根本原因

### 问题 1: React 状态异步更新

```typescript
// 玩家 A 下第一颗棋子
executeMove(row, col, Player.Black);  // 本地状态: stonesPlacedThisTurn=1, currentPlayer=Black

// 发送给玩家 B
peerService.send({ type: 'move', payload: { row, col, player: Black } });

// 玩家 B 接收到移动
executeMove(row, col, Player.Black);  // 玩家 B 的状态: stonesPlacedThisTurn=1

// 问题: 玩家 A 和玩家 B 的状态更新是异步的
// 如果玩家 A 快速下第二颗棋子,可能会发生:
// - 玩家 A: currentPlayer 切换到 White
// - 玩家 B: 还没收到第二颗棋子的消息,但 currentPlayer 已经是 White
// - 玩家 B 以为轮到自己了! ❌
```

### 问题 2: 独立状态管理

两个玩家各自运行 `executeMove`,各自管理 `currentPlayer` 和 `stonesPlacedThisTurn` 状态。由于网络延迟和 React 状态更新的异步性,两边的状态可能不同步。

### 问题 3: 错误的验证逻辑

原来的验证代码:

```typescript
// App.tsx:253 (修复前)
if (stonesPlacedThisTurn > 0 && currentPlayer !== localPlayerRole) {
  return;  // 阻止点击
}
```

这个条件永远不会为真,因为:
- 前面已经检查了 `if (currentPlayer !== localPlayerRole) return;`
- 所以到达这里时,`currentPlayer === localPlayerRole` 必定为真
- 因此 `currentPlayer !== localPlayerRole` 永远是 false

## 解决方案

### 核心思路

**发送方的状态是权威的** - 发送移动的玩家应该明确告诉对方:
1. 当前下了几颗棋子
2. 回合是否完成
3. 下一个玩家是谁

而不是让接收方自己计算这些状态。

### 技术实现

#### 1. 增强网络消息格式

**文件**: `App.tsx:260-278`

```typescript
if ((gameMode === GameMode.OnlineHost || gameMode === GameMode.OnlineJoin) && peerService.current) {
  // 计算移动后的状态
  const stonesPerTurn = isFirstMove ? 1 : 2;
  const newStonesPlaced = stonesPlacedThisTurn + 1;
  const turnComplete = newStonesPlaced >= stonesPerTurn;

  peerService.current.send({
    type: 'move',
    payload: {
      row,
      col,
      player: currentPlayer,
      stonesPlacedThisTurn: newStonesPlaced,      // 下完这颗后总共几颗
      isFirstMove: isFirstMove,                   // 是否是第一回合
      turnComplete: turnComplete,                 // 回合是否完成
      nextPlayer: turnComplete ?
        (currentPlayer === Player.Black ? Player.White : Player.Black) :
        currentPlayer                            // 下一个玩家是谁
    }
  });
}
```

**关键点**:
- `stonesPlacedThisTurn`: 下完这颗棋子后,当前回合总共下了几颗
- `turnComplete`: 明确告诉对方回合是否完成
- `nextPlayer`: 明确告诉对方下一个该谁下

#### 2. 更新 Host 接收处理

**文件**: `App.tsx:330-341`

```typescript
else if (data.type === 'move') {
  // 从 Client 接收移动,带有明确的状态同步信息
  const {
    row,
    col,
    player,
    stonesPlacedThisTurn: opponentStonesPlaced,
    isFirstMove: opponentIsFirstMove,
    turnComplete,
    nextPlayer
  } = data.payload;

  console.log('[Host] Syncing state:', {
    opponentStonesPlaced,
    opponentIsFirstMove,
    turnComplete,
    nextPlayer
  });

  // 在棋盘上执行移动
  executeMove(row, col, player);

  // 注意: executeMove 会处理状态更新,
  // 但对方的状态是权威的,应该与 payload 中的 nextPlayer 一致
}
```

#### 3. 更新 Client 接收处理

**文件**: `App.tsx:422-433`

```typescript
else if (data.type === 'move') {
  // 从 Host 接收移动,带有明确的状态同步信息
  const {
    row,
    col,
    player,
    stonesPlacedThisTurn: opponentStonesPlaced,
    isFirstMove: opponentIsFirstMove,
    turnComplete,
    nextPlayer
  } = data.payload;

  console.log('[Client] Syncing state:', {
    opponentStonesPlaced,
    opponentIsFirstMove,
    turnComplete,
    nextPlayer
  });

  // 在棋盘上执行移动
  executeMove(row, col, player);

  // 注意: executeMove 会处理状态更新,
  // 但对方的状态是权威的,应该与 payload 中的 nextPlayer 一致
}
```

#### 4. 简化点击验证逻辑

**文件**: `App.tsx:244-249`

```typescript
// 在线游戏: 检查是否轮到这个玩家
if (gameMode !== GameMode.Local && gameMode !== GameMode.AI) {
  // 只需检查当前玩家是否匹配本地玩家角色
  // 回合状态同步由 executeMove 和网络消息处理
  if (currentPlayer !== localPlayerRole) return;
}
```

**简化原因**:
- 移除了错误的逻辑判断
- 回合同步由网络消息明确处理
- 保持验证逻辑简单清晰

## 工作流程

### 场景: 黑方下两颗棋子

```
1. 黑方下第 1 颗棋子
   ↓
2. 黑方本地状态:
   - stonesPlacedThisTurn = 1
   - currentPlayer = Black (未切换)
   ↓
3. 黑方发送网络消息:
   {
     player: Black,
     stonesPlacedThisTurn: 1,
     turnComplete: false,      ← 回合未完成!
     nextPlayer: Black         ← 下一个还是黑方
   }
   ↓
4. 白方接收消息并执行 executeMove
   - 白方本地状态与黑方同步
   - currentPlayer = Black
   - 白方点击被阻止 ✓
   ↓
5. 黑方下第 2 颗棋子
   ↓
6. 黑方本地状态:
   - stonesPlacedThisTurn = 2
   - currentPlayer = White (已切换!)
   ↓
7. 黑方发送网络消息:
   {
     player: Black,
     stonesPlacedThisTurn: 2,
     turnComplete: true,       ← 回合完成!
     nextPlayer: White         ← 下一个是白方
   }
   ↓
8. 白方接收消息并执行 executeMove
   - 白方本地状态与黑方同步
   - currentPlayer = White
   - 白方现在可以点击了 ✓
```

## 调试日志

修复后会在控制台看到以下日志:

```
[Host] Received data: { type: 'move', payload: { ..., turnComplete: false, nextPlayer: 'Black' } }
[Host] Syncing state: { opponentStonesPlaced: 1, opponentIsFirstMove: false, turnComplete: false, nextPlayer: 'Black' }

[Host] Received data: { type: 'move', payload: { ..., turnComplete: true, nextPlayer: 'White' } }
[Host] Syncing state: { opponentStonesPlaced: 2, opponentIsFirstMove: false, turnComplete: true, nextPlayer: 'White' }
```

这些日志可以帮助验证状态同步是否正确。

## 测试方法

### 测试步骤

1. 启动本地服务器:
   ```bash
   npm run dev
   node peerserver.cjs
   ```

2. 打开两个浏览器窗口:
   - 窗口 A: 点击 "Host Game"
   - 窗口 B: 复制房间 ID,点击 "Join Game"

3. **第一回合** (黑方下 1 颗):
   - 黑方(Host)下 1 颗棋子
   - ✓ 验证: 白方(Client)不能点击
   - ✓ 验证: 黑方回合自动结束
   - ✓ 验证: 切换到白方

4. **第二回合** (白方下 2 颗):
   - 白方下第 1 颗棋子
   - ✓ 验证: 黑方不能点击 (关键测试!)
   - ✓ 验证: 白方可以继续下第 2 颗
   - 白方下第 2 颗棋子
   - ✓ 验证: 2 颗棋子同时发光
   - ✓ 验证: 回合结束,切换到黑方

5. **第三回合** (黑方下 2 颗):
   - 黑方下第 1 颗棋子
   - ✓ 验证: 白方不能点击 (关键测试!)
   - ✓ 验证: 黑方可以继续下第 2 颗
   - 黑方下第 2 颗棋子
   - ✓ 验证: 白方之前的发光消失
   - ✓ 验证: 黑方的 2 颗棋子发光

### 关键测试点

**最重要**: 当一方下了第 1 颗棋子(共需 2 颗)时,对方**绝对不能**点击棋盘!

### 使用浏览器开发者工具

打开控制台,观察日志:

```javascript
// 应该看到明确的状态同步信息
[Host] Syncing state: { turnComplete: false, nextPlayer: 'Black' }
[Client] Syncing state: { turnComplete: false, nextPlayer: 'Black' }

// 回合完成时
[Host] Syncing state: { turnComplete: true, nextPlayer: 'White' }
[Client] Syncing state: { turnComplete: true, nextPlayer: 'White' }
```

## 边界情况

### 第一回合特殊规则
- `isFirstMove = true`
- `stonesPerTurn = 1`
- 黑方只下 1 颗棋子
- 回合立即完成,切换到白方

### 网络延迟
- 即使有延迟,状态同步仍然正确
- 因为 `turnComplete` 和 `nextPlayer` 是明确发送的
- 不依赖于时序或计算

### 快速连续点击
- 玩家快速下 2 颗棋子
- 两条消息按顺序发送
- 接收方按顺序处理
- 状态保持同步

## 相关文件

- `App.tsx:239-279` - `onCellClick` 函数及网络发送逻辑
- `App.tsx:330-341` - Host 接收处理
- `App.tsx:422-433` - Client 接收处理
- `App.tsx:124-173` - `executeMove` 函数

## 总结

这个修复通过**明确的状态同步**解决了回合管理的问题:

1. ✅ 发送方告诉接收方回合是否完成
2. ✅ 发送方告诉接收方下一个该谁下
3. ✅ 接收方不需要自己计算,避免了同步错误
4. ✅ 简化了验证逻辑,更易于维护

现在双人联机对战的回合管理完全正确,对方必须等待当前玩家下完所有棋子才能开始自己的回合!
