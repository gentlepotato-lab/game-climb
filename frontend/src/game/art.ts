import Phaser from 'phaser';

const drawParrotFrame = (
  ctx: CanvasRenderingContext2D,
  wingY: number,
  blink: boolean,
  legPhase: number,
  flap: boolean
) => {
  ctx.clearRect(0, 0, 48, 48);
  ctx.imageSmoothingEnabled = false;

  // Body base (deeper yellow with more shading, no pink)
  ctx.fillStyle = '#f4d21b';
  ctx.fillRect(13, 16, 20, 18);
  ctx.fillStyle = '#e0b817';
  ctx.fillRect(18, 20, 11, 10);
  ctx.fillStyle = '#ffe866';
  ctx.fillRect(16, 17, 8, 4);
  ctx.fillStyle = '#f7dc44';
  ctx.fillRect(21, 18, 7, 4);

  // Head / face (yellow, no white)
  ctx.fillStyle = '#ffe14a';
  ctx.fillRect(16, 8, 13, 12);
  ctx.fillStyle = '#f4d21b';
  ctx.fillRect(16, 12, 11, 6);
  ctx.fillStyle = '#f7dc44';
  ctx.fillRect(18, 10, 4, 3);

  // Crown (yellow cap)
  ctx.fillStyle = '#ffe14a';
  ctx.fillRect(16, 7, 12, 2);

  // Wings (more detailed)
  ctx.fillStyle = '#f2c61f';
  if (flap) {
    ctx.fillRect(7, wingY - 2, 16, 11);
  } else {
    ctx.fillRect(9, wingY, 14, 10);
  }
  ctx.fillStyle = '#d9a716';
  ctx.fillRect(12, wingY + 2, 7, 4);
  ctx.fillStyle = '#fff09a';
  ctx.fillRect(13, wingY + 1, 4, 2);

  // Beak (richer orange with shading)
  ctx.fillStyle = '#f28c28';
  ctx.fillRect(30, 12, 8, 7);
  ctx.fillStyle = '#c96a1e';
  ctx.fillRect(31, 16, 5, 3);
  ctx.fillStyle = '#ffb55a';
  ctx.fillRect(31, 13, 2, 2);

  // Feet / legs (darker peach/orange)
  const legShift = legPhase === 0 ? 0 : 1;
  ctx.fillStyle = '#cc8256';
  ctx.fillRect(16, 31 + legShift, 3, 6);
  ctx.fillRect(24, 30 + (1 - legShift), 3, 6);
  ctx.fillStyle = '#a8673f';
  ctx.fillRect(15, 37 + legShift, 5, 2);
  ctx.fillRect(24, 36 + (1 - legShift), 5, 2);

  // Tail (slightly longer)
  ctx.fillStyle = '#f1cf3a';
  ctx.fillRect(12, 30, 3, 10);
  ctx.fillStyle = '#e0b817';
  ctx.fillRect(13, 33, 2, 6);

  // Eyes (stronger blink)
  if (blink) {
    ctx.fillStyle = '#1d1b16';
    ctx.fillRect(22, 14, 5, 2);
    ctx.fillStyle = '#2a241c';
    ctx.fillRect(22, 13, 5, 1);
  } else {
    ctx.fillStyle = '#111111';
    ctx.fillRect(22, 12, 3, 3);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(23, 12, 1, 1);
    ctx.fillStyle = '#1d1b16';
    ctx.fillRect(23, 13, 3, 3);
  }

  // Chest highlight (yellow only)
  ctx.fillStyle = '#ffe86a';
  ctx.fillRect(17, 19, 4, 3);
};

const drawBee = (ctx: CanvasRenderingContext2D) => {
  ctx.clearRect(0, 0, 16, 16);
  ctx.fillStyle = '#2b261f';
  ctx.fillRect(4, 6, 8, 5);
  ctx.fillStyle = '#f4d35e';
  ctx.fillRect(5, 6, 2, 5);
  ctx.fillRect(9, 6, 2, 5);
  ctx.fillStyle = '#f7e6a1';
  ctx.fillRect(2, 4, 4, 2);
  ctx.fillRect(10, 4, 4, 2);
};

const drawPin = (ctx: CanvasRenderingContext2D) => {
  ctx.clearRect(0, 0, 16, 16);
  ctx.fillStyle = '#ee964b';
  ctx.fillRect(4, 4, 8, 8);
  ctx.fillStyle = '#2b261f';
  ctx.fillRect(7, 2, 2, 4);
};

const drawDust = (ctx: CanvasRenderingContext2D) => {
  ctx.clearRect(0, 0, 16, 16);
  ctx.fillStyle = '#d7cec4';
  ctx.fillRect(4, 5, 6, 5);
  ctx.fillRect(3, 8, 3, 3);
  ctx.fillRect(9, 8, 3, 3);
  ctx.fillStyle = '#bfb3a6';
  ctx.fillRect(6, 4, 4, 2);
  ctx.fillRect(5, 11, 6, 2);
  ctx.fillStyle = '#a99b8f';
  ctx.fillRect(6, 6, 2, 2);
};

const drawSeed = (ctx: CanvasRenderingContext2D) => {
  ctx.clearRect(0, 0, 16, 16);
  // Sunflower seed (clearer silhouette + stripes)
  ctx.fillStyle = '#1a1612';
  ctx.fillRect(6, 2, 4, 1);
  ctx.fillRect(5, 3, 6, 1);
  ctx.fillRect(4, 4, 8, 1);
  ctx.fillRect(3, 5, 10, 6);
  ctx.fillRect(4, 11, 8, 1);
  ctx.fillRect(5, 12, 6, 1);
  ctx.fillRect(6, 13, 4, 1);

  ctx.fillStyle = '#2f2a26';
  ctx.fillRect(5, 4, 6, 7);
  ctx.fillRect(4, 6, 8, 4);

  ctx.fillStyle = '#f2e7c8';
  ctx.fillRect(6, 4, 1, 8);
  ctx.fillRect(8, 5, 1, 6);
  ctx.fillRect(10, 4, 1, 8);
  ctx.fillStyle = '#d2b07e';
  ctx.fillRect(4, 5, 1, 6);
  ctx.fillRect(11, 5, 1, 6);
};

const drawFeather = (ctx: CanvasRenderingContext2D) => {
  ctx.clearRect(0, 0, 12, 12);
  ctx.fillStyle = '#f4d35e';
  ctx.fillRect(5, 2, 3, 7);
  ctx.fillRect(4, 3, 1, 5);
  ctx.fillRect(8, 3, 1, 5);
  ctx.fillStyle = '#e9c24b';
  ctx.fillRect(6, 1, 1, 2);
  ctx.fillRect(6, 9, 1, 2);
};

const drawCurtain = (ctx: CanvasRenderingContext2D) => {
  ctx.clearRect(0, 0, 32, 64);
  ctx.fillStyle = '#4a3b2b';
  ctx.fillRect(0, 0, 32, 64);
  ctx.fillStyle = '#3b2f22';
  ctx.fillRect(0, 0, 8, 64);
  ctx.fillRect(16, 0, 8, 64);
  ctx.fillStyle = '#5a4a38';
  ctx.fillRect(8, 0, 4, 64);
  ctx.fillRect(24, 0, 4, 64);
};

const drawRope = (ctx: CanvasRenderingContext2D) => {
  ctx.clearRect(0, 0, 12, 64);
  ctx.fillStyle = '#9b7b4f';
  ctx.fillRect(0, 0, 12, 64);
  ctx.fillStyle = '#7e6441';
  ctx.fillRect(2, 0, 2, 64);
  ctx.fillRect(8, 0, 2, 64);
};

const drawCord = (ctx: CanvasRenderingContext2D) => {
  ctx.clearRect(0, 0, 8, 64);
  ctx.imageSmoothingEnabled = false;
  for (let y = 0; y < 64; y += 6) {
    ctx.fillStyle = '#d8b684';
    ctx.fillRect(3, y, 2, 4);
    ctx.fillStyle = '#b88b5c';
    ctx.fillRect(3, y + 3, 2, 1);
    ctx.fillStyle = '#f1d2a2';
    ctx.fillRect(2, y + 1, 1, 2);
  }
};

const createCanvasTexture = (scene: Phaser.Scene, key: string, width: number, height: number) => {
  const texture = scene.textures.createCanvas(key, width, height);
  if (!texture) return null;
  return texture;
};

export const ensureTextures = (scene: Phaser.Scene) => {
  if (scene.textures.exists('parrot-0')) return;

  const wingPositions = [20, 18, 15, 18];
  const legPhases = [0, 1, 0, 1];
  const flapFrames = [false, true, true, false];
  wingPositions.forEach((wingY, index) => {
    const texture = createCanvasTexture(scene, `parrot-${index}`, 48, 48);
    if (!texture) return;
    const ctx = texture.getContext();
    drawParrotFrame(ctx, wingY, index === 3, legPhases[index], flapFrames[index]);
    texture.refresh();
  });

  scene.anims.create({
    key: 'parrot-climb',
    frames: [
      { key: 'parrot-0' },
      { key: 'parrot-1' },
      { key: 'parrot-2' },
      { key: 'parrot-1' }
    ],
    frameRate: 8,
    repeat: -1
  });

  scene.anims.create({
    key: 'parrot-rest',
    frames: [
      { key: 'parrot-0' },
      { key: 'parrot-3' },
      { key: 'parrot-0' }
    ],
    frameRate: 2,
    repeat: -1
  });

  scene.anims.create({
    key: 'parrot-burst',
    frames: [
      { key: 'parrot-2' },
      { key: 'parrot-1' },
      { key: 'parrot-0' }
    ],
    frameRate: 12,
    repeat: -1
  });

  scene.anims.create({
    key: 'parrot-blink',
    frames: [
      { key: 'parrot-3' },
      { key: 'parrot-0' }
    ],
    frameRate: 10,
    repeat: 0
  });

  const beeTexture = createCanvasTexture(scene, 'obstacle-bee', 16, 16);
  if (beeTexture) {
    drawBee(beeTexture.getContext());
    beeTexture.refresh();
  }

  const pinTexture = createCanvasTexture(scene, 'obstacle-pin', 16, 16);
  if (pinTexture) {
    drawPin(pinTexture.getContext());
    pinTexture.refresh();
  }

  const dustTexture = createCanvasTexture(scene, 'obstacle-dust', 16, 16);
  if (dustTexture) {
    drawDust(dustTexture.getContext());
    dustTexture.refresh();
  }

  const seedTexture = createCanvasTexture(scene, 'obstacle-seed', 16, 16);
  if (seedTexture) {
    drawSeed(seedTexture.getContext());
    seedTexture.refresh();
  }

  const featherTexture = createCanvasTexture(scene, 'feather', 12, 12);
  if (featherTexture) {
    drawFeather(featherTexture.getContext());
    featherTexture.refresh();
  }

  const curtainTexture = createCanvasTexture(scene, 'curtain', 32, 64);
  if (curtainTexture) {
    drawCurtain(curtainTexture.getContext());
    curtainTexture.refresh();
  }

  const ropeTexture = createCanvasTexture(scene, 'rope', 12, 64);
  if (ropeTexture) {
    drawRope(ropeTexture.getContext());
    ropeTexture.refresh();
  }

  const cordTexture = createCanvasTexture(scene, 'cord', 8, 64);
  if (cordTexture) {
    drawCord(cordTexture.getContext());
    cordTexture.refresh();
  }
};
