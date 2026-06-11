(() => {
  const menu = document.querySelector('[data-mobile-menu]');
  if (menu) menu.addEventListener('click', () => {
    const nav = document.querySelector('.global-nav');
    if (!nav) return;
    nav.style.display = nav.style.display === 'flex' ? 'none' : 'flex';
    nav.style.position = 'absolute'; nav.style.top = '50px'; nav.style.left = '14px'; nav.style.right = '14px';
    nav.style.padding = '12px'; nav.style.background = '#07111f'; nav.style.border = '1px solid rgba(255,255,255,.17)';
  });

  document.querySelectorAll('[data-toggle-group]').forEach(group => {
    group.querySelectorAll('button').forEach(btn => btn.addEventListener('click', () => {
      group.querySelectorAll('button').forEach(x => x.classList.remove('active'));
      btn.classList.add('active');
      const target = group.getAttribute('data-target');
      if (target) document.querySelectorAll(`[data-mode-target="${target}"]`).forEach(el => {
        el.setAttribute('data-mode', btn.dataset.value || btn.textContent.trim().toLowerCase());
      });
    }));
  });

  const heatmap = document.querySelector('.heatmap-grid');
  if (heatmap) {
    let scale = 1, x = 0, y = 0, dragging = false, moved = false, sx = 0, sy = 0;
    const apply = () => heatmap.style.transform = `translate(${x}px,${y}px) scale(${scale})`;
    document.querySelectorAll('[data-zoom]').forEach(btn => btn.addEventListener('click', () => {
      const z = btn.getAttribute('data-zoom');
      if (z === 'in') scale = Math.min(2.5, scale + .2);
      if (z === 'out') scale = Math.max(1, scale - .2);
      if (z === 'reset') { scale = 1; x = 0; y = 0; }
      apply();
    }));
    heatmap.parentElement.addEventListener('pointerdown', e => { dragging = true; moved = false; sx = e.clientX - x; sy = e.clientY - y; });
    window.addEventListener('pointermove', e => {
      if (!dragging || scale === 1) return;
      const nx = e.clientX - sx, ny = e.clientY - sy;
      if (Math.abs(nx - x) + Math.abs(ny - y) > 3) moved = true;
      x = nx; y = ny;
      const lim = 180*(scale-1); x=Math.max(-lim,Math.min(lim,x)); y=Math.max(-lim,Math.min(lim,y)); apply();
    });
    window.addEventListener('pointerup', () => dragging = false);
    document.querySelectorAll('.tile').forEach(tile => tile.addEventListener('click', () => {
      if (moved) return;
      document.querySelectorAll('.tile').forEach(t => t.classList.remove('selected'));
      tile.classList.add('selected');
      const name = tile.dataset.name, viewers = tile.dataset.viewers, momentum = tile.dataset.momentum;
      document.querySelectorAll('[data-selected-name]').forEach(x => x.textContent = name);
      document.querySelectorAll('[data-selected-viewers]').forEach(x => x.textContent = viewers);
      document.querySelectorAll('[data-selected-momentum]').forEach(x => x.textContent = momentum);
    }));
  }

  document.querySelectorAll('[data-copy]').forEach(btn => btn.addEventListener('click', async () => {
    const text = btn.getAttribute('data-copy') || '';
    try { await navigator.clipboard.writeText(text); btn.textContent = 'Copied'; }
    catch { btn.textContent = 'Copy unavailable'; }
    setTimeout(() => btn.textContent = 'Copy summary', 1400);
  }));
})();
