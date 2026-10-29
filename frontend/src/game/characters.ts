import type { CharacterKey } from './types';

// defs.ts의 symbol 이름 앞자락
export type BirdPrefix = 'mg' | 'bo' | 'mo' | 'bn' | 'md';

export type Character = {
  key: CharacterKey;
  name: string;
  prefix: BirdPrefix;
  // 초마다 오르는 높이
  climbRate: number;
  // 처음 체력. 0이 되면 끝나고, 100까지 찬다.
  hp: number;
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
  // 필살기. 누르면 1초 동안 간다.
  // guard: 다가오는 먼지를 튕겨 낸다. blast: 화면의 먼지를 날려 버린다.
  // ghost: 몸이 흐려져 먼지와 청소기가 그냥 지나간다. dash: 제자리에서 좌우로 빠르게 움직여 먼지를 피한다.
  // repel: 먼지가 몸 둘레에서 휘어 비켜 간다.
  skill: 'guard' | 'blast' | 'ghost' | 'dash' | 'repel';
  skillLabel: string;
  skillCooldownMs: number;
  // 늘 해바라기씨를 끌어당기는 거리(px). 0이면 끌어당기지 않는다.
  magnet: number;
  // 성격. 가만히 있을 때 이쪽을 보는 간격(ms), 딴청 피우는 빈도(초당), 빨리 흔들릴 때 놀라는 빠르기(0이면 놀라지 않는다),
  // 먼지가 다가올 때 눈을 동그랗게 뜨는지, 안간힘 표정이 몇 박자에 한 번인지(0이면 짓지 않는다).
  frontEveryMs: [number, number];
  derpyRate: number;
  surpriseSpeed: number;
  alertOnThreat: boolean;
  effortEvery: number;
  // 고르는 화면에 쓰는 소개
  tagline: string;
  stats: { climb: number; swing: number; hp: number };
  skillNote: string;
  trait: string;
};

// 서로 한쪽이 유리하지 않게 맞춘다.
// 몽글이는 오래 버티고 정확하게 비키는 쪽, 보리는 빨리 오르고 많이 먹는 쪽이다.
// 모모는 느리지만 가장 단단하고, 번개는 재빠르지만 여리고, 막둥이는 모든 것이 고르다.
export const CHARACTERS: Record<CharacterKey, Character> = {
  mongle: {
    key: 'mongle',
    name: '몽글이',
    prefix: 'mg',
    climbRate: 3,
    hp: 80,
    drive: 3.6,
    stiffness: 6,
    damping: 4.2,
    reach: 158,
    bounce: 0.15,
    inputDelayMs: 0,
    inputJitterMs: 0,
    wobble: 0,
    skill: 'guard',
    skillLabel: '쪼기',
    skillCooldownMs: 8000,
    magnet: 0,
    frontEveryMs: [6000, 9000],
    derpyRate: 0,
    surpriseSpeed: 0,
    alertOnThreat: true,
    effortEvery: 3,
    tagline: '차분하고 도도한 절세미인',
    stats: { climb: 3, swing: 5, hp: 4 },
    skillNote: '1초 동안 먼지를 튕겨낸다.',
    trait: '흔들림이 작고 오르기가 느리다.'
  },
  bori: {
    key: 'bori',
    name: '보리',
    prefix: 'bo',
    climbRate: 3.4,
    hp: 60,
    // 몽글이보다 덜 잡히고 조금 지나치지만, 휘둘려서 못 피할 만큼은 아니게 맞춘다.
    drive: 3.5,
    stiffness: 5.4,
    damping: 2.8,
    reach: 160,
    bounce: 0.35,
    inputDelayMs: 110,
    inputJitterMs: 40,
    wobble: 0.35,
    skill: 'blast',
    skillLabel: '날리기',
    skillCooldownMs: 8000,
    magnet: 80,
    frontEveryMs: [4000, 7000],
    derpyRate: 0.15,
    surpriseSpeed: 0.9,
    alertOnThreat: false,
    effortEvery: 3,
    tagline: '엇박자 천방지축',
    stats: { climb: 5, swing: 3, hp: 3 },
    skillNote: '1초 동안 먼지를 날려버린다.',
    trait: '씨앗을 끌어당기고 크게 흔들린다.'
  },
  momo: {
    key: 'momo',
    name: '모모',
    prefix: 'mo',
    // 느릿하게 오르고, 손이 실리는 데 조금 더 걸리지만 한번 흔들리면 차분하게 멈춘다. 체력이 가장 많다.
    climbRate: 2.6,
    hp: 100,
    drive: 3.3,
    stiffness: 5.6,
    damping: 4.6,
    reach: 158,
    bounce: 0.1,
    inputDelayMs: 0,
    inputJitterMs: 0,
    wobble: 0,
    skill: 'ghost',
    skillLabel: '유령',
    skillCooldownMs: 8000,
    magnet: 0,
    // 혼자 있기를 좋아해서 이쪽을 잘 보지 않고, 놀라지도 서두르지도 않는다. 늘 순한 얼굴이다.
    frontEveryMs: [10000, 15000],
    derpyRate: 0,
    surpriseSpeed: 0,
    alertOnThreat: false,
    effortEvery: 0,
    tagline: '차분하고 고독한 외유내강',
    stats: { climb: 2, swing: 4, hp: 5 },
    skillNote: '1초 동안 몸이 흐려져 먼지가 그냥 지나간다.',
    trait: '느릿하게 오르지만 오래 버틴다.'
  },
  beongae: {
    key: 'beongae',
    name: '번개',
    prefix: 'bn',
    // 손에 빠릿빠릿하게 반응하고 빨리 멈춘다. 살짝 엇박자에 제멋대로 흔들리지만 보리보다는 덜하다.
    climbRate: 3.2,
    hp: 60,
    drive: 4.4,
    stiffness: 6.4,
    damping: 3.6,
    reach: 160,
    bounce: 0.25,
    inputDelayMs: 40,
    inputJitterMs: 20,
    wobble: 0.15,
    skill: 'dash',
    skillLabel: '스스슥',
    skillCooldownMs: 8000,
    magnet: 0,
    // 궁금한 게 많아 이쪽을 자주 보고, 가끔 두리번거리고, 빨리 흔들리면 놀란다.
    frontEveryMs: [3000, 5000],
    derpyRate: 0.07,
    surpriseSpeed: 1.2,
    alertOnThreat: false,
    effortEvery: 3,
    tagline: '빠릿빠릿 온순한 천방지축',
    stats: { climb: 4, swing: 4, hp: 3 },
    skillNote: '1초 동안 제자리에서 좌우로 빠르게 움직여 먼지를 피한다.',
    trait: '재빠르게 흔들리고 살짝 엇박자다.'
  },
  makdung: {
    key: 'makdung',
    name: '막둥이',
    prefix: 'md',
    // 온순하고 차분해서 흔들림이 고르다. 모모보다는 조금 더 빠릿하다.
    climbRate: 3,
    hp: 80,
    drive: 3.5,
    stiffness: 5.8,
    damping: 4,
    reach: 158,
    bounce: 0.15,
    inputDelayMs: 0,
    inputJitterMs: 0,
    wobble: 0.06,
    skill: 'repel',
    skillLabel: '비켜 가기',
    skillCooldownMs: 8000,
    magnet: 0,
    frontEveryMs: [5000, 8000],
    derpyRate: 0.03,
    surpriseSpeed: 0,
    alertOnThreat: false,
    effortEvery: 0,
    tagline: '온순하고 차분한 막둥이',
    stats: { climb: 3, swing: 4, hp: 4 },
    skillNote: '1초 동안 먼지가 막둥이를 피해서 지나간다.',
    trait: '흔들림이 고르고 무난하다.'
  }
};

// 고르는 화면에 놓는 순서
export const CHARACTER_ORDER: CharacterKey[] = ['mongle', 'bori', 'momo', 'beongae', 'makdung'];
