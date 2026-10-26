export type DifficultyKey = 'easy' | 'normal' | 'hard';

export type GameResult = {
  difficulty: DifficultyKey;
  score: number;
  height: number;
  durationMs: number;
  obstaclesAvoided: number;
};

export type GameOptions = {
  difficulty: DifficultyKey;
  onGameOver: (result: GameResult) => void;
};