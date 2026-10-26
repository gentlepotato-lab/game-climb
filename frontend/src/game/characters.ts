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
  skill: 'peck' | 'glutton';
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
    skill: 'peck',
    skillLabel: '쪼기',
    skillCooldownMs: 8000,
    magnet: 0
  },
  bori: {
    key: 'bori',
    name: '보리',
    prefix: 'bo',
    climbRate: 3.6,
    lives: 3,
    drive: 4.4,
    stiffness: 5,
    damping: 1.3,
    reach: 128,
    bounce: 0.55,
    inputDelayMs: 170,
    inputJitterMs: 70,
    wobble: 0.7,
    skill: 'glutton',
    skillLabel: '먹보',
    skillCooldownMs: 8000,
    magnet: 60
  }
};
