(function () {
  'use strict';

change   // ─── PARTICLE CANVAS ───────────────────────────────────────────────────────

  const canvas = document.getElementById('bg-canvas');
  const ctx    = canvas.getContext('2d');

  const CONNECT_DIST = 125;
  const REPEL_RADIUS = 175;
  const REPEL_FORCE  = 0.14;
  const MAX_SPEED    = 1.1;
  const DAMPING      = 0.984;

  const COLORS = [
    { c: '#9BA89A', weight: 12 }, { c: '#B8AE94', weight: 12 },
    { c: '#C4BBAA', weight: 10 }, { c: '#7A8C5A', weight: 8  },
    { c: '#5C6B3E', weight: 5  }, { c: '#A8B88A', weight: 7  },
    { c: '#8B7355', weight: 6  }, { c: '#6B8A7A', weight: 4  },
    { c: '#8B6B6B', weight: 3  }, { c: '#7B8B9A', weight: 4  },
    { c: '#A89B6A', weight: 4  }, { c: '#697A5A', weight: 3  },
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
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.45, vy: (Math.random() - 0.5) * 0.3,
      r: Math.random() * 2.6 + 0.5,
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
        const dx = nodes[i].x - nodes[j].x, dy = nodes[i].y - nodes[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < CONNECT_DIST) {
          ctx.beginPath();
          ctx.strokeStyle = '#9BA89A';
          ctx.globalAlpha = (1 - dist / CONNECT_DIST) * 0.13;
          ctx.lineWidth = 0.5;
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
      ctx.fillStyle = n.color;
      ctx.globalAlpha = n.alpha;
      ctx.fill();
    });
    ctx.globalAlpha = 1;
  }

  function particleTick() {
    ctx.clearRect(0, 0, W, H);
    lineOff += 0.004;
    drawDriftLines();
    drawConnections();
    drawNodes();
    nodes.forEach(n => {
      if (mouseX !== null) {
        const dx = n.x - mouseX, dy = n.y - mouseY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < REPEL_RADIUS && dist > 0) {
          const f = (1 - dist / REPEL_RADIUS) * REPEL_FORCE;
          n.vx += (dx / dist) * f;
          n.vy += (dy / dist) * f;
        }
      }
      n.vx *= DAMPING; n.vy *= DAMPING;
      const spd = Math.sqrt(n.vx * n.vx + n.vy * n.vy);
      if (spd > MAX_SPEED) { n.vx = (n.vx / spd) * MAX_SPEED; n.vy = (n.vy / spd) * MAX_SPEED; }
      n.x += n.vx; n.y += n.vy;
      if (n.x < -20) n.x = W + 20; if (n.x > W + 20) n.x = -20;
      if (n.y < -20) n.y = H + 20; if (n.y > H + 20) n.y = -20;
    });
    animId = requestAnimationFrame(particleTick);
  }

  window.addEventListener('mousemove', e => { mouseX = e.clientX; mouseY = e.clientY; });
  window.addEventListener('mouseleave', () => { mouseX = null; mouseY = null; });

  const heroEl = document.querySelector('.hero');
  new IntersectionObserver(entries => {
    if (entries[0].isIntersecting) { if (!animId) animId = requestAnimationFrame(particleTick); }
    else { cancelAnimationFrame(animId); animId = null; }
  }).observe(heroEl);

  window.addEventListener('resize', () => {
    cancelAnimationFrame(animId); animId = null;
    resize(); animId = requestAnimationFrame(particleTick);
  });

  resize();
  animId = requestAnimationFrame(particleTick);


  // ─── TIMELINE SCROLL REVEAL ────────────────────────────────────────────────

  const flowNodes = document.querySelectorAll('.flow-node');
  const timelineObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        const delay = parseInt(e.target.dataset.index || '0') * 140;
        setTimeout(() => e.target.classList.add('visible'), delay);
      } else {
        e.target.classList.remove('visible');
      }
    });
  }, { threshold: 0.15 });
  flowNodes.forEach(n => timelineObs.observe(n));

  const pubObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      e.target.style.opacity    = e.isIntersecting ? '1' : '0';
      e.target.style.transform  = e.isIntersecting ? 'translateY(0)' : 'translateY(18px)';
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.pub-card').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(18px)';
    el.style.transition = 'opacity 0.65s ease, transform 0.65s ease';
    pubObs.observe(el);
  });


  // ─── GLOBE ────────────────────────────────────────────────────────────────
  //
  // Add your locations here. Each entry has:
  //   name   — shown in the panel
  //   lat    — latitude  (positive = north)
  //   lon    — longitude (positive = east)
  //   photos — array of image paths from materials/images/
  //
  const LOCATIONS = [
    {
      name: 'New York',
      lat: 40.71, lon: -74.01,
      photos: ['materials/images/nyc1.jpg', 'materials/images/nyc2.jpg'],
    },
    {
      name: 'San Francisco',
      lat: 37.77, lon: -122.42,
      photos: ['materials/images/sf1.jpg'],
    },
    {
      name: 'Stanford',
      lat: 37.43, lon: -122.17,
      photos: ['materials/images/stanford1.jpg', 'materials/images/stanford2.jpg'],
    },
    {
      name: 'London',
      lat: 51.51, lon: -0.13,
      photos: ['materials/images/london1.jpg'],
    },
    {
      name: 'Tokyo',
      lat: 35.68, lon: 139.69,
      photos: ['materials/images/tokyo1.jpg', 'materials/images/tokyo2.jpg'],
    },
    {
      name: 'Mumbai',
      lat: 19.08, lon: 72.88,
      photos: ['materials/images/mumbai1.jpg'],
    },
    {
      name: 'Paris',
      lat: 48.85, lon: 2.35,
      photos: ['materials/images/paris1.jpg'],
    },
  ];

  const globeCanvas = document.getElementById('globe');
  if (!globeCanvas) return;
  const gc = globeCanvas.getContext('2d');

  // rotation state
  let rotX = 0.35;   // tilt (radians, 0 = equator facing up)
  let rotY = -0.3;   // spin (radians)
  let isDragging = false;
  let lastMX = 0, lastMY = 0;
  let spinV = 0.002; // auto-spin velocity
  let dragVX = 0, dragVY = 0;

  // panel state
  const panel        = document.getElementById('photoPanel');
  const panelEmpty   = document.getElementById('photoPanelEmpty');
  const panelContent = document.getElementById('photoPanelContent');
  const panelClose   = document.getElementById('photoPanelClose');
  const panelImg     = document.getElementById('panelImg');
  const panelPlace   = document.getElementById('panelPlace');
  const panelThumbs  = document.getElementById('panelThumbs');
  let activeLoc      = null;
  let activePhotoIdx = 0;

  function openPanel(loc) {
    activeLoc = loc;
    activePhotoIdx = 0;
    panelPlace.textContent = loc.name;
    panelImg.src = loc.photos[0];

    panelThumbs.innerHTML = '';
    loc.photos.forEach((src, i) => {
      const img = document.createElement('img');
      img.src = src;
      img.className = 'panel-thumb' + (i === 0 ? ' active' : '');
      img.addEventListener('click', () => {
        activePhotoIdx = i;
        panelImg.src = src;
        panelThumbs.querySelectorAll('.panel-thumb').forEach((t, ti) => {
          t.classList.toggle('active', ti === i);
        });
      });
      panelThumbs.appendChild(img);
    });

    panelEmpty.hidden = true;
    panelContent.hidden = false;
  }

  function closePanel() {
    activeLoc = null;
    panelContent.hidden = true;
    panelEmpty.hidden = false;
  }

  panelClose.addEventListener('click', closePanel);

  function resizeGlobe() {
    const size = globeCanvas.parentElement.offsetWidth;
    globeCanvas.width  = size;
    globeCanvas.height = size;
  }

  // lat/lon → 3D unit vector
  function latLonTo3D(lat, lon) {
    const phi   = (90 - lat)  * Math.PI / 180;
    const theta = (lon + 180) * Math.PI / 180;
    return {
      x:  Math.sin(phi) * Math.cos(theta),
      y:  Math.cos(phi),
      z:  Math.sin(phi) * Math.sin(theta),
    };
  }

  // apply Y then X rotation
  function rotatePoint(p) {
    let x = p.x, y = p.y, z = p.z;
    // rotate around Y axis (spin)
    const cosY = Math.cos(rotY), sinY = Math.sin(rotY);
    const x1 =  x * cosY + z * sinY;
    const z1 = -x * sinY + z * cosY;
    // rotate around X axis (tilt)
    const cosX = Math.cos(rotX), sinX = Math.sin(rotX);
    const y2 = y * cosX - z1 * sinX;
    const z2 = y * sinX + z1 * cosX;
    return { x: x1, y: y2, z: z2 };
  }

  // store projected pin positions each frame for hit-testing
  let projectedPins = [];

  function drawGlobe() {
    const size = globeCanvas.width;
    const cx   = size / 2;
    const cy   = size / 2;
    const R    = size * 0.46;

    gc.clearRect(0, 0, size, size);

    // ocean fill
    gc.beginPath();
    gc.arc(cx, cy, R, 0, Math.PI * 2);
    const oceanGrad = gc.createRadialGradient(cx - R * 0.25, cy - R * 0.2, R * 0.05, cx, cy, R);
    oceanGrad.addColorStop(0,   '#D8D0BC');
    oceanGrad.addColorStop(0.5, '#C8BC9E');
    oceanGrad.addColorStop(1,   '#B0A888');
    gc.fillStyle = oceanGrad;
    gc.fill();

    // clip to sphere for graticules + landmass strokes
    gc.save();
    gc.beginPath();
    gc.arc(cx, cy, R, 0, Math.PI * 2);
    gc.clip();

    // lat/lon grid lines
    gc.strokeStyle = 'rgba(92,107,62,0.13)';
    gc.lineWidth   = 0.6;

    // latitude lines
    for (let lat = -75; lat <= 75; lat += 15) {
      const phi  = (90 - lat) * Math.PI / 180;
      const sinP = Math.sin(phi), cosP = Math.cos(phi);
      gc.beginPath();
      let first = true;
      for (let lon = -180; lon <= 180; lon += 3) {
        const theta = (lon + 180) * Math.PI / 180;
        const p = rotatePoint({ x: sinP * Math.cos(theta), y: cosP, z: sinP * Math.sin(theta) });
        if (p.z < 0) { first = true; continue; }
        const sx = cx + p.x * R, sy = cy - p.y * R;
        first ? gc.moveTo(sx, sy) : gc.lineTo(sx, sy);
        first = false;
      }
      gc.stroke();
    }

    // longitude lines
    for (let lon = -180; lon < 180; lon += 15) {
      const theta = (lon + 180) * Math.PI / 180;
      gc.beginPath();
      let first = true;
      for (let lat = -90; lat <= 90; lat += 2) {
        const phi = (90 - lat) * Math.PI / 180;
        const p = rotatePoint({ x: Math.sin(phi)*Math.cos(theta), y: Math.cos(phi), z: Math.sin(phi)*Math.sin(theta) });
        if (p.z < 0) { first = true; continue; }
        const sx = cx + p.x * R, sy = cy - p.y * R;
        first ? gc.moveTo(sx, sy) : gc.lineTo(sx, sy);
        first = false;
      }
      gc.stroke();
    }

    gc.restore();

    // rim shadow
    const rimGrad = gc.createRadialGradient(cx + R*0.1, cy - R*0.1, R*0.75, cx, cy, R);
    rimGrad.addColorStop(0,   'rgba(0,0,0,0)');
    rimGrad.addColorStop(0.8, 'rgba(34,40,15,0.05)');
    rimGrad.addColorStop(1,   'rgba(34,40,15,0.22)');
    gc.beginPath();
    gc.arc(cx, cy, R, 0, Math.PI * 2);
    gc.fillStyle = rimGrad;
    gc.fill();

    // highlight
    const hlGrad = gc.createRadialGradient(cx - R*0.35, cy - R*0.35, 0, cx - R*0.2, cy - R*0.2, R*0.55);
    hlGrad.addColorStop(0,   'rgba(255,252,240,0.18)');
    hlGrad.addColorStop(1,   'rgba(255,252,240,0)');
    gc.beginPath();
    gc.arc(cx, cy, R, 0, Math.PI * 2);
    gc.fillStyle = hlGrad;
    gc.fill();

    // pins
    projectedPins = [];
    LOCATIONS.forEach(loc => {
      const p3  = latLonTo3D(loc.lat, loc.lon);
      const rot = rotatePoint(p3);
      if (rot.z <= 0) return; // behind globe

      const sx = cx + rot.x * R;
      const sy = cy - rot.y * R;

      const isActive = activeLoc && activeLoc.name === loc.name;
      const pinR     = isActive ? 7 : 5;

      // outer ring
      gc.beginPath();
      gc.arc(sx, sy, pinR + 3, 0, Math.PI * 2);
      gc.fillStyle = 'rgba(92,107,62,0.18)';
      gc.fill();

      // pin dot
      gc.beginPath();
      gc.arc(sx, sy, pinR, 0, Math.PI * 2);
      gc.fillStyle = isActive ? '#3D4F2A' : '#5C6B3E';
      gc.fill();

      gc.beginPath();
      gc.arc(sx, sy, pinR - 2, 0, Math.PI * 2);
      gc.fillStyle = isActive ? '#A8B88A' : '#DCE8C8';
      gc.fill();

      projectedPins.push({ loc, sx, sy, r: pinR + 5 });
    });
  }

  function globeLoop() {
    if (!isDragging) {
      rotY += spinV;
      dragVX *= 0.92;
      dragVY *= 0.92;
    }
    drawGlobe();
    requestAnimationFrame(globeLoop);
  }

  // pointer events for dragging
  function onPointerDown(e) {
    isDragging = true;
    spinV = 0;
    dragVX = 0; dragVY = 0;
    lastMX = e.clientX ?? e.touches[0].clientX;
    lastMY = e.clientY ?? e.touches[0].clientY;
    e.preventDefault();
  }

  function onPointerMove(e) {
    if (!isDragging) return;
    const mx = e.clientX ?? e.touches[0].clientX;
    const my = e.clientY ?? e.touches[0].clientY;
    const dx = mx - lastMX, dy = my - lastMY;
    dragVX = dx * 0.006;
    dragVY = dy * 0.006;
    rotY += dragVX;
    rotX += dragVY;
    rotX = Math.max(-1.4, Math.min(1.4, rotX));
    lastMX = mx; lastMY = my;
  }

  function onPointerUp(e) {
    if (!isDragging) return;
    isDragging = false;
    // resume gentle auto-spin, scaled from drag momentum
    spinV = dragVX * 0.4;
    if (Math.abs(spinV) < 0.0005) spinV = 0.002;

    // hit test — did we click a pin?
    const rect = globeCanvas.getBoundingClientRect();
    const cx = (e.clientX ?? (e.changedTouches && e.changedTouches[0].clientX)) - rect.left;
    const cy = (e.clientY ?? (e.changedTouches && e.changedTouches[0].clientY)) - rect.top;

    if (Math.abs(dragVX) < 0.004 && Math.abs(dragVY) < 0.004) {
      let hit = null;
      let bestDist = Infinity;
      projectedPins.forEach(pin => {
        const d = Math.sqrt((cx - pin.sx) ** 2 + (cy - pin.sy) ** 2);
        if (d < pin.r + 6 && d < bestDist) { bestDist = d; hit = pin.loc; }
      });
      if (hit) {
        if (activeLoc && activeLoc.name === hit.name) closePanel();
        else openPanel(hit);
      }
    }
  }

  globeCanvas.addEventListener('mousedown',  onPointerDown);
  window.addEventListener('mousemove',       onPointerMove);
  window.addEventListener('mouseup',         onPointerUp);
  globeCanvas.addEventListener('touchstart', onPointerDown, { passive: false });
  window.addEventListener('touchmove',       onPointerMove, { passive: true });
  window.addEventListener('touchend',        onPointerUp);

  window.addEventListener('resize', resizeGlobe);
  resizeGlobe();
  globeLoop();

})();
