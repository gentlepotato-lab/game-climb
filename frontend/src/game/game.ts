import { hangingBird } from '../art/bird';
import { sceneMarkup, timeLabels } from '../art/scene';
import { CHARACTERS } from './characters';
import { pace } from './pace';
import type { GameOptions, GameResult } from './types';

// 화면은 가로 360px을 기준으로 그린다. 세로는 기기 비율에 맞춰 main.ts가 정한다.
export const GAME_WIDTH = 360;

// pace.ts의 속도는 세로 640px 화면에 맞춘 값이다.
const BASE_HEIGHT = 640;
const MAX_LIVES = 5;
const SAFE_START_MS = 1500;
const HIT_COOLDOWN_MS = 700;
const FACE_MS = 700;

// 새 그림(viewBox 120x160)을 76x101로 그린다. 체인은 그림의 x=20, 발은 y=122 언저리다.
const BIRD_SCALE = 76 / 120;
const BIRD_W = 76;
const BIRD_H = Math.round(160 * BIRD_SCALE);
const GRIP_X = Math.round(20 * BIRD_SCALE);
const GRIP_Y = Math.round(122 * BIRD_SCALE);

type Item = {
  kind: 'seed' | 'dust';
  x: number;
  y: number;
  x0: number;
  vy: number;
  amp: number;
  freq: number;
  phase: number;
  spin: number;
  angle: number;
  size: number;
  el: HTMLDivElement;
};

type Face = 'open' | 'effort' | 'happy' | 'hurt' | 'surprise' | 'glare' | 'derpy';

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
const rand = (min: number, max: number) => min + Math.random() * (max - min);

const featherIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><use href="#feather"/></svg>';

export const startGame = (stage: HTMLElement, options: GameOptions) => {
  const ch = CHARACTERS[options.character];
  const W = GAME_WIDTH;
  const H = stage.offsetHeight;
  const speedScale = H / BASE_HEIGHT;

  // 줄 위쪽은 화면 위 바깥에 매여 있고, 새는 화면 높이의 70% 자리에서 매달린다.
  const pivotX = W / 2;
  const pivotY = -0.16 * H;
  const gripY = 0.7 * H;
  const ropeLength = gripY - pivotY;
  const maxAngle = Math.asin(Math.min(0.9, ch.reach / ropeLength));

  const root = document.createElement('div');
  root.className = `game game-${ch.prefix}`;
  root.innerHTML = `
<div class="scene">${sceneMarkup()}</div>
<div class="items"></div>
<div class="rig" style="left: ${pivotX}px; top: ${pivotY}px">
  <div class="chain chain-back" style="height: ${ropeLength + 400}px"></div>
  <div class="chain chain-front" style="height: ${ropeLength + 400}px"></div>
  <div class="bird-pos" style="left: ${-GRIP_X}px; top: ${ropeLength - GRIP_Y}px; width: ${BIRD_W}px; height: ${BIRD_H}px">
    <div class="bird-flip" style="transform-origin: ${GRIP_X}px 50%"><svg class="bird ${ch.prefix}-climb" viewBox="0 0 120 160" data-face="open" data-view="side" data-fx="" aria-hidden="true">${hangingBird(ch.prefix)}</svg></div>
  </div>
</div>
<div class="hud">
  <div class="hud-score"><span class="hud-height nw">높이 0cm</span><strong class="hud-points nw">0</strong></div>
  <div class="hud-feathers">${featherIcon.repeat(MAX_LIVES)}</div>
</div>
<div class="tod-pill nw">${timeLabels()}</div>
<div class="controls">
  <div class="pad nw">◀ 끌어서 줄 흔들기 ▶</div>
  <button class="skill nw" type="button">${ch.skillLabel}</button>
</div>`;
  stage.appendChild(root);

  const $ = <T extends Element>(selector: string) => root.querySelector(selector) as T;
  const itemsLayer = $<HTMLDivElement>('.items');
  const rig = $<HTMLDivElement>('.rig');
  const flip = $<HTMLDivElement>('.bird-flip');
  const bird = $<SVGSVGElement>('.bird');
  const hudHeight = $<HTMLSpanElement>('.hud-height');
  const hudPoints = $<HTMLElement>('.hud-points');
  const feathers = Array.from(root.querySelectorAll('.hud-feathers svg'));
  const skillButton = $<HTMLButtonElement>('.skill');

  const items: Item[] = [];
  let lives = ch.lives;
  let angle = 0;
  let angularVelocity = 0;
  let facingRight = false;
  let score = 0;
  let height = 0;
  let bonus = 0;
  let avoided = 0;
  let ended = false;
  let raf = 0;
  let lastFrame = 0;

  const startAt = performance.now();
  let nextSpawnAt = startAt + SAFE_START_MS;
  let hitCooldownUntil = 0;
  let hurtUntil = 0;
  let happyUntil = 0;
  let peckUntil = 0;
  let magnetUntil = 0;
  let skillReadyAt = startAt;
  let frontUntil = 0;
  let nextFrontAt = startAt + rand(4000, 7000);
  let derpyUntil = 0;

  // 손 입력. 보리는 엇박자라서 조금 늦게, 그것도 들쭉날쭉하게 먹힌다.
  let rawInput = 0;
  let keyLeft = false;
  let keyRight = false;
  const inputHistory: Array<{ t: number; u: number }> = [{ t: startAt, u: 0 }];
  let delayMs = ch.inputDelayMs;
  let nextDelayAt = startAt;
  let noise = 0;
  let nextNoiseAt = startAt;

  const setInput = (u: number) => {
    const value = clamp(u, -1, 1);
    if (value === rawInput) return;
    rawInput = value;
    inputHistory.push({ t: performance.now(), u: value });
    if (inputHistory.length > 60) inputHistory.splice(0, inputHistory.length - 60);
  };

  const effectiveInput = (now: number) => {
    if (ch.inputDelayMs === 0) return rawInput;
    const target = now - delayMs;
    for (let i = inputHistory.length - 1; i >= 0; i -= 1) {
      if (inputHistory[i].t <= target) return inputHistory[i].u;
    }
    return 0;
  };

  const keyInput = () => (keyLeft ? -1 : 0) + (keyRight ? 1 : 0);

  // 끌기는 화면 어디서든 받는다. 시작점에서 40px 밀면 끝까지 기운다.
  let dragId: number | null = null;
  let dragStartX = 0;
  const toLocalX = (clientX: number) => {
    const rect = root.getBoundingClientRect();
    return ((clientX - rect.left) / rect.width) * W;
  };
  const onPointerDown = (event: PointerEvent) => {
    if (ended || dragId !== null) return;
    dragId = event.pointerId;
    dragStartX = toLocalX(event.clientX);
    root.setPointerCapture(event.pointerId);
  };
  const onPointerMove = (event: PointerEvent) => {
    if (event.pointerId !== dragId) return;
    setInput((toLocalX(event.clientX) - dragStartX) / 40);
  };
  const onPointerUp = (event: PointerEvent) => {
    if (event.pointerId !== dragId) return;
    dragId = null;
    setInput(keyInput());
  };

  const onKey = (event: KeyboardEvent, down: boolean) => {
    if (event.key === 'ArrowLeft' || event.key === 'a' || event.key === 'A') keyLeft = down;
    else if (event.key === 'ArrowRight' || event.key === 'd' || event.key === 'D') keyRight = down;
    else if (event.key === ' ' && down) {
      event.preventDefault();
      useSkill();
      return;
    } else return;
    event.preventDefault();
    if (dragId === null) setInput(keyInput());
  };
  const onKeyDown = (event: KeyboardEvent) => onKey(event, true);
  const onKeyUp = (event: KeyboardEvent) => onKey(event, false);

  const birdCenter = () => {
    const x = pivotX + ropeLength * Math.sin(angle);
    const y = pivotY + ropeLength * Math.cos(angle);
    // 몸은 체인 옆, 바라보는 반대쪽에 붙는다. 머리와 가슴 사이를 가운데로 친다.
    return { x: x + (facingRight ? -25 : 25), y: y - 30 };
  };

  const removeItem = (index: number) => {
    items[index].el.remove();
    items.splice(index, 1);
  };

  const useSkill = () => {
    const now = performance.now();
    if (ended || now < skillReadyAt) return;
    if (ch.skill === 'peck') {
      // 머리 가까이 온 먼지 하나를 쪼아 없앤다. 없으면 노려보기만 하고 쓰지 않는다.
      const center = birdCenter();
      const headX = center.x + (facingRight ? 15 : -15);
      const headY = center.y - 18;
      let best = -1;
      let bestDist = 120;
      items.forEach((item, index) => {
        if (item.kind !== 'dust') return;
        const dist = Math.hypot(item.x - headX, item.y - headY);
        if (dist < bestDist) {
          best = index;
          bestDist = dist;
        }
      });
      peckUntil = now + 500;
      if (best < 0) return;
      removeItem(best);
      avoided += 1;
      bird.dataset.fx = 'peck';
      window.setTimeout(() => { if (bird.dataset.fx === 'peck') bird.dataset.fx = ''; }, 450);
    } else {
      magnetUntil = now + 3000;
      happyUntil = now + 500;
    }
    skillReadyAt = now + ch.skillCooldownMs;
  };
  const onSkill = (event: PointerEvent) => {
    event.stopPropagation();
    event.preventDefault();
    useSkill();
  };

  const spawn = (now: number, elapsedSec: number) => {
    const current = pace(elapsedSec);
    const kind: Item['kind'] = Math.random() < current.seedChance ? 'seed' : 'dust';
    const birdX = birdCenter().x;
    let x = rand(36, W - 36);
    for (let i = 0; i < 6 && now < startAt + SAFE_START_MS + 2000 && Math.abs(x - birdX) < 50; i += 1) {
      x = rand(36, W - 36);
    }
    const size = kind === 'seed' ? 18 : Math.round(rand(30, 42));
    const el = document.createElement('div');
    el.className = `item item-${kind}`;
    el.style.width = `${size}px`;
    el.style.height = kind === 'seed' ? '29px' : `${size}px`;
    el.innerHTML = kind === 'seed'
      ? '<svg viewBox="0 0 20 32" aria-hidden="true"><use href="#seedS"/></svg>'
      : '<svg viewBox="0 0 40 40" aria-hidden="true"><use href="#dustS"/></svg>';
    itemsLayer.appendChild(el);
    const speed = current.speed * speedScale;
    items.push({
      kind,
      x,
      y: -30,
      x0: x,
      vy: speed + rand(10, 150) * speedScale,
      amp: kind === 'dust' ? rand(10, 20) : 0,
      freq: rand(1.6, 2.6),
      phase: rand(0, Math.PI * 2),
      spin: kind === 'dust' ? rand(-40, 40) : rand(-140, 140),
      angle: rand(0, 360),
      size,
      el
    });
    nextSpawnAt = now + current.spawnMs;
  };

  const setLives = (value: number) => {
    lives = clamp(value, 0, MAX_LIVES);
    feathers.forEach((icon, index) => icon.classList.toggle('off', index >= lives));
  };
  setLives(lives);

  const finish = (now: number) => {
    ended = true;
    cancelAnimationFrame(raf);
    root.classList.add('paused');
    setInput(0);
    const result: GameResult = {
      character: options.character,
      score,
      height,
      durationMs: Math.round(now - startAt),
      obstaclesAvoided: avoided
    };
    window.setTimeout(() => options.onGameOver(result), 500);
  };

  let shownFace: Face | null = null;
  let shownView = '';
  let shownFlap = false;
  let shownRight = false;
  let shownHud = '';

  const render = (now: number, threat: boolean) => {
    rig.style.transform = `rotate(${-angle}rad)`;

    let face: Face = Math.floor((now - startAt) / 1600) % 3 === 0 ? 'effort' : 'open';
    let view = 'side';
    if (now < hurtUntil) face = 'hurt';
    else if (now < happyUntil) face = 'happy';
    else if (now < peckUntil) face = 'glare';
    else if (ch.skill === 'peck' && threat) face = 'glare';
    else if (ch.prefix === 'bo' && Math.abs(angularVelocity) > 0.9) face = 'surprise';
    else if (now < frontUntil) view = 'front';
    else if (now < derpyUntil) face = 'derpy';

    if (face !== shownFace) {
      bird.dataset.face = face;
      shownFace = face;
    }
    if (view !== shownView) {
      bird.dataset.view = view;
      shownView = view;
    }
    const flap = Math.abs(angularVelocity) > 0.55 || now < hurtUntil || (ch.prefix === 'bo' && now < happyUntil);
    if (flap !== shownFlap) {
      bird.classList.toggle(`${ch.prefix}-flap`, flap);
      shownFlap = flap;
    }
    if (facingRight !== shownRight) {
      flip.style.transform = facingRight ? 'scaleX(-1)' : '';
      shownRight = facingRight;
    }

    const hud = `${Math.round((height * 100) / 200)}|${score}`;
    if (hud !== shownHud) {
      hudHeight.textContent = `높이 ${Math.round((height * 100) / 200)}cm`;
      hudPoints.textContent = score.toLocaleString('ko-KR');
      shownHud = hud;
    }

    const cool = clamp((skillReadyAt - now) / ch.skillCooldownMs, 0, 1);
    skillButton.style.setProperty('--cool', String(cool));
    skillButton.classList.toggle('ready', cool === 0);
  };

  const frame = (now: number) => {
    if (ended) return;
    const dt = Math.min(0.05, (now - (lastFrame || now)) / 1000);
    lastFrame = now;
    const elapsedSec = (now - startAt) / 1000;

    // 줄 흔들기
    if (ch.inputJitterMs > 0 && now >= nextDelayAt) {
      delayMs = ch.inputDelayMs + rand(-ch.inputJitterMs, ch.inputJitterMs);
      nextDelayAt = now + 600;
    }
    if (ch.wobble > 0 && now >= nextNoiseAt) {
      noise = rand(-ch.wobble, ch.wobble);
      nextNoiseAt = now + 300;
    }
    const u = effectiveInput(now);
    const accel = ch.drive * u + noise - ch.stiffness * Math.sin(angle) - ch.damping * angularVelocity;
    angularVelocity += accel * dt;
    angle += angularVelocity * dt;
    if (Math.abs(angle) > maxAngle) {
      angle = Math.sign(angle) * maxAngle;
      angularVelocity = -angularVelocity * ch.bounce;
    }
    if (angularVelocity > 0.12) facingRight = true;
    else if (angularVelocity < -0.12) facingRight = false;

    // 오르기
    height = Math.floor(elapsedSec * ch.climbRate);

    if (now >= nextSpawnAt) spawn(now, elapsedSec);

    const center = birdCenter();
    const magnetRange = now < magnetUntil ? 140 : ch.magnet;
    let threat = false;

    for (let i = items.length - 1; i >= 0; i -= 1) {
      const item = items[i];
      item.y += item.vy * dt;
      item.angle += item.spin * dt;
      if (item.kind === 'dust') {
        item.x = item.x0 + item.amp * Math.sin(elapsedSec * item.freq + item.phase);
        const dy = center.y - item.y;
        if (dy > 0 && dy < 170 && Math.abs(item.x - center.x) < 70) threat = true;
      } else if (magnetRange > 0) {
        const dx = center.x - item.x;
        const dy = center.y - item.y;
        const dist = Math.hypot(dx, dy);
        if (dist < magnetRange && dist > 1) {
          item.x += (dx / dist) * 240 * dt;
          item.y += (dy / dist) * 240 * dt;
        }
      }
      item.el.style.transform = `translate(${item.x - item.size / 2}px, ${item.y - item.size / 2}px) rotate(${item.angle}deg)`;

      const hitRange = (item.kind === 'seed' ? 10 : item.size * 0.38) + 20;
      if (Math.hypot(item.x - center.x, item.y - center.y) < hitRange) {
        if (item.kind === 'seed') {
          removeItem(i);
          bonus += 120;
          setLives(lives + 1);
          happyUntil = now + FACE_MS;
          continue;
        }
        if (now > startAt + SAFE_START_MS && now > hitCooldownUntil) {
          removeItem(i);
          hitCooldownUntil = now + HIT_COOLDOWN_MS;
          hurtUntil = now + FACE_MS;
          bird.dataset.fx = 'dust';
          window.setTimeout(() => { if (bird.dataset.fx === 'dust') bird.dataset.fx = ''; }, 600);
          setLives(lives - 1);
          if (lives <= 0) {
            score = Math.floor(height * 2 + avoided * 15 + bonus);
            render(now, false);
            finish(now);
            return;
          }
          continue;
        }
      }
      if (item.y > H + 40) {
        removeItem(i);
        avoided += 1;
      }
    }

    // 가만히 매달려 있으면 가끔 이쪽을 본다. 보리는 그 사이 두리번거리기도 한다.
    if (!threat && Math.abs(angularVelocity) < 0.2 && now >= nextFrontAt) {
      frontUntil = now + 1400;
      nextFrontAt = now + (ch.prefix === 'mg' ? rand(6000, 9000) : rand(4000, 7000));
    }
    if (ch.prefix === 'bo' && !threat && Math.random() < dt * 0.15) derpyUntil = now + 900;

    score = Math.floor(height * 2 + avoided * 15 + bonus);
    render(now, threat);
    raf = requestAnimationFrame(frame);
  };

  root.addEventListener('pointerdown', onPointerDown);
  root.addEventListener('pointermove', onPointerMove);
  root.addEventListener('pointerup', onPointerUp);
  root.addEventListener('pointercancel', onPointerUp);
  skillButton.addEventListener('pointerdown', onSkill);
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  raf = requestAnimationFrame(frame);

  return {
    destroy: () => {
      ended = true;
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      root.remove();
    }
  };
};
