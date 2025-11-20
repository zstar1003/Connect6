import { BOARD_SIZE, WIN_COUNT } from '../constants';
import { BoardState, Player, Coordinate } from '../types';

export const getKey = (row: number, col: number) => `${row},${col}`;

export const checkWin = (board: BoardState, lastMove: Coordinate, player: Player): Coordinate[] | null => {
  const directions = [
    { dr: 0, dc: 1 },  // Horizontal
    { dr: 1, dc: 0 },  // Vertical
    { dr: 1, dc: 1 },  // Diagonal \
    { dr: 1, dc: -1 }, // Diagonal /
  ];

  for (const { dr, dc } of directions) {
    let line: Coordinate[] = [{ row: lastMove.row, col: lastMove.col }];
    
    // Check positive direction
    for (let i = 1; i < WIN_COUNT; i++) {
      const r = lastMove.row + dr * i;
      const c = lastMove.col + dc * i;
      if (board.get(getKey(r, c)) === player) {
        line.push({ row: r, col: c });
      } else {
        break;
      }
    }

    // Check negative direction
    for (let i = 1; i < WIN_COUNT; i++) {
      const r = lastMove.row - dr * i;
      const c = lastMove.col - dc * i;
      if (board.get(getKey(r, c)) === player) {
        line.push({ row: r, col: c });
      } else {
        break;
      }
    }

    if (line.length >= WIN_COUNT) {
      return line;
    }
  }

  return null;
};

export const isValidMove = (board: BoardState, row: number, col: number): boolean => {
  if (row < 0 || row >= BOARD_SIZE || col < 0 || col >= BOARD_SIZE) return false;
  return !board.has(getKey(row, col));
};
