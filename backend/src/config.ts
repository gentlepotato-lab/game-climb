import dotenv from 'dotenv';
import process from 'node:process';

dotenv.config();

const env = (key: string, fallback?: string) => {
  const value = process.env[key];
  return value !== undefined && value !== '' ? value : fallback;
};

const toNumber = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

// 기본값은 lab.ps1과 GP Lab의 포트 규칙(18201)과 DB 이름(gp-lab)에 맞춘다.
export const config = {
  port: toNumber(env('PORT', '18201'), 18201),
  db: {
    host: env('DB_HOST', '127.0.0.1') as string,
    port: toNumber(env('DB_PORT', '5432'), 5432),
    name: env('DB_NAME', 'gp-lab') as string,
    user: env('DB_USER', 'postgres') as string,
    pass: env('DB_PASS', 'postgres') as string
  },
  corsOrigin: env('CORS_ORIGIN', '*') as string,
  dbInit: env('DB_INIT', '0') === '1'
};
