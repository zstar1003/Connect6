import { BOARD_SIZE, WIN_COUNT } from '../constants';
import { BoardState, Player, Coordinate } from '../types';
import { getKey } from './gameLogic';

/**
 * Enhanced AI for Connect-6 Game
 *
 * Strategy improvements:
 * 1. More precise evaluation of open/half-open/closed patterns
 * 2. Higher priority for blocking opponent's winning moves
 * 3. Center position bonus for strategic control
 * 4. Balanced attack/defense weighting (1.2:1.5 ratio)
 * 5. Pattern recognition for 2-5 consecutive stones
 *
 * The AI uses a heuristic evaluation function to score potential moves
 * without requiring external APIs or machine learning models.
 */

// Enhanced heuristic weights for Connect-6
const SCORES = {
  WIN: 100000000,           // Immediate win
  BLOCK_WIN: 50000000,      // Block opponent's win
  OPEN_5: 10000000,         // 5 in a row with open ends
  CLOSED_5: 1000000,        // 5 in a row with one blocked end
  OPEN_4: 500000,           // 4 in a row with open ends (very dangerous)
  HALF_OPEN_4: 100000,      // 4 in a row with one open end
  CLOSED_4: 10000,          // 4 in a row with blocked ends
  OPEN_3: 50000,            // 3 in a row with open ends
  HALF_OPEN_3: 5000,        // 3 in a row with one open end
  CLOSED_3: 1000,           // 3 in a row with blocked ends
  OPEN_2: 500,              // 2 in a row with open ends
  HALF_OPEN_2: 100,         // 2 in a row with one open end
  CLOSED_2: 50,             // 2 in a row with blocked ends
  CENTER_BONUS: 20,         // Bonus for center positions
};

const DIRECTIONS = [
  { dr: 0, dc: 1 },  // Horizontal
  { dr: 1, dc: 0 },  // Vertical
  { dr: 1, dc: 1 },  // Diagonal \
  { dr: 1, dc: -1 }, // Diagonal /
];

// Get empty cells near existing stones to reduce search space
const getCandidateMoves = (board: BoardState): Coordinate[] => {
  const candidates = new Set<string>();
  const taken = Array.from(board.keys());
  
  // If board is empty, start in the center
  if (taken.length === 0) {
    return [{ row: Math.floor(BOARD_SIZE / 2), col: Math.floor(BOARD_SIZE / 2) }];
  }

  const takenSet = new Set(taken);

  for (const key of taken) {
    const [r, c] = key.split(',').map(Number);
    // Search radius 2
    for (let dr = -2; dr <= 2; dr++) {
      for (let dc = -2; dc <= 2; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = r + dr;
        const nc = c + dc;
        
        if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE) {
          const nKey = getKey(nr, nc);
          if (!takenSet.has(nKey)) {
            candidates.add(nKey);
          }
        }
      }
    }
  }
  
  const result = Array.from(candidates).map(k => {
    const [row, col] = k.split(',').map(Number);
    return { row, col };
  });

  // FALLBACK: If no candidates found (rare), return all empty cells
  if (result.length === 0) {
      const allEmpty: Coordinate[] = [];
      for(let r=0; r<BOARD_SIZE; r++) {
          for(let c=0; c<BOARD_SIZE; c++) {
              if(!board.has(getKey(r, c))) {
                  allEmpty.push({row: r, col: c});
              }
          }
      }
      return allEmpty;
  }

  return result;
};

const evaluateLine = (board: BoardState, r: number, c: number, dr: number, dc: number, player: Player): number => {
  let count = 0;
  let frontOpen = false;
  let backOpen = false;

  // Check backwards
  let i = 1;
  while (true) {
    const tr = r - dr * i;
    const tc = c - dc * i;
    if (tr < 0 || tr >= BOARD_SIZE || tc < 0 || tc >= BOARD_SIZE) {
      backOpen = false; // Hit board edge
      break;
    }

    const val = board.get(getKey(tr, tc));
    if (val === player) {
      count++;
    } else if (val === undefined) {
      backOpen = true; // Empty space behind
      break;
    } else {
      backOpen = false; // Opponent blocked
      break;
    }
    i++;
  }

  // Check forwards
  let j = 1;
  while (true) {
    const tr = r + dr * j;
    const tc = c + dc * j;
    if (tr < 0 || tr >= BOARD_SIZE || tc < 0 || tc >= BOARD_SIZE) {
      frontOpen = false; // Hit board edge
      break;
    }

    const val = board.get(getKey(tr, tc));
    if (val === player) {
      count++;
    } else if (val === undefined) {
      frontOpen = true; // Empty space in front
      break;
    } else {
      frontOpen = false; // Opponent blocked
      break;
    }
    j++;
  }

  // +1 because we assume placing a stone at (r,c)
  const totalLen = count + 1;

  if (totalLen >= WIN_COUNT) return SCORES.WIN;

  // Categorize based on open ends
  const openEnds = (frontOpen ? 1 : 0) + (backOpen ? 1 : 0);

  if (totalLen === 5) {
    if (openEnds === 2) return SCORES.OPEN_5;
    if (openEnds === 1) return SCORES.CLOSED_5;
    return 0;
  }
  if (totalLen === 4) {
    if (openEnds === 2) return SCORES.OPEN_4;
    if (openEnds === 1) return SCORES.HALF_OPEN_4;
    return SCORES.CLOSED_4;  // 添加 return
  }
  if (totalLen === 3) {
    if (openEnds === 2) return SCORES.OPEN_3;
    if (openEnds === 1) return SCORES.HALF_OPEN_3;
    return SCORES.CLOSED_3;  // 添加 return
  }
  if (totalLen === 2) {
    if (openEnds === 2) return SCORES.OPEN_2;
    if (openEnds === 1) return SCORES.HALF_OPEN_2;
    return SCORES.CLOSED_2;  // 添加 return
  }

  return 1; // Base value for adjacency
};

const evaluatePosition = (board: BoardState, row: number, col: number, player: Player, opponent: Player): number => {
  let attackScore = 0;
  let defenseScore = 0;

  // Evaluate attack potential in all directions
  for (const { dr, dc } of DIRECTIONS) {
    attackScore += evaluateLine(board, row, col, dr, dc, player);
  }

  // Evaluate defense necessity in all directions
  for (const { dr, dc } of DIRECTIONS) {
    const lineScore = evaluateLine(board, row, col, dr, dc, opponent);
    defenseScore += lineScore;

    // CRITICAL: If opponent can win next turn, prioritize blocking
    if (lineScore >= SCORES.OPEN_5 || lineScore >= SCORES.CLOSED_5) {
      defenseScore = SCORES.BLOCK_WIN;
    }
  }

  // Center position bonus - controlling the center is strategically important
  const centerRow = Math.floor(BOARD_SIZE / 2);
  const centerCol = Math.floor(BOARD_SIZE / 2);
  const distanceFromCenter = Math.abs(row - centerRow) + Math.abs(col - centerCol);
  const centerBonus = SCORES.CENTER_BONUS * (BOARD_SIZE - distanceFromCenter);

  // Defense has higher priority when opponent threatens to win
  // But attack is valued higher for creating winning opportunities
  const finalScore = attackScore * 1.2 + defenseScore * 1.5 + centerBonus;

  return finalScore;
};

export const getBestMove = (board: BoardState, aiPlayer: Player): Coordinate => {
  try {
    const candidates = getCandidateMoves(board);
    
    if (candidates.length === 0) {
        // Board is full?
        return { row: -1, col: -1 }; 
    }

    const opponent = aiPlayer === Player.Black ? Player.White : Player.Black;
    
    let bestScore = -1;
    let bestMoves: Coordinate[] = [];

    for (const move of candidates) {
      const score = evaluatePosition(board, move.row, move.col, aiPlayer, opponent);
      
      if (score > bestScore) {
        bestScore = score;
        bestMoves = [move];
      } else if (score === bestScore) {
        bestMoves.push(move);
      }
    }

    if (bestMoves.length > 0) {
      return bestMoves[Math.floor(Math.random() * bestMoves.length)];
    }
    
    return candidates[0];

  } catch (e) {
    console.error("AI Error, falling back to random move", e);
    // Simple random fallback
    let r, c;
    let attempts = 0;
    do {
        r = Math.floor(Math.random() * BOARD_SIZE);
        c = Math.floor(Math.random() * BOARD_SIZE);
        attempts++;
    } while (board.has(getKey(r,c)) && attempts < 1000);
    return { row: r, col: c };
  }
};