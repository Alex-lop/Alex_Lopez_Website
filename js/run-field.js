/* The run field.
   A ruler of short ticks over the hero, lifted from the Nemisis kill field: ticks brighten and
   turn near a vertical focus line and in the pointer's wake. Here the focus line has a job.
   The latest run's GPS trace is drawn on the right; the red line follows the pointer (or
   sweeps on its own), snaps to the nearest point of the route, and reads out the mile. */
(function () {
  'use strict';
  var canvas = document.querySelector('[data-run-field]');
  if (!canvas) return;
  var ctx = canvas.getContext('2d', { alpha: false });
  var hero = canvas.parentElement;
  if (!ctx || !hero) return;

  var css = getComputedStyle(document.documentElement);
  function token(name, fallback) { return (css.getPropertyValue(name) || fallback).trim(); }
  var BG = token('--bg', '#0d1117'), INK = token('--ink', '#ecebe6');
  var MUTED = token('--muted', '#9aa0aa'), RED = token('--red', '#e6392d');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var FONT = '11px ui-monospace, "SF Mono", Menlo, monospace';

  var REVEAL_MS = 1400, DWELL_MS = 900, SWEEP_MS = 14000;
  var WAKE = [], WAKE_MAX = 32, WAKE_MS = 800, WAKE_RADIUS = 120;

  var W = 0, H = 0, dpr = 1, ticks = [], stage = null, narrow = false, tight = false;
  var focus = .5, target = .5, pointerU = null, pointerX = 0, pointerY = 0, pointerAt = -1e9;
  var mounted = performance.now(), raf = 0, running = false;
  var route = null, prevBest = 0, lastLx = 0;

  function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }
  function smooth(t) { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); }
  function easeOut(t) { t = clamp(t, 0, 1); return 1 - Math.pow(1 - t, 3); }
  function mmss(s) { s = Math.round(s); return (s / 60 | 0) + ':' + String(s % 60).padStart(2, '0'); }

  /* Google encoded polyline. Test vector: "_p~iF~ps|U_ulLnnqC_mqNvxq`@"
     -> [[38.5,-120.2],[40.7,-120.95],[43.252,-126.453]] */
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

  /* Decode once into unit space (equirectangular, aspect kept); the box centres it each frame. */
  function setRoute(meta) {
    if (route && route.meta.polyline === meta.polyline) { route.meta = meta; return; }
    var p = decodePolyline(meta.polyline || '');
    if (p.length < 2) return;
    var step = Math.ceil(p.length / 300);
    if (step > 1) p = p.filter(function (_, i) { return i % step === 0 || i === p.length - 1; });
    var c = Math.cos(p[0][0] * Math.PI / 180);
    var xy = p.map(function (q) { return [q[1] * c, -q[0]]; });
    var xs = xy.map(function (q) { return q[0]; }), ys = xy.map(function (q) { return q[1]; });
    var x0 = Math.min.apply(0, xs), y0 = Math.min.apply(0, ys);
    var w = Math.max.apply(0, xs) - x0, h = Math.max.apply(0, ys) - y0, s = Math.max(w, h) || 1;
    var u = xy.map(function (q) { return [(q[0] - x0) / s, (q[1] - y0) / s]; });
    var cum = [0], t = 0;
    for (var i = 1; i < u.length; i++) { t += Math.hypot(u[i][0] - u[i - 1][0], u[i][1] - u[i - 1][1]); cum.push(t); }
    route = { u: u, w: w / s, h: h / s, cum: cum.map(function (v) { return v / (t || 1); }), meta: meta, at: performance.now() };
    prevBest = 0;
    if (running && !raf) raf = requestAnimationFrame(frame);
  }
  function dateLabel(iso) {
    var d = new Date(iso + 'T12:00:00');
    return isNaN(d) ? String(iso).toUpperCase() : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();
  }
  window.__route = setRoute;

  function layout() {
    W = canvas.clientWidth; H = canvas.clientHeight;
    if (!W || !H) return;
    var ratio = Math.min(window.devicePixelRatio || 1, 2);
    dpr = ratio;
    var bw = Math.round(W * dpr), bh = Math.round(H * dpr);
    if (canvas.width !== bw) canvas.width = bw;
    if (canvas.height !== bh) canvas.height = bh;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    narrow = window.matchMedia('(max-width: 900px)').matches; tight = window.matchMedia('(max-width: 620px)').matches;
    stage = tight
      ? { x0: W * .08, x1: W * .92, y0: H - 262, y1: H - 96, labelY: H - 82, top: H - 290, bottom: H - 54 }
      : narrow
        ? { x0: W * .08, x1: W * .92, y0: H - 300, y1: H - 110, labelY: H - 88, top: H - 330, bottom: H - 62 }
        : { x0: W * .52, x1: W * .95, y0: H * .18, y1: H * .80, labelY: H * .86, top: 0, bottom: H };

    /* The tick field: a ruler over the whole hero, confined to the band when narrow. */
    var step = narrow ? 30 : 26;
    var cap = 1500, estimate = Math.ceil(W / step) * Math.ceil(H / step);
    if (estimate > cap) step *= Math.sqrt(estimate / cap);
    ticks = [];
    var ox = ((W % step) + step) / 2, oy = ((H % step) + step) / 2;
    var yMin = narrow ? stage.top : 0, yMax = narrow ? stage.bottom : H;
    for (var y = oy; y < H; y += step) {
      if (y < yMin || y > yMax) continue;
      for (var x = ox; x < W; x += step) ticks.push({ x: x, y: y });
    }
  }

  function focusX() { return stage.x0 + (stage.x1 - stage.x0) * focus; }

  function drawTicks(now, fx) {
    var reveal = easeOut((now - mounted) / REVEAL_MS);
    var buckets = [[], [], [], [], [], [], [], []];
    var live = [];
    for (var wi = 0; wi < WAKE.length; wi++) {
      var age = now - WAKE[wi].t;
      if (age < WAKE_MS) live.push({ x: WAKE[wi].x, y: WAKE[wi].y, e: 1 - age / WAKE_MS });
    }
    var mid = narrow ? (stage.top + stage.bottom) / 2 : H / 2;
    for (var i = 0; i < ticks.length; i++) {
      var t = ticks[i], d = Math.abs(t.x - fx);
      var near = 1 - smooth(d / 150), wake = 0;
      for (var li = 0; li < live.length; li++) {
        var dx = t.x - live[li].x, dy = t.y - live[li].y, dd = Math.sqrt(dx * dx + dy * dy);
        if (dd < WAKE_RADIUS) wake = Math.max(wake, (1 - smooth(dd / WAKE_RADIUS)) * live[li].e);
      }
      var angle = near * Math.PI / 2 * (t.y < mid ? 1 : -1) * .92;
      var len = 3.5 + near * 3 + wake * 4, alpha = (.10 + near * .42 + wake * .55) * reveal;
      var c = Math.cos(angle) * len, s = Math.sin(angle) * len;
      var b = Math.min(7, Math.floor(alpha * 14));
      buckets[b].push(t.x - c, t.y - s, t.x + c, t.y + s);
    }
    ctx.lineWidth = 1; ctx.strokeStyle = INK;
    for (var k = 0; k < buckets.length; k++) {
      var lines = buckets[k]; if (!lines.length) continue;
      ctx.globalAlpha = (k + .5) / 14;
      ctx.beginPath();
      for (var j = 0; j < lines.length; j += 4) { ctx.moveTo(lines[j], lines[j + 1]); ctx.lineTo(lines[j + 2], lines[j + 3]); }
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  function corner(x, y, sx, sy) {
    ctx.beginPath(); ctx.moveTo(x, y + 8 * sy); ctx.lineTo(x, y); ctx.lineTo(x + 8 * sx, y); ctx.stroke();
  }

  /* The route, the focus line, and the mile it is standing on. Returns the snapped line x. */
  function drawRoute(now, fx) {
    if (!route) return fx;
    var reveal = reduce ? 1 : easeOut((now - route.at) / REVEAL_MS);
    var u = route.u, n = u.length, m = route.meta;
    var inset = tight ? 14 : 0;
    var bw = stage.x1 - stage.x0 - inset * 2, bh = stage.y1 - stage.y0 - inset * 2;
    var k = Math.min(bw / (route.w || 1), bh / (route.h || 1));
    var ox = stage.x0 + inset + (bw - route.w * k) / 2, oy = stage.y0 + inset + (bh - route.h * k) / 2;
    route.uLo = (ox - stage.x0) / (stage.x1 - stage.x0); route.uHi = (ox + route.w * k - stage.x0) / (stage.x1 - stage.x0);
    function X(i) { return ox + u[i][0] * k; }
    function Y(i) { return oy + u[i][1] * k; }
    var end = Math.max(1, Math.floor(reveal * (n - 1)));

    ctx.globalAlpha = .35; ctx.strokeStyle = INK; ctx.lineWidth = 1;
    corner(stage.x0 + .5, stage.y0 + .5, 1, 1); corner(stage.x1 - .5, stage.y1 - .5, -1, -1);

    ctx.globalAlpha = .85; ctx.lineWidth = 1.25; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(X(0), Y(0));
    for (var i = 1; i <= end; i++) ctx.lineTo(X(i), Y(i));
    ctx.stroke();
    ctx.globalAlpha = 1; ctx.fillStyle = RED;
    ctx.fillRect(X(0) - 4.5, Y(0) - 4.5, 9, 9);

    ctx.font = FONT; ctx.fillStyle = MUTED; ctx.textBaseline = 'top'; ctx.globalAlpha = .9 * reveal;
    if (!tight) { ctx.textAlign = 'left'; ctx.fillText('LATEST RUN · ' + dateLabel(m.date) + ' · ' + String(m.place).toUpperCase(), stage.x0, stage.y0 - 18); }
    ctx.textAlign = 'right';
    ctx.fillText(Number(m.miles).toFixed(2) + ' MI · ' + mmss(m.pace_sec_per_mi) + ' /MI · ' + Math.round(m.elev_ft) + ' FT', stage.x1, stage.labelY);
    ctx.globalAlpha = 1;

    /* Where the line stands: nearest point to a live pointer, else nearest by x, with continuity. */
    var live = now - pointerAt < 4000 && pointerU != null;
    var best = prevBest, bd = Infinity, j;
    if (live && pointerX > stage.x0 - 40 && pointerX < stage.x1 + 40 && pointerY > stage.y0 - 40 && pointerY < stage.y1 + 40) {
      for (j = 0; j <= end; j++) { var dd = Math.hypot(X(j) - pointerX, Y(j) - pointerY); if (dd < bd) { bd = dd; best = j; } }
    } else {
      var near = [];
      for (j = 0; j <= end; j++) if (Math.abs(X(j) - fx) < 10) near.push(j);
      if (near.length) { bd = Infinity; for (j = 0; j < near.length; j++) { var di = Math.abs(near[j] - prevBest); if (di < bd) { bd = di; best = near[j]; } } }
      else { bd = Infinity; for (j = 0; j <= end; j++) { var dx = Math.abs(X(j) - fx); if (dx < bd) { bd = dx; best = j; } } }
    }
    prevBest = best;
    var lx = X(best), ly = Y(best);
    var lineAlpha = reduce ? 1 : easeOut((now - route.at - REVEAL_MS * .8) / 500);
    if (lineAlpha > 0) {
      ctx.globalAlpha = lineAlpha; ctx.strokeStyle = RED; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(lx + .5, stage.top); ctx.lineTo(lx + .5, stage.bottom); ctx.stroke();
      ctx.beginPath();
      for (var ty = stage.top + 24; ty < stage.bottom; ty += 48) { ctx.moveTo(lx - 5, ty + .5); ctx.lineTo(lx + 6, ty + .5); }
      ctx.stroke();
      ctx.fillStyle = RED; ctx.fillRect(lx - 2, ly - 2, 4, 4);
      var label = (route.cum[best] * Number(m.miles)).toFixed(1) + ' MI', flip = lx > stage.x1 - 60;
      ctx.textAlign = flip ? 'right' : 'left'; ctx.textBaseline = 'middle';
      ctx.fillText(label, flip ? lx - 9 : lx + 9, ly - 14);
      ctx.globalAlpha = 1;
    }
    return lx;
  }

  function frame(now) {
    raf = 0;
    if (!stage) layout();
    if (!stage) return;
    var idle = now - pointerAt > 4000, since = now - mounted;
    if (pointerU != null && !idle) target = pointerU;
    else if (!reduce) {
      /* Sweep the width of the trace itself, so the line and its mile readout never park at the box edge. */
      var lo = route && route.uLo != null ? route.uLo : .05, hi = route && route.uHi != null ? route.uHi : .95;
      target = since < DWELL_MS ? (lo + hi) / 2 : (lo + hi) / 2 + (hi - lo) / 2 * .98 * Math.sin((since - DWELL_MS) / SWEEP_MS * Math.PI * 2);
    }
    focus += (target - focus) * (reduce ? 1 : .07);
    var fx = focusX();
    ctx.fillStyle = BG; ctx.fillRect(0, 0, W, H);
    drawTicks(now, lastLx || fx);
    lastLx = drawRoute(now, fx);
    var settled = reduce && Math.abs(target - focus) < .0005 && now - mounted > REVEAL_MS * 1.5 && !WAKE.length;
    if (WAKE.length && now - WAKE[WAKE.length - 1].t > WAKE_MS) WAKE.length = 0;
    if (running && !settled) raf = requestAnimationFrame(frame);
  }
  function start() { if (!running) { running = true; } if (!raf) raf = requestAnimationFrame(frame); }
  function stop() { running = false; if (raf) { cancelAnimationFrame(raf); raf = 0; } }

  function setPointer(clientX, clientY) {
    var rect = canvas.getBoundingClientRect();
    if (clientY < rect.top || clientY > rect.bottom) return;
    var x = (clientX - rect.left) * (W / rect.width), y = (clientY - rect.top) * (H / rect.height);
    pointerX = x; pointerY = y;
    pointerU = clamp((x - stage.x0) / (stage.x1 - stage.x0), 0, 1);
    pointerAt = performance.now();
    var last = WAKE[WAKE.length - 1];
    if (!last || Math.abs(last.x - x) + Math.abs(last.y - y) > 8) {
      WAKE.push({ x: x, y: y, t: pointerAt });
      if (WAKE.length > WAKE_MAX) WAKE.shift();
    }
    start();
  }
  hero.addEventListener('pointermove', function (e) { if (stage) setPointer(e.clientX, e.clientY); }, { passive: true });
  hero.addEventListener('pointerdown', function (e) { if (stage) setPointer(e.clientX, e.clientY); }, { passive: true });
  hero.addEventListener('pointerleave', function () { pointerAt = performance.now() - 3000; });

  var resize = window.ResizeObserver ? new ResizeObserver(function () { layout(); start(); }) : null;
  if (resize) resize.observe(hero); else window.addEventListener('resize', function () { layout(); start(); });
  if (window.IntersectionObserver) {
    new IntersectionObserver(function (entries) { entries[0].isIntersecting ? start() : stop(); }, { threshold: .02 }).observe(hero);
  }
  document.addEventListener('visibilitychange', function () { document.hidden ? stop() : start(); });

  layout();
  if (canvas.dataset.route) {
    setRoute({ polyline: canvas.dataset.route, miles: canvas.dataset.miles, pace_sec_per_mi: canvas.dataset.pace,
               elev_ft: canvas.dataset.elev, date: canvas.dataset.date, place: canvas.dataset.place });
  }
  start();
})();
