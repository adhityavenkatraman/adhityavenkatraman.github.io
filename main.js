(function () {
  'use strict';

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

    // increased base speed and repel force for more lively feel
    var CONNECT = 125, REPEL_R = 175, REPEL_F = 0.18, MAX_SPD = 1.4, DAMP = 0.980;
    var BASE_SPEED = 0.3; // passive drift magnitude

    var PALETTE = [
      { c: '#9BA89A', w: 5  }, { c: '#B8AE94', w: 5  }, { c: '#C4BBAA', w: 5  },
      { c: '#7A8C5A', w: 12  }, { c: '#5C6B3E', w: 5  }, { c: '#A8B88A', w: 5  },
      { c: '#8B7355', w: 5  }, { c: '#6B8A7A', w: 12  }, { c: '#8B6B6B', w: 12  },
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
        // each node gets a random drift angle so they all move in different directions
        var angle = Math.random() * Math.PI * 2;
        var speed = (Math.random() * 0.5 + 0.5) * BASE_SPEED;
        nodes.push({
          x: Math.random() * W, y: Math.random() * H,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          r: Math.random() * 2.4 + 0.6,
          a: Math.random() * 0.48 + 0.08,
          c: pickColor(),
          driftX: Math.cos(angle) * speed * 0.06, // gentle persistent nudge
          driftY: Math.sin(angle) * speed * 0.06,
        });
      }
    }

    function tick() {
      ctx.clearRect(0, 0, W, H);
      lineOff += 0.005;

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
            ctx.globalAlpha = (1 - dist / CONNECT) * 0.5;
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

      // move — apply persistent drift nudge + mouse repel
      for (var i = 0; i < nodes.length; i++) {
        var n = nodes[i];

        // persistent drift so nodes never fully stop
        n.vx += n.driftX;
        n.vy += n.driftY;

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

        // enforce minimum speed so drift never dies
        if (spd < 0.18) {
          n.vx += n.driftX * 3;
          n.vy += n.driftY * 3;
        }

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
  // Edit LOCATIONS to match your photos.
  // lat = latitude (N+), lon = longitude (E+)
  //
  function initGlobe() {
    var LOCATIONS = [
      { name: 'New York',     lat: 40.71, lon:  -74.01, photos: ['materials/images/IMG_3647.jpeg','materials/images/IMG_4373.jpeg'] },
      { name: 'Bay Area',     lat: 37.77, lon: -122.42, photos: ['materials/images/IMG_0394.jpeg','materials/images/IMG_7274.jpeg','materials/images/IMG_0647.jpeg','materials/images/IMG_0629.jpeg'] },
      { name: 'London',       lat: 51.51, lon:   -0.13, photos: ['materials/images/IMG_2590.jpeg'] },
      { name: 'Chicago',      lat: 41.88, lon:  -87.63, photos: ['materials/images/IMG_4248.jpeg'] },
      { name: 'Utah',         lat: 39.32, lon: -111.09, photos: ['materials/images/IMG_1277.jpeg'] },
      { name: 'Tokyo',        lat: 35.68, lon:  139.69, photos: ['materials/images/IMG_3210.jpeg'] },
      { name: 'Maharashtra',  lat: 19.08, lon:   75.70, photos: ['materials/images/IMG_8206.jpeg'] },
    ];

    var gc_el = document.getElementById('globe');
    if (!gc_el) return;
    var gc = gc_el.getContext('2d');

    var rotX = 0.3, rotY = 0.4; // start showing Americas
    var isDragging = false, lastMX = 0, lastMY = 0;
    var spinV = 0.0015, dragVX = 0, dragVY = 0;
    var projectedPins = [];
    var activeLoc = null;
    var activePhotoIdx = 0;

    // popover elements
    var popover    = document.getElementById('globePopover');
    var popImg     = document.getElementById('popImg');
    var popPlace   = document.getElementById('popPlace');
    var popThumbs  = document.getElementById('popThumbs');
    var popClose   = document.getElementById('popClose');
    var popPrev    = document.getElementById('popPrev');
    var popNext    = document.getElementById('popNext');

    function showPopover(loc, pinScreenX, pinScreenY) {
      activeLoc = loc;
      activePhotoIdx = 0;
      renderPopover();

      // position near pin, keeping inside viewport
      var globeRect = gc_el.getBoundingClientRect();
      var absX = globeRect.left + pinScreenX;
      var absY = globeRect.top  + pinScreenY;

      popover.style.display = 'flex';
      // force layout so offsetWidth is available
      var pw = popover.offsetWidth;
      var ph = popover.offsetHeight;
      var vw = window.innerWidth, vh = window.innerHeight;

      var left = absX + 16;
      var top  = absY - ph / 2;

      // flip left if too close to right edge
      if (left + pw > vw - 12) { left = absX - pw - 16; }
      // clamp vertically
      if (top < 8) top = 8;
      if (top + ph > vh - 8) top = vh - ph - 8;

      popover.style.left = left + 'px';
      popover.style.top  = top  + 'px';
    }

    var loadGen = 0; // generation counter to discard stale image loads

    function renderPopover() {
      if (!activeLoc) return;
      popPlace.textContent = activeLoc.name;
      var src = activeLoc.photos[activePhotoIdx];

      loadGen++;
      var myGen = loadGen;
      popImg.style.opacity = '0';

      var img = new Image();
      img.onload = function() {
        if (myGen !== loadGen) return; // stale load, discard
        popImg.src = src;
        popImg.style.opacity = '1';
      };
      img.onerror = function() {
        if (myGen !== loadGen) return;
        popImg.src = src;
        popImg.style.opacity = '0.35';
      };
      img.src = src;

      popThumbs.innerHTML = '';
      activeLoc.photos.forEach(function(thumbSrc, i) {
        var t = document.createElement('img');
        t.src = thumbSrc;
        t.className = 'pop-thumb' + (i === activePhotoIdx ? ' active' : '');
        (function(idx) {
          t.addEventListener('click', function() {
            activePhotoIdx = idx;
            renderPopover();
          });
        })(i);
        popThumbs.appendChild(t);
      });

      var multi = activeLoc.photos.length > 1;
      popPrev.style.display = multi ? '' : 'none';
      popNext.style.display = multi ? '' : 'none';
    }

    function hidePopover() {
      activeLoc = null;
      popover.style.display = 'none';
    }

    if (popClose) popClose.addEventListener('click', hidePopover);

    if (popPrev) popPrev.addEventListener('click', function() {
      if (!activeLoc) return;
      activePhotoIdx = (activePhotoIdx - 1 + activeLoc.photos.length) % activeLoc.photos.length;
      renderPopover();
    });

    if (popNext) popNext.addEventListener('click', function() {
      if (!activeLoc) return;
      activePhotoIdx = (activePhotoIdx + 1) % activeLoc.photos.length;
      renderPopover();
    });

    // click outside popover closes it
    document.addEventListener('click', function(e) {
      if (!popover || popover.style.display === 'none') return;
      if (!popover.contains(e.target) && e.target !== gc_el) {
        hidePopover();
      }
    });

    function setGlobeSize() {
      var wrap = gc_el.parentElement;
      var w = wrap.getBoundingClientRect().width || 400;
      gc_el.width  = w;
      gc_el.height = w;
    }

    function latLonTo3D(lat, lon) {
      var phi   = (90 - lat) * Math.PI / 180;
      var theta = lon        * Math.PI / 180;
      return {
        x:  Math.sin(phi) * Math.cos(theta),
        y:  Math.cos(phi),
        z: -Math.sin(phi) * Math.sin(theta)
      };
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

    // ── Simplified land outlines as arrays of [lat, lon] polylines ─────────
    // Each continent is an array of polygon rings; each ring is [lat, lon] pairs.
    // Accuracy is intentionally coarse — enough to show geographic context.
    var LAND = (function() {
      // helper: build a lat/lon ring from a compact string "lat,lon lat,lon ..."
      function ring(s) {
        return s.trim().split(' ').map(function(p) {
          var parts = p.split(',');
          return [parseFloat(parts[0]), parseFloat(parts[1])];
        });
      }

      return [
        // North America outline
        ring('71,-141 70,-130 60,-140 59,-135 56,-133 54,-130 49,-125 48,-123 42,-124 37,-122 32,-117 25,-110 20,-105 16,-97 15,-92 14,-88 15,-85 18,-88 18,-92 21,-97 22,-105 25,-109 24,-110 20,-86 19,-87 16,-86 16,-83 10,-83 9,-80 9,-77 11,-73 12,-72 16,-60 11,-60 10,-62 7,-60 5,-55 4,-52 4,-51 5,-50 2,-49 0,-48 2,-53 4,-60 8,-62 10,-63 14,-60 15,-61 17,-62 18,-63 18,-66 18,-68 19,-69 22,-72 24,-74 25,-77 27,-78 28,-80 30,-80 32,-80 34,-77 35,-75 36,-75 39,-74 40,-73 41,-69 43,-70 45,-66 47,-65 46,-63 44,-63 47,-60 51,-56 53,-55 55,-57 56,-60 59,-64 59,-67 61,-69 63,-73 65,-76 67,-80 68,-88 68,-95 70,-95 71,-103 72,-108 73,-117 73,-130 72,-140 71,-141'),
        // Greenland
        ring('59,-43 61,-42 63,-42 65,-40 67,-34 70,-22 76,-20 79,-20 83,-30 83,-40 82,-50 80,-60 77,-66 75,-65 72,-57 70,-53 67,-52 65,-50 62,-46 59,-43'),
        // South America
        ring('12,-72 11,-73 10,-75 8,-77 7,-77 8,-76 7,-75 4,-76 1,-78 -1,-80 -3,-80 -5,-81 -8,-80 -14,-76 -17,-72 -18,-70 -22,-68 -24,-70 -27,-70 -32,-71 -35,-71 -40,-71 -42,-73 -44,-66 -46,-66 -48,-75 -52,-69 -54,-66 -55,-64 -54,-63 -52,-60 -51,-59 -49,-57 -47,-65 -44,-63 -42,-64 -40,-62 -38,-57 -34,-52 -28,-49 -24,-44 -20,-40 -17,-38 -12,-37 -7,-34 -4,-36 -2,-39 0,-50 3,-52 6,-53 8,-60 10,-62 11,-62 12,-71 12,-72'),
        // Europe
        ring('36,27 38,27 40,28 41,29 42,28 44,29 45,29 46,29 47,28 46,26 45,25 46,23 47,22 49,20 49,18 50,18 51,17 52,14 54,12 55,12 56,10 58,7 58,5 59,5 60,5 63,5 66,14 70,25 70,20 69,15 67,14 65,12 63,8 62,4 60,5 57,10 56,10 55,10 52,14 50,14 51,12 50,12 49,12 48,9 48,8 45,7 44,7 43,5 42,4 41,4 40,4 38,1 37,-2 36,-6 36,-9 38,-9 39,-9 41,-8 43,-9 44,-8 45,-1 44,0 43,3 42,3 41,2 40,4 39,9 38,15 37,14 37,15 36,27'),
        // Africa
        ring('37,10 37,11 36,10 33,11 30,32 25,37 20,37 15,42 11,44 12,44 11,43 8,40 5,38 2,41 0,42 -1,40 -3,39 -5,39 -9,35 -12,35 -15,35 -18,35 -20,35 -22,34 -25,33 -28,33 -30,30 -32,28 -34,26 -35,24 -35,20 -33,18 -30,17 -27,16 -25,15 -22,14 -20,13 -18,12 -15,11 -10,15 -7,15 -5,15 -2,15 0,15 2,17 5,15 8,15 10,15 12,16 15,17 20,38 22,37 30,32 33,30 33,25 33,20 37,14 37,10'),
        // Asia (simplified, major outline)
        ring('70,30 70,50 68,70 68,90 70,110 70,130 60,130 55,130 50,140 45,135 40,130 35,120 30,120 25,120 20,110 15,108 10,105 5,103 1,104 3,101 5,100 10,99 13,100 15,101 15,100 12,99 10,98 8,98 5,100 2,103 1,104 0,104 -1,104 -2,106 -3,107 -5,105 -8,115 -10,124 -8,128 -5,110 -3,107 0,108 4,118 6,117 7,116 5,115 4,116 2,118 1,118 -1,118 -3,110 -5,106 -7,107 -8,115 -10,125 -8,127 -6,134 -10,146 -10,142 -8,135 -5,130 -5,120 -8,117 -8,115 -10,105 -5,104 0,104 5,100 10,98 15,100 20,110 25,120 30,120 35,120 40,125 45,135 50,140 55,132 60,130 65,140 70,141 72,130 72,120 70,110 70,100 72,90 70,80 68,60 70,50 72,38 72,30 70,30'),
        // Japan
        ring('31,131 33,131 34,132 34,130 33,131 32,130 31,130 31,131'),
        ring('35,136 36,137 37,137 38,141 40,141 42,142 43,141 44,142 43,140 42,140 40,139 38,141 36,136 35,135 34,135 35,136'),
        ring('42,141 43,143 44,145 44,142 43,141'),
        // Australia
        ring('-12,136 -14,136 -16,136 -17,139 -17,140 -16,145 -14,143 -15,146 -18,146 -20,148 -22,150 -26,153 -28,153 -30,153 -32,152 -34,150 -38,147 -38,146 -39,144 -38,141 -35,137 -32,133 -29,129 -26,114 -22,114 -20,118 -17,122 -15,128 -13,130 -12,136'),
        ring('-42,146 -43,147 -43,148 -42,148 -41,146 -42,146'),
        // UK
        ring('50,-6 51,-5 51,-3 53,-4 54,-4 56,-6 58,-6 59,-5 60,-2 58,0 55,2 53,2 52,2 51,2 51,1 50,0 50,-2 50,-5 50,-6'),
        ring('57,-6 58,-5 58,-4 57,-6'),
        // Iceland
        ring('63,-24 63,-20 64,-15 65,-13 66,-13 66,-18 65,-24 63,-24'),
        // New Zealand
        ring('-41,174 -42,172 -44,170 -46,169 -46,168 -44,168 -41,173 -41,174'),
        ring('-34,173 -35,174 -37,176 -38,177 -37,175 -36,174 -34,173'),
        // Sri Lanka
        ring('[8,80 9,80 10,80 9,81 8,81 8,80]'.replace('[','').replace(']','').replace(/8,80 /g,'8,80 ')),
        // India subcontinent
        ring('28,77 24,88 20,87 18,84 15,80 10,78 8,77 8,78 10,79 12,80 13,80 8,78 7,77 8,76 10,76 12,78 13,80 15,80 17,82 18,84 20,86 22,89 23,91 25,90 26,90 28,95 30,97 30,95 28,95 27,90 25,92 24,90 23,91 22,92 20,90 18,84 15,80 10,78 8,77 9,78 10,80 12,80 13,79 12,78 10,76 8,76 8,77 9,78 10,79 12,80 14,80 16,82 18,84 20,87 22,87 24,88 26,92 28,97 30,97 32,76 35,75 36,73 36,70 32,68 28,68 24,68 22,68 20,70 18,72 17,73 15,74 13,80 10,79 8,77 9,76 10,74 12,73 13,74 14,75 16,73 17,73 18,72 20,70 22,68 24,68 28,68 32,68 36,70 37,71 36,74 35,75 34,74 33,74 32,75 32,77 28,77'),
        // simplified India
        ring('8,77 10,80 13,80 16,82 18,84 21,87 24,89 25,90 28,95 30,97 32,77 36,73 36,70 32,68 24,68 20,70 16,73 12,73 8,77'),
      ];
    })();

    function drawGlobe() {
      var size = gc_el.width;
      if (size === 0) return;
      var cx = size / 2, cy = size / 2, R = size * 0.46;

      gc.clearRect(0, 0, size, size);

      // ocean sphere
      gc.beginPath();
      gc.arc(cx, cy, R, 0, Math.PI * 2);
      var og = gc.createRadialGradient(cx - R*0.22, cy - R*0.18, R*0.04, cx, cy, R);
      og.addColorStop(0,   '#D0CCBC');
      og.addColorStop(0.6, '#C2BAA4');
      og.addColorStop(1,   '#A8A08A');
      gc.fillStyle = og;
      gc.fill();

      // clip everything to sphere
      gc.save();
      gc.beginPath();
      gc.arc(cx, cy, R, 0, Math.PI * 2);
      gc.clip();

      // draw land polygons
      gc.fillStyle   = '#B8B09A';
      gc.strokeStyle = '#8A8070';
      gc.lineWidth   = 0.7;

      // Project all vertices in this ring, then draw only visible segments.
      // This prevents straight lines cutting across the sphere when a polygon
      // straddles the front/back boundary.
      LAND.forEach(function(ringPts) {
        var pts = ringPts.map(function(ll) {
          var p3 = latLonTo3D(ll[0], ll[1]);
          var rp = rotatePoint(p3);
          return { sx: cx + rp.x * R, sy: cy - rp.y * R, vis: rp.z > 0 };
        });
        var n = pts.length;
        gc.beginPath();
        var inPath = false;
        for (var i = 0; i < n; i++) {
          var cur  = pts[i];
          var next = pts[(i + 1) % n];
          if (cur.vis && next.vis) {
            if (!inPath) { gc.moveTo(cur.sx, cur.sy); inPath = true; }
            else          { gc.lineTo(cur.sx, cur.sy); }
            gc.lineTo(next.sx, next.sy);
          } else {
            inPath = false;
          }
        }
        if (inPath) gc.closePath();
        gc.fill();
        gc.stroke();
      });

      // graticule grid (sparse, subtle)
      gc.strokeStyle = 'rgba(80,75,60,0.10)';
      gc.lineWidth   = 0.4;
      for (var lat = -60; lat <= 60; lat += 30) {
        var phi = (90 - lat) * Math.PI / 180;
        var sinP = Math.sin(phi), cosP = Math.cos(phi);
        gc.beginPath();
        var firstL = true;
        for (var lon = -180; lon <= 180; lon += 4) {
          var theta = lon * Math.PI / 180;
          var rp = rotatePoint({ x: sinP * Math.cos(theta), y: cosP, z: -sinP * Math.sin(theta) });
          if (rp.z < 0) { firstL = true; continue; }
          var sx = cx + rp.x * R, sy = cy - rp.y * R;
          firstL ? gc.moveTo(sx, sy) : gc.lineTo(sx, sy);
          firstL = false;
        }
        gc.stroke();
      }
      for (var lon2 = -180; lon2 < 180; lon2 += 30) {
        var theta2 = lon2 * Math.PI / 180;
        gc.beginPath();
        var firstL2 = true;
        for (var lat2 = -90; lat2 <= 90; lat2 += 3) {
          var phi2 = (90 - lat2) * Math.PI / 180;
          var rp2 = rotatePoint({ x: Math.sin(phi2)*Math.cos(theta2), y: Math.cos(phi2), z: -Math.sin(phi2)*Math.sin(theta2) });
          if (rp2.z < 0) { firstL2 = true; continue; }
          var sx2 = cx + rp2.x * R, sy2 = cy - rp2.y * R;
          firstL2 ? gc.moveTo(sx2, sy2) : gc.lineTo(sx2, sy2);
          firstL2 = false;
        }
        gc.stroke();
      }

      gc.restore();

      // rim shadow
      var rg = gc.createRadialGradient(cx, cy, R*0.72, cx, cy, R);
      rg.addColorStop(0, 'rgba(0,0,0,0)');
      rg.addColorStop(1, 'rgba(30,25,15,0.30)');
      gc.beginPath(); gc.arc(cx, cy, R, 0, Math.PI*2);
      gc.fillStyle = rg; gc.fill();

      // highlight
      var hg = gc.createRadialGradient(cx-R*0.32, cy-R*0.32, 0, cx-R*0.18, cy-R*0.18, R*0.52);
      hg.addColorStop(0, 'rgba(255,252,240,0.20)');
      hg.addColorStop(1, 'rgba(255,252,240,0)');
      gc.beginPath(); gc.arc(cx, cy, R, 0, Math.PI*2);
      gc.fillStyle = hg; gc.fill();

      // pins — drawn on top of everything
      projectedPins = [];
      LOCATIONS.forEach(function(loc) {
        var p3  = latLonTo3D(loc.lat, loc.lon);
        var rot = rotatePoint(p3);
        if (rot.z <= 0.05) return; // only draw pins clearly on front face
        var px = cx + rot.x * R, py = cy - rot.y * R;
        var isActive = activeLoc && activeLoc.name === loc.name;
        var pr = isActive ? 7 : 5;

        // halo
        gc.beginPath(); gc.arc(px, py, pr + 4, 0, Math.PI*2);
        gc.fillStyle = 'rgba(92,107,62,0.22)'; gc.fill();
        // outer
        gc.beginPath(); gc.arc(px, py, pr, 0, Math.PI*2);
        gc.fillStyle = isActive ? '#3D4F2A' : '#5C6B3E'; gc.fill();
        // inner
        gc.beginPath(); gc.arc(px, py, pr - 2.5, 0, Math.PI*2);
        gc.fillStyle = isActive ? '#A8B88A' : '#E8DEC8'; gc.fill();

        projectedPins.push({ loc: loc, sx: px, sy: py, r: pr + 8 });
      });
    }

    function globeLoop() {
      if (!isDragging) { rotY += spinV; }
      drawGlobe();
      requestAnimationFrame(globeLoop);
    }

    function clientXY(e) {
      if (e.touches && e.touches.length)               return { x: e.touches[0].clientX,        y: e.touches[0].clientY };
      if (e.changedTouches && e.changedTouches.length) return { x: e.changedTouches[0].clientX,  y: e.changedTouches[0].clientY };
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
      if (Math.abs(spinV) < 0.0005) spinV = 0.0015;

      // click = barely moved
      if (Math.abs(dragVX) < 0.004 && Math.abs(dragVY) < 0.004) {
        var rect = gc_el.getBoundingClientRect();
        var p = clientXY(e);
        var cx2 = p.x - rect.left, cy2 = p.y - rect.top;
        var hit = null, best = Infinity;
        projectedPins.forEach(function(pin) {
          var d = Math.sqrt((cx2-pin.sx)*(cx2-pin.sx) + (cy2-pin.sy)*(cy2-pin.sy));
          if (d < pin.r && d < best) { best = d; hit = pin; }
        });
        if (hit) {
          if (activeLoc && activeLoc.name === hit.loc.name) {
            hidePopover();
          } else {
            showPopover(hit.loc, hit.sx, hit.sy);
          }
        }
      }
    }

    window.addEventListener('mouseup',  onUp);
    window.addEventListener('touchend', onUp);

    window.addEventListener('resize', function() { setGlobeSize(); });

    setGlobeSize();
    globeLoop();
  }

})();