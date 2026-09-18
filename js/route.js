/* The route trace: frame corners and a pulsing start dot, then a runner dot walking the latest
   run's polyline over 120s, line drawing behind it, mile markers, a counting readout, and
   hover/drag/arrow scrubbing. Decoder lifted from js/run-field.js at 1669e62. */
(function () {
  'use strict';
  var canvas = document.getElementById('route');
  if (!canvas) return;
  var ctx = canvas.getContext('2d'); /* alpha on: the | field shows through */
  if (!ctx) return;

  var box = document.querySelector('[data-route-readout]'), ro = {};
  ['dist', 'time', 'pace', 'extra'].forEach(function (k) { ro[k] = box && box.querySelector('[data-ro="' + k + '"]'); });
  var css = getComputedStyle(document.documentElement);
  function token(n, f) { return (css.getPropertyValue(n) || f).trim(); }
  var INK = token('--ink', '#171613'), ACCENT = token('--accent', '#1a5fff'), PAPER = token('--paper', '#f5f5f0');
  var RUN = 120000, HOLD = 8000, PULSE = 1500, FRAME = 33, FONT = '11px system-ui, sans-serif';
  var mq = window.matchMedia('(prefers-reduced-motion: reduce)');

  var R = null, S = null, W = 0, H = 0, g = null, rect = null;
  var phase = 'start', pulseT = 0, elapsed = 0, holdT = 0, last = 0, raf = 0, drawnAt = 0, combAt = 0;
  var onScreen = false, hidden = document.hidden, reduce = mq.matches, lastMile = -1;
  var hover = false, drag = false, origin = null, keyUntil = 0, scrubF = 0, shownF = 0;

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function mmss(s) {
    s = Math.max(0, Math.round(s));
    var h = (s / 3600) | 0, m = ((s % 3600) / 60) | 0, p = function (n) { return (n < 10 ? '0' : '') + n; };
    return (h ? h + ':' + p(m) : m) + ':' + p(s % 60);
  }
  /* last i with arr[i] <= v, clamped so i+1 is always a neighbour */
  function idxOf(arr, v) {
    var lo = 0, hi = arr.length - 1, m;
    while (hi - lo > 1) { m = (lo + hi) >> 1; if (arr[m] <= v) lo = m; else hi = m; }
    return lo;
  }
  function lerpAt(xs, ys, v) {
    var i = idxOf(xs, v), d = xs[i + 1] - xs[i];
    return ys[i] + (ys[i + 1] - ys[i]) * (d > 0 ? clamp((v - xs[i]) / d, 0, 1) : 0);
  }

  function decodePolyline(s) {
    var pts = [], i = 0, lat = 0, lng = 0;
    while (i < s.length) {
      for (var k = 0; k < 2; k++) {
        var b, shift = 0, result = 0;
        do { b = s.charCodeAt(i++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
        var d = (result & 1) ? ~(result >> 1) : (result >> 1);
        if (k === 0) lat += d; else lng += d;
      }
      pts.push([lat * 1e-5, lng * 1e-5]);
    }
    return pts;
  }
  (function () { /* the old comment's test vector, as a real check */
    var got = decodePolyline('_p~iF~ps|U_ulLnnqC_mqNvxq`@');
    var ok = got.length === 3 && [[38.5, -120.2], [40.7, -120.95], [43.252, -126.453]].every(function (p, i) {
      return Math.abs(got[i][0] - p[0]) < 1e-9 && Math.abs(got[i][1] - p[1]) < 1e-9;
    });
    if (!ok) console.error('route.js: polyline decoder failed its test vector', got);
  })();

  /* Decode once into unit space (equirectangular, aspect kept); cumulative chord length 0-1. */
  function setRoute(meta) {
    if (!meta || !meta.polyline) return;
    /* same route, new keys: merge so a fetch that lacks a seeded key (moving_time_s) keeps it */
    if (R && R.meta.polyline === meta.polyline) { R.meta = Object.assign({}, R.meta, meta); setStreams(); repaint(); return; }
    var p = decodePolyline(meta.polyline), i;
    if (p.length < 2) return;
    var c = Math.cos(p[0][0] * Math.PI / 180);
    var xy = p.map(function (q) { return [q[1] * c, -q[0]]; });
    var x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (i = 0; i < xy.length; i++) {
      x0 = Math.min(x0, xy[i][0]); x1 = Math.max(x1, xy[i][0]);
      y0 = Math.min(y0, xy[i][1]); y1 = Math.max(y1, xy[i][1]);
    }
    var s = Math.max(x1 - x0, y1 - y0) || 1, cum = [0], t = 0;
    var u = xy.map(function (q) { return [(q[0] - x0) / s, (q[1] - y0) / s]; });
    for (i = 1; i < u.length; i++) cum.push(t += Math.hypot(u[i][0] - u[i - 1][0], u[i][1] - u[i - 1][1]));
    for (i = 0; i < cum.length; i++) cum[i] /= t || 1;
    R = { u: u, w: (x1 - x0) / s, h: (y1 - y0) / s, cum: cum, meta: meta };
    setStreams(); layout(); reset(); sync(); repaint();
  }
  function setStreams() {
    var s = R && R.meta.streams;
    S = (s && s.time && s.miles && s.time.length > 1 && s.time.length === s.miles.length) ? s : null;
  }
  function miles() { return Number(R.meta.miles) || 0; }
  function total() { return (S ? S.time[S.time.length - 1] : Number(R.meta.moving_time_s)) || 1; }
  /* the two directions between distance and activity time; without streams, constant speed */
  function tauOf(f) { return S ? lerpAt(S.miles, S.time, f * miles()) : f * total(); }
  function fracOf(tau) { return clamp(S ? lerpAt(S.time, S.miles, tau) / (miles() || 1) : tau / total(), 0, 1); }

  function layout() {
    var w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    W = w; H = h;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var ix = w * 0.08, iy = h * 0.08, bw = w - 2 * ix, bh = h - 2 * iy;
    var rw = R ? R.w || 1 : 1, rh = R ? R.h || 1 : 1, k = Math.min(bw / rw, bh / rh);
    g = { k: k, ox: ix + (bw - rw * k) / 2, oy: iy + (bh - rh * k) / 2, x0: ix, y0: iy, x1: w - ix, y1: h - iy };
  }
  function px(i) { return g.ox + R.u[i][0] * g.k; }
  function py(i) { return g.oy + R.u[i][1] * g.k; }
  /* point and local segment direction at a fraction of cumulative chord length */
  function at(f) {
    var i = idxOf(R.cum, clamp(f, 0, 1)), d = R.cum[i + 1] - R.cum[i];
    var t = d > 0 ? (clamp(f, 0, 1) - R.cum[i]) / d : 0;
    var ax = px(i), ay = py(i), dx = px(i + 1) - ax, dy = py(i + 1) - ay;
    return { x: ax + dx * t, y: ay + dy * t, i: i, dx: dx, dy: dy };
  }

  function corner(x, y, sx, sy) {
    ctx.beginPath(); ctx.moveTo(x, y + 8 * sy); ctx.lineTo(x, y); ctx.lineTo(x + 8 * sx, y); ctx.stroke();
  }
  function corners() {
    ctx.globalAlpha = 0.35; ctx.strokeStyle = INK; ctx.lineWidth = 1;
    corner(g.x0 + 0.5, g.y0 + 0.5, 1, 1); corner(g.x1 - 0.5, g.y0 + 0.5, -1, 1);
    corner(g.x0 + 0.5, g.y1 - 0.5, 1, -1); corner(g.x1 - 0.5, g.y1 - 0.5, -1, -1);
    ctx.globalAlpha = 1;
  }
  function dot(x, y, r) { ctx.fillStyle = ACCENT; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); }
  function label(x, y, text) {
    ctx.font = FONT; ctx.textBaseline = 'top'; ctx.textAlign = 'left';
    var w = ctx.measureText(text).width;
    var lx = clamp(x + 6, 2, Math.max(2, W - w - 4)), ly = clamp(y - 15, 2, H - 15);
    ctx.fillStyle = PAPER; ctx.fillRect(lx - 2, ly - 2, w + 4, 15);
    ctx.fillStyle = INK; ctx.fillText(text, lx, ly);
  }
  function set(el, txt) { if (el && el.textContent !== txt) el.textContent = txt; }

  function readout(f, tau) {
    set(ro.dist, (f * miles()).toFixed(2) + ' mi');
    set(ro.time, mmss(tau));
    var pace = '', extra = '';
    if (S && S.pace_sec_per_mi) {
      var i = idxOf(S.time, tau), p = S.pace_sec_per_mi[i], bits = [];
      pace = p == null ? 'stopped' : mmss(p) + ' /mi';
      if (S.hr && S.hr[i] != null) bits.push(Math.round(S.hr[i]) + ' bpm');
      if (S.alt_ft && S.alt_ft[i] != null) bits.push(Math.round(S.alt_ft[i]) + ' ft');
      extra = bits.join(' · ');
    } else if (Number(R.meta.pace_sec_per_mi)) pace = mmss(R.meta.pace_sec_per_mi) + ' /mi';
    set(ro.pace, pace); set(ro.extra, extra);
  }

  /* One fraction decides everything drawn, so scrubbing back removes markers as it goes. */
  function paint(f) {
    if (!R || !g) return;
    shownF = f = clamp(f, 0, 1);
    var tau = tauOf(f), head = at(f), mi = f * miles(), splits = R.meta.splits, i;
    ctx.clearRect(0, 0, W, H);
    corners();
    ctx.globalAlpha = 0.85; ctx.strokeStyle = INK; ctx.lineWidth = 1.5;
    ctx.lineJoin = ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(px(0), py(0));
    for (i = 1; i <= head.i; i++) ctx.lineTo(px(i), py(i));
    ctx.lineTo(head.x, head.y); ctx.stroke();
    ctx.globalAlpha = 1;
    dot(px(0), py(0), 4);
    for (var k = 1; k <= Math.floor(mi); k++) {
      var m = at(k / (miles() || 1)), sp = splits && splits[k - 1];
      ctx.fillStyle = ACCENT; ctx.fillRect(m.x - 1.5, m.y - 1.5, 3, 3);
      label(m.x, m.y, k + ' mi' + (sp && sp.pace_sec_per_mi ? ' · ' + mmss(sp.pace_sec_per_mi) : ''));
    }
    dot(head.x, head.y, 4);
    readout(f, tau);
    emit(mi, f, tau, false);
    if (!reduce && (head.dx || head.dy)) comb(head);
  }

  function paintStart(now) {
    if (!R || !g) return;
    ctx.clearRect(0, 0, W, H);
    corners();
    dot(px(0), py(0), 4 + 1.5 * (1 - Math.cos(now / PULSE * Math.PI * 2))); /* 4 -> 7px, 1.5s */
    shownF = 0;
    readout(0, 0);
  }

  function comb(head) {
    var now = performance.now(), f = window.__field;
    if (now - combAt < FRAME || !f || !f.comb || !rect) return;
    combAt = now;
    /* the field measures angles from vertical: atan2(dx, -dy), same as its own wake */
  f.comb(rect.left + head.x * (rect.width / W), rect.top + head.y * (rect.height / H), Math.atan2(head.dx, -head.dy));
  }
  function emit(mile, fraction, t, reset) {
    var f = Math.floor(mile);
    if (f === lastMile && !reset) return;
    lastMile = f;
    document.dispatchEvent(new CustomEvent('route:at', { detail: { mile: mile, fraction: fraction, t: t, reset: !!reset } }));
  }

  function scrubbing() { return hover || drag || performance.now() < keyUntil; }
  function reset() { phase = 'start'; pulseT = elapsed = holdT = 0; lastMile = 0; emit(0, 0, 0, true); }
  function release(f) { /* reseat the 120s clock where the scrub left the dot */
    elapsed = clamp(tauOf(f) / total(), 0, 1) * RUN;
    phase = elapsed >= RUN ? 'hold' : 'run';
    holdT = 0; last = performance.now();
  }

  function frame(now) {
    raf = requestAnimationFrame(frame);
    if (now - drawnAt < FRAME) return; /* 30fps */
    drawnAt = now;
    var dt = Math.min(now - last, 50);
    last = now;
    if (keyUntil && now >= keyUntil) { keyUntil = 0; release(scrubF); }
    rect = canvas.getBoundingClientRect();
    if (scrubbing()) return paint(scrubF);
    if (phase === 'start') {
      pulseT += dt;
      if (pulseT < PULSE) return paintStart(now);
      phase = 'run';
    }
    if (phase === 'run') {
      elapsed += dt;
      if (elapsed >= RUN) { elapsed = RUN; phase = 'hold'; holdT = 0; }
      return paint(phase === 'hold' ? 1 : fracOf(elapsed / RUN * total()));
    }
    holdT += dt;
    if (holdT >= HOLD) { reset(); return paintStart(now); }
    paint(1);
  }
  function repaint() {
    if (!R) return;
    if (!g) layout();
    if (!g) return;
    rect = canvas.getBoundingClientRect();
    if (scrubbing()) paint(scrubF);
    else if (reduce) paint(1);
    else if (phase === 'start') paintStart(performance.now());
    else paint(phase === 'run' ? fracOf(elapsed / RUN * total()) : 1);
  }
  function sync() {
    if (onScreen && !hidden && !reduce) {
      if (!raf && R) { last = drawnAt = performance.now(); raf = requestAnimationFrame(frame); }
    } else if (raf) { cancelAnimationFrame(raf); raf = 0; repaint(); }
  }

  /* Scrub: nearest polyline point by squared distance. <= 800 points, cheap at 30fps. */
  function scrubTo(clientX, clientY) {
    if (!R || !g) return;
    rect = canvas.getBoundingClientRect();
    var x = (clientX - rect.left) * (W / rect.width), y = (clientY - rect.top) * (H / rect.height);
    var best = 0, bd = Infinity;
    for (var i = 0; i < R.u.length; i++) {
      var dx = px(i) - x, dy = py(i) - y, d = dx * dx + dy * dy;
      if (d < bd) { bd = d; best = i; }
    }
    scrubF = R.cum[best];
    if (phase === 'start') { phase = 'run'; pulseT = PULSE; }
    paint(scrubF);
  }
  function endScrub() {
    if (!hover && !drag) return;
    hover = drag = false; origin = null;
    release(scrubF);
    if (!raf) repaint();
  }
  canvas.addEventListener('pointerdown', function (e) { /* never preventDefault on touch */
    if (e.pointerType === 'touch') { origin = { x: e.clientX, y: e.clientY, id: e.pointerId }; return; }
    hover = true; scrubTo(e.clientX, e.clientY);
  });
  canvas.addEventListener('pointermove', function (e) {
    if (e.pointerType !== 'touch') { hover = true; return scrubTo(e.clientX, e.clientY); }
    if (drag) return scrubTo(e.clientX, e.clientY);
    if (!origin) return;
    var dx = e.clientX - origin.x, dy = e.clientY - origin.y;
    if (Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy)) { /* clearly horizontal: it's a scrub */
      drag = true;
      try { canvas.setPointerCapture(origin.id); } catch (err) { /* a nicety */ }
      scrubTo(e.clientX, e.clientY);
    }
  });
  canvas.addEventListener('pointerleave', endScrub);
  canvas.addEventListener('pointerup', function () { origin = null; endScrub(); });
  canvas.addEventListener('pointercancel', function () { origin = null; endScrub(); });
  canvas.addEventListener('keydown', function (e) {
    var step = e.shiftKey ? 1 / 20 : 1 / 200, f;
    if (e.key === 'ArrowLeft') f = shownF - step;
    else if (e.key === 'ArrowRight') f = shownF + step;
    else if (e.key === 'Home') f = 0;
    else if (e.key === 'End') f = 1;
    else return;
    e.preventDefault();
    scrubF = clamp(f, 0, 1);
    keyUntil = performance.now() + 1500;
    if (phase === 'start') { phase = 'run'; pulseT = PULSE; }
    if (R && g) { rect = canvas.getBoundingClientRect(); paint(scrubF); }
  });

  if (window.ResizeObserver) new ResizeObserver(function () { layout(); repaint(); }).observe(canvas);
  else window.addEventListener('resize', function () { layout(); repaint(); });
  if (window.IntersectionObserver) new IntersectionObserver(function (es) { onScreen = es[0].isIntersecting; sync(); }, { threshold: 0.25 }).observe(canvas);
  else onScreen = true;
  document.addEventListener('visibilitychange', function () { hidden = document.hidden; sync(); });
  function modeChange() { reduce = mq.matches; sync(); repaint(); }
  if (mq.addEventListener) mq.addEventListener('change', modeChange); else mq.addListener(modeChange);

  window.__route = setRoute;
  var d = canvas.dataset;
  if (d.route) setRoute({ polyline: d.route, miles: d.miles, pace_sec_per_mi: d.pace, elev_ft: d.elev, date: d.date, place: d.place, moving_time_s: d.time });
})();
