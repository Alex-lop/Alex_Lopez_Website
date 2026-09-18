/* The | field.
   A grid of short vertical ticks behind the whole page. Each tick springs toward a target angle:
   a slow idle wave plus the scroll lean, overridden near the pointer, along its wake, and under
   the route trace's comb point. Angles are measured from vertical and are symmetric, so every
   angle error is reduced modulo pi (a tick leaning +80 deg is 20 deg from one leaning -80).
   Strokes are batched into 8 opacity buckets: one beginPath/stroke per bucket, not per tick. */
(function () {
  'use strict';
  var canvas = document.getElementById('field');
  var ctx = canvas && canvas.getContext('2d');
  if (!ctx) return;

  var PI = Math.PI, RAF = requestAnimationFrame, now0 = performance.now.bind(performance);
  var R = 220, R2 = R * R;                                  // pointer radius
  var WR = 120, WR2 = WR * WR, WAKE_MS = 800, WAKE_MAX = 30; // wake points
  var CR = 140, CR2 = CR * CR, COMB_MS = 800;                // the single comb point
  var IDLE_MS = 20000, IDLE_FRAME = 50;                      // idle window, ~20fps gate
  var LEN = 9, GROW = 3, A0 = 0.08, A1 = 0.35, ASTEP = (A1 - A0) / 7;
  var SCROLL_K = 0.12, LEAN_MAX = 0.5, PASS = { passive: true };

  var mqReduce = matchMedia('(prefers-reduced-motion: reduce)');
  var mqFine = matchMedia('(hover: hover) and (pointer: fine)');
  var INK = (getComputedStyle(document.documentElement).getPropertyValue('--ink') || '#171613').trim();

  var W = 0, H = 0, gridW = 0, gridH = -1e3, ticks = [];
  var raf = 0, reduce = false, settling = false, lastDraw = -1e9;
  var pointer = false, px = 0, py = 0, wx = 0, wy = 0;
  var wake = [], wn = 0, wakeAt = -1e9, comb = null;
  var sy = 0, st = 0, sv = 0, inputAt = -1e9, rt = 0;
  var buckets = [[], [], [], [], [], [], [], []];

  var api = window.__field = { comb: setComb, static: false, frameMs: 0, frames: 0 };

  function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }
  function smooth(q) { return q * q * (3 - 2 * q); }
  function modPi(a) { return a - PI * Math.round(a / PI); }

  function build() {
    var tight = W <= 620, step = tight ? 34 : 26, cap = tight ? 600 : 1800;
    var est = Math.ceil(W / step) * Math.ceil(H / step);
    if (est > cap) step *= Math.sqrt(est / cap);
    ticks = [];
    var ox = ((W % step) + step) / 2, oy = ((H % step) + step) / 2;
    for (var y = oy; y < H; y += step)
      for (var x = ox; x < W; x += step) ticks.push({ x: x, y: y, a: 0, v: 0 });
  }

  function size() {
    W = canvas.clientWidth || innerWidth; H = canvas.clientHeight || innerHeight;
    var dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    /* Rebuild the grid only for a real layout change; a phone's address bar must not. */
    if (!ticks.length || W !== gridW || Math.abs(H - gridH) > 120) { gridW = W; gridH = H; build(); }
  }

  function draw(t0now) {
    var t0 = now0(), i, k, dx, dy, d2, w;
    var live = [];
    for (i = 0; i < wake.length; i++) {
      var age = t0now - wake[i].t;
      if (age < WAKE_MS) live.push({ x: wake[i].x, y: wake[i].y, d: wake[i].d, e: 1 - age / WAKE_MS });
    }
    var cE = comb ? Math.max(0, 1 - (t0now - comb.t) / COMB_MS) : 0;
    var amp = !reduce && mqFine.matches && t0now - inputAt < IDLE_MS ? 0.05 : 0;
    var lean = clamp(sv * SCROLL_K, -LEAN_MAX, LEAN_MAX);
    var maxV = 0, maxE = 0, n = ticks.length;
    for (i = 0; i < 8; i++) buckets[i].length = 0;

    for (i = 0; i < n; i++) {
      var t = ticks[i], x = t.x, y = t.y, m = 0;
      var target = lean + (amp ? amp * Math.sin(x * 0.004 + y * 0.003 + t0now * 0.0006) : 0);

      if (pointer) {
        dx = px - x; dy = py - y;
        if (dx < R && dx > -R && dy < R && dy > -R && (d2 = dx * dx + dy * dy) < R2) {
          w = 1 - smooth(Math.sqrt(d2) / R);
          target += modPi(Math.atan2(dx, -dy) - target) * w;
          m = w;
        }
      }
      for (k = 0; k < live.length; k++) {
        var p = live[k]; dx = p.x - x; dy = p.y - y;
        if (dx >= WR || dx <= -WR || dy >= WR || dy <= -WR) continue;
        if ((d2 = dx * dx + dy * dy) >= WR2) continue;
        w = (1 - smooth(Math.sqrt(d2) / WR)) * p.e;
        target += modPi(p.d - target) * w;
        if (w > m) m = w;
      }
      if (cE) {
        dx = comb.x - x; dy = comb.y - y;
        if (dx < CR && dx > -CR && dy < CR && dy > -CR && (d2 = dx * dx + dy * dy) < CR2) {
          w = (1 - smooth(Math.sqrt(d2) / CR)) * cE;
          target += modPi(comb.a - target) * w;
          if (w > m) m = w;
        }
      }

      var e = modPi(target - t.a);
      t.v += e * 0.12; t.v *= 0.82; t.a += t.v;
      var av = t.v < 0 ? -t.v : t.v, ae = e < 0 ? -e : e;
      if (av > maxV) maxV = av;
      if (ae > maxE) maxE = ae;

      var half = (LEN + m * GROW) / 2, s = Math.sin(t.a) * half, c = Math.cos(t.a) * half;
      var b = (m * 7 + 0.5) | 0;
      buckets[b > 7 ? 7 : b].push(x - s, y + c, x + s, y - c);
    }

    ctx.clearRect(0, 0, W, H);
    ctx.lineWidth = 1; ctx.strokeStyle = INK;
    for (i = 0; i < 8; i++) {
      var L = buckets[i];
      if (!L.length) continue;
      ctx.globalAlpha = A0 + i * ASTEP;
      ctx.beginPath();
      for (k = 0; k < L.length; k += 4) { ctx.moveTo(L[k], L[k + 1]); ctx.lineTo(L[k + 2], L[k + 3]); }
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    settling = maxV > 5e-4 || maxE > 1e-3;
    lastDraw = t0now;
    api.frames++;
    api.frameMs = now0() - t0;
  }

  function frame(t) {
    raf = 0;
    var y = pageYOffset, dt = t - st;
    if (dt <= 0) dt = 16;
    if (y !== sy) { sv += ((y - sy) / dt - sv) * 0.25; sy = y; inputAt = t; }
    else sv *= 0.85;                               // no new delta: let the lean spring back
    st = t;

    var driven = t - wakeAt < WAKE_MS || (comb && t - comb.t < COMB_MS) || sv > 1e-3 || sv < -1e-3;
    if (!driven) {
      var idleOpen = mqFine.matches && t - inputAt < IDLE_MS;
      if (!settling && !idleOpen) return;          // settled and idle window shut: no rAF pending
      if (t - lastDraw < IDLE_FRAME) { raf = RAF(frame); return; }
    }
    draw(t);
    raf = RAF(frame);
  }

  function kick() { if (!reduce && !raf) raf = RAF(frame); }
  function stop() { if (raf) { cancelAnimationFrame(raf); raf = 0; } }

  function onPoint(e) {
    px = e.clientX; py = e.clientY; pointer = true; inputAt = now0();
    var dx = px - wx, dy = py - wy;
    if (dx * dx + dy * dy > 64) {                  // a new wake point every 8px of travel
      wake[wn++ % WAKE_MAX] = { x: px, y: py, d: modPi(Math.atan2(dx, -dy)), t: inputAt };
      wx = px; wy = py; wakeAt = inputAt;
    }
    kick();
  }
  function onScroll() { inputAt = now0(); kick(); }   // the frame reads scrollY itself
  function onLeave() { pointer = false; kick(); }      // cursor left the window, or a finger lifted
  function onUp(e) { if (e.pointerType === 'touch') onLeave(); }

  function setComb(x, y, angle) {
    if (reduce) return;
    comb = { x: x, y: y, a: modPi(angle), t: now0() };
    kick();
  }

  function listen(on) {
    var m = on ? 'addEventListener' : 'removeEventListener';
    window[m]('pointermove', onPoint, PASS);
    window[m]('pointerdown', onPoint, PASS);
    window[m]('scroll', onScroll, PASS);
    window[m]('pointerup', onUp, PASS);
    document.documentElement[m]('mouseleave', onLeave, PASS);
  }

  function apply() {
    reduce = mqReduce.matches; api.static = reduce;
    stop(); listen(!reduce); size();
    if (reduce) {
      for (var i = 0; i < ticks.length; i++) { ticks[i].a = 0; ticks[i].v = 0; }
      pointer = false; sv = 0; comb = null;
      draw(now0()); api.frames = 1;
    } else {
      st = inputAt = now0(); sy = pageYOffset;
      draw(st); kick();
    }
  }

  addEventListener('resize', function () {
    clearTimeout(rt);
    rt = setTimeout(function () {
      size();
      if (reduce) { draw(now0()); api.frames = 1; } else kick();
    }, 150);
  }, PASS);

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) stop();
    else if (!reduce) { st = now0(); kick(); }
  });

  if (mqReduce.addEventListener) mqReduce.addEventListener('change', apply);
  else if (mqReduce.addListener) mqReduce.addListener(apply);

  if (document.readyState === 'complete') apply();
  else addEventListener('load', apply);
})();
