export type CharacterKey = 'mongle' | 'bori' | 'momo' | 'beongae' | 'makdung';

export type GameResult = {
  character: CharacterKey;
  score: number;
  height: number;
  durationMs: number;
  obstaclesAvoided: number;
};

export type GameOptions = {
  character: CharacterKey;
  onGameOver: (result: GameResult) => void;
};
