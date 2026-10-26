import { Router } from 'express';
import { query } from '../db';

export const leaderboardRouter = Router();

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

leaderboardRouter.get('/', async (req, res) => {
  const difficulty = String(req.query.difficulty ?? '').trim().toLowerCase();
  const limit = Math.min(5, Math.max(1, Number(req.query.limit ?? 5)));

  if (!difficulty) {
    return res.status(400).json({ error: 'difficulty_required' });
  }

  const weekStart = kstWeekStartUtc().toISOString();
  const result = await query(
    `SELECT r.id, r.difficulty, r.score, r.height, r.duration_ms as "durationMs", r.obstacles_avoided as "obstaclesAvoided",
            r.created_at as "createdAt", u.display_name as "displayName"
     FROM game_climb.runs r
     JOIN game_climb.users u ON r.user_id = u.id
     WHERE r.difficulty = $1
       AND r.created_at >= $2
     ORDER BY r.score DESC, r.height DESC, r.created_at DESC
     LIMIT $3`,
    [difficulty, weekStart, limit]
  );

  return res.json({ leaderboard: result.rows });
});
