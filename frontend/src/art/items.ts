// 떨어지는 먹을 것과 청소기 그림.

// 울퉁불퉁한 덩어리. 타원 둘레의 점을 조금씩 들쭉날쭉하게 밀고 당긴 뒤 부드럽게 잇는다.
const lump = (rx: number, ry: number, bumps: number[]) => {
  const pts = bumps.map((b, i) => {
    const a = (i / bumps.length) * Math.PI * 2;
    return [Math.cos(a) * rx * b, Math.sin(a) * ry * b];
  });
  const mid = (i: number) => {
    const [x0, y0] = pts[i % pts.length];
    const [x1, y1] = pts[(i + 1) % pts.length];
    return `${((x0 + x1) / 2).toFixed(1)} ${((y0 + y1) / 2).toFixed(1)}`;
  };
  let d = `M${mid(0)}`;
  for (let i = 1; i <= pts.length; i += 1) {
    const [x, y] = pts[i % pts.length];
    d += ` Q${x.toFixed(1)} ${y.toFixed(1)} ${mid(i)}`;
  }
  return `${d} Z`;
};

const PELLETS: Array<[number, number, number, string, string, number[]]> = [
  [9, 15, -28, '#e59858', '#bf7434', [1, 0.86, 1.12, 0.9, 1.05, 0.82, 1.1, 0.94, 1.02]],
  [21, 10, 18, '#a6c27a', '#7b9a52', [0.92, 1.1, 0.84, 1.04, 0.95, 1.12, 0.86, 1.06, 0.9]],
  [19, 21, -8, '#e4c266', '#b9963c', [1.08, 0.9, 1, 0.84, 1.12, 0.92, 1.04, 0.86, 1]]
];

// 펠렛. 주황, 초록, 노랑 덩어리 셋이 모여 있다. 겉이 거칠어서 군데군데 패이고 점이 박혀 있다.
export const pelletSvg = (size = 30) =>
  `<svg viewBox="0 0 30 28" width="${size}" height="${Math.round((size * 28) / 30)}" aria-hidden="true">${PELLETS.map(
    ([x, y, r, color, edge, bumps]) =>
      `<g transform="translate(${x} ${y}) rotate(${r})"><path d="${lump(6, 4.9, bumps)}" fill="${edge}"/>` +
      `<path d="${lump(5.6, 4.4, bumps)}" fill="${color}" transform="translate(-0.4 -0.5)"/>` +
      `<path d="${lump(3.6, 2.6, bumps.slice(3).concat(bumps.slice(0, 3)))}" fill="#ffffff" opacity=".18" transform="translate(-1.2 -1.2)"/>` +
      `<path d="M-4 -1.6 q2 -1.4 4.5 -0.8" stroke="#ffffff" stroke-width="1.1" fill="none" stroke-linecap="round" opacity=".45"/>` +
      `<path d="M1.5 1.2 l1.6 0.9 M-2.6 1.8 l1 -0.7" stroke="${edge}" stroke-width=".7" stroke-linecap="round" opacity=".8"/>` +
      `<g fill="${edge}" opacity=".7"><circle cx="3.6" cy="-1.2" r=".55"/><circle cx="-1" cy="0.6" r=".45"/><circle cx="-4.2" cy="1" r=".4"/><circle cx="1" cy="-2.4" r=".35"/></g></g>`
  ).join('')}</svg>`;

const STRANDS: Array<[number, number, number, number]> = [
  // x, y, 길이, 기울기(도)
  [4, 7, 40, -4],
  [3, 10, 42, -2],
  [5, 13, 39, 1],
  [3, 16, 41, 3],
  [6, 19, 37, 5],
  [4, 11.5, 40, 0],
  [5, 15, 38, 2]
];

// 국수 생면. 삶지 않아 곧고 빳빳한 면 가닥이 한 다발로 겹친다. 끝이 반듯하게 잘려 있고 밀가루가 묻어 있다.
export const noodleSvg = (size = 46) => {
  const line = ([x, y, len, deg]: [number, number, number, number]) => {
    const r = (deg * Math.PI) / 180;
    return `M${x} ${y} l${(Math.cos(r) * len).toFixed(1)} ${(Math.sin(r) * len).toFixed(1)}`;
  };
  const d = STRANDS.map(line).join(' ');
  return (
    `<svg viewBox="0 0 48 26" width="${size}" height="${Math.round((size * 26) / 48)}" aria-hidden="true">` +
    `<path d="${d}" stroke="#c9a96c" stroke-width="3.4" fill="none"/>` +
    `<path d="${d}" stroke="#f4e4b6" stroke-width="2.2" fill="none"/>` +
    `<path d="M8 9.4 l14 -0.9 M10 15.8 l12 0.4" stroke="#fffaf0" stroke-width=".8" fill="none" opacity=".8"/>` +
    `<g fill="#ffffff" opacity=".85"><circle cx="12" cy="6" r=".8"/><circle cx="27" cy="12" r=".7"/><circle cx="36" cy="17" r=".9"/><circle cx="19" cy="20" r=".6"/><circle cx="41" cy="9" r=".6"/><circle cx="31" cy="22" r=".7"/></g>` +
    `</svg>`
  );
};

// 무선 청소기. 손이 위에서 손잡이를 쥐고, 긴 봉 끝의 바닥 솔이 아래를 본다.
// 몸통에는 먼지가 보이는 투명한 통이 있다. 팔은 오른쪽 위 화면 밖으로 이어진다.
// viewBox는 0 0 130 250이고, 바닥 솔 아래 가운데는 (60, 244)다.
export const vacuumSvg = (prefix: string, width = 78) => {
  const skin = '#f7d8c6';
  const edge = '#e0ab90';
  return (
    `<svg class="vacuum-art" viewBox="0 0 130 250" width="${width}" height="${Math.round((width * 250) / 130)}" aria-hidden="true" style="overflow: visible">` +
    `<defs><linearGradient id="${prefix}vSleeve" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#c9bce6"/><stop offset="1" stop-color="#a796d0"/></linearGradient>` +
    `<linearGradient id="${prefix}vBody" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#f7a789"/><stop offset=".55" stop-color="#ee8c6c"/><stop offset="1" stop-color="#d67455"/></linearGradient>` +
    `<linearGradient id="${prefix}vTube" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#eef1f4"/><stop offset=".45" stop-color="#cfd5dc"/><stop offset="1" stop-color="#a7afb9"/></linearGradient>` +
    `<linearGradient id="${prefix}vHead" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fbf7f1"/><stop offset="1" stop-color="#e5dccf"/></linearGradient></defs>` +
    // 팔
    `<path d="M150 -50 L94 8" stroke="url(#${prefix}vSleeve)" stroke-width="32" stroke-linecap="round" fill="none"/>` +
    `<path d="M94 8 L76 22" stroke="${edge}" stroke-width="22" stroke-linecap="round"/><path d="M94 8 L76 22" stroke="${skin}" stroke-width="20" stroke-linecap="round"/>` +
    // 손잡이
    `<path d="M50 52 L50 30 Q50 20 60 20 L74 20 Q82 20 80 30 L74 56" stroke="#5f5568" stroke-width="9" fill="none" stroke-linecap="round" stroke-linejoin="round"/>` +
    // 몸통과 투명 먼지 통
    `<rect x="40" y="46" width="40" height="30" rx="10" fill="url(#${prefix}vBody)" stroke="#c4664a" stroke-width="1.2"/>` +
    `<rect x="44" y="50" width="4" height="20" rx="2" fill="#ffffff" opacity=".5"/>` +
    `<rect x="42" y="74" width="36" height="38" rx="8" fill="#d8e9f0" fill-opacity=".8" stroke="#9fbccb" stroke-width="1.2"/>` +
    `<path d="M48 80 h24 M48 86 h24" stroke="#9fbccb" stroke-width="1" opacity=".7"/>` +
    `<g opacity=".85"><circle cx="52" cy="102" r="5" fill="#c9c1d6"/><circle cx="61" cy="105" r="4.5" fill="#d9d2e3"/><circle cx="69" cy="101" r="4" fill="#c9c1d6"/><circle cx="58" cy="97" r="3" fill="#e3dcea"/></g>` +
    `<rect x="46" y="76" width="3" height="30" rx="1.5" fill="#ffffff" opacity=".7"/>` +
    `<path d="M48 112 h24 l-4 8 h-16 z" fill="#5f5568"/>` +
    // 봉
    `<rect x="55" y="118" width="10" height="94" rx="4" fill="url(#${prefix}vTube)" stroke="#97a0ab" stroke-width="1"/>` +
    `<rect x="54" y="150" width="12" height="4" rx="2" fill="#97a0ab"/>` +
    // 바닥 솔
    `<circle cx="60" cy="216" r="7" fill="#5f5568"/>` +
    `<path d="M20 228 Q20 218 32 218 H88 Q100 218 100 228 V236 H20 Z" fill="url(#${prefix}vHead)" stroke="#c8bba9" stroke-width="1.2"/>` +
    `<rect x="26" y="221" width="40" height="3" rx="1.5" fill="#ee8c6c"/>` +
    `<rect x="18" y="235" width="84" height="7" rx="3" fill="#4d4456"/>` +
    `<path d="M24 242 v4 M30 242 v4 M36 242 v4 M42 242 v4 M48 242 v4 M54 242 v4 M60 242 v4 M66 242 v4 M72 242 v4 M78 242 v4 M84 242 v4 M90 242 v4 M96 242 v4" stroke="#6b6175" stroke-width="2" stroke-linecap="round"/>` +
    `<circle cx="96" cy="229" r="2" fill="#bfe7c4"/>` +
    // 손. 손잡이 위를 감싸 쥔다.
    `<ellipse cx="68" cy="22" rx="14" ry="10" fill="${edge}"/>` +
    `<path d="M58 27 L62 34 M65 28 L68 35 M72 27 L74 33" stroke="${edge}" stroke-width="8.5" stroke-linecap="round"/>` +
    `<ellipse cx="68" cy="22" rx="13" ry="9" fill="${skin}"/>` +
    `<path d="M58 27 L62 34 M65 28 L68 35 M72 27 L74 33" stroke="${skin}" stroke-width="6.5" stroke-linecap="round"/>` +
    `</svg>`
  );
};
