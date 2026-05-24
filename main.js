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

    // Start rotated to show Americas centered
    var rotX = 0.3, rotY = 1.8;
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
      // ── North America (main body) ──────────────────────────────────────
      [[71,-141],[70,-137],[69,-140],[67,-139],[60,-141],[58,-137],[56,-133],
       [54,-130],[50,-127],[49,-124],[48,-123],[44,-124],[40,-124],[37,-122],
       [35,-121],[32,-117],[29,-114],[25,-110],[22,-106],[19,-104],[16,-97],
       [15,-92],[14,-90],[15,-88],[16,-86],[14,-83],[10,-83],[9,-79],[8,-77],
       [9,-79],[10,-75],[10,-62],[16,-61],[18,-66],[18,-68],[19,-69],[21,-72],
       [24,-74],[25,-77],[27,-80],[28,-80],[30,-81],[31,-81],[33,-79],[35,-76],
       [37,-76],[38,-75],[39,-74],[40,-74],[41,-70],[42,-70],[43,-70],[44,-67],
       [45,-66],[46,-64],[44,-63],[47,-61],[50,-56],[52,-55],[55,-57],[57,-60],
       [59,-64],[59,-67],[61,-69],[63,-73],[65,-76],[67,-80],[68,-88],[68,-95],
       [70,-96],[71,-103],[72,-108],[72,-120],[73,-130],[72,-140],[71,-141]],
      // ── Alaska ────────────────────────────────────────────────────────
      [[60,-141],[61,-145],[61,-150],[60,-152],[59,-153],[57,-152],[56,-154],
       [55,-160],[55,-163],[57,-170],[60,-166],[63,-163],[65,-168],[66,-163],
       [64,-158],[65,-152],[66,-145],[64,-141],[63,-142],[62,-141],[60,-141]],
      // ── Greenland ─────────────────────────────────────────────────────
      [[60,-43],[62,-42],[64,-40],[66,-34],[68,-26],[70,-22],[75,-20],[78,-18],
       [81,-20],[83,-30],[83,-42],[82,-52],[80,-62],[77,-66],[76,-65],[72,-57],
       [70,-52],[67,-52],[65,-50],[62,-46],[60,-43]],
      // ── Central America ───────────────────────────────────────────────
      [[16,-90],[15,-89],[14,-90],[13,-89],[12,-87],[11,-86],[10,-85],[9,-83],
       [9,-80],[8,-77],[9,-79],[10,-83],[10,-88],[12,-87],[13,-89],[15,-89],
       [16,-90]],
      // ── South America ─────────────────────────────────────────────────
      [[12,-72],[11,-73],[10,-75],[8,-77],[6,-77],[4,-76],[2,-77],[0,-78],
       [-2,-80],[-5,-81],[-8,-80],[-14,-76],[-17,-72],[-18,-70],[-22,-68],
       [-24,-70],[-27,-70],[-32,-71],[-36,-72],[-40,-72],[-42,-74],[-44,-67],
       [-46,-66],[-48,-75],[-50,-68],[-52,-69],[-54,-67],[-55,-64],[-54,-64],
       [-52,-60],[-50,-57],[-48,-57],[-46,-65],[-44,-63],[-42,-63],[-40,-62],
       [-38,-57],[-34,-53],[-28,-49],[-24,-44],[-20,-40],[-15,-39],[-10,-37],
       [-7,-35],[-4,-37],[-2,-39],[-1,-50],[3,-52],[6,-53],[8,-60],[10,-62],
       [11,-62],[12,-71],[12,-72]],
      // ── Europe (main) ─────────────────────────────────────────────────
      [[36,-6],[36,-9],[38,-9],[39,-9],[41,-9],[43,-9],[44,-8],[45,-2],[44,0],
       [43,3],[42,3],[41,2],[40,4],[38,0],[37,-2],[36,-6]],
      [[36,-6],[37,0],[38,8],[38,15],[37,14],[37,16],[38,16],[39,16],[40,18],
       [41,19],[42,19],[43,17],[45,14],[46,14],[47,16],[48,17],[50,18],[51,17],
       [52,14],[54,12],[55,12],[56,10],[57,8],[58,7],[58,5],[59,5],[60,5],
       [62,5],[63,8],[65,12],[67,14],[69,16],[70,25],[70,20],[69,18],[68,17],
       [67,16],[65,14],[63,10],[62,5],[60,5],[58,5],[57,8],[56,10],[55,10],
       [52,14],[50,14],[51,12],[50,12],[49,12],[48,9],[48,8],[46,7],[44,7],
       [43,5],[42,4],[41,4],[40,4],[38,1],[37,-2],[36,-6]],
      // ── Scandinavia ───────────────────────────────────────────────────
      [[57,8],[58,7],[62,5],[63,8],[65,12],[67,14],[69,16],[70,28],[70,25],
       [69,18],[68,16],[67,15],[66,14],[65,13],[63,10],[62,5],[60,5],[58,5],
       [57,8]],
      // ── UK ────────────────────────────────────────────────────────────
      [[50,-5],[51,-5],[51,-3],[53,-4],[54,-4],[56,-6],[58,-6],[58,-5],[60,-2],
       [58,0],[55,2],[53,2],[52,2],[51,2],[51,1],[50,0],[50,-2],[50,-5]],
      [[57,-7],[58,-6],[58,-4],[57,-6],[57,-7]],
      // ── Iceland ───────────────────────────────────────────────────────
      [[63,-24],[63,-20],[64,-15],[65,-13],[66,-13],[66,-18],[65,-24],[63,-24]],
      // ── Africa ────────────────────────────────────────────────────────
      [[37,10],[37,11],[36,10],[30,32],[25,37],[20,38],[15,42],[12,44],[11,43],
       [8,40],[5,38],[2,41],[0,42],[-2,41],[-4,40],[-6,39],[-9,35],[-12,35],
       [-15,35],[-18,35],[-20,35],[-23,34],[-26,33],[-29,32],[-32,28],[-34,26],
       [-35,24],[-35,20],[-34,18],[-30,17],[-27,16],[-25,15],[-22,14],[-18,12],
       [-15,11],[-10,15],[-5,15],[0,15],[2,17],[5,15],[8,15],[10,15],[12,16],
       [15,17],[20,38],[25,37],[30,32],[33,30],[33,25],[33,20],[37,14],[37,10]],
      // ── Arabian Peninsula ─────────────────────────────────────────────
      [[16,43],[12,44],[12,43],[15,42],[20,37],[25,37],[28,35],[30,32],
       [28,34],[24,38],[20,40],[15,43],[16,43]],
      // ── Asia (main body) ──────────────────────────────────────────────
      [[37,27],[38,27],[40,28],[41,29],[42,29],[44,29],[46,29],[47,28],[48,25],
       [45,25],[46,22],[48,18],[50,18],[52,14],[55,12],[57,10],[60,5],[63,5],
       [66,14],[70,25],[72,38],[72,50],[70,60],[68,70],[68,90],[70,110],
       [70,130],[65,140],[62,140],[58,132],[57,130],[55,130],[50,140],[48,135],
       [45,135],[43,132],[42,130],[38,122],[35,120],[32,120],[28,120],[25,120],
       [22,113],[20,110],[18,108],[15,108],[12,105],[10,104],[5,103],[1,104],
       [4,101],[5,100],[10,99],[13,100],[15,101],[15,100],[12,99],[10,98],[8,98],
       [5,100],[2,103],[0,104],[-1,104],[-5,105],[0,104],[4,102],[5,103],
       [10,104],[12,105],[15,108],[18,108],[20,110],[22,113],[25,120],[28,120],
       [30,121],[32,120],[35,120],[38,122],[40,125],[42,130],[43,132],[45,135],
       [47,138],[48,135],[50,140],[52,141],[55,130],[57,130],[58,132],[60,140],
       [63,140],[65,140],[67,140],[70,130],[70,120],[72,110],[72,100],[70,90],
       [68,70],[68,50],[70,40],[72,38],[72,30],[70,30],[67,30],[65,30],[62,30],
       [60,28],[57,27],[55,22],[52,20],[50,18],[48,18],[46,22],[45,25],[48,25],
       [47,28],[44,29],[42,29],[40,28],[38,27],[37,27]],
      // ── Indian Subcontinent ───────────────────────────────────────────
      [[8,77],[10,80],[13,80],[16,82],[18,84],[21,87],[24,89],[25,90],[28,95],
       [30,97],[32,77],[36,73],[36,70],[32,68],[24,68],[20,70],[16,73],[12,73],
       [8,77]],
      // ── Sri Lanka ─────────────────────────────────────────────────────
      [[10,80],[8,81],[7,81],[7,80],[8,80],[10,80]],
      // ── Japan (Honshu) ────────────────────────────────────────────────
      [[34,136],[35,135],[36,136],[37,137],[38,141],[40,141],[41,141],[43,141],
       [44,142],[43,140],[42,140],[40,139],[38,141],[36,136],[35,135],[34,136]],
      // ── Hokkaido ──────────────────────────────────────────────────────
      [[43,141],[44,142],[44,145],[43,144],[42,141],[43,141]],
      // ── Australia ─────────────────────────────────────────────────────
      [[-12,136],[-14,136],[-16,136],[-17,140],[-16,145],[-14,143],[-15,147],
       [-18,147],[-20,149],[-22,150],[-26,153],[-28,153],[-32,152],[-34,151],
       [-38,147],[-39,145],[-38,141],[-35,137],[-32,133],[-29,129],[-26,114],
       [-22,114],[-20,118],[-17,122],[-15,128],[-13,130],[-12,136]],
      // ── Tasmania ──────────────────────────────────────────────────────
      [[-41,146],[-43,147],[-43,148],[-42,148],[-41,146]],
      // ── New Zealand (South Island) ────────────────────────────────────
      [[-40,175],[-42,172],[-44,170],[-46,169],[-46,168],[-44,168],[-41,174],
       [-40,175]],
      // ── New Zealand (North Island) ────────────────────────────────────
      [[-37,175],[-38,177],[-39,177],[-38,175],[-36,174],[-34,173],[-37,175]],
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
      rotY += dragVX;
      rotX = Math.max(-1.3, Math.min(1.3, rotX + dragVY));
      lastMX = p.x; lastMY = p.y;
    }

    function endDrag(e) {
      if (!isDragging) return;
      isDragging = false;
      spinV = dragVX * 0.4;
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