type PanelName = 'start' | 'menu' | 'result' | null;

const overlay = document.getElementById('overlay');
const root = document.body;
const panels = {
  start: document.getElementById('start-panel'),
  menu: document.getElementById('menu-panel'),
  result: document.getElementById('result-panel')
};

export const showPanel = (panel: PanelName) => {
  Object.values(panels).forEach((node) => node?.classList.add('hidden'));

  if (panel && panels[panel]) {
    overlay?.classList.remove('is-playing');
    root.classList.remove('is-playing');
    panels[panel]?.classList.remove('hidden');
  } else {
    overlay?.classList.add('is-playing');
    root.classList.add('is-playing');
  }
};
