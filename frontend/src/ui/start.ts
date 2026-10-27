import { posingBird } from '../art/bird';
import { bgm } from '../audio/bgm';
import { CHARACTERS } from '../game/characters';
import type { CharacterKey } from '../game/types';
import { showPanel } from './screens';

// 닉네임과 마지막으로 고른 친구는 이 브라우저에만 남긴다. 다음에 들어오면 그대로 골라져 있다.
const STORAGE_KEY = 'climb_display_name';
const CHARACTER_KEY = 'climb_character';

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
  const cards = Array.from(document.querySelectorAll<HTMLButtonElement>('.card[data-character]'));

  let character: CharacterKey = load(CHARACTER_KEY) === 'bori' ? 'bori' : 'mongle';

  cards.forEach((card) => {
    const key = card.dataset.character as CharacterKey;
    const portrait = card.querySelector('.portrait');
    if (portrait) portrait.innerHTML = posingBird(CHARACTERS[key].prefix);
  });

  const paint = () => {
    cards.forEach((card) => card.setAttribute('aria-pressed', String(card.dataset.character === character)));
    if (startButton) startButton.textContent = `${CHARACTERS[character].name}와 시작`;
  };

  cards.forEach((card) => {
    card.addEventListener('click', () => {
      character = card.dataset.character as CharacterKey;
      save(CHARACTER_KEY, character);
      bgm.unlock();
      bgm.sfx('pick');
      paint();
    });
  });

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
