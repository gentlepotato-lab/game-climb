-- 새 환경에서 game_climb 스키마를 처음부터 세운다.
--
-- DB_INIT=1일 때 기동하면서 이 파일을 돌린다. 운영 DB의 모양과 늘 같아야
-- 하므로, sql/에 날짜 붙은 마이그레이션을 추가할 때 이 파일도 함께 고친다.
--
-- users는 로그인을 걷어내면서 쓰지 않게 됐다. 운영 DB에서 지우는 것은 다음
-- 배포이고, 그때까지는 이 파일에도 남는다(2026-10-27_runs_display_name.sql).

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "citext";

CREATE SCHEMA IF NOT EXISTS game_climb;

CREATE TABLE IF NOT EXISTS game_climb.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email CITEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  display_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS game_climb.runs (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES game_climb.users(id) ON DELETE CASCADE,
  difficulty TEXT NOT NULL,
  score INTEGER NOT NULL,
  height INTEGER NOT NULL,
  duration_ms INTEGER NOT NULL,
  obstacles_avoided INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  display_name TEXT NULL,
  CONSTRAINT runs_display_name_chk
    CHECK (display_name IS NULL OR char_length(display_name) BETWEEN 1 AND 20)
);

CREATE INDEX IF NOT EXISTS runs_leaderboard_idx
  ON game_climb.runs (difficulty, score DESC, height DESC, created_at DESC);
