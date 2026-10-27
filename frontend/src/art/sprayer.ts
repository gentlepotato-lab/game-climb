// 분무기를 든 손. 노즐이 오른쪽을 본다. 손목은 왼쪽 화면 밖으로 이어진다.
// viewBox는 -40 20 140 110이고, 노즐 끝은 (98, 36.5)이다.

const SKIN = '#f7d8c6';
const SKIN_EDGE = '#e0ab90';

const finger = (d: string, width = 8) =>
  `<path d="${d}" fill="none" stroke="${SKIN_EDGE}" stroke-width="${width + 2}" stroke-linecap="round"/>` +
  `<path d="${d}" fill="none" stroke="${SKIN}" stroke-width="${width}" stroke-linecap="round"/>`;

// 손바닥과 손가락. 테두리를 먼저 한꺼번에 그리고 그 위에 살을 덮어서, 손가락 사이에 선이 겹치지 않는다.
const hand = (color: string, extra: number) =>
  [
    ['M-14 46 L14 54', 22],
    ['M30 60 Q48 59 58 64', 8],
    ['M29 67 Q45 67 54 71', 7.5],
    ['M27 73 Q40 74 47 77', 6.5],
    ['M20 48 Q28 38 38 36', 8]
  ]
    .map(([d, w]) => `<path d="${d}" fill="none" stroke="${color}" stroke-width="${Number(w) + extra}" stroke-linecap="round"/>`)
    .join('') + `<ellipse cx="22" cy="57" rx="${17 + extra / 2}" ry="${15 + extra / 2}" fill="${color}"/>`;

export const sprayerSvg = () => `<svg class="sprayer-art" viewBox="-40 20 140 110" width="130" height="102" aria-hidden="true">
<defs>
  <linearGradient id="sprayBottleG" x1="0" x2="1">
    <stop offset="0" stop-color="#e8f6fa"/>
    <stop offset="0.55" stop-color="#cbe8f1"/>
    <stop offset="1" stop-color="#a9d3e3"/>
  </linearGradient>
  <linearGradient id="sprayHeadG" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#ffffff"/>
    <stop offset="1" stop-color="#e3eaf0"/>
  </linearGradient>
  <linearGradient id="spraySleeveG" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#c9bce6"/>
    <stop offset="1" stop-color="#a796d0"/>
  </linearGradient>
</defs>
<g class="bottle">
  <path d="M30 60 h22 v5 q11 4 11 17 v36 q0 9 -9 9 h-26 q-9 0 -9 -9 v-36 q0 -13 11 -17z" fill="url(#sprayBottleG)" stroke="#8fbccd" stroke-width="1.2"/>
  <path d="M20 94 q21 -4 42 0 v24 q0 8 -8 8 h-26 q-8 0 -8 -8z" fill="#8ec8dc" opacity="0.45"/>
  <rect x="25" y="72" width="4" height="40" rx="2" fill="#ffffff" opacity="0.7"/>
  <rect x="28" y="53" width="26" height="9" rx="2.5" fill="#eef3f6" stroke="#c3cfd8" stroke-width="1"/>
</g>
<g class="head">
  <path d="M24 54 V40 Q24 29 36 29 L81 31 Q87 32 87 37 V42 L62 46 L58 54 Z" fill="url(#sprayHeadG)" stroke="#c3cfd8" stroke-width="1.2" stroke-linejoin="round"/>
  <rect x="86" y="33" width="12" height="7" rx="2" fill="#86bfd5" stroke="#679fb6" stroke-width="1"/>
</g>
<g class="trigger">
  <path d="M58 46 Q72 46 75 55 Q77 66 69 73 Q66 62 58 56 Z" fill="#86bfd5" stroke="#679fb6" stroke-width="1" stroke-linejoin="round"/>
  ${finger('M40 52 Q58 50 66 56', 8)}
</g>
<g class="hand">
  <path d="M-60 26 L-14 44" fill="none" stroke="url(#spraySleeveG)" stroke-width="34" stroke-linecap="round"/>
  ${hand(SKIN_EDGE, 2)}
  ${hand(SKIN, 0)}
  <path d="M34 63.6 Q47 63.4 55 67.4 M33 70.2 Q43 70.6 50 74" fill="none" stroke="${SKIN_EDGE}" stroke-width="1.2" stroke-linecap="round"/>
  <path d="M-50 15 Q-38 27 -26 31" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round" opacity="0.35"/>
</g>
</svg>`;
