export const virtualInput = {
  left: false,
  right: false,
  burstQueued: false
};

export const setLeft = (down: boolean) => {
  virtualInput.left = down;
  if (down) virtualInput.right = false;
};

export const setRight = (down: boolean) => {
  virtualInput.right = down;
  if (down) virtualInput.left = false;
};

export const queueBurst = () => {
  virtualInput.burstQueued = true;
};

export const consumeBurst = () => {
  const queued = virtualInput.burstQueued;
  virtualInput.burstQueued = false;
  return queued;
};
