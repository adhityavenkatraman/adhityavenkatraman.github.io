(function () {
  'use strict';

  // run everything after layout is ready
  window.addEventListener('DOMContentLoaded', function () {
    requestAnimationFrame(function () {
      initParticles();
      initTimeline();
      initGlobe();
    });
  });


  // ─── PARTICLES ─────────────────────────────────────────────────────────────

  function initParticles() {
    var canvas = document.getElementById('bg-canvas');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');

    var CONNECT = 125, REPEL_R = 175, REPEL_F = 0.14, MAX_SPD = 1.1, DAMP = 0.984;

    var PALETTE = [
      { c: '#9BA89A', w: 12 }, { c: '#B8AE94', w: 12 }, { c: '#C4BBAA', w: 10 },
      { c: '#7A8C5A', w: 8  }, { c: '#5C6B3E', w: 5  }, { c: '#A8B88A', w: 7  },
      { c: '#8B7355', w: 6  }, { c: '#6B8A7A', w: 4  }, { c: '#8B6B6B', w: 3  },
      { c: '#7B8B9A', w: 4  }, { c: '#A89B6A', w: 4  }, { c: '#697A5A', w: 3  },
    ];
    var TOTAL_W = PALETTE.reduce(function(s, c) { return s + c.w; }, 0);

    function pickColor() {
      var r = Math.random() * TOTAL_W;
      for (var i = 0; i < PALETTE.length; i++) { r -= PALETTE[i].w; if (r <= 0) return PALETTE[i].c; }
      return PALETTE[0].c;
    }

    var W, H, nodes, animId, mouseX = null, mouseY = null, lineOff = 0;

    function setSize() {
      var rect = canvas.parentElement.getBoundingClientRect();
      W = canvas.width  = rect.width  || window.innerWidth;
      H = canvas.height = rect.height || window.innerHeight;
    }

    function makeNodes() {
      nodes = [];
      for (var i = 0; i < 110; i++) {
        nodes.push({
          x: Math.random() * W, y: Math.random() * H,
          vx: (Math.random() - 0.5) * 0.45, vy: (Math.random() - 0.5) * 0.3,
          r: Math.random() * 2.4 + 0.6,
          a: Math.random() * 0.48 + 0.08,
          c: pickColor()
        });
      }
    }

    function tick() {
      ctx.clearRect(0, 0, W, H);
      lineOff += 0.004;

      // drift lines
      ctx.lineWidth = 0.7;
      for (var li = 1; li <= 4; li++) {
        var baseY = (H / 5) * li;
        ctx.beginPath();
        ctx.globalAlpha = 0.035;
        ctx.strokeStyle = '#7A8C5A';
        for (var s = 0; s <= 12; s++) {
          var lx = (s / 12) * W;
          var ly = baseY + Math.sin((s / 12) * Math.PI * 2 + lineOff + li) * 18;
          s === 0 ? ctx.moveTo(lx, ly) : ctx.lineTo(lx, ly);
        }
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      // connections
      for (var i = 0; i < nodes.length; i++) {
        for (var j = i + 1; j < nodes.length; j++) {
          var dx = nodes[i].x - nodes[j].x, dy = nodes[i].y - nodes[j].y;
          var dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < CONNECT) {
            ctx.beginPath();
            ctx.strokeStyle = '#9BA89A';
            ctx.globalAlpha = (1 - dist / CONNECT) * 0.14;
            ctx.lineWidth = 0.55;
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
          }
        }
      }
      ctx.globalAlpha = 1;

      // dots
      for (var i = 0; i < nodes.length; i++) {
        ctx.beginPath();
        ctx.arc(nodes[i].x, nodes[i].y, nodes[i].r, 0, Math.PI * 2);
        ctx.fillStyle = nodes[i].c;
        ctx.globalAlpha = nodes[i].a;
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // move
      for (var i = 0; i < nodes.length; i++) {
        var n = nodes[i];
        if (mouseX !== null) {
          var dx = n.x - mouseX, dy = n.y - mouseY;
          var dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < REPEL_R && dist > 0) {
            var f = (1 - dist / REPEL_R) * REPEL_F;
            n.vx += (dx / dist) * f;
            n.vy += (dy / dist) * f;
          }
        }
        n.vx *= DAMP; n.vy *= DAMP;
        var spd = Math.sqrt(n.vx * n.vx + n.vy * n.vy);
        if (spd > MAX_SPD) { n.vx = n.vx / spd * MAX_SPD; n.vy = n.vy / spd * MAX_SPD; }
        n.x += n.vx; n.y += n.vy;
        if (n.x < -20) n.x = W + 20; else if (n.x > W + 20) n.x = -20;
        if (n.y < -20) n.y = H + 20; else if (n.y > H + 20) n.y = -20;
      }

      animId = requestAnimationFrame(tick);
    }

    window.addEventListener('mousemove', function(e) { mouseX = e.clientX; mouseY = e.clientY; });
    window.addEventListener('mouseleave', function() { mouseX = null; mouseY = null; });

    window.addEventListener('resize', function() {
      cancelAnimationFrame(animId); animId = null;
      setSize();
      animId = requestAnimationFrame(tick);
    });

    // only run while hero is visible
    var hero = document.querySelector('.hero');
    if (hero && typeof IntersectionObserver !== 'undefined') {
      new IntersectionObserver(function(entries) {
        if (entries[0].isIntersecting) {
          if (!animId) animId = requestAnimationFrame(tick);
        } else {
          cancelAnimationFrame(animId); animId = null;
        }
      }, { threshold: 0 }).observe(hero);
    }

    setSize();
    makeNodes();
    animId = requestAnimationFrame(tick);
  }


  // ─── TIMELINE + PUB REVEALS ────────────────────────────────────────────────

  function initTimeline() {
    if (typeof IntersectionObserver === 'undefined') return;

    var flowObs = new IntersectionObserver(function(entries) {
      entries.forEach(function(e) {
        if (e.isIntersecting) {
          var delay = parseInt(e.target.dataset.index || '0') * 140;
          setTimeout(function() { e.target.classList.add('visible'); }, delay);
        } else {
          e.target.classList.remove('visible');
        }
      });
    }, { threshold: 0.12 });
    document.querySelectorAll('.flow-node').forEach(function(n) { flowObs.observe(n); });

    var pubCards = document.querySelectorAll('.pub-card');
    pubCards.forEach(function(el) {
      el.style.opacity = '0';
      el.style.transform = 'translateY(18px)';
      el.style.transition = 'opacity 0.65s ease, transform 0.65s ease';
    });
    var pubObs = new IntersectionObserver(function(entries) {
      entries.forEach(function(e) {
        e.target.style.opacity   = e.isIntersecting ? '1' : '0';
        e.target.style.transform = e.isIntersecting ? 'translateY(0)' : 'translateY(18px)';
      });
    }, { threshold: 0.08 });
    pubCards.forEach(function(el) { pubObs.observe(el); });
  }


  // ─── GLOBE ─────────────────────────────────────────────────────────────────
  //
  // Edit LOCATIONS to match your actual photos.
  // lat = latitude (N positive), lon = longitude (E positive)
  // photos = paths relative to index.html
  //
  function initGlobe() {
    var LOCATIONS = [
      { name: 'New York',      lat: 40.71, lon:  -74.01, photos: ['materials/images/nyc1.jpg',      'materials/images/nyc2.jpg'] },
      { name: 'San Francisco', lat: 37.77, lon: -122.42, photos: ['materials/images/sf1.jpg'] },
      { name: 'Stanford',      lat: 37.43, lon: -122.17, photos: ['materials/images/stanford1.jpg', 'materials/images/stanford2.jpg'] },
      { name: 'London',        lat: 51.51, lon:   -0.13, photos: ['materials/images/london1.jpg'] },
      { name: 'Tokyo',         lat: 35.68, lon:  139.69, photos: ['materials/images/tokyo1.jpg',    'materials/images/tokyo2.jpg'] },
      { name: 'Mumbai',        lat: 19.08, lon:   72.88, photos: ['materials/images/mumbai1.jpg'] },
      { name: 'Paris',         lat: 48.85, lon:    2.35, photos: ['materials/images/paris1.jpg'] },
    ];

    var gc_el = document.getElementById('globe');
    if (!gc_el) return;
    var gc = gc_el.getContext('2d');

    var rotX = 0.35, rotY = -0.3;
    var isDragging = false, lastMX = 0, lastMY = 0;
    var spinV = 0.002, dragVX = 0, dragVY = 0;
    var projectedPins = [];
    var activeLoc = null;

    var panelEmpty   = document.getElementById('photoPanelEmpty');
    var panelContent = document.getElementById('photoPanelContent');
    var panelClose   = document.getElementById('photoPanelClose');
    var panelImg     = document.getElementById('panelImg');
    var panelPlace   = document.getElementById('panelPlace');
    var panelThumbs  = document.getElementById('panelThumbs');

    function openPanel(loc) {
      activeLoc = loc;
      panelPlace.textContent = loc.name;
      panelImg.src = loc.photos[0];
      panelThumbs.innerHTML = '';
      loc.photos.forEach(function(src, i) {
        var img = document.createElement('img');
        img.src = src;
        img.className = 'panel-thumb' + (i === 0 ? ' active' : '');
        img.addEventListener('click', function() {
          panelImg.src = src;
          panelThumbs.querySelectorAll('.panel-thumb').forEach(function(t, ti) {
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

    if (panelClose) panelClose.addEventListener('click', closePanel);

    function setGlobeSize() {
      var wrap = gc_el.parentElement;
      var w = wrap.getBoundingClientRect().width || 400;
      gc_el.width = w;
      gc_el.height = w;
    }

    function latLonTo3D(lat, lon) {
      var phi   = (90 - lat)  * Math.PI / 180;
      var theta = (lon + 180) * Math.PI / 180;
      return { x: Math.sin(phi) * Math.cos(theta), y: Math.cos(phi), z: Math.sin(phi) * Math.sin(theta) };
    }

    function rotatePoint(p) {
      var cosY = Math.cos(rotY), sinY = Math.sin(rotY);
      var x1 =  p.x * cosY + p.z * sinY;
      var z1 = -p.x * sinY + p.z * cosY;
      var cosX = Math.cos(rotX), sinX = Math.sin(rotX);
      var y2 = p.y * cosX - z1 * sinX;
      var z2 = p.y * sinX + z1 * cosX;
      return { x: x1, y: y2, z: z2 };
    }

    function drawGlobe() {
      var size = gc_el.width;
      if (size === 0) return;
      var cx = size / 2, cy = size / 2, R = size * 0.46;

      gc.clearRect(0, 0, size, size);

      // sphere fill
      gc.beginPath();
      gc.arc(cx, cy, R, 0, Math.PI * 2);
      var og = gc.createRadialGradient(cx - R*0.25, cy - R*0.2, R*0.05, cx, cy, R);
      og.addColorStop(0,   '#D8D0BC');
      og.addColorStop(0.5, '#C8BC9E');
      og.addColorStop(1,   '#B0A888');
      gc.fillStyle = og;
      gc.fill();

      // clip + grid
      gc.save();
      gc.beginPath();
      gc.arc(cx, cy, R, 0, Math.PI * 2);
      gc.clip();
      gc.strokeStyle = 'rgba(92,107,62,0.14)';
      gc.lineWidth = 0.6;

      for (var lat = -75; lat <= 75; lat += 15) {
        var phi = (90 - lat) * Math.PI / 180;
        var sinP = Math.sin(phi), cosP = Math.cos(phi);
        gc.beginPath();
        var first = true;
        for (var lon = -180; lon <= 180; lon += 3) {
          var theta = (lon + 180) * Math.PI / 180;
          var rp = rotatePoint({ x: sinP * Math.cos(theta), y: cosP, z: sinP * Math.sin(theta) });
          if (rp.z < 0) { first = true; continue; }
          var sx = cx + rp.x * R, sy = cy - rp.y * R;
          first ? gc.moveTo(sx, sy) : gc.lineTo(sx, sy);
          first = false;
        }
        gc.stroke();
      }

      for (var lon2 = -180; lon2 < 180; lon2 += 15) {
        var theta2 = (lon2 + 180) * Math.PI / 180;
        gc.beginPath();
        var first2 = true;
        for (var lat2 = -90; lat2 <= 90; lat2 += 2) {
          var phi2 = (90 - lat2) * Math.PI / 180;
          var rp2 = rotatePoint({ x: Math.sin(phi2)*Math.cos(theta2), y: Math.cos(phi2), z: Math.sin(phi2)*Math.sin(theta2) });
          if (rp2.z < 0) { first2 = true; continue; }
          var sx2 = cx + rp2.x * R, sy2 = cy - rp2.y * R;
          first2 ? gc.moveTo(sx2, sy2) : gc.lineTo(sx2, sy2);
          first2 = false;
        }
        gc.stroke();
      }
      gc.restore();

      // shadow + highlight
      var rg = gc.createRadialGradient(cx, cy, R*0.75, cx, cy, R);
      rg.addColorStop(0, 'rgba(0,0,0,0)');
      rg.addColorStop(1, 'rgba(34,40,15,0.22)');
      gc.beginPath(); gc.arc(cx, cy, R, 0, Math.PI*2);
      gc.fillStyle = rg; gc.fill();

      var hg = gc.createRadialGradient(cx-R*0.35, cy-R*0.35, 0, cx-R*0.2, cy-R*0.2, R*0.55);
      hg.addColorStop(0, 'rgba(255,252,240,0.18)');
      hg.addColorStop(1, 'rgba(255,252,240,0)');
      gc.beginPath(); gc.arc(cx, cy, R, 0, Math.PI*2);
      gc.fillStyle = hg; gc.fill();

      // pins
      projectedPins = [];
      LOCATIONS.forEach(function(loc) {
        var p3  = latLonTo3D(loc.lat, loc.lon);
        var rot = rotatePoint(p3);
        if (rot.z <= 0) return;
        var px = cx + rot.x * R, py = cy - rot.y * R;
        var isActive = activeLoc && activeLoc.name === loc.name;
        var pr = isActive ? 7 : 5;

        gc.beginPath(); gc.arc(px, py, pr+3, 0, Math.PI*2);
        gc.fillStyle = 'rgba(92,107,62,0.2)'; gc.fill();

        gc.beginPath(); gc.arc(px, py, pr, 0, Math.PI*2);
        gc.fillStyle = isActive ? '#3D4F2A' : '#5C6B3E'; gc.fill();

        gc.beginPath(); gc.arc(px, py, pr-2, 0, Math.PI*2);
        gc.fillStyle = isActive ? '#A8B88A' : '#DCE8C8'; gc.fill();

        projectedPins.push({ loc: loc, sx: px, sy: py, r: pr+6 });
      });
    }

    function globeLoop() {
      if (!isDragging) { rotY += spinV; }
      drawGlobe();
      requestAnimationFrame(globeLoop);
    }

    function clientXY(e) {
      if (e.touches && e.touches.length) return { x: e.touches[0].clientX, y: e.touches[0].clientY };
      if (e.changedTouches && e.changedTouches.length) return { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
      return { x: e.clientX, y: e.clientY };
    }

    gc_el.addEventListener('mousedown', function(e) {
      isDragging = true; spinV = 0; dragVX = 0; dragVY = 0;
      var p = clientXY(e); lastMX = p.x; lastMY = p.y;
      e.preventDefault();
    });

    gc_el.addEventListener('touchstart', function(e) {
      isDragging = true; spinV = 0; dragVX = 0; dragVY = 0;
      var p = clientXY(e); lastMX = p.x; lastMY = p.y;
      e.preventDefault();
    }, { passive: false });

    window.addEventListener('mousemove', function(e) {
      if (!isDragging) return;
      var p = clientXY(e);
      dragVX = (p.x - lastMX) * 0.006;
      dragVY = (p.y - lastMY) * 0.006;
      rotY += dragVX;
      rotX = Math.max(-1.4, Math.min(1.4, rotX + dragVY));
      lastMX = p.x; lastMY = p.y;
    });

    window.addEventListener('touchmove', function(e) {
      if (!isDragging) return;
      var p = clientXY(e);
      dragVX = (p.x - lastMX) * 0.006;
      dragVY = (p.y - lastMY) * 0.006;
      rotY += dragVX;
      rotX = Math.max(-1.4, Math.min(1.4, rotX + dragVY));
      lastMX = p.x; lastMY = p.y;
    }, { passive: true });

    function onUp(e) {
      if (!isDragging) return;
      isDragging = false;
      spinV = dragVX * 0.4;
      if (Math.abs(spinV) < 0.0005) spinV = 0.002;

      // click detection: only if barely moved
      if (Math.abs(dragVX) < 0.004 && Math.abs(dragVY) < 0.004) {
        var rect = gc_el.getBoundingClientRect();
        var p = clientXY(e);
        var cx2 = p.x - rect.left, cy2 = p.y - rect.top;
        var hit = null, best = Infinity;
        projectedPins.forEach(function(pin) {
          var d = Math.sqrt((cx2-pin.sx)*(cx2-pin.sx) + (cy2-pin.sy)*(cy2-pin.sy));
          if (d < pin.r && d < best) { best = d; hit = pin.loc; }
        });
        if (hit) { activeLoc && activeLoc.name === hit.name ? closePanel() : openPanel(hit); }
      }
    }

    window.addEventListener('mouseup',  onUp);
    window.addEventListener('touchend', onUp);

    window.addEventListener('resize', function() {
      setGlobeSize();
    });

    setGlobeSize();
    globeLoop();
  }

})();
