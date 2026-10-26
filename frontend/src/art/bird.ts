// 새 한 마리의 SVG를 조립한다. 그림 조각은 defs.ts의 symbol이다.
// 표정, 방향, 효과는 바깥 svg의 data-face, data-view, data-fx로 갈아 끼운다(styles.css).

const use = (id: string) => `<use href="#${id}" width="120" height="150"/>`;

const blink = (open: string, closed: string) =>
  `<g class="blinkO">${use(open)}</g><g class="blinkC">${use(closed)}</g>`;

// 줄에 매달린 새. 옆모습과 정면 둘 다 담는다.
export const hangingBird = (prefix: 'mg' | 'bo') => {
  const eyeOpen = prefix === 'mg' ? 'eyeOpenMg' : 'eyeOpenBo';
  const eyesFront = prefix === 'mg' ? 'eyesFrontMg' : 'eyesFrontBo';
  return `
<g class="view-front"><g transform="translate(-20 -14)">${use(prefix + 'FWL')}${use(prefix + 'FWR')}${use(prefix + 'FrontS')}<g class="tilt">${use(prefix + 'FaceS')}${blink(eyesFront, 'eyesFrontClosed')}</g></g></g>
<g class="view-side"><g class="torso">
<g class="wing">${use(prefix + 'UnderS')}<g class="outer">${use(prefix + 'OuterS')}</g></g>
${use(prefix + 'TorsoS')}${use('toes')}
<g class="head">${use(prefix + 'HeadS')}
<g class="face face-open">${blink(eyeOpen, 'eyeClosedSide')}</g>
<g class="face face-effort">${use('eyeEffort')}</g>
<g class="face face-happy">${use('eyeHappy')}<g transform="translate(28 50) rotate(-70)"><use href="#seedS" width="8" height="13"/></g></g>
<g class="face face-hurt">${use('eyeHurt')}</g>
<g class="face face-surprise">${use('eyeSurprise')}</g>
<g class="face face-glare">${use('eyeGlare')}</g>
<g class="face face-derpy">${use('eyeDerpy')}</g>
</g></g></g>
<g class="fx fx-dust"><circle class="pop" cx="34" cy="40" r="12" fill="#e9e3f0" opacity=".9"/><circle class="pop" cx="64" cy="34" r="9" fill="#ddd6e8"/></g>
<g class="fx fx-peck"><circle class="pop" cx="20" cy="44" r="10" fill="#ece6f2"/><path d="M12 36 l-6 -4 M12 52 l-7 3 M10 44 l-8 0" stroke="#fff8f0" stroke-width="1.6" stroke-linecap="round"/></g>`;
};

// 고르는 화면의 정면 모습. 예쁜 짓은 styles.css의 .pose-mg, .pose-bo가 맡는다.
export const posingBird = (prefix: 'mg' | 'bo') => {
  const eyesFront = prefix === 'mg' ? 'eyesFrontMg' : 'eyesFrontBo';
  const tongue = prefix === 'bo' ? '<ellipse class="tongue" cx="60" cy="64.5" rx="2.4" ry="2" fill="#f08b9b"/>' : '';
  return `<svg viewBox="20 16 80 128" aria-hidden="true">
<g class="fwl">${use(prefix + 'FWL')}</g><g class="fwr">${use(prefix + 'FWR')}</g>${use(prefix + 'FrontS')}
<g class="tilt">${tongue}${use(prefix + 'FaceS')}<g class="eyesO">${blink(eyesFront, 'eyesFrontClosed')}</g><g class="eyesH">${use('eyesFrontHappy')}</g></g>
</svg>`;
};
