import { Router } from 'express';
import { query } from '../db';
import { hashPassword, verifyPassword } from '../utils/password';
import { signToken } from '../utils/jwt';
import { requireAuth, AuthRequest } from '../middleware/auth';

export const authRouter = Router();

const emailRegex = /^\S+@\S+\.\S+$/;

const sanitize = (value: unknown) => String(value ?? '').trim();

const baseUserSelect = 'id, email, display_name as "displayName", created_at as "createdAt"';

authRouter.post('/register', async (req, res) => {
  try {
    const email = sanitize(req.body.email).toLowerCase();
    const password = sanitize(req.body.password);
    const displayName = sanitize(req.body.displayName) || email.split('@')[0];

    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'invalid_email' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'weak_password' });
    }

    const existing = await query('SELECT id FROM game_climb.users WHERE email = $1', [email]);
    if (existing.rowCount && existing.rowCount > 0) {
      return res.status(409).json({ error: 'email_exists' });
    }

    const passwordHash = await hashPassword(password);
    const created = await query(
      `INSERT INTO game_climb.users (email, password_hash, display_name)
       VALUES ($1, $2, $3)
       RETURNING ${baseUserSelect}`,
      [email, passwordHash, displayName]
    );

    const user = created.rows[0];
    const token = signToken({ userId: user.id, email: user.email });
    return res.json({ token, user });
  } catch (error: any) {
    if (error?.code === '23505') {
      return res.status(409).json({ error: 'email_exists' });
    }
    return res.status(500).json({ error: 'register_failed' });
  }
});

authRouter.post('/login', async (req, res) => {
  try {
    const email = sanitize(req.body.email).toLowerCase();
    const password = sanitize(req.body.password);

    if (!emailRegex.test(email) || password.length < 1) {
      return res.status(400).json({ error: 'invalid_credentials' });
    }

    const result = await query(
      `SELECT ${baseUserSelect}, password_hash as "passwordHash"
       FROM game_climb.users WHERE email = $1`,
      [email]
    );

    const user = result.rows[0];
    if (!user) {
      return res.status(401).json({ error: 'invalid_credentials' });
    }

    const passwordHash =
      user.passwordHash ??
      user.passwordhash ??
      user.password_hash;

    if (!passwordHash) {
      return res.status(401).json({ error: 'invalid_credentials' });
    }

    const looksBcrypt = typeof passwordHash === 'string' && /^\$2[aby]\$/.test(passwordHash);
    let ok = false;

    if (looksBcrypt) {
      ok = await verifyPassword(password, passwordHash);
    } else {
      ok = password === passwordHash;
    }

    if (!ok) {
      return res.status(401).json({ error: 'invalid_credentials' });
    }

    if (!looksBcrypt) {
      const newHash = await hashPassword(password);
      await query('UPDATE game_climb.users SET password_hash = $1 WHERE id = $2', [newHash, user.id]);
    }

    const token = signToken({ userId: user.id, email: user.email });
    const { passwordHash: _passwordHash, ...safeUser } = user;
    return res.json({ token, user: safeUser });
  } catch (error) {
    return res.status(500).json({ error: 'login_failed' });
  }
});

authRouter.get('/me', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    const result = await query(
      `SELECT ${baseUserSelect}
       FROM game_climb.users WHERE id = $1`,
      [userId]
    );
    return res.json({ user: result.rows[0] });
  } catch (_error) {
    return res.status(500).json({ error: 'me_failed' });
  }
});
