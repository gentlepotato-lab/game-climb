import { Router } from 'express';
import { query } from '../db';

export const runsRouter = Router();

const allowedDifficulties = new Set(['easy', 'normal', 'hard']);

// 랭킹 한 줄에 들어갈 만큼만 받는다. DB의 runs_display_name_chk와 같은 값이다.
const DISPLAY_NAME_MAX = 20;

const kstWeekStartUtc = () => {
  const kstOffsetMs = 9 * 60 * 60 * 1000;
  const now = new Date();
  const kst = new Date(now.getTime() + kstOffsetMs);
  const day = kst.getUTCDay(); // 0=Sun, 1=Mon
  const diffToMonday = (day + 6) % 7;
  kst.setUTCDate(kst.getUTCDate() - diffToMonday);
  kst.setUTCHours(0, 0, 0, 0);
  return new Date(kst.getTime() - kstOffsetMs);
};

runsRouter.post('/', async (req, res) => {
  const difficulty = String(req.body.difficulty ?? '').toLowerCase();
  if (!allowedDifficulties.has(difficulty)) {
    return res.status(400).json({ error: 'invalid_difficulty' });
  }

  // 글자 수는 DB(char_length)와 같게 센다. length로 세면 이모지 하나가 둘로 잡힌다.
  const displayName = String(req.body.displayName ?? '').trim();
  const displayNameLength = [...displayName].length;
  if (displayNameLength < 1 || displayNameLength > DISPLAY_NAME_MAX) {
    return res.status(400).json({ error: 'invalid_display_name' });
  }

  const score = Math.max(0, Number(req.body.score ?? 0));
  const height = Math.max(0, Number(req.body.height ?? 0));
  const durationMs = Math.max(0, Math.round(Number(req.body.durationMs ?? req.body.duration_ms ?? 0)));
  const obstaclesAvoided = Math.max(0, Number(req.body.obstaclesAvoided ?? req.body.obstacles_avoided ?? 0));

  const inserted = await query(
    `INSERT INTO game_climb.runs (display_name, difficulty, score, height, duration_ms, obstacles_avoided)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, display_name as "displayName", difficulty, score, height, duration_ms as "durationMs", obstacles_avoided as "obstaclesAvoided", created_at as "createdAt"`,
    [displayName, difficulty, score, height, durationMs, obstaclesAvoided]
  );

  return res.json({ run: inserted.rows[0] });
});

runsRouter.get('/leaderboard', async (req, res) => {
  const difficulty = String(req.query.difficulty ?? '').trim().toLowerCase();
  const limit = Math.min(5, Math.max(1, Number(req.query.limit ?? 5)));

  if (!difficulty) {
    return res.status(400).json({ error: 'difficulty_required' });
  }

  const weekStart = kstWeekStartUtc().toISOString();
  const result = await query(
    `SELECT id, difficulty, score, height, duration_ms as "durationMs", obstacles_avoided as "obstaclesAvoided",
            created_at as "createdAt", display_name as "displayName"
     FROM game_climb.runs
     WHERE difficulty = $1
       AND created_at >= $2
     ORDER BY score DESC, height DESC, created_at DESC
     LIMIT $3`,
    [difficulty, weekStart, limit]
  );

  return res.json({ leaderboard: result.rows });
});
