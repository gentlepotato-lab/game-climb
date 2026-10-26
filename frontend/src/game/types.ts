export type DifficultyKey = 'easy' | 'normal' | 'hard';

export type CharacterKey = 'mongle' | 'bori';

export type GameResult = {
  character: CharacterKey;
  difficulty: DifficultyKey;
  score: number;
  height: number;
  durationMs: number;
  obstaclesAvoided: number;
};

export type GameOptions = {
  character: CharacterKey;
  difficulty: DifficultyKey;
  onGameOver: (result: GameResult) => void;
};
