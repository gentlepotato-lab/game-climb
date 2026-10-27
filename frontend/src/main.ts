import './styles.css';
import { api } from './api/client';
import { bgm } from './audio/bgm';
import { DEFS } from './art/defs';
import { GAME_WIDTH, startGame } from './game/game';
import type { GameResult } from './game/types';
import { initStart, StartChoice } from './ui/start';
import { showPanel } from './ui/screens';

// 그림 조각(symbol)을 한 번만 심고, 화면의 모든 svg가 이것을 쓴다.
const defsHost = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
defsHost.setAttribute('width', '0');
defsHost.setAttribute('height', '0');
defsHost.setAttribute('aria-hidden', 'true');
defsHost.style.position = 'absolute';
defsHost.innerHTML = `<defs>${DEFS}</defs>`;
document.body.prepend(defsHost);

// 게임판은 가로 360px 기준이다. 세로는 처음 연 기기의 비율로 한 번 정하고, 그 뒤로는 크기만 맞춘다.
// PC처럼 가로가 넓은 화면에서도 고르는 화면이 다 들어가도록 세로는 720px 아래로 줄이지 않는다.
const stage = document.getElementById('stage') as HTMLDivElement;
const stageHeight = Math.round(Math.min(820, Math.max(720, (GAME_WIDTH * window.innerHeight) / window.innerWidth)));
stage.style.width = `${GAME_WIDTH}px`;
stage.style.height = `${stageHeight}px`;

const fitStage = () => {
  const scale = Math.min(window.innerWidth / GAME_WIDTH, window.innerHeight / stageHeight);
  stage.style.transform = `translate(-50%, -50%) scale(${scale})`;
};
fitStage();
window.addEventListener('resize', fitStage);

// 배경 음악. 브라우저가 첫 손길 뒤에야 소리를 내게 해 주므로 그때 깨운다.
const soundButton = document.getElementById('sound') as HTMLButtonElement;
const paintSound = () => {
  soundButton.setAttribute('aria-pressed', String(!bgm.muted));
  soundButton.classList.toggle('off', bgm.muted);
};
paintSound();
soundButton.addEventListener('click', () => {
  bgm.unlock();
  bgm.setMuted(!bgm.muted);
  paintSound();
});
const wake = () => bgm.unlock();
window.addEventListener('pointerdown', wake);
window.addEventListener('keydown', wake);
bgm.play('select');

const resultSummary = document.getElementById('result-summary');
const resultStats = document.getElementById('result-stats');
const leaderboard = document.getElementById('leaderboard');
const retryButton = document.getElementById('retry-button');
const retrySameButton = document.getElementById('retry-same-button');

const setStats = (lines: string[]) => {
  if (!resultStats) return;
  resultStats.replaceChildren(...lines.map((line) => {
    const row = document.createElement('div');
    row.textContent = line;
    return row;
  }));
};

// 닉네임은 누구나 적을 수 있다. innerHTML에 그대로 넣으면 남이 적은 태그가
// 이 화면에서 돈다. 그래서 글자로만 넣는다.
const leaderboardRow = (left: string, right: string) => {
  const row = document.createElement('div');
  row.className = 'leaderboard-item';
  const name = document.createElement('span');
  name.textContent = left;
  const score = document.createElement('span');
  score.textContent = right;
  row.append(name, score);
  return row;
};

const setLeaderboard = (entries: Array<{ displayName: string; score: number; height: number }>) => {
  if (!leaderboard) return;
  const title = document.createElement('h3');
  title.textContent = '이번 주 랭킹 Top 5';
  const rows = entries.length
    ? entries.map((entry, index) => leaderboardRow(`${index + 1}. ${entry.displayName}`, `${entry.score}점`))
    : [leaderboardRow('이번 주 기록이 아직 없습니다.', '-')];
  leaderboard.replaceChildren(title, ...rows);
};

// 난이도는 하나로 합쳤다(game/pace.ts). 기록 테이블의 difficulty 컬럼과 API는 그대로 두고 normal로 적는다.
const RUN_DIFFICULTY = 'normal';

let lastChoice: StartChoice | null = null;
let current: { destroy: () => void } | null = null;

const onGameOver = async (choice: StartChoice, result: GameResult) => {
  showPanel('result');
  bgm.play('select');
  if (resultSummary) resultSummary.textContent = '도전 종료!';
  const heightCm = Math.round((result.height * 100) / 200);
  setStats([
    `점수: ${result.score}`,
    `최대 높이: ${heightCm}cm`,
    `피한 장애물: ${result.obstaclesAvoided}개`,
    `플레이 타임: ${(result.durationMs / 1000).toFixed(1)}초`
  ]);
  setLeaderboard([]);

  try {
    await api.saveRun({
      displayName: choice.displayName,
      difficulty: RUN_DIFFICULTY,
      score: result.score,
      height: result.height,
      durationMs: result.durationMs,
      obstaclesAvoided: result.obstaclesAvoided
    });
  } catch (_error) {
    // 저장에 실패해도 랭킹은 불러온다.
  }

  try {
    const board = await api.leaderboard(RUN_DIFFICULTY, 5);
    setLeaderboard(Array.isArray(board.leaderboard) ? board.leaderboard : []);
  } catch (_error) {
    setLeaderboard([]);
  }
};

const startRun = (choice: StartChoice) => {
  lastChoice = choice;
  current?.destroy();
  showPanel(null);
  bgm.play('game');
  current = startGame(stage, {
    character: choice.character,
    onGameOver: (result) => onGameOver(choice, result)
  });
};

initStart(startRun);

retrySameButton?.addEventListener('click', () => {
  if (lastChoice) startRun(lastChoice);
});

retryButton?.addEventListener('click', () => {
  current?.destroy();
  current = null;
  showPanel('start');
});

showPanel('start');
