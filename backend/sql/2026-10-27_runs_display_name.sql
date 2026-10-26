-- 기록에 닉네임을 직접 담는다.
--
-- 로그인을 걷어낸다. 기록이 누구 것인지는 이제 users를 거치지 않고 기록
-- 자신이 갖는다. 그래서 runs에 display_name을 추가하고 user_id는 비울 수
-- 있게 한다.
--
-- 지금 있는 기록에는 가입 때 적은 닉네임을 채운다. users와 user_id는
-- 지우지 않는다. 옛 코드도 이 상태에서 그대로 돌아야 하므로, 지우는 것은
-- 다음 배포에서 한다(Expand/Contract).

BEGIN;

ALTER TABLE game_climb.runs
    ADD COLUMN IF NOT EXISTS display_name TEXT NULL;

UPDATE game_climb.runs r
   SET display_name = u.display_name
  FROM game_climb.users u
 WHERE r.user_id = u.id
   AND r.display_name IS NULL;

ALTER TABLE game_climb.runs
    ALTER COLUMN user_id DROP NOT NULL;

-- 랭킹 한 줄에 들어갈 만큼만 받는다. 지금 가장 긴 닉네임이 12자다.
ALTER TABLE game_climb.runs
    DROP CONSTRAINT IF EXISTS runs_display_name_chk;

ALTER TABLE game_climb.runs
    ADD CONSTRAINT runs_display_name_chk
    CHECK (display_name IS NULL OR char_length(display_name) BETWEEN 1 AND 20);

COMMIT;
