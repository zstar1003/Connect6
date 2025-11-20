import { BOARD_SIZE, WIN_COUNT } from '../constants';
import { BoardState, Player, Coordinate } from '../types';
import { getKey } from './gameLogic';

// Heuristic weights
const SCORES = {
  WIN: 100000000,
  OPEN_5: 1000000,
  CLOSED_5: 50000,
  OPEN_4: 50000,
  CLOSED_4: 5000,
  OPEN_3: 5000,
  CLOSED_3: 500,
  OPEN_2: 200,
  CLOSED_2: 50,
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
  let openEnds = 0;
  
  // Check backwards
  let i = 1;
  while (true) {
    const tr = r - dr * i;
    const tc = c - dc * i;
    if (tr < 0 || tr >= BOARD_SIZE || tc < 0 || tc >= BOARD_SIZE) break;

    const val = board.get(getKey(tr, tc));
    if (val === player) {
      count++;
    } else if (val === undefined) {
      openEnds++;
      break;
    } else {
      // Opponent blocked
      break;
    }
    i++;
  }
  
  // Check forwards
  let j = 1;
  while (true) {
    const tr = r + dr * j;
    const tc = c + dc * j;
    if (tr < 0 || tr >= BOARD_SIZE || tc < 0 || tc >= BOARD_SIZE) break;

    const val = board.get(getKey(tr, tc));
    if (val === player) {
      count++;
    } else if (val === undefined) {
      openEnds++;
      break;
    } else {
      break;
    }
    j++;
  }

  // +1 because we assume placing a stone at (r,c)
  const totalLen = count + 1;

  if (totalLen >= WIN_COUNT) return SCORES.WIN;
  
  // Adjust scores for Connect 6
  if (totalLen === 5) return openEnds > 0 ? (openEnds > 1 ? SCORES.OPEN_5 : SCORES.CLOSED_5) : 0;
  if (totalLen === 4) return openEnds > 0 ? (openEnds > 1 ? SCORES.OPEN_4 : SCORES.CLOSED_4) : 0;
  if (totalLen === 3) return openEnds > 0 ? (openEnds > 1 ? SCORES.OPEN_3 : SCORES.CLOSED_3) : 0;
  if (totalLen === 2) return openEnds > 0 ? (openEnds > 1 ? SCORES.OPEN_2 : SCORES.CLOSED_2) : 0;
  
  return 1; // Base value for adjacency
};

const evaluatePosition = (board: BoardState, row: number, col: number, player: Player, opponent: Player): number => {
  let attackScore = 0;
  let defenseScore = 0;

  for (const { dr, dc } of DIRECTIONS) {
    attackScore += evaluateLine(board, row, col, dr, dc, player);
  }

  for (const { dr, dc } of DIRECTIONS) {
    defenseScore += evaluateLine(board, row, col, dr, dc, opponent);
  }

  // Defense is critical if opponent is about to win
  if (defenseScore >= SCORES.OPEN_5) defenseScore *= 2.0;
  
  return attackScore + defenseScore;
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