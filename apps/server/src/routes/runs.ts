import { Router } from 'express';
import { query } from '../db';
import { requireAuth, AuthRequest } from '../middleware/auth';

export const runsRouter = Router();

const allowedDifficulties = new Set(['easy', 'normal', 'hard']);

runsRouter.post('/', requireAuth, async (req: AuthRequest, res) => {
  const difficulty = String(req.body.difficulty ?? '').toLowerCase();
  if (!allowedDifficulties.has(difficulty)) {
    return res.status(400).json({ error: 'invalid_difficulty' });
  }

  const score = Math.max(0, Number(req.body.score ?? 0));
  const height = Math.max(0, Number(req.body.height ?? 0));
  const durationMs = Math.max(0, Math.round(Number(req.body.durationMs ?? req.body.duration_ms ?? 0)));
  const obstaclesAvoided = Math.max(0, Number(req.body.obstaclesAvoided ?? req.body.obstacles_avoided ?? 0));

  const inserted = await query(
    `INSERT INTO game_climb.runs (user_id, difficulty, score, height, duration_ms, obstacles_avoided)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, difficulty, score, height, duration_ms as "durationMs", obstacles_avoided as "obstaclesAvoided", created_at as "createdAt"`,
    [req.user?.id, difficulty, score, height, durationMs, obstaclesAvoided]
  );

  return res.json({ run: inserted.rows[0] });
});

runsRouter.get('/mine', requireAuth, async (req: AuthRequest, res) => {
  const result = await query(
    `SELECT id, difficulty, score, height, duration_ms as "durationMs", obstacles_avoided as "obstaclesAvoided", created_at as "createdAt"
     FROM game_climb.runs
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT 20`,
    [req.user?.id]
  );

  return res.json({ runs: result.rows });
});
