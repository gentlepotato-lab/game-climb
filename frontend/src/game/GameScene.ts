import Phaser from 'phaser';
import type { GameOptions, GameResult } from './types';
import { ensureTextures } from './art';
import { Parrot } from './objects/Parrot';
import { Obstacle, ObstacleKind } from './objects/Obstacle';
import { DIFFICULTY_CONFIG, getSpeed, getSpawnInterval } from './systems/Difficulty';
import { virtualInput, consumeBurst } from './virtualInput';

export class GameScene extends Phaser.Scene {
  private options: GameOptions;
  private parrot!: Parrot;
  private obstacles!: Phaser.Physics.Arcade.Group;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys!: { left: Phaser.Input.Keyboard.Key; right: Phaser.Input.Keyboard.Key; burst: Phaser.Input.Keyboard.Key };
  private hud!: Phaser.GameObjects.Text;
  private window!: Phaser.GameObjects.Image;
  private curtain!: Phaser.GameObjects.TileSprite;
  private rope!: Phaser.GameObjects.TileSprite;
  private cords: Phaser.GameObjects.TileSprite[] = [];
  private cordBaseX: number[] = [];
  private cordSway: number[] = [];
  private feathers: Phaser.GameObjects.Image[] = [];
  private lives = 3;
  private maxLives = 5;
  private startTime = 0;
  private nextSpawnAt = 0;
  private burstUntil = 0;
  private burstQueued = false;
  private spawnIndex = 0;
  private gameDurationMs = Number.POSITIVE_INFINITY;
  private safeUntil = 0;
  private hasStarted = false;
  private height = 0;
  private score = 0;
  private obstaclesAvoided = 0;
  private scoreBonus = 0;
  private ended = false;
  private lastMoveAt = 0;
  private emoteUntil = 0;
  private hitCooldownUntil = 0;
  private emoteText!: Phaser.GameObjects.Text;
  private emoteHideAt = 0;
  private touchActive = false;
  private touchStartX = 0;
  private touchStartTime = 0;
  private touchDir = 0;
  private touchMode: 'tap' | 'move' = 'tap';

  constructor(options: GameOptions) {
    super('game');
    this.options = options;
  }

  preload() {
    if (this.textures.exists('hanriver-bg')) {
      this.textures.remove('hanriver-bg');
    }
    this.load.image('hanriver-bg', `/hanriver_bg.png?v=${Date.now()}`);
  }

  create() {
    ensureTextures(this);

    const { width, height } = this.scale;
    this.window = this.add.image(width / 2, height / 2, 'hanriver-bg').setOrigin(0.5).setDepth(0);
    const bgSource = this.textures.get('hanriver-bg').getSourceImage() as HTMLImageElement;
    const bgScale = Math.max(width / bgSource.width, height / bgSource.height);
    this.window.setScale(bgScale);
    this.curtain = this.add.tileSprite(0, 0, width, height, 'curtain').setOrigin(0).setDepth(1).setAlpha(0.35);
    this.rope = this.add.tileSprite(width / 2, 0, 12, height, 'rope').setOrigin(0.5, 0).setDepth(2);

    const cordXs = [width * 0.25, width * 0.5, width * 0.75];
    cordXs.forEach((x) => {
      const cord = this.add.tileSprite(x, 0, 8, height, 'cord').setOrigin(0.5, 0).setDepth(2);
      this.cords.push(cord);
      this.cordBaseX.push(x);
      this.cordSway.push(0);
    });

    this.parrot = new Parrot(this, width / 2 + 18, height * 0.78);
    this.parrot.sprite.setCollideWorldBounds(false);

    this.obstacles = this.physics.add.group({ runChildUpdate: true });

    this.physics.add.overlap(this.parrot.sprite, this.obstacles, (_parrot, obstacle) => {
      this.handleObstacleHit(obstacle as Obstacle);
    });

    const keyboard = this.input.keyboard;
    if (!keyboard) {
      throw new Error('Keyboard input not available.');
    }

    this.cursors = keyboard.createCursorKeys();
    this.keys = keyboard.addKeys({
      left: 'A',
      right: 'D',
      burst: 'SPACE'
    }) as { left: Phaser.Input.Keyboard.Key; right: Phaser.Input.Keyboard.Key; burst: Phaser.Input.Keyboard.Key };

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.touchActive = true;
      this.touchStartX = pointer.x;
      this.touchStartTime = this.time.now;
      this.touchMode = 'tap';
      this.touchDir = 0;
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!this.touchActive) return;
      const dx = pointer.x - this.touchStartX;
      if (Math.abs(dx) > 18) {
        this.touchMode = 'move';
        this.touchDir = Math.sign(dx);
      }
    });

    this.input.on('pointerup', () => {
      if (this.touchMode === 'tap' && this.time.now - this.touchStartTime < 240) {
        this.burstQueued = true;
      }
      this.touchActive = false;
      this.touchDir = 0;
    });

    this.hud = this.add.text(12, 12, '', {
      fontFamily: 'Galmuri11',
      fontSize: '16px',
      color: '#f7efe4'
    }).setDepth(5);

    this.createFeathers();
    this.setLives(this.lives);

    this.emoteText = this.add.text(0, 0, '', {
      fontFamily: 'Galmuri11',
      fontSize: '20px',
      color: '#f7efe4'
    }).setDepth(6).setVisible(false);

    this.startTime = 0;
    this.nextSpawnAt = 0;
    this.spawnIndex = 0;
    this.safeUntil = 0;
    this.hasStarted = false;
  }

  private createFeathers() {
    const { width } = this.scale;
    const spacing = 18;
    const startX = width - 12;
    for (let i = 0; i < this.maxLives; i += 1) {
      const icon = this.add.image(startX - i * spacing, 10, 'feather')
        .setOrigin(1, 0)
        .setDepth(6)
        .setScale(1.65);
      this.feathers.push(icon);
    }
  }

  private setLives(value: number) {
    this.lives = Phaser.Math.Clamp(value, 0, this.maxLives);
    this.feathers.forEach((icon, index) => {
      icon.setAlpha(index < this.lives ? 1 : 0.25);
    });
  }

  private handleObstacleHit(obstacle: Obstacle) {
    if (this.ended) return;
    if (!obstacle.active) return;

    const now = this.time.now;
    if (obstacle.kind === 'seed') {
      obstacle.destroy();
      this.scoreBonus += 120;
      this.setLives(this.lives + 1);
      this.emoteText.setText('😘').setVisible(true);
      this.emoteHideAt = now + 380;
      return;
    }

    if (obstacle.kind === 'dust') {
      if (now < this.safeUntil || now < this.hitCooldownUntil) return;
      obstacle.destroy();
      this.hitCooldownUntil = now + 600;
      this.setLives(this.lives - 1);
      this.emoteText.setText('😣').setVisible(true);
      this.emoteHideAt = now + 450;
      if (this.lives <= 0) {
        this.finishRun();
      }
    }
  }

  private spawnObstacle(speed: number, elapsedSec: number, config: (typeof DIFFICULTY_CONFIG)[keyof typeof DIFFICULTY_CONFIG]) {
    const { width } = this.scale;
    const margin = 40;
    const safeRadius = 60;
    const parrotX = this.parrot.sprite.x;
    const span = width - margin * 2;
    const bins = 6;
    const binWidth = span / bins;
    let x = margin + binWidth * (this.spawnIndex % bins) + Phaser.Math.Between(0, Math.max(1, Math.floor(binWidth - 1)));
    this.spawnIndex += 1;
    let attempts = 0;
    while (Math.abs(x - parrotX) < safeRadius && attempts < 6) {
      const offset = ((this.spawnIndex + attempts) % bins) * binWidth;
      x = margin + offset + Phaser.Math.Between(0, Math.max(1, Math.floor(binWidth - 1)));
      attempts += 1;
    }
    if (Math.abs(x - parrotX) < safeRadius) {
      x = Phaser.Math.Between(margin, width - margin);
    }
    const y = -20;
    const timeTier = Math.floor(elapsedSec / 20);
    const seedChance = Math.max(0.05, config.seedChance + 0.02 - timeTier * 0.01);
    const roll = Math.random();
    const kind: ObstacleKind = roll < seedChance ? 'seed' : 'dust';
    const obstacle = new Obstacle(this, x, y, kind);
    const obstacleBody = obstacle.body as Phaser.Physics.Arcade.Body;
    obstacleBody.setVelocityY((speed + obstacle.extraSpeed) * obstacle.speedScale);
    this.obstacles.add(obstacle);
  }

  private finishRun() {
    this.ended = true;
    this.physics.pause();

    const durationMs = Math.min(this.gameDurationMs, this.time.now - this.startTime);
    const result: GameResult = {
      difficulty: this.options.difficulty,
      score: this.score,
      height: this.height,
      durationMs,
      obstaclesAvoided: this.obstaclesAvoided
    };

    this.time.delayedCall(400, () => {
      this.options.onGameOver(result);
    });
  }

  update(time: number, delta: number) {
    if (this.ended) return;

    const now = this.time.now;
    if (!this.hasStarted) {
      this.hasStarted = true;
      this.startTime = now;
      this.nextSpawnAt = now + 1500;
      this.safeUntil = now + 1500;
    }

    const elapsedMs = now - this.startTime;
    const elapsedSec = elapsedMs / 1000;
    const config = DIFFICULTY_CONFIG[this.options.difficulty];

    if (elapsedMs >= this.gameDurationMs) {
      this.finishRun();
      return;
    }

    const virtualBurst = consumeBurst();
    if (Phaser.Input.Keyboard.JustDown(this.keys.burst) || this.burstQueued || virtualBurst) {
      this.burstUntil = now + 220;
      this.burstQueued = false;
    }

    const isBursting = now < this.burstUntil;
    const speed = getSpeed(config, elapsedSec, 0);

    if (now >= this.nextSpawnAt) {
      this.spawnObstacle(speed, elapsedSec, config);
      const timeTier = Math.floor(elapsedSec / 20);
      const interval = Math.max(config.minSpawnMs, getSpawnInterval(config, elapsedSec) - timeTier * 40);
      this.nextSpawnAt = now + interval;
    }

    this.curtain.tilePositionY -= (speed * delta) / 1300;
    this.rope.tilePositionY -= (speed * delta) / 3200;
    this.cords.forEach((cord) => {
      cord.tilePositionY -= (speed * delta) / 3200;
    });

    const leftPressed = this.cursors.left?.isDown || this.keys.left.isDown || virtualInput.left;
    const rightPressed = this.cursors.right?.isDown || this.keys.right.isDown || virtualInput.right;

    let direction = 0;
    if (leftPressed) direction -= 1;
    if (rightPressed) direction += 1;
    if (this.touchDir !== 0) direction = this.touchDir;

    const body = this.parrot.sprite.body as Phaser.Physics.Arcade.Body;
    const lateralBoost = isBursting ? config.lateralSpeed * 0.7 : 0;
    const targetVelocity = direction * (config.lateralSpeed + lateralBoost);
    body.velocity.x = Phaser.Math.Linear(body.velocity.x, targetVelocity, 0.2);

    const margin = this.scale.width * 0.1;
    this.parrot.sprite.x = Phaser.Math.Clamp(this.parrot.sprite.x, margin, this.scale.width - margin);
    if (this.parrot.sprite.x <= margin && body.velocity.x < 0) {
      body.velocity.x = 0;
    }
    if (this.parrot.sprite.x >= this.scale.width - margin && body.velocity.x > 0) {
      body.velocity.x = 0;
    }

    if (Math.abs(body.velocity.x) > 5) {
      this.lastMoveAt = now;
    }

    if (isBursting) {
      this.parrot.setMotion('burst');
    } else if (Math.abs(body.velocity.x) > 5) {
      this.parrot.setMotion('climb');
    } else if (now - this.lastMoveAt > 900) {
      this.parrot.setMotion('rest');
    } else {
      this.parrot.setMotion('climb');
    }

    this.parrot.update(time, body.velocity.x);

    const parrotX = this.parrot.sprite.x;
    this.cords.forEach((cord, index) => {
      const baseX = this.cordBaseX[index];
      const dx = Math.abs(parrotX - baseX);
      if (dx < 10) {
        this.cordSway[index] = Math.min(1, this.cordSway[index] + 0.25);
      }
      this.cordSway[index] *= 0.93;
      const sway = Math.sin(time * 0.02 + index) * 2.2 * this.cordSway[index];
      cord.x = baseX + sway;
    });
    if (this.emoteText.visible) {
      this.emoteText.setPosition(this.parrot.sprite.x + 14, this.parrot.sprite.y - 18);
      this.emoteText.setAlpha((Math.floor(now / 120) % 2) ? 0.2 : 1);
      if (now >= this.emoteHideAt) {
        this.emoteText.setVisible(false);
      }
    }

    this.obstacles.children.each((child) => {
      const obstacle = child as Obstacle;
      const obstacleBody = obstacle.body as Phaser.Physics.Arcade.Body;
      obstacleBody.velocity.y = (speed + obstacle.extraSpeed) * obstacle.speedScale;
      if (obstacle.y > this.scale.height + 30) {
        obstacle.destroy();
        this.obstaclesAvoided += 1;
      }
      return true;
    });

    this.height = Math.floor(elapsedSec * 3);
    this.score = Math.floor(this.height * 2 + this.obstaclesAvoided * 15 + this.scoreBonus);

    const heightCm = Math.round((this.height * 100) / 200);
    this.hud.setText(
      `난이도 ${this.options.difficulty.toUpperCase()}  생존 ${(elapsedSec).toFixed(1)}s\n` +
      `높이 ${heightCm}cm  점수 ${this.score}  회피 ${this.obstaclesAvoided}`
    );
  }
}
