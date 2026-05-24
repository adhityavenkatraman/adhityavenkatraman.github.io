(function () {
  'use strict';

  const canvas = document.getElementById('bg-canvas');
  const ctx    = canvas.getContext('2d');

  const CONNECT_DIST = 125;
  const REPEL_RADIUS = 175;
  const REPEL_FORCE  = 0.14;
  const MAX_SPEED    = 1.1;
  const DAMPING      = 0.984;

  // muted palette — mostly beige/grey, accent touches of color
  const COLORS = [
    { c: '#9BA89A', weight: 12 },
    { c: '#B8AE94', weight: 12 },
    { c: '#C4BBAA', weight: 10 },
    { c: '#7A8C5A', weight: 8  },
    { c: '#5C6B3E', weight: 5  },
    { c: '#A8B88A', weight: 7  },
    { c: '#8B7355', weight: 6  },
    { c: '#6B8A7A', weight: 4  },
    { c: '#8B6B6B', weight: 3  },
    { c: '#7B8B9A', weight: 4  },
    { c: '#A89B6A', weight: 4  },
    { c: '#697A5A', weight: 3  },
  ];

  function pickColor() {
    const total = COLORS.reduce((s, c) => s + c.weight, 0);
    let r = Math.random() * total;
    for (const c of COLORS) { r -= c.weight; if (r <= 0) return c.c; }
    return COLORS[0].c;
  }

  let W, H, nodes, animId;
  let mouseX = null, mouseY = null;

  function resize() {
    W = canvas.width  = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
    if (!nodes) initNodes();
  }

  function initNodes() {
    nodes = Array.from({ length: 110 }, () => ({
      x:     Math.random() * W,
      y:     Math.random() * H,
      vx:    (Math.random() - 0.5) * 0.45,
      vy:    (Math.random() - 0.5) * 0.3,
      r:     Math.random() * 2.6 + 0.5,
      alpha: Math.random() * 0.5 + 0.08,
      color: pickColor(),
    }));
  }

  let lineOff = 0;
  function drawDriftLines() {
    ctx.lineWidth = 0.7;
    for (let i = 1; i <= 4; i++) {
      const baseY = (H / 5) * i;
      ctx.beginPath();
      ctx.globalAlpha = 0.035;
      ctx.strokeStyle = '#7A8C5A';
      for (let s = 0; s <= 12; s++) {
        const x = (s / 12) * W;
        const y = baseY + Math.sin((s / 12) * Math.PI * 2 + lineOff + i) * 18;
        s === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
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
          ctx.beginPath();
          ctx.strokeStyle = '#9BA89A';
          ctx.globalAlpha = (1 - dist / CONNECT_DIST) * 0.13;
          ctx.lineWidth   = 0.5;
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
      ctx.fillStyle   = n.color;
      ctx.globalAlpha = n.alpha;
      ctx.fill();
    });
    ctx.globalAlpha = 1;
  }

  function tick() {
    ctx.clearRect(0, 0, W, H);
    lineOff += 0.004;
    drawDriftLines();
    drawConnections();
    drawNodes();

    nodes.forEach(n => {
      if (mouseX !== null) {
        const dx   = n.x - mouseX;
        const dy   = n.y - mouseY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < REPEL_RADIUS && dist > 0) {
          const f = (1 - dist / REPEL_RADIUS) * REPEL_FORCE;
          n.vx += (dx / dist) * f;
          n.vy += (dy / dist) * f;
        }
      }
      n.vx *= DAMPING;
      n.vy *= DAMPING;
      const spd = Math.sqrt(n.vx * n.vx + n.vy * n.vy);
      if (spd > MAX_SPEED) { n.vx = (n.vx / spd) * MAX_SPEED; n.vy = (n.vy / spd) * MAX_SPEED; }
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


  // timeline — fade in on scroll down, fade out when scrolled back above
  const flowNodes = document.querySelectorAll('.flow-node');
  const flowObs   = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        const delay = parseInt(e.target.dataset.index || '0') * 140;
        setTimeout(() => e.target.classList.add('visible'), delay);
      } else {
        e.target.classList.remove('visible');
      }
    });
  }, { threshold: 0.15 });
  flowNodes.forEach(n => flowObs.observe(n));


  // pub cards — same repeat-on-scroll behavior
  const pubCards = document.querySelectorAll('.pub-card');
  pubCards.forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(18px)';
    el.style.transition = 'opacity 0.65s ease, transform 0.65s ease';
  });

  const pubObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.style.opacity = '1';
        e.target.style.transform = 'translateY(0)';
      } else {
        e.target.style.opacity = '0';
        e.target.style.transform = 'translateY(18px)';
      }
    });
  }, { threshold: 0.1 });
  pubCards.forEach(el => pubObs.observe(el));


  // photo scroller
  const scroller  = document.getElementById('photoScroller');
  const dotsWrap  = document.getElementById('scrollerDots');
  const prevBtn   = document.querySelector('.scroller-prev');
  const nextBtn   = document.querySelector('.scroller-next');
  const slides    = document.querySelectorAll('.photo-slide');
  let current     = 0;

  slides.forEach((_, i) => {
    const d = document.createElement('button');
    d.className = 'scroller-dot' + (i === 0 ? ' active' : '');
    d.addEventListener('click', () => goTo(i));
    dotsWrap.appendChild(d);
  });

  function goTo(idx) {
    current = (idx + slides.length) % slides.length;
    scroller.scrollTo({ left: current * scroller.offsetWidth, behavior: 'smooth' });
    document.querySelectorAll('.scroller-dot').forEach((d, i) => {
      d.classList.toggle('active', i === current);
    });
  }

  prevBtn.addEventListener('click', () => goTo(current - 1));
  nextBtn.addEventListener('click', () => goTo(current + 1));

  // sync dots when user swipes
  scroller.addEventListener('scroll', () => {
    const idx = Math.round(scroller.scrollLeft / scroller.offsetWidth);
    if (idx !== current) {
      current = idx;
      document.querySelectorAll('.scroller-dot').forEach((d, i) => {
        d.classList.toggle('active', i === current);
      });
    }
  }, { passive: true });

})();
