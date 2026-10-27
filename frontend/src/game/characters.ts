import type { CharacterKey } from './types';

export type Character = {
  key: CharacterKey;
  name: string;
  // defs.ts의 symbol 이름 앞자락
  prefix: 'mg' | 'bo';
  // 초마다 오르는 높이
  climbRate: number;
  lives: number;
  // 줄 흔들기. 손을 대면 drive만큼 밀고, stiffness가 가운데로 되돌리고, damping이 잦아들게 한다.
  drive: number;
  stiffness: number;
  damping: number;
  // 가운데에서 옆으로 나갈 수 있는 거리(px)
  reach: number;
  // 끝에 닿았을 때 튕겨 나오는 정도
  bounce: number;
  // 손이 늦게 먹히는 정도(엇박자)
  inputDelayMs: number;
  inputJitterMs: number;
  // 손을 안 대도 제멋대로 흔들리는 정도
  wobble: number;
  // guard: 1초 동안 다가오는 먼지를 튕겨 낸다. blast: 1초 동안 화면의 먼지를 날려 버린다.
  skill: 'guard' | 'blast';
  skillLabel: string;
  skillCooldownMs: number;
  // 늘 해바라기씨를 끌어당기는 거리(px). 0이면 끌어당기지 않는다.
  magnet: number;
};

// 둘 다 한쪽이 유리하지 않게 맞춘다.
// 몽글이는 오래 버티고 정확하게 비키는 쪽, 보리는 빨리 오르고 많이 먹는 쪽이다.
export const CHARACTERS: Record<CharacterKey, Character> = {
  mongle: {
    key: 'mongle',
    name: '몽글이',
    prefix: 'mg',
    climbRate: 3,
    lives: 4,
    drive: 3.6,
    stiffness: 6,
    damping: 5,
    reach: 104,
    bounce: 0.15,
    inputDelayMs: 0,
    inputJitterMs: 0,
    wobble: 0,
    skill: 'guard',
    skillLabel: '쪼기',
    skillCooldownMs: 8000,
    magnet: 0
  },
  bori: {
    key: 'bori',
    name: '보리',
    prefix: 'bo',
    climbRate: 3.4,
    lives: 3,
    // 몽글이보다 덜 잡히고 조금 지나치지만, 휘둘려서 못 피할 만큼은 아니게 맞춘다.
    drive: 3.5,
    stiffness: 5.4,
    damping: 3.2,
    reach: 120,
    bounce: 0.35,
    inputDelayMs: 110,
    inputJitterMs: 40,
    wobble: 0.35,
    skill: 'blast',
    skillLabel: '날리기',
    skillCooldownMs: 8000,
    magnet: 80
  }
};
