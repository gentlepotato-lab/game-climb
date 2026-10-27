import { bgm } from '../audio/bgm';
import { hangingBird } from '../art/bird';
import { sprayerSvg } from '../art/sprayer';
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
// 시작 전 3, 2, 1을 센다.
const READY_MS = 3000;
// 특기는 누르면 1초 동안 간다.
const SKILL_MS = 1000;
// 몽글이가 먼지를 튕겨 내는 막의 반지름(px)
const GUARD_RANGE = 70;
// 분무기 한 번이 물방울까지 다 사라지는 시간과, 두 번 뿌리는 때(ms). 뿌리는 때는 styles.css의 sprayArm과 맞춘다.
const SPRAY_MS = 4600;
const SPRAY_PUFFS_MS = [620, 1120];

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
  // 특기에 튕기거나 날아간 먼지. 닿지 않고 화면 밖으로 사라진다.
  flung?: { vx: number; vy: number; life: number };
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

  // 줄 위쪽은 화면 위 바깥에 매여 있고, 새는 화면 높이의 80% 자리에서 매달린다.
  // 흔들면 체인이 화면 가로 끝까지 닿아, 떨어지는 것을 어디서든 받을 수 있다.
  const pivotX = W / 2;
  const pivotY = -0.16 * H;
  const gripY = 0.8 * H;
  const ropeLength = gripY - pivotY;
  const maxAngle = Math.asin(Math.min(0.9, Math.min(ch.reach, W / 2 - 12) / ropeLength));

  // 구슬 체인. 마디 열네 개짜리 줄로 셈한다. 위끝은 화면 위에 매여 있고, 새가 쥔 자리에서
  // 한 번 더 붙잡힌다. 그 사이 마디는 관성과 무게로 늦게 따라와서, 흔들면 가운데가 휘었다가 펴진다.
  // 새 아래로는 몇 마디가 늘어져 흔들린다.
  const SEGMENTS = 14;
  const TAIL = 5;
  const segLength = (ropeLength * 1.03) / SEGMENTS;
  const rx = new Float32Array(SEGMENTS + TAIL + 1);
  const ry = new Float32Array(SEGMENTS + TAIL + 1);
  const ox = new Float32Array(SEGMENTS + TAIL + 1);
  const oy = new Float32Array(SEGMENTS + TAIL + 1);
  for (let i = 0; i < rx.length; i += 1) {
    rx[i] = ox[i] = pivotX;
    ry[i] = oy[i] = pivotY + (ropeLength / SEGMENTS) * i;
  }
  const stepRope = (dt: number, gx: number, gy: number) => {
    const fall = 1400 * dt * dt;
    for (let i = 1; i < rx.length; i += 1) {
      if (i === SEGMENTS) continue;
      const vx = (rx[i] - ox[i]) * 0.98;
      const vy = (ry[i] - oy[i]) * 0.98;
      ox[i] = rx[i];
      oy[i] = ry[i];
      rx[i] += vx;
      ry[i] += vy + fall;
    }
    rx[0] = pivotX;
    ry[0] = pivotY;
    rx[SEGMENTS] = ox[SEGMENTS] = gx;
    ry[SEGMENTS] = oy[SEGMENTS] = gy;
    for (let k = 0; k < 10; k += 1) {
      for (let i = 0; i < rx.length - 1; i += 1) {
        const dx = rx[i + 1] - rx[i];
        const dy = ry[i + 1] - ry[i];
        const d = Math.hypot(dx, dy) || 1;
        if (d <= segLength) continue;
        const aFixed = i === 0 || i === SEGMENTS;
        const bFixed = i + 1 === SEGMENTS;
        if (aFixed && bFixed) continue;
        const wa = aFixed ? 0 : bFixed ? 1 : 0.5;
        const wb = bFixed ? 0 : aFixed ? 1 : 0.5;
        const diff = (d - segLength) / d;
        rx[i] += dx * diff * wa;
        ry[i] += dy * diff * wa;
        rx[i + 1] -= dx * diff * wb;
        ry[i + 1] -= dy * diff * wb;
      }
    }
  };
  const ropePath = () => {
    let d = `M${rx[0].toFixed(1)} ${ry[0].toFixed(1)}`;
    for (let i = 1; i < rx.length - 1; i += 1) {
      d += ` Q${rx[i].toFixed(1)} ${ry[i].toFixed(1)} ${((rx[i] + rx[i + 1]) / 2).toFixed(1)} ${((ry[i] + ry[i + 1]) / 2).toFixed(1)}`;
    }
    return `${d} L${rx[rx.length - 1].toFixed(1)} ${ry[ry.length - 1].toFixed(1)}`;
  };
  // 오를 때 구슬이 흘러내리는 빠르기(px/s)
  const beadSpeed = 48 * (ch.climbRate / 3);
  let beadOffset = 0;

  const root = document.createElement('div');
  root.className = `game game-${ch.prefix} waiting`;
  root.innerHTML = `
<div class="scene">${sceneMarkup()}</div>
<div class="items"></div>
<svg class="rope" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" aria-hidden="true">
  <g class="rope-back"><path class="rope-line"/><path class="rope-beads-edge"/><path class="rope-beads"/></g>
  <path class="rope-line"/><path class="rope-beads-edge"/><path class="rope-beads"/><path class="rope-stops-edge"/><path class="rope-stops"/>
</svg>
<div class="rig" style="left: ${pivotX}px; top: ${pivotY}px">
  <div class="bird-pos" style="left: ${-GRIP_X}px; top: ${ropeLength - GRIP_Y}px; width: ${BIRD_W}px; height: ${BIRD_H}px; transform-origin: ${GRIP_X}px ${GRIP_Y}px">
    <div class="bird-flip" style="transform-origin: ${GRIP_X}px 50%"><svg class="bird ${ch.prefix}-climb" viewBox="0 0 120 160" data-face="open" data-view="front" data-fx="" aria-hidden="true">${hangingBird(ch.prefix)}</svg></div>
  </div>
</div>
<div class="hud">
  <div class="hud-score"><span class="hud-height nw">높이 0cm</span><strong class="hud-points nw">0</strong></div>
  <div class="hud-feathers">${featherIcon.repeat(MAX_LIVES)}</div>
</div>
<div class="tod-pill nw">${timeLabels()}</div>
<div class="countdown" aria-live="polite"><span class="countdown-label nw">READY</span><strong class="countdown-count">3</strong></div>
<div class="controls">
  <div class="pad nw">◀ 끌어서 줄 흔들기 ▶</div>
  <button class="skill nw" type="button">${ch.skillLabel}</button>
</div>`;
  stage.appendChild(root);

  const $ = <T extends Element>(selector: string) => root.querySelector(selector) as T;
  const itemsLayer = $<HTMLDivElement>('.items');
  const rig = $<HTMLDivElement>('.rig');
  const flip = $<HTMLDivElement>('.bird-flip');
  const birdPos = $<HTMLDivElement>('.bird-pos');
  const ropePaths = Array.from(root.querySelectorAll<SVGPathElement>('.rope path'));
  const ropeBeads = Array.from(root.querySelectorAll<SVGPathElement>('.rope-beads, .rope-beads-edge, .rope-stops, .rope-stops-edge'));
  const bird = $<SVGSVGElement>('.bird');
  const hudHeight = $<HTMLSpanElement>('.hud-height');
  const hudPoints = $<HTMLElement>('.hud-points');
  const feathers = Array.from(root.querySelectorAll('.hud-feathers svg'));
  const skillButton = $<HTMLButtonElement>('.skill');
  const readyEl = $<HTMLDivElement>('.countdown');
  const readyCount = $<HTMLElement>('.countdown-count');
  const hud = $<HTMLDivElement>('.hud');

  const items: Item[] = [];
  let lives = ch.lives;
  let angle = 0;
  let angularVelocity = 0;
  // 관성. 손의 힘은 조금 늦게 실리고, 체인 끝의 새는 한 박자 늦게 따라 흔들린다.
  let push = 0;
  let sway = 0;
  let swayVelocity = 0;
  let facingRight = false;
  let score = 0;
  let height = 0;
  let bonus = 0;
  let avoided = 0;
  let ended = false;
  let raf = 0;
  let lastFrame = 0;

  const startAt = performance.now() + READY_MS;
  let started = false;
  let shownCount = 0;
  let nextSpawnAt = startAt + SAFE_START_MS;
  let hitCooldownUntil = 0;
  let hurtUntil = 0;
  let happyUntil = 0;
  let skillUntil = 0;
  let lastTinkAt = 0;
  // 새 근처에 마지막으로 떨어뜨린 때. 오래 비면 새 위로 겨눠 떨어뜨린다.
  let lastNearAt = startAt;
  // 먼지에 맞은 만큼 머리가 잿빛으로 물든다.
  let soot = 0;
  let wasCooling = false;
  // 분무기. 아주 가끔 화면 위 한쪽에서 손이 들어와 물을 뿌리고, 그을린 머리를 씻어 준다.
  // 양옆을 번갈아 오고, 머리가 두 번 넘게 그을렸을 때만 온다.
  let nextSprayAt = startAt + rand(20000, 30000);
  let spraySide: 'left' | 'right' = Math.random() < 0.5 ? 'left' : 'right';
  let spray: { el: HTMLDivElement; at: number; puffs: number; washed: boolean } | null = null;
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
  // 손가락마다 따로 따라가고 화면을 붙잡지 않는다. 그래야 한 손가락으로 흔들면서
  // 다른 손가락으로 필살기를 누를 수 있다.
  let dragId: number | null = null;
  let dragStartX = 0;
  const toLocalX = (clientX: number) => {
    const rect = root.getBoundingClientRect();
    return ((clientX - rect.left) / rect.width) * W;
  };
  const onSkillButton = (clientX: number, clientY: number) => {
    const r = skillButton.getBoundingClientRect();
    const pad = 10;
    return clientX >= r.left - pad && clientX <= r.right + pad && clientY >= r.top - pad && clientY <= r.bottom + pad;
  };
  const onPointerDown = (event: PointerEvent) => {
    if (ended) return;
    if (onSkillButton(event.clientX, event.clientY)) {
      event.preventDefault();
      useSkill();
      return;
    }
    if (dragId !== null) return;
    dragId = event.pointerId;
    dragStartX = toLocalX(event.clientX);
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
    if (ended || now < startAt || now < skillReadyAt) return;
    skillUntil = now + SKILL_MS;
    skillReadyAt = now + ch.skillCooldownMs;
    root.classList.add(`skill-${ch.skill}`);
    bgm.sfx(ch.skill === 'guard' ? 'guard' : 'blast');
    window.setTimeout(() => root.classList.remove(`skill-${ch.skill}`), SKILL_MS);
  };

  // 먼지를 바깥으로 내보낸다. 닿지 않고 빙글 돌며 사라진다.
  const fling = (item: Item, from: { x: number; y: number }, speed: number, lift: number) => {
    const dx = item.x - from.x;
    const dy = item.y - from.y;
    const dist = Math.hypot(dx, dy) || 1;
    item.flung = { vx: (dx / dist) * speed, vy: (dy / dist) * speed - lift, life: 0.8 };
    item.spin *= 6;
    item.el.classList.add('item-flung');
    avoided += 1;
    // 튕길 때마다 소리를 낸다. 한꺼번에 여럿이면 겹치지 않게 사이를 둔다.
    const now = performance.now();
    if (ch.skill === 'guard' && now - lastTinkAt > 70) {
      bgm.sfx('tink');
      lastTinkAt = now;
    }
  };
  // 터치 이벤트만 따로 오는 기기를 위해 단추에도 한 번 더 건다. 두 번 불려도 쿨타임이 막는다.
  const onSkillTouch = (event: TouchEvent) => {
    event.preventDefault();
    useSkill();
  };

  const spawn = (now: number, elapsedSec: number) => {
    const current = pace(elapsedSec);
    const birdX = birdCenter().x;
    // 가만히 있어도 비켜 가지 못하게, 새 근처가 2.6초 넘게 비면 새 바로 위로 떨어뜨린다.
    // 그때는 먼지가 잦고, 가끔 해바라기씨가 섞인다.
    const aimed = now - lastNearAt > 2600;
    const kind: Item['kind'] = Math.random() < (aimed ? 0.25 : current.seedChance) ? 'seed' : 'dust';
    let x = aimed ? clamp(birdX + rand(-16, 16), 36, W - 36) : rand(36, W - 36);
    for (let i = 0; !aimed && i < 6 && now < startAt + SAFE_START_MS + 2000 && Math.abs(x - birdX) < 50; i += 1) {
      x = rand(36, W - 36);
    }
    if (Math.abs(x - birdX) < 50) lastNearAt = now;
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

  const startSpray = (now: number) => {
    const el = document.createElement('div');
    el.className = `sprayer from-${spraySide}`;
    // 물방울은 노즐에서 부채꼴로 퍼진다. 화면 아래쪽으로 조금씩 처지며 날아간다.
    let drops = '';
    for (let puff = 0; puff < SPRAY_PUFFS_MS.length; puff += 1) {
      for (let i = 0; i < 40; i += 1) {
        const dist = rand(60, 680);
        const a = rand(-0.7, 0.7);
        const sag = rand(20, 110) * (dist / 680);
        const dx = dist * Math.cos(a) + sag * 0.53;
        const dy = dist * Math.sin(a) + sag * 0.85;
        const delay = SPRAY_PUFFS_MS[puff] + rand(0, 140);
        drops += `<i style="--dx: ${dx.toFixed(0)}px; --dy: ${dy.toFixed(0)}px; --s: ${rand(3, 7).toFixed(1)}px; --d: ${delay.toFixed(0)}ms; --t: ${rand(1300, 2000).toFixed(0)}ms"></i>`;
      }
    }
    // 퍼진 물안개는 화면 전체에 내려앉는다.
    let drizzle = '';
    for (let i = 0; i < 36; i += 1) {
      drizzle += `<i style="left: ${rand(10, W - 10).toFixed(0)}px; top: ${rand(110, H - 160).toFixed(0)}px; --fy: ${rand(120, 260).toFixed(0)}px; --s: ${rand(3, 6).toFixed(1)}px; --d: ${rand(800, 1600).toFixed(0)}ms; --t: ${rand(2000, 2800).toFixed(0)}ms"></i>`;
    }
    el.innerHTML = `<div class="drizzle">${drizzle}</div><div class="mist"><b></b><b></b>${drops}</div><div class="spray-arm">${sprayerSvg()}</div>`;
    root.insertBefore(el, hud);
    spray = { el, at: now, puffs: 0, washed: false };
    spraySide = spraySide === 'left' ? 'right' : 'left';
  };

  const stepSpray = (now: number) => {
    if (!spray) {
      if (now < nextSprayAt) return;
      if (soot >= 2) {
        startSpray(now);
        nextSprayAt = now + rand(30000, 45000);
      } else {
        nextSprayAt = now + 4000;
      }
      return;
    }
    const t = now - spray.at;
    if (spray.puffs < SPRAY_PUFFS_MS.length && t >= SPRAY_PUFFS_MS[spray.puffs]) {
      bgm.sfx('spray');
      spray.puffs += 1;
    }
    if (!spray.washed && t >= SPRAY_PUFFS_MS[0] + 330) {
      spray.washed = true;
      soot = 0;
      bird.classList.add('rinse');
      bird.style.setProperty('--soot', '0');
      happyUntil = now + FACE_MS;
    }
    if (t >= SPRAY_MS) {
      spray.el.remove();
      bird.classList.remove('rinse');
      spray = null;
    }
  };

  const setLives = (value: number) => {
    lives = clamp(value, 0, MAX_LIVES);
    feathers.forEach((icon, index) => icon.classList.toggle('off', index >= lives));
  };
  setLives(lives);

  const finish = (now: number) => {
    ended = true;
    bgm.sfx('over');
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
    const d = ropePath();
    ropePaths.forEach((path) => path.setAttribute('d', d));
    ropeBeads.forEach((path) => path.setAttribute('stroke-dashoffset', beadOffset.toFixed(1)));
    birdPos.style.transform = `rotate(${-sway}rad)`;

    let face: Face = Math.floor((now - startAt) / 1600) % 3 === 0 ? 'effort' : 'open';
    let view = 'side';
    if (now < skillUntil) face = ch.skill === 'guard' ? 'glare' : 'effort';
    else if (now < hurtUntil) face = 'hurt';
    else if (now < happyUntil) face = 'happy';
    else if (ch.prefix === 'mg' && threat) face = 'glare';
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
    if (wasCooling && cool === 0) bgm.sfx('ready');
    wasCooling = cool > 0;
  };

  const frame = (now: number) => {
    if (ended) return;
    // READY: 정면을 보고 3, 2, 1을 센다. 그동안 아무것도 떨어지지 않는다.
    if (now < startAt) {
      const left = Math.ceil((startAt - now) / 1000);
      if (left !== shownCount) {
        readyCount.textContent = String(left);
        readyCount.classList.remove('tick');
        void readyCount.offsetWidth;
        readyCount.classList.add('tick');
        shownCount = left;
        bgm.sfx('tick', left);
      }
      stepRope(Math.min(0.05, (now - (lastFrame || now)) / 1000), pivotX, pivotY + ropeLength);
      const d = ropePath();
      ropePaths.forEach((path) => path.setAttribute('d', d));
      lastFrame = now;
      raf = requestAnimationFrame(frame);
      return;
    }
    if (!started) {
      started = true;
      root.classList.remove('waiting');
      readyEl.classList.add('hidden');
      bgm.sfx('go');
    }
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
    push += (u - push) * Math.min(1, dt * 7);
    const accel = ch.drive * push + noise - ch.stiffness * Math.sin(angle) - ch.damping * angularVelocity;
    angularVelocity += accel * dt;
    angle += angularVelocity * dt;
    if (Math.abs(angle) > maxAngle) {
      angle = Math.sign(angle) * maxAngle;
      angularVelocity = -angularVelocity * ch.bounce;
    }
    // 새는 체인보다 늦게 따라온다. 출발할 때는 뒤로 처지고, 멈출 때는 앞으로 쏠린다.
    swayVelocity += (-sway * 70 - swayVelocity * 9 + accel * 3.5) * dt;
    sway = clamp(sway + swayVelocity * dt, -0.4, 0.4);
    stepRope(dt, pivotX + ropeLength * Math.sin(angle), pivotY + ropeLength * Math.cos(angle));
    beadOffset -= beadSpeed * dt;
    if (angularVelocity > 0.12) facingRight = true;
    else if (angularVelocity < -0.12) facingRight = false;

    // 오르기
    height = Math.floor(elapsedSec * ch.climbRate);

    if (now >= nextSpawnAt) spawn(now, elapsedSec);
    stepSpray(now);

    const center = birdCenter();
    const magnetRange = ch.magnet;
    const skillOn = now < skillUntil;
    let threat = false;

    for (let i = items.length - 1; i >= 0; i -= 1) {
      const item = items[i];
      if (item.flung) {
        item.x += item.flung.vx * dt;
        item.y += item.flung.vy * dt;
        item.angle += item.spin * dt;
        item.flung.life -= dt;
        item.el.style.opacity = String(Math.max(0, item.flung.life / 0.8));
        item.el.style.transform = `translate(${item.x - item.size / 2}px, ${item.y - item.size / 2}px) rotate(${item.angle}deg)`;
        if (item.flung.life <= 0) removeItem(i);
        continue;
      }
      if (skillOn && item.kind === 'dust') {
        // 몽글이는 막에 닿는 먼지를 쪼아 튕겨 내고, 보리는 화면의 먼지를 모두 날려 버린다.
        if (ch.skill === 'blast') {
          fling(item, center, 560, 140);
          continue;
        }
        if (Math.hypot(item.x - center.x, item.y - center.y) < GUARD_RANGE + item.size * 0.3) {
          fling(item, center, 300, 220);
          continue;
        }
      }
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
          bgm.sfx('seed');
          happyUntil = now + FACE_MS;
          continue;
        }
        if (now > startAt + SAFE_START_MS && now > hitCooldownUntil) {
          removeItem(i);
          hitCooldownUntil = now + HIT_COOLDOWN_MS;
          hurtUntil = now + FACE_MS;
          bgm.sfx('hit');
          bgm.stumble();
          // 가끔 모란앵무가 '삐빅' 운다.
          if (Math.random() < 0.5) bgm.sfx('chirp');
          bird.dataset.fx = 'dust';
          window.setTimeout(() => { if (bird.dataset.fx === 'dust') bird.dataset.fx = ''; }, 600);
          setLives(lives - 1);
          soot = Math.min(5, soot + 1);
          bird.style.setProperty('--soot', String(soot * 0.06));
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
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);
  window.addEventListener('pointercancel', onPointerUp);
  skillButton.addEventListener('touchstart', onSkillTouch, { passive: false });
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  raf = requestAnimationFrame(frame);

  return {
    destroy: () => {
      ended = true;
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
      root.remove();
    }
  };
};
