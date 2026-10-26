import Phaser from 'phaser';

export type ParrotMotion = 'climb' | 'rest' | 'burst' | 'slip';

export class Parrot {
  sprite: Phaser.Physics.Arcade.Sprite;
  private motion: ParrotMotion = 'climb';
  private baseY: number;
  private nextBlinkAt = 0;
  private blinking = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.sprite = scene.physics.add.sprite(x, y, 'parrot-0');
    this.sprite.setOrigin(0.5, 0.5);
    this.sprite.setDepth(3);
    this.sprite.setScale(1.6);
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.setSize(26, 28);
    body.setOffset(10, 9);
    this.sprite.play('parrot-climb');
    this.baseY = y;
  }

  setMotion(motion: ParrotMotion) {
    if (this.motion === motion) return;
    this.motion = motion;
    this.blinking = false;

    if (motion === 'climb') {
      this.sprite.play('parrot-climb', true);
      this.sprite.scene.tweens.killTweensOf(this.sprite);
      this.sprite.setScale(1.6);
      this.sprite.setTexture('parrot-0');
    }

    if (motion === 'rest') {
      this.sprite.play('parrot-rest', true);
      this.sprite.scene.tweens.killTweensOf(this.sprite);
      this.sprite.setScale(1.5);
      this.sprite.setTexture('parrot-0');
    }

    if (motion === 'burst') {
      this.sprite.play('parrot-burst', true);
      this.sprite.scene.tweens.add({
        targets: this.sprite,
        scaleX: 1.8,
        scaleY: 1.8,
        yoyo: true,
        duration: 120
      });
    }

    if (motion === 'slip') {
      this.sprite.scene.tweens.add({
        targets: this.sprite,
        angle: 25,
        yoyo: true,
        repeat: 4,
        duration: 60
      });
    }
  }

  update(time: number, velocityX: number) {
    this.sprite.y = this.baseY + Math.sin(time * 0.006) * 2;
    const tilt = Phaser.Math.Clamp(velocityX / 300, -0.4, 0.4);
    this.sprite.rotation = tilt;
    if (velocityX > 10) {
      this.sprite.setFlipX(false);
    } else if (velocityX < -10) {
      this.sprite.setFlipX(true);
    }

    if (!this.blinking && this.motion !== 'burst' && this.motion !== 'slip') {
      if (this.nextBlinkAt === 0) {
        this.nextBlinkAt = time + Phaser.Math.Between(1200, 2200);
      }
      if (time >= this.nextBlinkAt) {
        this.blinking = true;
        this.sprite.play('parrot-blink', true);
        this.sprite.once('animationcomplete', () => {
          this.blinking = false;
          if (this.motion === 'rest') {
            this.sprite.play('parrot-rest', true);
          } else if (this.motion === 'climb') {
            this.sprite.play('parrot-climb', true);
          }
        });
        this.nextBlinkAt = time + Phaser.Math.Between(1200, 2200);
      }
    }
  }
}