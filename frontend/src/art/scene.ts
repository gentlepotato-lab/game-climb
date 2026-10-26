// 창밖 풍경과 버티컬 블라인드. 시안의 플레이 화면을 그대로 옮긴 것이다.
// 하루(아침, 낮, 오후, 저녁, 밤, 새벽)는 CSS 애니메이션이 돌린다. 한 바퀴 길이는 styles.css의 --day다.

const TIMES: Array<[string, string]> = [
  ['아침', 'linear-gradient(180deg, #8ec5e8 0%, #cfe6f2 42%, #fde9c8 67%, #e9d9c0 68%, #6f8fa8 100%)'],
  ['낮', 'linear-gradient(180deg, #4f9fe0 0%, #9cd0f2 42%, #e4f3fb 67%, #bcd8e6 68%, #3f6f96 100%)'],
  ['오후', 'linear-gradient(180deg, #6aa6d8 0%, #f2d7a4 46%, #ffd08a 67%, #f0c48c 68%, #4c5f86 100%)'],
  ['저녁', 'linear-gradient(180deg, #2d2b5c 0%, #6b4685 25%, #d0708a 43%, #f6a66c 55%, #ffd59a 67%, #e6936e 68%, #9b5c7d 78%, #2e2a4e 100%)'],
  ['밤', 'linear-gradient(180deg, #0b0e2c 0%, #1a1f4c 42%, #33305e 67%, #2a2d55 68%, #0c0e26 100%)'],
  ['새벽', 'linear-gradient(180deg, #2a3466 0%, #8a7fb0 42%, #f3c2b8 67%, #c7a7b4 68%, #2c3560 100%)']
];

// 여섯 장이 차례로 떠오르도록 한 장씩 1/6 바퀴씩 앞당긴다.
const delay = (i: number) => (i === 0 ? '0s' : `calc(var(--day) * ${-(6 - i) / 6})`);

export const skyLayers = () =>
  `<div class="sky" style="background: ${TIMES[5][1]}"></div>` +
  TIMES.map(([, bg], i) => `<div class="sky tod" style="animation-delay: ${delay(i)}; background: ${bg}"></div>`).join('');

export const timeLabels = () =>
  TIMES.map(([name], i) => `<span class="tod-label" style="animation-delay: ${delay(i)}">${name}</span>`).join('');

const windowsLit = [
  [153, 468], [158, 478], [171, 458], [171, 472], [186, 476], [194, 484], [265, 464],
  [281, 450], [281, 470], [296, 474], [305, 482], [319, 468], [108, 480]
].map(([x, y]) => `<rect x="${x}" y="${y}" width="2" height="2"/>`).join('');

export const skyline = () => `<svg class="skyline" viewBox="0 0 340 740" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
<g class="nightsky"><circle cx="40" cy="80" r="1.2" fill="#fff"/><circle cx="120" cy="60" r="1" fill="#fff"/><circle cx="210" cy="110" r="1.4" fill="#fff"/><circle cx="290" cy="70" r="1" fill="#fff"/><circle cx="160" cy="180" r="1.1" fill="#fff"/><circle cx="70" cy="230" r="1" fill="#fff"/><circle cx="260" cy="210" r="1.2" fill="#fff"/><circle cx="96" cy="150" r="16" fill="#fbf3d6"/><circle cx="102" cy="146" r="14" fill="#1a1f4c" opacity=".9"/></g>
<g class="sun"><circle cx="236" cy="462" r="150" fill="url(#sunGlow)"/><circle cx="236" cy="468" r="30" fill="#ffe2a2"/></g>
<g class="drift"><ellipse cx="90" cy="300" rx="70" ry="9" fill="#f7b1a2" opacity=".35"/><ellipse cx="250" cy="250" rx="54" ry="7" fill="#e795a6" opacity=".3"/><ellipse cx="180" cy="380" rx="80" ry="6" fill="#ffc9a0" opacity=".35"/></g>
<path class="bld" d="M0 486 Q30 450 66 458 Q96 440 128 462 Q150 472 172 480 L172 502 L0 502 Z" opacity=".75"/>
<g class="bld"><rect x="63" y="408" width="3.4" height="44"/><rect x="58.5" y="418" width="12.5" height="6" rx="3"/><rect x="64.4" y="394" width="1.2" height="16"/></g>
<g class="bld" opacity=".9"><rect x="150" y="462" width="14" height="38"/><rect x="168" y="450" width="10" height="50"/><rect x="182" y="468" width="18" height="32"/><rect x="262" y="456" width="12" height="44"/><rect x="278" y="440" width="9" height="60"/><rect x="290" y="466" width="22" height="34"/><rect x="316" y="458" width="12" height="42"/><rect x="104" y="472" width="16" height="28"/></g>
<g class="lights" fill="#ffd27a"><circle cx="64.7" cy="421" r="1.6"/>${windowsLit}</g>
<g class="sun" fill="#ffe2a2"><rect class="shimmer" x="214" y="510" width="44" height="2.4" rx="1.2"/><rect class="shimmer" x="222" y="524" width="30" height="2" rx="1" style="animation-delay: -.7s"/><rect class="shimmer" x="206" y="540" width="56" height="2" rx="1" style="animation-delay: -1.4s"/></g>
<rect class="brgF" x="0" y="504" width="340" height="5"/>
<path class="brgS" d="M0 522 Q24 504 48 522 Q72 504 96 522 Q120 504 144 522 Q168 504 192 522 Q216 504 240 522 Q264 504 288 522 Q312 504 336 522" stroke-width="3" fill="none"/>
</svg>`;

// 창 바깥 풍경 전부. 블라인드 날개까지 한 겹으로 덮는다.
export const sceneMarkup = () => `${skyLayers()}${skyline()}<div class="vanes"></div>`;
