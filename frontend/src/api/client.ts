export type Run = {
  id: number;
  displayName: string;
  difficulty: string;
  score: number;
  height: number;
  durationMs: number;
  obstaclesAvoided: number;
  createdAt: string;
};

export type LeaderboardEntry = Run;

// API는 전부 /api 아래에 모여 있다. 화면(SPA)이 루트를 쓰기 때문이다.
// 개발 서버에서도 같은 값을 쓴다. Vite가 /api를 백엔드로 넘겨 준다.
const API = '/api';

const request = async (path: string, options: RequestInit = {}) => {
  const headers = new Headers(options.headers ?? {});
  headers.set('Content-Type', 'application/json');

  const response = await fetch(`${API}${path}`, {
    ...options,
    headers
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error ?? 'request_failed');
  }
  return payload;
};

export const api = {
  saveRun: async (run: {
    displayName: string;
    difficulty: string;
    score: number;
    height: number;
    durationMs: number;
    obstaclesAvoided: number;
  }) => {
    return request('/runs', {
      method: 'POST',
      body: JSON.stringify(run)
    }) as Promise<{ run: Run }>;
  },
  leaderboard: async (difficulty: string, limit = 10) => {
    const diff = difficulty ? encodeURIComponent(difficulty) : 'all';
    return request(`/runs/leaderboard?difficulty=${diff}&limit=${limit}`) as Promise<{
      leaderboard: LeaderboardEntry[];
    }>;
  }
};
