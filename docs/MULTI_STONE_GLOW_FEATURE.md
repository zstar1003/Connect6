# 多棋子发光效果功能

## 问题

之前的实现只显示**最后一颗**棋子的外发光效果，但在六子棋中：
- 第一回合：黑方下 **1 颗**棋子
- 之后每回合：每方下 **2 颗**棋子

用户应该看到**当前回合内所有棋子**都有发光效果，而不仅仅是最后一颗。

## 解决方案

### 核心改动

将单一的 `lastMove` 状态改为 `lastMoves` 数组，追踪当前回合内所有落下的棋子。

### 技术实现

#### 1. App.tsx - 添加状态

**文件**: `App.tsx:31`

```typescript
const [lastMove, setLastMove] = useState<Coordinate | null>(null);
const [lastMoves, setLastMoves] = useState<Coordinate[]>([]); // Track all stones placed in current turn
```

#### 2. App.tsx - 重置游戏时清空数组

**文件**: `App.tsx:90`

```typescript
const resetGame = () => {
  setBoard(new Map());
  setCurrentPlayer(Player.Black);
  setWinner(null);
  setWinningLine(null);
  setLastMove(null);
  setLastMoves([]); // Clear moves array
  setIsAITurn(false);
  setStonesPlacedThisTurn(0);
  setIsFirstMove(true);
  setStatus(GameStatus.Playing);
};
```

#### 3. App.tsx - 执行移动时更新数组

**文件**: `App.tsx:124-169`

```typescript
const executeMove = (row: number, col: number, player: Player) => {
  const key = getKey(row, col);
  if (board.has(key)) return;

  // Play stone placement sound
  soundManager.playPlaceStone();

  setBoard(prev => {
    const newBoard = new Map(prev);
    newBoard.set(key, player);
    return newBoard;
  });

  const moveCoord = { row, col };
  setLastMove(moveCoord);

  // ✨ Add to lastMoves array for this turn
  setLastMoves(prev => [...prev, moveCoord]);

  const tempBoard = new Map<string, Player>(board);
  tempBoard.set(key, player);

  const winLine = checkWin(tempBoard, moveCoord, player);

  if (winLine) {
    handleWin(player, winLine);
    return;
  }

  // Connect-6 rule: determine stones per turn
  const stonesPerTurn = isFirstMove ? 1 : 2;
  const newStonesPlaced = stonesPlacedThisTurn + 1;

  if (newStonesPlaced >= stonesPerTurn) {
    // Turn complete, switch player
    const nextPlayer = player === Player.Black ? Player.White : Player.Black;
    setCurrentPlayer(nextPlayer);
    setStonesPlacedThisTurn(0);
    setIsFirstMove(false);
    // ✨ Clear lastMoves for next turn
    setLastMoves([]);
  } else {
    // Same player continues
    setStonesPlacedThisTurn(newStonesPlaced);
  }
};
```

**关键点**:
1. 每次落子时，将坐标添加到 `lastMoves` 数组
2. 回合结束切换玩家时，清空 `lastMoves` 数组

#### 4. App.tsx - 传递给 Scene 组件

**文件**: `App.tsx:464-474`

```typescript
<Scene
  board={board}
  hoverPos={hoverPos}
  currentPlayer={currentPlayer}
  lastMove={lastMove}
  lastMoves={lastMoves}  // ✨ Pass the array
  onCellClick={onCellClick}
  onCellHover={onCellHover}
  winningLine={winningLine}
  resetCameraTrigger={resetCameraFlag}
/>
```

#### 5. Scene.tsx - 接收参数

**文件**: `components/Scene.tsx:9-19`

```typescript
interface SceneProps {
  board: BoardState;
  hoverPos: Coordinate | null;
  currentPlayer: Player;
  lastMove: Coordinate | null;
  lastMoves: Coordinate[]; // ✨ All stones placed in current turn
  onCellClick: (row: number, col: number) => void;
  onCellHover: (row: number, col: number) => void;
  winningLine: Coordinate[] | null;
  resetCameraTrigger: number;
}
```

#### 6. Scene.tsx - 使用数组判断发光效果

**文件**: `components/Scene.tsx:93-106`

```typescript
{/* Render Placed Stones */}
{Array.from(board.entries()).map(([key, player]) => {
    const [row, col] = key.split(',').map(Number);
    // ✨ Check if this stone is in the lastMoves array (current turn)
    const isInCurrentTurn = lastMoves.some(move => move.row === row && move.col === col);
    return (
        <Stone
            key={key}
            position={getPosition(row, col)}
            player={player}
            isLastMove={isInCurrentTurn}  // ✨ Glow if in current turn
        />
    );
})}
```

**关键逻辑**:
使用 `Array.some()` 检查当前石头的坐标是否在 `lastMoves` 数组中，如果在，则显示发光效果。

## 效果演示

### 场景 1: 第一回合（黑方下 1 颗）
- 黑方下第 1 颗棋子
- **1 颗**棋子显示发光效果
- 回合结束，切换到白方

### 场景 2: 第二回合（白方下 2 颗）
- 白方下第 1 颗棋子 → **1 颗**发光
- 白方下第 2 颗棋子 → **2 颗**同时发光
- 回合结束，切换到黑方

### 场景 3: 第三回合（黑方下 2 颗）
- 前面白方的 2 颗棋子发光效果消失
- 黑方下第 1 颗棋子 → **1 颗**发光
- 黑方下第 2 颗棋子 → **2 颗**同时发光
- 回合结束，切换到白方

## 工作流程图

```
玩家落子 (executeMove)
    ↓
添加到 lastMoves 数组
    ↓
检查是否完成回合 (stonesPlacedThisTurn >= stonesPerTurn)
    ↓
    ├── 是: 清空 lastMoves，切换玩家
    └── 否: 继续当前回合
    ↓
Scene 渲染
    ↓
遍历棋盘上所有棋子
    ↓
检查坐标是否在 lastMoves 中
    ↓
    ├── 是: 显示发光效果 (isLastMove=true)
    └── 否: 正常显示 (isLastMove=false)
```

## 优势

1. **符合游戏规则**: 准确显示当前回合的所有棋子
2. **视觉清晰**: 玩家可以清楚地看到刚刚落下的所有棋子
3. **自动管理**: 回合结束自动清空，无需手动干预
4. **性能优化**: 使用 `Array.some()` 快速查找，O(n) 复杂度

## 测试方法

1. 启动游戏: `npm run dev`
2. 开始一局游戏（任意模式）
3. **第一回合**: 黑方下 1 颗棋子
   - 验证: 1 颗棋子有发光效果
4. **第二回合**: 白方下 2 颗棋子
   - 验证: 第一颗下完后，1 颗发光
   - 验证: 第二颗下完后，2 颗同时发光
5. **第三回合**: 黑方下 2 颗棋子
   - 验证: 白方的 2 颗棋子发光消失
   - 验证: 黑方的新棋子显示发光

## 边界情况

### 第一回合（特殊规则）
- `isFirstMove = true`
- `stonesPerTurn = 1`
- 只添加 1 颗棋子到 `lastMoves`
- 下完后立即清空并切换玩家

### 后续回合
- `isFirstMove = false`
- `stonesPerTurn = 2`
- 添加 2 颗棋子到 `lastMoves`
- 下完 2 颗后清空并切换玩家

### 获胜情况
- 如果某颗棋子导致获胜，立即触发 `handleWin`
- 游戏结束，不会切换玩家
- `lastMoves` 保持当前状态

## 相关文件

- `App.tsx` - 游戏逻辑和状态管理
- `components/Scene.tsx` - 3D 场景渲染
- `components/Stone.tsx` - 棋子组件（接收 `isLastMove` 参数）

## 备注

保留了 `lastMove` 状态用于向后兼容，但主要逻辑已切换到使用 `lastMoves` 数组。如果确认不再需要 `lastMove`，可以在后续版本中移除。

---

这个功能完美解决了多棋子发光效果的问题，让玩家清楚地看到当前回合下的所有棋子！✨
