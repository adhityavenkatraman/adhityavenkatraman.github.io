(function () {
  'use strict';
  const canvas = document.getElementById('bg-canvas');
  const ctx    = canvas.getContext('2d');

  const OLIVE      = '#7A8C5A';
  const OLIVE_DARK = '#5C6B3E';
  const NODE_COUNT  = 85;
  const CONNECT_DIST = 130;
  const REPEL_RADIUS = 180;
  const REPEL_FORCE  = 0.15;
  const MAX_SPEED    = 1.2;
  const DAMPING      = 0.985;

  let W, H, nodes, animId;
  let mouseX = null, mouseY = null;

  function resize() {
    W = canvas.width  = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
    if (!nodes) initNodes();
  }

  function initNodes() {
    nodes = Array.from({ length: NODE_COUNT }, () => ({
      x:  Math.random() * W,
      y:  Math.random() * H,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.35,
      r:  Math.random() * 2 + 0.8,
      alpha: Math.random() * 0.35 + 0.1,
    }));
  }

  let lineOffset = 0;
  function drawDriftLines() {
    const count = 4;
    const gap   = H / (count + 1);
    ctx.globalAlpha = 0.04;
    ctx.strokeStyle = OLIVE;
    ctx.lineWidth   = 0.8;
    for (let i = 1; i <= count; i++) {
      const baseY = gap * i;
      ctx.beginPath();
      for (let s = 0; s <= 10; s++) {
        const x    = (s / 10) * W;
        const wave = Math.sin((s / 10) * Math.PI * 2 + lineOffset + i) * 20;
        s === 0 ? ctx.moveTo(x, baseY + wave) : ctx.lineTo(x, baseY + wave);
      }
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  function drawConnections() {
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx   = nodes[i].x - nodes[j].x;
        const dy   = nodes[i].y - nodes[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < CONNECT_DIST) {
          const alpha = (1 - dist / CONNECT_DIST) * 0.15;
          ctx.beginPath();
          ctx.strokeStyle  = OLIVE;
          ctx.globalAlpha  = alpha;
          ctx.lineWidth    = 0.6;
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(nodes[j].x, nodes[j].y);
          ctx.stroke();
        }
      }
    }
    ctx.globalAlpha = 1;
  }

  function drawNodes() {
    nodes.forEach(n => {
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fillStyle   = OLIVE_DARK;
      ctx.globalAlpha = n.alpha;
      ctx.fill();
    });
    ctx.globalAlpha = 1;
  }

  function clampSpeed(n) {
    const speed = Math.sqrt(n.vx * n.vx + n.vy * n.vy);
    if (speed > MAX_SPEED) {
      n.vx = (n.vx / speed) * MAX_SPEED;
      n.vy = (n.vy / speed) * MAX_SPEED;
    }
  }

  function tick() {
    ctx.clearRect(0, 0, W, H);
    lineOffset += 0.004;

    drawDriftLines();
    drawConnections();
    drawNodes();

    nodes.forEach(n => {
      if (mouseX !== null) {
        const dx   = n.x - mouseX;
        const dy   = n.y - mouseY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < REPEL_RADIUS && dist > 0) {
          const force = (1 - dist / REPEL_RADIUS) * REPEL_FORCE;
          n.vx += (dx / dist) * force;
          n.vy += (dy / dist) * force;
        }
      }

      n.vx *= DAMPING;
      n.vy *= DAMPING;
      clampSpeed(n);
      n.x += n.vx;
      n.y += n.vy;

      if (n.x < -20)    n.x = W + 20;
      if (n.x > W + 20) n.x = -20;
      if (n.y < -20)    n.y = H + 20;
      if (n.y > H + 20) n.y = -20;
    });

    animId = requestAnimationFrame(tick);
  }

  window.addEventListener('mousemove', e => { mouseX = e.clientX; mouseY = e.clientY; });
  window.addEventListener('mouseleave', () => { mouseX = null; mouseY = null; });

  const heroEl = document.querySelector('.hero');
  new IntersectionObserver(entries => {
    if (entries[0].isIntersecting) {
      if (!animId) animId = requestAnimationFrame(tick);
    } else {
      cancelAnimationFrame(animId);
      animId = null;
    }
  }).observe(heroEl);

  window.addEventListener('resize', () => {
    cancelAnimationFrame(animId);
    animId = null;
    resize();
    animId = requestAnimationFrame(tick);
  });

  resize();
  animId = requestAnimationFrame(tick);


  const flowNodes = document.querySelectorAll('.flow-node');
  const flowObs   = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        const idx   = parseInt(e.target.dataset.index || '0');
        const delay = idx * 140;
        setTimeout(() => e.target.classList.add('visible'), delay);
        flowObs.unobserve(e.target);
      }
    });
  }, { threshold: 0.15 });
  flowNodes.forEach(n => flowObs.observe(n));


  const revealEls = document.querySelectorAll('.pub-card, .photo-tabs');
  revealEls.forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(18px)';
    el.style.transition = 'opacity 0.65s ease, transform 0.65s ease';
  });

  const revealObs = new IntersectionObserver(entries => {
    entries.forEach((e, i) => {
      if (e.isIntersecting) {
        setTimeout(() => {
          e.target.style.opacity = '1';
          e.target.style.transform = 'translateY(0)';
        }, i * 80);
        revealObs.unobserve(e.target);
      }
    });
  }, { threshold: 0.1 });
  revealEls.forEach(el => revealObs.observe(el));


  const tabBtns   = document.querySelectorAll('.tab-btn');
  const tabPanels = document.querySelectorAll('.tab-panel');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = parseInt(btn.dataset.tab);

      tabBtns.forEach(b => b.classList.remove('active'));
      tabPanels.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      document.querySelector(`.tab-panel[data-panel="${target}"]`).classList.add('active');
    });
  });

})();
