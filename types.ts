import React from 'react';

export enum Player {
  None = 0,
  Black = 1,
  White = 2,
}

export enum GameMode {
  Local = 'local',
  AI = 'ai',
  OnlineHost = 'host',
  OnlineJoin = 'join',
}

export enum GameStatus {
  Menu = 'menu',
  Playing = 'playing',
  Ended = 'ended',
}

export enum AIDifficulty {
  Easy = 'easy',
  Medium = 'medium',
  Hard = 'hard',
}

export interface Coordinate {
  row: number;
  col: number;
}

export interface MoveData {
  row: number;
  col: number;
  player: Player;
  seq: number; // Sequence number to track order
}

export type BoardState = Map<string, Player>;

export interface NetworkMessage {
  type: 'move' | 'start' | 'restart' | 'join';
  payload?: any;
}
