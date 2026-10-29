import { posingBird } from '../art/bird';
import { bgm } from '../audio/bgm';
import { CHARACTERS, CHARACTER_ORDER } from '../game/characters';
import type { CharacterKey } from '../game/types';
import { showPanel } from './screens';

// 닉네임은 이 브라우저에만 남긴다. 다음에 들어오면 그대로 적혀 있다.
const STORAGE_KEY = 'climb_display_name';

const load = (key: string) => {
  try {
    return localStorage.getItem(key) ?? '';
  } catch (_error) {
    return '';
  }
};

const save = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch (_error) {
    // 저장이 막힌 브라우저여도 이번 판은 그대로 한다.
  }
};

export type StartChoice = {
  character: CharacterKey;
  displayName: string;
};

export const initStart = (onStart: (choice: StartChoice) => void) => {
  const startForm = document.getElementById('start-form') as HTMLFormElement | null;
  const input = startForm?.elements.namedItem('displayName') as HTMLInputElement | null;
  const startButton = document.getElementById('start-button');
  const perch = document.getElementById('perch-birds');
  const card = document.getElementById('pick-card');
  const $ = (id: string) => document.getElementById(id);

  // 들어올 때마다 보리가 골라져 있다.
  let character: CharacterKey = 'bori';

  // 횃대에 다섯 친구가 일렬로 앉는다. 고른 친구만 예쁜 짓을 한다.
  const birds = CHARACTER_ORDER.map((key) => {
    const ch = CHARACTERS[key];
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'perch-bird';
    button.dataset.character = key;
    button.setAttribute('aria-label', ch.name);
    button.innerHTML = `<span class="perch-pose"><span class="perch-anim">${posingBird(ch.prefix)}</span></span><span class="perch-name nw"></span>`;
    (button.querySelector('.perch-name') as HTMLElement).textContent = ch.name;
    button.addEventListener('click', () => {
      character = key;
      bgm.unlock();
      bgm.sfx('pick');
      paint();
    });
    perch?.appendChild(button);
    return button;
  });

  // 하품. 고르지 않은 채 5초 넘게 앉아 있는 친구는 가끔 하품한다.
  // 친구마다 따로 셈하고, 한 번 하품하면 10초에서 16초쯤 쉬었다가 다시 한다. 하품은 한 번에 한 친구만 한다.
  const YAWN_AFTER_MS = 5000;
  const YAWN_MS = 1800;
  const restingSince = new Map<HTMLButtonElement, number>();
  const nextYawnAt = new Map<HTMLButtonElement, number>();
  const rest = (button: HTMLButtonElement, now: number) => {
    restingSince.set(button, now);
    nextYawnAt.set(button, now + YAWN_AFTER_MS + Math.random() * 6000);
  };
  window.setInterval(() => {
    const now = performance.now();
    if (birds.some((button) => button.classList.contains('yawning'))) return;
    birds.some((button) => {
      if (button.dataset.character === character) return false;
      if (now - (restingSince.get(button) ?? now) < YAWN_AFTER_MS || now < (nextYawnAt.get(button) ?? 0)) return false;
      button.classList.add('yawning');
      nextYawnAt.set(button, now + YAWN_MS + 10000 + Math.random() * 6000);
      window.setTimeout(() => button.classList.remove('yawning'), YAWN_MS);
      return true;
    });
  }, 500);

  const setText = (id: string, text: string) => {
    const el = $(id);
    if (el) el.textContent = text;
  };
  const setBar = (id: string, n: number) => $(id)?.style.setProperty('--n', String(n));

  // 위에는 고른 친구의 설명이 보인다.
  const paint = () => {
    const ch = CHARACTERS[character];
    const now = performance.now();
    birds.forEach((button) => {
      const on = button.dataset.character === character;
      // 방금 고른 친구는 하품을 멈추고, 방금 놓인 친구는 그때부터 다시 5초를 센다.
      if (on) button.classList.remove('yawning');
      if (on || button.getAttribute('aria-pressed') !== 'false') rest(button, now);
      button.setAttribute('aria-pressed', String(on));
      const pose = button.querySelector('.perch-anim');
      pose?.classList.toggle(`pose-${CHARACTERS[button.dataset.character as CharacterKey].prefix}`, on);
    });
    if (card) card.className = `card pick-card card-${ch.prefix}`;
    const portrait = $('pick-portrait');
    if (portrait) {
      portrait.className = `portrait pose-${ch.prefix}`;
      portrait.innerHTML = posingBird(ch.prefix);
    }
    setText('pick-name', ch.name);
    setText('pick-tagline', ch.tagline);
    setBar('pick-climb', ch.stats.climb);
    setBar('pick-swing', ch.stats.swing);
    setBar('pick-hp', ch.stats.hp);
    setText('pick-skill', ch.skillLabel);
    setText('pick-skill-note', ch.skillNote);
    setText('pick-trait', ch.trait);
    if (startButton) startButton.textContent = `${ch.name}와 시작`;
  };

  if (input) input.value = load(STORAGE_KEY);
  paint();

  startForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    const displayName = String(input?.value ?? '').trim();
    if (!displayName) {
      input?.focus();
      return;
    }
    save(STORAGE_KEY, displayName);
    onStart({ character, displayName });
    showPanel(null);
  });
};
