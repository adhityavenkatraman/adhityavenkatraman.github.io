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

    var CONNECT = 125, REPEL_R = 175, REPEL_F = 0.18, MAX_SPD = 1.4, DAMP = 0.980;
    var BASE_SPEED = 0.7;

    var PALETTE = [
      { c: '#9BA89A', w: 8  }, { c: '#B8AE94', w: 8  }, { c: '#C4BBAA', w: 3  },
      { c: '#7A8C5A', w: 8  }, { c: '#5C6B3E', w: 5  }, { c: '#A8B88A', w: 5  },
      { c: '#8B7355', w: 5  }, { c: '#6B8A7A', w: 8  }, { c: '#8B6B6B', w: 8  },
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
        var angle = Math.random() * Math.PI * 2;
        var speed = (Math.random() * 0.5 + 0.5) * BASE_SPEED;
        nodes.push({
          x: Math.random() * W, y: Math.random() * H,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          r: Math.random() * 2.4 + 0.6,
          a: Math.random() * 0.48 + 0.08,
          c: pickColor(),
          driftX: Math.cos(angle) * speed * 0.06,
          driftY: Math.sin(angle) * speed * 0.06,
        });
      }
    }

    function tick() {
      ctx.clearRect(0, 0, W, H);
      lineOff += 0.005;

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

      for (var i = 0; i < nodes.length; i++) {
        ctx.beginPath();
        ctx.arc(nodes[i].x, nodes[i].y, nodes[i].r, 0, Math.PI * 2);
        ctx.fillStyle = nodes[i].c;
        ctx.globalAlpha = nodes[i].a;
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      for (var i = 0; i < nodes.length; i++) {
        var n = nodes[i];
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
        if (spd < 0.18) { n.vx += n.driftX * 3; n.vy += n.driftY * 3; }
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
  // lat = latitude (N positive), lon = longitude (E positive)
  //
  function initGlobe() {
    var LOCATIONS = [
      { name: 'New York',    lat: 40.71, lon:  -74.01, photos: ['materials/images/3647.JPEG','materials/images/4373.JPEG'] },
      { name: 'Bay Area',    lat: 37.77, lon: -122.42, photos: ['materials/images/IMG_0394.JPEG','materials/images/IMG_7274.JPEG','materials/images/IMG_0647.JPEG','materials/images/IMG_0629.JPEG'] },
      { name: 'London',      lat: 51.51, lon:   -0.13, photos: ['materials/images/IMG_2590.JPEG'] },
      { name: 'Chicago',     lat: 41.88, lon:  -87.63, photos: ['materials/images/IMG_4248.JPEG'] },
      { name: 'Utah',        lat: 39.32, lon: -111.09, photos: ['materials/images/IMG_1277.JPEG'] },
      { name: 'Tokyo',       lat: 35.68, lon:  139.69, photos: ['materials/images/3210.JPEG'] },
      { name: 'Maharashtra', lat: 19.08, lon:   75.70, photos: ['materials/images/IMG_8206.JPEG'] },
    ];

    var gc_el = document.getElementById('globe');
    if (!gc_el) return;
    var gc = gc_el.getContext('2d');

    // Start rotated to show the Americas centered
    var rotX = 0.35, rotY = -1.66;
    var isDragging = false, lastMX = 0, lastMY = 0;
    var spinV = 0.0015, dragVX = 0, dragVY = 0;
    var projectedPins = [];
    var activeLoc = null;
    var activePhotoIdx = 0;
    var loadGen = 0;

    var popover   = document.getElementById('globePopover');
    var popImg    = document.getElementById('popImg');
    var popPlace  = document.getElementById('popPlace');
    var popThumbs = document.getElementById('popThumbs');
    var popClose  = document.getElementById('popClose');
    var popPrev   = document.getElementById('popPrev');
    var popNext   = document.getElementById('popNext');

    // ── Coordinate conversion ──────────────────────────────────────────────
    // Standard spherical: phi = polar angle from north pole, theta = azimuth.
    // We use a right-handed system where:
    //   x = sin(phi)*cos(theta)  → points toward lon=0 (prime meridian) on equator
    //   y = cos(phi)             → points north
    //   z = sin(phi)*sin(theta)  → points toward lon=90E on equator
    // theta increases eastward (positive lon = positive theta).
    function ll2xyz(lat, lon) {
      var phi   = (90 - lat) * Math.PI / 180;  // 0 at north pole, PI at south
      var theta = lon        * Math.PI / 180;   // 0 at prime meridian, east positive
      return {
        x:  Math.sin(phi) * Math.cos(theta),
        y:  Math.cos(phi),
        z:  Math.sin(phi) * Math.sin(theta)
      };
    }

    // Rotation: rotY spins around Y axis (longitude), rotX tilts around X axis (latitude view)
    function rotate(p) {
      // Spin around Y (changes which longitude faces forward)
      var cy = Math.cos(rotY), sy = Math.sin(rotY);
      var x1 = p.x * cy - p.z * sy;
      var z1 = p.x * sy + p.z * cy;
      // Tilt around X (changes which latitude faces up)
      var cx = Math.cos(rotX), sx = Math.sin(rotX);
      var y2 = p.y * cx - z1 * sx;
      var z2 = p.y * sx + z1 * cx;
      return { x: x1, y: y2, z: z2 };
    }

    // Project to screen: visible when z > 0 (facing camera)
    function project(lat, lon, cx, cy, R) {
      var r = rotate(ll2xyz(lat, lon));
      return { sx: cx + r.x * R, sy: cy - r.y * R, vis: r.z > 0, z: r.z };
    }

    // ── Land outline data ──────────────────────────────────────────────────
    // Stored as arrays of [lat, lon] pairs forming closed polygons.
    // Coordinates are verified against real geography.
    // We draw these as stroke-only outlines (no fill) to avoid
    // fill artifacts when polygons wrap the back of the globe.
    var CONTINENTS = [
      // North America
      [[70,-165],[71,-157],[70,-143],[69,-141],[60,-141],[57,-135],[54,-130],[49,-123],[46,-124],[42,-124],[37,-122],[34,-120],[32,-117],[28,-114],[24,-110],[21,-106],[18,-103],[16,-99],[15,-96],[16,-92],[14,-91],[13,-88],[11,-86],[9,-83],[8,-80],[9,-77],[11,-74],[12,-71],[10,-70],[12,-62],[16,-62],[18,-66],[21,-72],[25,-80],[28,-80],[31,-81],[33,-80],[35,-76],[38,-75],[40,-74],[41,-71],[43,-70],[45,-67],[47,-65],[48,-60],[50,-57],[52,-56],[54,-58],[58,-62],[62,-66],[63,-78],[62,-82],[58,-82],[56,-88],[60,-86],[64,-83],[68,-84],[68,-90],[70,-92],[68,-96],[72,-96],[70,-102],[73,-110],[72,-118],[74,-122],[72,-128],[71,-135],[70,-142],[71,-150],[71,-157],[68,-163],[65,-167],[60,-165],[58,-160],[60,-153],[62,-150],[59,-153],[57,-158],[59,-162],[63,-165],[66,-165],[70,-165]],
      // Greenland
      [[60,-44],[63,-41],[67,-33],[70,-22],[75,-18],[79,-16],[82,-24],[83,-34],[82,-46],[80,-58],[77,-67],[74,-58],[71,-54],[68,-52],[65,-52],[62,-48],[60,-44]],
      // South America
      [[11,-72],[9,-76],[6,-78],[2,-79],[-2,-81],[-5,-81],[-8,-79],[-13,-77],[-18,-70],[-23,-71],[-30,-72],[-37,-73],[-43,-74],[-48,-74],[-52,-72],[-55,-68],[-52,-69],[-50,-66],[-46,-67],[-42,-63],[-38,-58],[-33,-53],[-28,-49],[-23,-43],[-18,-39],[-12,-37],[-7,-35],[-3,-39],[-1,-44],[1,-50],[4,-51],[6,-58],[9,-61],[11,-64],[11,-72]],
      // Africa
      [[37,10],[35,11],[33,15],[31,20],[31,25],[30,32],[27,34],[23,36],[18,38],[14,41],[12,44],[10,45],[7,49],[4,48],[1,44],[-3,41],[-7,40],[-12,40],[-17,38],[-22,36],[-26,33],[-30,31],[-34,27],[-34,22],[-34,18],[-31,17],[-26,15],[-22,14],[-17,12],[-12,14],[-7,13],[-2,9],[3,8],[5,3],[5,-2],[6,-7],[9,-12],[12,-16],[15,-17],[19,-16],[23,-16],[27,-13],[31,-10],[34,-7],[36,-2],[37,4],[37,10]],
      // Europe
      [[36,-6],[38,-9],[42,-9],[44,-8],[44,-2],[47,-3],[49,-2],[50,1],[52,3],[53,7],[55,8],[57,8],[58,11],[57,13],[59,11],[60,5],[63,7],[66,13],[69,16],[70,24],[69,28],[66,32],[64,38],[60,30],[59,24],[57,22],[55,20],[54,16],[54,11],[52,4],[50,2],[48,-2],[46,-1],[44,-2],[43,4],[44,9],[45,13],[43,16],[40,18],[40,15],[38,16],[37,13],[39,8],[38,1],[37,-2],[36,-6]],
      // Great Britain
      [[50,-5],[52,-4],[54,-3],[56,-2],[58,-4],[58,-6],[57,-5],[55,-5],[53,-4],[51,1],[51,-1],[50,-5]],
      // Ireland
      [[52,-10],[54,-10],[55,-7],[54,-6],[52,-6],[51,-9],[52,-10]],
      // Iceland
      [[63,-22],[65,-23],[66,-17],[65,-14],[64,-15],[63,-19],[63,-22]],
      // Asia
      [[41,28],[36,36],[33,36],[31,34],[28,35],[22,39],[16,43],[13,45],[15,52],[20,58],[24,57],[25,52],[29,49],[26,54],[25,61],[24,66],[23,68],[21,70],[18,73],[13,75],[9,77],[8,78],[10,80],[14,80],[17,83],[20,86],[22,89],[18,93],[16,94],[13,98],[10,99],[8,100],[12,100],[10,105],[14,109],[18,107],[21,108],[22,114],[25,119],[30,122],[35,120],[38,121],[39,118],[40,122],[39,124],[38,127],[41,129],[43,131],[47,138],[51,141],[55,138],[59,143],[62,160],[64,170],[66,180],[70,178],[73,160],[75,140],[76,115],[78,100],[76,90],[77,80],[74,72],[70,68],[68,58],[67,50],[68,44],[69,36],[70,30],[62,40],[55,42],[48,40],[44,36],[42,32],[41,28]],
      // Japan
      [[31,130],[33,131],[34,133],[35,136],[37,137],[38,140],[39,142],[41,141],[39,140],[37,137],[35,136],[34,134],[33,132],[31,130]],
      // Australia
      [[-11,131],[-12,137],[-15,136],[-17,141],[-16,145],[-19,147],[-22,150],[-26,153],[-30,153],[-34,151],[-37,150],[-38,146],[-38,141],[-35,139],[-32,134],[-34,135],[-32,131],[-31,116],[-34,118],[-33,115],[-29,114],[-25,113],[-21,114],[-18,122],[-15,125],[-13,129],[-11,131]],
      // New Zealand North
      [[-35,173],[-37,175],[-39,177],[-41,175],[-38,174],[-35,173]],
      // New Zealand South
      [[-41,174],[-44,171],[-46,167],[-45,168],[-42,171],[-41,174]],
    ];

    // ── Drawing ───────────────────────────────────────────────────────────

    function drawGlobe() {
      var size = gc_el.width;
      if (size === 0) return;
      var cx = size / 2, cy = size / 2, R = size * 0.46;

      gc.clearRect(0, 0, size, size);

      // Ocean sphere with subtle gradient
      gc.beginPath();
      gc.arc(cx, cy, R, 0, Math.PI * 2);
      var og = gc.createRadialGradient(cx - R*0.22, cy - R*0.18, R*0.04, cx, cy, R);
      og.addColorStop(0,   '#CCCABF');
      og.addColorStop(0.6, '#BFBBA8');
      og.addColorStop(1,   '#ADA894');
      gc.fillStyle = og;
      gc.fill();

      // Clip all drawing to the sphere
      gc.save();
      gc.beginPath();
      gc.arc(cx, cy, R, 0, Math.PI * 2);
      gc.clip();

      // Subtle graticule grid
      gc.strokeStyle = 'rgba(60,58,48,0.10)';
      gc.lineWidth   = 0.35;
      for (var glat = -60; glat <= 60; glat += 30) {
        var gphi = (90 - glat) * Math.PI / 180;
        var gs = Math.sin(gphi), gc2 = Math.cos(gphi);
        gc.beginPath();
        var gf = true;
        for (var glon = -180; glon <= 180; glon += 3) {
          var gt = glon * Math.PI / 180;
          var gr = rotate({ x: gs*Math.cos(gt), y: gc2, z: gs*Math.sin(gt) });
          if (gr.z <= 0) { gf = true; continue; }
          var gsx = cx + gr.x*R, gsy = cy - gr.y*R;
          gf ? gc.moveTo(gsx,gsy) : gc.lineTo(gsx,gsy); gf = false;
        }
        gc.stroke();
      }
      for (var glon2 = -150; glon2 <= 180; glon2 += 30) {
        var gt2 = glon2 * Math.PI / 180;
        gc.beginPath();
        var gf2 = true;
        for (var glat2 = -90; glat2 <= 90; glat2 += 3) {
          var gphi2 = (90 - glat2) * Math.PI / 180;
          var gr2 = rotate({ x: Math.sin(gphi2)*Math.cos(gt2), y: Math.cos(gphi2), z: Math.sin(gphi2)*Math.sin(gt2) });
          if (gr2.z <= 0) { gf2 = true; continue; }
          var gsx2 = cx + gr2.x*R, gsy2 = cy - gr2.y*R;
          gf2 ? gc.moveTo(gsx2,gsy2) : gc.lineTo(gsx2,gsy2); gf2 = false;
        }
        gc.stroke();
      }

      // Land — draw as stroked outlines only.
      // Each segment is drawn independently: we never connect across the
      // front/back boundary of the globe, which is the source of bad lines.
      gc.strokeStyle = 'rgba(80,74,58,0.75)';
      gc.fillStyle   = 'rgba(185,178,160,0.55)';
      gc.lineWidth   = 0.8;

      CONTINENTS.forEach(function(poly) {
        var n = poly.length;

        // Project all points
        var pts = [];
        for (var i = 0; i < n; i++) {
          var r = rotate(ll2xyz(poly[i][0], poly[i][1]));
          pts.push({ x: cx + r.x*R, y: cy - r.y*R, v: r.z > 0 });
        }

        // Fill pass: build contiguous visible runs and fill each
        gc.beginPath();
        var inFill = false;
        for (var i = 0; i < n; i++) {
          var p = pts[i];
          if (p.v) {
            if (!inFill) { gc.moveTo(p.x, p.y); inFill = true; }
            else          { gc.lineTo(p.x, p.y); }
          } else {
            inFill = false;
          }
        }
        gc.fill();

        // Stroke pass: draw each segment only if BOTH endpoints are visible
        for (var i = 0; i < n; i++) {
          var a = pts[i];
          var b = pts[(i + 1) % n];
          if (a.v && b.v) {
            gc.beginPath();
            gc.moveTo(a.x, a.y);
            gc.lineTo(b.x, b.y);
            gc.stroke();
          }
        }
      });

      gc.restore();

      // Rim shadow
      var rg = gc.createRadialGradient(cx, cy, R*0.70, cx, cy, R);
      rg.addColorStop(0, 'rgba(0,0,0,0)');
      rg.addColorStop(1, 'rgba(20,18,10,0.35)');
      gc.beginPath(); gc.arc(cx, cy, R, 0, Math.PI*2);
      gc.fillStyle = rg; gc.fill();

      // Specular highlight
      var hg = gc.createRadialGradient(cx-R*0.3, cy-R*0.3, 0, cx-R*0.15, cy-R*0.15, R*0.5);
      hg.addColorStop(0, 'rgba(255,252,240,0.22)');
      hg.addColorStop(1, 'rgba(255,252,240,0)');
      gc.beginPath(); gc.arc(cx, cy, R, 0, Math.PI*2);
      gc.fillStyle = hg; gc.fill();

      // Pins
      projectedPins = [];
      LOCATIONS.forEach(function(loc) {
        var r = rotate(ll2xyz(loc.lat, loc.lon));
        if (r.z <= 0.05) return;
        var px = cx + r.x*R, py = cy - r.y*R;
        var active = activeLoc && activeLoc.name === loc.name;
        var pr = active ? 7 : 5;

        gc.beginPath(); gc.arc(px, py, pr+4, 0, Math.PI*2);
        gc.fillStyle = 'rgba(92,107,62,0.22)'; gc.fill();

        gc.beginPath(); gc.arc(px, py, pr, 0, Math.PI*2);
        gc.fillStyle = active ? '#3D4F2A' : '#5C6B3E'; gc.fill();

        gc.beginPath(); gc.arc(px, py, pr-2.5, 0, Math.PI*2);
        gc.fillStyle = active ? '#A8B88A' : '#E8DEC8'; gc.fill();

        projectedPins.push({ loc: loc, sx: px, sy: py, r: pr+8 });
      });
    }

    // ── Popover ───────────────────────────────────────────────────────────

    function isMobile() { return window.innerWidth < 640; }

    function positionPopover(pinScreenX, pinScreenY) {
      popover.style.display = 'flex';
      // Force layout so dimensions are real
      var pw = popover.offsetWidth  || 240;
      var ph = popover.offsetHeight || 360;
      var vw = window.innerWidth, vh = window.innerHeight;

      var left, top;
      if (isMobile()) {
        // Center in viewport on mobile
        left = Math.round((vw - pw) / 2);
        top  = Math.round((vh - ph) / 2);
      } else {
        var globeRect = gc_el.getBoundingClientRect();
        var absX = globeRect.left + pinScreenX;
        var absY = globeRect.top  + pinScreenY;
        left = absX + 18;
        top  = absY - Math.round(ph / 2);
        // Flip left if near right edge
        if (left + pw > vw - 16) { left = absX - pw - 18; }
        // Clamp vertical
        if (top < 8)          top = 8;
        if (top + ph > vh - 8) top = vh - ph - 8;
      }

      popover.style.left = left + 'px';
      popover.style.top  = top  + 'px';
    }

    function renderPopover() {
      if (!activeLoc) return;
      popPlace.textContent = activeLoc.name;
      var src = activeLoc.photos[activePhotoIdx];

      loadGen++;
      var myGen = loadGen;
      popImg.style.opacity = '0';

      var img = new Image();
      img.onload = function() {
        if (myGen !== loadGen) return;
        popImg.src = src;
        popImg.style.opacity = '1';
      };
      img.onerror = function() {
        if (myGen !== loadGen) return;
        popImg.src = src;
        popImg.style.opacity = '0.35';
      };
      img.src = src;

      // Rebuild thumbnails — clicking one swaps main image
      popThumbs.innerHTML = '';
      activeLoc.photos.forEach(function(thumbSrc, i) {
        var t = document.createElement('img');
        t.src = thumbSrc;
        t.className = 'pop-thumb' + (i === activePhotoIdx ? ' active' : '');
        (function(idx, tsrc) {
          t.addEventListener('click', function() {
            activePhotoIdx = idx;
            // Update active class without full re-render to preserve image state
            popThumbs.querySelectorAll('.pop-thumb').forEach(function(th, ti) {
              th.classList.toggle('active', ti === idx);
            });
            // Load the selected image into main frame
            loadGen++;
            var g = loadGen;
            popImg.style.opacity = '0';
            var im = new Image();
            im.onload = function() {
              if (g !== loadGen) return;
              popImg.src = tsrc;
              popImg.style.opacity = '1';
            };
            im.onerror = function() {
              if (g !== loadGen) return;
              popImg.src = tsrc;
              popImg.style.opacity = '0.35';
            };
            im.src = tsrc;
          });
        })(i, thumbSrc);
        popThumbs.appendChild(t);
      });

      var multi = activeLoc.photos.length > 1;
      if (popPrev) popPrev.style.display = multi ? '' : 'none';
      if (popNext) popNext.style.display = multi ? '' : 'none';
    }

    function showPopover(loc, pinSX, pinSY) {
      activeLoc = loc;
      activePhotoIdx = 0;
      renderPopover();
      positionPopover(pinSX, pinSY);
    }

    function hidePopover() {
      activeLoc = null;
      loadGen++; // cancel any pending image loads
      if (popover) popover.style.display = 'none';
    }

    if (popClose) popClose.addEventListener('click', function(e) {
      e.stopPropagation();
      hidePopover();
    });

    if (popPrev) popPrev.addEventListener('click', function(e) {
      e.stopPropagation();
      if (!activeLoc) return;
      activePhotoIdx = (activePhotoIdx - 1 + activeLoc.photos.length) % activeLoc.photos.length;
      renderPopover();
    });

    if (popNext) popNext.addEventListener('click', function(e) {
      e.stopPropagation();
      if (!activeLoc) return;
      activePhotoIdx = (activePhotoIdx + 1) % activeLoc.photos.length;
      renderPopover();
    });

    // Close popover on outside click
    document.addEventListener('click', function(e) {
      if (!popover || popover.style.display === 'none') return;
      if (!popover.contains(e.target) && e.target !== gc_el) {
        hidePopover();
      }
    });

    // ── Globe resize + loop ───────────────────────────────────────────────

    function setGlobeSize() {
      var wrap = gc_el.parentElement;
      var w = Math.round(wrap.getBoundingClientRect().width) || 400;
      gc_el.width  = w;
      gc_el.height = w;
    }

    function globeLoop() {
      if (!isDragging) { rotY += spinV; }
      drawGlobe();
      requestAnimationFrame(globeLoop);
    }

    // ── Input handling ────────────────────────────────────────────────────

    function clientXY(e) {
      if (e.touches && e.touches.length)               return { x: e.touches[0].clientX,       y: e.touches[0].clientY };
      if (e.changedTouches && e.changedTouches.length) return { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
      return { x: e.clientX, y: e.clientY };
    }

    function startDrag(e) {
      isDragging = true; spinV = 0; dragVX = 0; dragVY = 0;
      var p = clientXY(e); lastMX = p.x; lastMY = p.y;
      e.preventDefault();
    }

    function moveDrag(e) {
      if (!isDragging) return;
      var p = clientXY(e);
      dragVX = (p.x - lastMX) * 0.006;
      dragVY = (p.y - lastMY) * 0.006;
      // drag left exposes the right (east) side: subtract dragVX
      rotY -= dragVX;
      rotX = Math.max(-1.3, Math.min(1.3, rotX + dragVY));
      lastMX = p.x; lastMY = p.y;
    }

    function endDrag(e) {
      if (!isDragging) return;
      isDragging = false;
      spinV = -dragVX * 0.4;
      if (Math.abs(spinV) < 0.0005) spinV = 0.0015;

      // Treat as click only if movement was tiny
      if (Math.abs(dragVX) < 0.004 && Math.abs(dragVY) < 0.004) {
        var rect = gc_el.getBoundingClientRect();
        var p = clientXY(e);
        var mx = p.x - rect.left, my = p.y - rect.top;
        var hit = null, best = Infinity;
        projectedPins.forEach(function(pin) {
          var d = Math.sqrt((mx-pin.sx)*(mx-pin.sx) + (my-pin.sy)*(my-pin.sy));
          if (d < pin.r && d < best) { best = d; hit = pin; }
        });
        if (hit) {
          if (activeLoc && activeLoc.name === hit.loc.name) hidePopover();
          else showPopover(hit.loc, hit.sx, hit.sy);
        }
      }
    }

    gc_el.addEventListener('mousedown',  startDrag);
    gc_el.addEventListener('touchstart', startDrag, { passive: false });
    window.addEventListener('mousemove', moveDrag);
    window.addEventListener('touchmove', moveDrag, { passive: true });
    window.addEventListener('mouseup',   endDrag);
    window.addEventListener('touchend',  endDrag);

    window.addEventListener('resize', function() {
      setGlobeSize();
      // Reposition popover if open
      if (activeLoc && popover && popover.style.display !== 'none') {
        positionPopover(0, 0); // recenters on mobile, roughly repositions on desktop
      }
    });

    setGlobeSize();
    globeLoop();
  }

})();