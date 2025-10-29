document.addEventListener('DOMContentLoaded', () => {
  const car  = document.querySelector('.car');
  const vp   = car.querySelector('.vp');
  const btns = car.querySelectorAll('.nav');

  let timer = null;
  const pxPerTick = 5;   // velocidad (más fluido)
  const tickMs    = 16;  // ~60 FPS

  const start = (dir) => {
    stop();
    timer = setInterval(() => {
      const max = vp.scrollWidth - vp.clientWidth;
      let next  = vp.scrollLeft + dir * pxPerTick;

      // wrap-around suave
      if (next >= max - 2) next = 0;
      if (next <= 2) next = max;

      vp.scrollLeft = next;
    }, tickMs);
  };

  const stop = () => {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  };

  btns.forEach(b => {
    const dir = +b.dataset.dir;
    b.addEventListener('mouseenter', () => start(dir));
    b.addEventListener('mouseleave', stop);
  });

  car.addEventListener('mouseleave', stop);
});
