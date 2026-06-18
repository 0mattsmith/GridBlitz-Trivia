// Shared types for Football Trivia Arena

// 1. Football Tic-Tac-Toe (Immaculate Grid)
export type CriteriaType = 'League' | 'Trophy' | 'Nationality' | 'Club' | 'Partner' | 'Manager';

export interface GridCriteria {
  type: CriteriaType;
  value: string;
}

export interface GridCellState {
  index: number; // 0-8 for 3x3 grid
  owner: 'X' | 'O' | null;
  playerGuess: string | null;
  checkedByAI: boolean;
}

export interface GridSetup {
  rows: GridCriteria[]; // 3 criteria
  cols: GridCriteria[]; // 3 criteria
  solvable: boolean;
  gameMode: 'single' | 'two-player';
  allowRepeats?: boolean;
}

export interface TicTacToeGuessResponse {
  success: boolean;
  clarification: string;
}

// 2. Football Tenable/Tension
export interface TenableTopic {
  id: string;
  title: string;
  description: string;
  items: string[]; // List of 10 answers
}

export interface TenableSetup {
  livesMode: 'custom' | 'zero' | 'infinite';
  livesCount: number;
  timerMode: 'none' | 'round' | 'full'; // 'round': time per guess, 'full': time for whole board
  timerDuration: number; // in seconds
  allowRepeats?: boolean;
}

// 3. Career Path Mode
export interface CareerPathItem {
  years: string;
  club: string;
  apps: string;
  goals: string;
}

export interface CareerPathPlayer {
  id: string;
  name: string;
  nationality: string;
  positions: string;
  birthYear: string;
  clues: string[];
  career: CareerPathItem[];
}

export interface CareerPathSetup {
  hideYears: boolean;
  allowRepeats?: boolean;
}
