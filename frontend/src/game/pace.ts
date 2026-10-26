// 판의 빠르기. 난이도는 하나이고, 한 판 안에서 물결처럼 오르내린다.
//
// 40초가 한 마디다. 처음 32초 동안 서서히 빨라지고, 마지막 8초는 숨을 돌릴 만큼
// 느려진다. 다음 마디는 시작점과 꼭대기가 조금씩 더 높다. 그래서 오래 버틸수록
// 쉬는 자리도 점점 빠듯해진다.

const CYCLE_SEC = 40;
const RAMP_SEC = 32;

// 0(가장 느림)부터 1(가장 빠름)까지
export const paceLevel = (elapsedSec: number) => {
  const round = Math.floor(elapsedSec / CYCLE_SEC);
  const t = elapsedSec % CYCLE_SEC;
  const floor = Math.min(0.55, 0.1 * round);
  const peak = Math.min(1, 0.55 + 0.15 * round);
  if (t < RAMP_SEC) return floor + (peak - floor) * Math.pow(t / RAMP_SEC, 1.3);
  return floor + (peak - floor) * 0.35;
};

// 세로 640px 화면 기준의 값이다. game.ts가 화면 높이에 맞춰 늘인다.
export const pace = (elapsedSec: number) => {
  const level = paceLevel(elapsedSec);
  return {
    level,
    // 떨어지는 속도(px/s)
    speed: 70 + 150 * level,
    // 다음 것이 떨어질 때까지(ms)
    spawnMs: 1200 - 820 * level,
    // 해바라기씨가 나올 확률. 빨라질수록 조금 드물다.
    seedChance: 0.14 - 0.05 * level
  };
};
