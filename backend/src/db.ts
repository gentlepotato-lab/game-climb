import fs from 'node:fs';
import path from 'node:path';
import { Pool } from 'pg';
import { config } from './config';

const pool = new Pool({
  host: config.db.host,
  port: config.db.port,
  database: config.db.name,
  user: config.db.user,
  password: config.db.pass
});

// Prevent the process from crashing on idle client errors.
pool.on('error', (error) => {
  console.error('PostgreSQL pool error:', error);
});

export const query = (text: string, params?: Array<string | number | boolean | null>) => {
  return pool.query(text, params);
};

export const getPool = () => pool;

export const initDb = async () => {
  const sqlPath = path.resolve(process.cwd(), 'sql', '001_init.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');
  await pool.query(sql);
};

export const initDbIfNeeded = async () => {
  if (!config.dbInit) return;
  await initDb();
};
