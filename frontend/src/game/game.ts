import Phaser from 'phaser';
import { GameScene } from './GameScene';
import type { GameOptions } from './types';

let game: Phaser.Game | null = null;

export const startGame = (options: GameOptions) => {
  if (game) {
    game.destroy(true);
    game = null;
  }

  game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'app',
    backgroundColor: '#201a12',
    pixelArt: true,
    roundPixels: true,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: 360,
      height: 640
    },
    physics: {
      default: 'arcade',
      arcade: {
        debug: false
      }
    },
    scene: [new GameScene(options)]
  });

  return game;
};