// 새 한 마리의 SVG를 조립한다. 그림 조각은 defs.ts의 symbol이다(viewBox 0 0 120 160).
// 표정, 방향, 효과는 바깥 svg의 data-face, data-view, data-fx로 갈아 끼운다(styles.css).

const use = (id: string) => `<use href="#${id}" width="120" height="160"/>`;

const blink = (open: string, closed: string) =>
  `<g class="blinkO">${use(open)}</g><g class="blinkC">${use(closed)}</g>`;

// 구슬 체인에 매달린 새. 체인은 x=20에 있고, 발이 y=122 언저리를 쥔다.
// 3/4 모습과 정면을 둘 다 담는다.
export const hangingBird = (prefix: 'mg' | 'bo') => {
  const surprise = prefix === 'mg' ? 'qSurpriseMg' : 'qSurpriseBo';
  const effort = prefix === 'mg' ? 'qEffortMg' : 'qEffortBo';
  return `
<g class="view-front"><g transform="translate(-40 -24)">${use(prefix + 'FBody')}${use(prefix + 'FWL')}${use(prefix + 'FWR')}${use(prefix + 'FFace')}${blink(prefix + 'FEyes', 'fBlink')}</g></g>
<g class="view-side"><g class="torso">
${use(prefix + 'Tail')}${use(prefix + 'Feet')}${use(prefix + 'Body')}
<g class="wing">${use(prefix + 'Wing')}</g>
${use(prefix + 'Cheek')}${use(prefix + 'Beak')}
<g class="face face-open">${blink(prefix + 'Eye', 'qBlink')}</g>
<g class="face face-effort">${use(effort)}</g>
<g class="face face-happy">${use('qHappy')}<g transform="translate(26 58) rotate(-70)"><use href="#seedS" width="7" height="11"/></g></g>
<g class="face face-hurt">${use('qHurt')}</g>
<g class="face face-surprise">${use(surprise)}</g>
<g class="face face-glare">${use(prefix + 'Eye')}${use('qBrow')}</g>
<g class="face face-derpy"><g transform="translate(1.2 -1.6)">${use(prefix + 'Eye')}</g></g>
</g></g>
<g class="fx fx-dust"><circle class="pop" cx="42" cy="34" r="12" fill="#e9e3f0" opacity=".9"/><circle class="pop" cx="72" cy="28" r="9" fill="#ddd6e8"/></g>
<g class="fx fx-peck"><circle class="pop" cx="20" cy="56" r="10" fill="#ece6f2"/><path d="M12 48 l-6 -4 M12 64 l-7 3 M10 56 l-8 0" stroke="#fff8f0" stroke-width="1.6" stroke-linecap="round"/></g>`;
};

// 고르는 화면의 정면 모습. 예쁜 짓은 styles.css의 .pose-mg, .pose-bo가 맡는다.
export const posingBird = (prefix: 'mg' | 'bo') => {
  const tongue = prefix === 'bo' ? `<g class="tongue">${use('fTongue')}</g>` : '';
  return `<svg viewBox="0 0 120 160" aria-hidden="true"><g class="tilt">
${use(prefix + 'FBody')}<g class="fwl">${use(prefix + 'FWL')}</g><g class="fwr">${use(prefix + 'FWR')}</g>
${tongue}${use(prefix + 'FFace')}<g class="eyesO">${blink(prefix + 'FEyes', 'fBlink')}</g><g class="eyesH">${use('fHappy')}</g>
</g></svg>`;
};
