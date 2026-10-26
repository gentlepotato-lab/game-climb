import { showPanel } from './screens';

// 닉네임은 이 브라우저에만 남긴다. 다음에 들어오면 칸이 채워져 있다.
const STORAGE_KEY = 'climb_display_name';

export const loadDisplayName = () => {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? '';
  } catch (_error) {
    return '';
  }
};

const saveDisplayName = (displayName: string) => {
  try {
    localStorage.setItem(STORAGE_KEY, displayName);
  } catch (_error) {
    // 저장이 막힌 브라우저여도 이번 판은 그대로 한다.
  }
};

export const initStart = (onStart: (displayName: string) => void) => {
  const startForm = document.getElementById('start-form') as HTMLFormElement | null;
  const input = startForm?.elements.namedItem('displayName') as HTMLInputElement | null;

  if (input) {
    input.value = loadDisplayName();
  }

  startForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    const displayName = String(input?.value ?? '').trim();
    if (!displayName) {
      input?.focus();
      return;
    }
    saveDisplayName(displayName);
    onStart(displayName);
    showPanel('menu');
  });
};
