let last = performance.now();

function frame(now) {
  const delta = Math.floor(now - last);
  last = now;

  if (window.gameTick) {
    window.gameTick(delta);
  }

  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
