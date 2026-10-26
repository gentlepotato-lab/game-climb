-- 2026-10-27_runs_display_name.sql 되돌리기.
--
-- user_id를 다시 채워야 하는 값으로 되돌린다. 로그인 없이 남긴 기록은
-- 주인이 없어서 그 제약을 못 지킨다. 그런 기록은 지운다. 남기려면 되돌리기
-- 전에 따로 떠야 한다.

BEGIN;

DELETE FROM game_climb.runs WHERE user_id IS NULL;

ALTER TABLE game_climb.runs
    ALTER COLUMN user_id SET NOT NULL;

ALTER TABLE game_climb.runs
    DROP CONSTRAINT IF EXISTS runs_display_name_chk;

ALTER TABLE game_climb.runs
    DROP COLUMN IF EXISTS display_name;

COMMIT;
