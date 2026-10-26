import Phaser from 'phaser';

export type ObstacleKind = 'seed' | 'dust';

const textureByKind: Record<ObstacleKind, string> = {
  seed: 'obstacle-seed',
  dust: 'obstacle-dust'
};

export class Obstacle extends Phaser.Physics.Arcade.Sprite {
  extraSpeed: number;
  speedScale: number;
  kind: ObstacleKind;

  constructor(scene: Phaser.Scene, x: number, y: number, kind: ObstacleKind) {
    super(scene, x, y, textureByKind[kind]);
    this.kind = kind;
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setDepth(3);
    this.setImmovable(true);
    this.extraSpeed = Phaser.Math.Between(10, 150);
    this.speedScale = 1;
    this.setScale(1.35);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(12, 12);
    body.setOffset(2, 2);
  }
}
