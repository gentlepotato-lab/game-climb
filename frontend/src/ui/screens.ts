type PanelName = 'start' | 'result' | null;

const root = document.body;
const panels = {
  start: document.getElementById('start-panel'),
  result: document.getElementById('result-panel')
};

export const showPanel = (panel: PanelName) => {
  Object.values(panels).forEach((node) => node?.classList.add('hidden'));

  if (panel && panels[panel]) {
    panels[panel]?.classList.remove('hidden');
    root.classList.toggle('is-playing', panel === 'result');
  } else {
    root.classList.add('is-playing');
  }
};
