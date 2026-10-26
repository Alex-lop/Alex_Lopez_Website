/* Pace, grade-adjusted pace, heart rate, and cadence for the run on screen.
   The four switches open one chart. Grade-adjusted pace is Minetti's running-cost
   curve (the one Strava uses): equivalent flat pace from the grade over ~40m.
   Strava's cadence is one foot; steps per minute is twice that. A cadence the
   watch only averaged is a flat line, not a trace invented sample by sample. */
(function () {
  'use strict';
  var root = document.querySelector('[data-analysis]');
  if (!root) return;
  var canvas = root.querySelector('[data-plot]');
  var ctx = canvas && canvas.getContext('2d');
  if (!ctx) return;

  var fold = root.querySelector('[data-fold]');
  var clip = root.querySelector('[data-clip]');
  var chart = root.querySelector('[data-chart]');
  var slider = root.querySelector('[data-slider]');
  var read = root.querySelector('[data-read]');
  var row = root.querySelector('.metric-row');
  var ORDER = ['pace', 'gap', 'hr', 'cadence'];
  var NAME = { pace: 'Pace', gap: 'Grade adjusted pace', hr: 'Heart rate', cadence: 'Cadence' };
  var UNIT = { pace: 'per mile', gap: 'per mile', hr: 'beats per minute', cadence: 'steps per minute' };
  var FALLBACK = { pace: '#1c9fd0', gap: '#6e63d8', hr: '#d84b6c', cadence: '#c73d96' };
  var buttons = {}, avgs = {}, bits = {}, colors = {};
  ORDER.forEach(function (k) {
    buttons[k] = root.querySelector('[data-metric="' + k + '"]');
    avgs[k] = root.querySelector('[data-avg="' + k + '"]');
    var bit = document.createElement('span');
    bit.setAttribute('data-bit', k === 'pace' ? 'pace' : k);
    read.appendChild(bit);
    bits[k] = bit;
  });
  var distBit = document.createElement('span');
  distBit.setAttribute('data-bit', 'dist');
  read.insertBefore(distBit, read.firstChild);

  var mq = matchMedia('(prefers-reduced-motion: reduce)');
  function motionOff() { return mq.matches || document.documentElement.dataset.motion === 'off'; }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function num(v) { return v == null || v === '' || !isFinite(+v) ? null : +v; }
  function mmss(s) {
    s = Math.max(0, Math.round(s));
    return (s / 60 | 0) + ':' + String(s % 60).padStart(2, '0');
  }
  /* one-foot rpm under 120; a value already in steps per minute is left alone */
  function spm(c) {
    if (c == null || !isFinite(+c) || +c <= 0) return null;
    c = +c;
    return Math.round(c > 120 ? c : c * 2);
  }
  function minetti(g) {
    var i2 = g * g, i3 = i2 * g, i4 = i2 * i2, i5 = i4 * g;
    return 155.4 * i5 - 30.4 * i4 - 43.3 * i3 + 46.3 * i2 + 19.5 * g + 3.6;
  }
  function hasNumbers(arr) {
    return !!arr && arr.some(function (v) { return v != null && isFinite(v); });
  }
  function idxOf(xs, v) {
    var lo = 0, hi = xs.length - 1, m;
    if (hi < 1) return 0;
    while (hi - lo > 1) { m = (lo + hi) >> 1; if (xs[m] <= v) lo = m; else hi = m; }
    return lo;
  }
  function smooth(arr, r) {
    return arr.map(function (v, i) {
      if (v == null) return null;
      var sum = 0, n = 0, k, j, hole;
      for (k = i - r; k <= i + r; k++) {
        if (k < 0 || k >= arr.length || arr[k] == null) continue;
        hole = false;
        if (k < i) for (j = k; j < i; j++) if (arr[j] == null) hole = true;
        if (k > i) for (j = i + 1; j <= k; j++) if (arr[j] == null) hole = true;
        if (hole) continue;
        sum += arr[k];
        n++;
      }
      return n ? sum / n : null;
    });
  }
  function grades(miles, alt) {
    var n = miles.length, g = new Array(n), i, a, b, dm;
    for (i = 0; i < n; i++) {
      a = b = i;
      while (a > 0 && miles[i] - miles[a] < 0.02) a--;
      while (b < n - 1 && miles[b] - miles[i] < 0.02) b++;
      dm = (miles[b] - miles[a]) * 5280;
      g[i] = dm > 20 && alt[a] != null && alt[b] != null ? (alt[b] - alt[a]) / dm : 0;
    }
    return g;
  }
  function domain(arr, keep) {
    var v = [];
    arr.forEach(function (x) { if (x != null && isFinite(x) && (!keep || keep(x))) v.push(x); });
    if (!v.length) return [0, 1];
    v.sort(function (a, b) { return a - b; });
    function q(p) {
      var i = (v.length - 1) * p, lo = Math.floor(i), hi = Math.ceil(i);
      return v[lo] + (v[hi] - v[lo]) * (i - lo);
    }
    var a = q(0.06), b = q(0.94), pad;
    if (b - a < 1e-3) { a -= 1; b += 1; }
    pad = (b - a) * 0.28;
    return [a - pad, b + pad];
  }
  function spread(arr, keep) {
    var lo = Infinity, hi = -Infinity;
    arr.forEach(function (x) {
      if (x == null || (keep && !keep(x))) return;
      if (x < lo) lo = x;
      if (x > hi) hi = x;
    });
    return hi > lo ? hi - lo : 0;
  }
  function pack(arr, invert, keep) {
    var d = domain(arr, keep);
    return { v: arr, lo: d[0], hi: d[1], invert: invert, flat: spread(arr, keep) < 1 };
  }
  function weighted(miles, arr, keep) {
    var num = 0, den = 0, i, w, v;
    for (i = 0; i < arr.length - 1; i++) {
      w = miles[i + 1] - miles[i];
      v = arr[i];
      if (!(w > 0) || v == null || (keep && !keep(v))) continue;
      num += v * w;
      den += w;
    }
    return den ? num / den : null;
  }
  function fromSplits(splits) {
    var miles = [], pace = [], hr = [], alt = [], dist = 0, elev = 0;
    splits.forEach(function (sp) {
      var len = +sp.miles || 0;
      if (!(len > 0)) return;
      var a = dist, gain = num(sp.elev_change_ft) || 0;
      dist += len;
      miles.push(a, dist);
      pace.push(num(sp.pace_sec_per_mi), num(sp.pace_sec_per_mi));
      hr.push(num(sp.hr), num(sp.hr));
      alt.push(elev, elev + gain);
      elev += gain;
    });
    return miles.length > 2 ? { miles: miles, pace: pace, hr: hr, alt: alt } : null;
  }

  var paceOk = function (v) { return v >= 180 && v <= 900; };
  function build(run) {
    var s = run.streams, miles = null, pace = null, alt = null, hr = null, cad = null, stepped = false;
    if (s && s.miles && s.miles.length > 3 && s.pace_sec_per_mi && s.pace_sec_per_mi.length === s.miles.length) {
      miles = s.miles.map(num);
      if (miles.some(function (m) { return m == null; })) miles = null;
      else {
        pace = s.pace_sec_per_mi.map(num);
        alt = s.alt_ft && s.alt_ft.length === miles.length ? s.alt_ft.map(num) : null;
        hr = s.hr && s.hr.length === miles.length ? s.hr.map(num) : null;
        cad = s.cadence && s.cadence.length === miles.length ? s.cadence.map(spm) : null;
        if (alt && !hasNumbers(alt)) alt = null;
        if (hr && !hasNumbers(hr)) hr = null;
        if (cad && !hasNumbers(cad)) cad = null;
      }
    }
    if (!miles && run.splits && run.splits.length) {
      var step = fromSplits(run.splits);
      if (step) { miles = step.miles; pace = step.pace; alt = step.alt; hr = step.hr; stepped = true; }
    }
    if (!miles && num(run.miles) && num(run.pace_sec_per_mi)) {
      miles = [0, +run.miles];
      pace = [+run.pace_sec_per_mi, +run.pace_sec_per_mi];
      stepped = true;
    }
    if (!miles || !pace) return null;

    var paceRaw = pace.slice();
    if (!stepped) {
      pace = smooth(pace, 1);
      if (hr) hr = smooth(hr, 1);
      if (alt) alt = smooth(alt, 2);
      if (cad) cad = smooth(cad, 2);
    }
    /* Average GAP from the raw pace. Smoothing is only for the line, so a stop
       doesn't drag the number. */
    var gapRaw = null, gap = null;
    if (alt) {
      var g = grades(miles, alt);
      function toGap(src) {
        return src.map(function (p, i) {
          if (p == null) return null;
          var cost = minetti(clamp(g[i], -0.45, 0.45));
          return cost > 0.5 ? p * 3.6 / cost : null;
        });
      }
      gapRaw = toGap(paceRaw);
      gap = stepped ? gapRaw : smooth(toGap(pace), 2);
      if (!hasNumbers(gap)) gap = gapRaw = null;
    }
    if (!hr && num(run.avg_hr)) hr = miles.map(function () { return +run.avg_hr; });
    if (!cad && spm(run.cadence)) {
      var c = spm(run.cadence);
      cad = miles.map(function () { return c; });
    }

    var series = {};
    if (hasNumbers(pace)) series.pace = pack(pace, true, function (v) { return v >= 200 && v <= 800; });
    if (gap) series.gap = pack(gap, true, function (v) { return v >= 200 && v <= 800; });
    if (hr && hasNumbers(hr)) series.hr = pack(hr, false, function (v) { return v >= 40 && v <= 230; });
    if (cad && hasNumbers(cad)) series.cadence = pack(cad, false, function (v) { return v >= 60 && v <= 230; });
    if (!ORDER.some(function (k) { return series[k]; })) return null;

    return {
      id: String(run.id || '') + '|' + (run.date || '') + '|' + (run.name || '') + '|' + run.miles,
      miles: miles,
      maxMile: +run.miles || miles[miles.length - 1] || 1,
      alt: alt,
      series: series,
      linked: !!run.polyline,
      avg: {
        pace: num(run.pace_sec_per_mi) || weighted(miles, pace, paceOk),
        gap: gapRaw ? weighted(miles, gapRaw, paceOk) : null,
        hr: num(run.avg_hr) || (hr ? weighted(miles, hr) : null),
        cadence: spm(run.cadence) || (cad ? weighted(miles, cad) : null)
      }
    };
  }

  var data = null, open = false, linked = false, hot = '';
  var on = { pace: false, gap: false, hr: false, cadence: false };
  var cursor = 0, lastFrame = 0, hover = false, dragging = false, down = null;
  var reveal = 1, revealTo = 1, raf = 0, readSig = '';
  var laneNow = {}, laneTarget = {}, elev = { y: 0, h: 0 };
  var plot = { l: 8, r: 8, t: 10, b: 26, w: 0, h: 0 };
  var viewW = 0, viewH = 0, ink2 = '#55554f', paper = '#f5f5f0';

  function readColors() {
    var cs = getComputedStyle(root), rootCs = getComputedStyle(document.documentElement);
    ORDER.forEach(function (k) { colors[k] = cs.getPropertyValue('--' + k).trim() || FALLBACK[k]; });
    ink2 = rootCs.getPropertyValue('--ink-2').trim() || ink2;
    paper = rootCs.getPropertyValue('--paper').trim() || paper;
  }
  function withAlpha(color, a) {
    var hex = /^#([0-9a-f]{6})$/i.exec(color);
    if (hex) {
      var n = parseInt(hex[1], 16);
      return 'rgba(' + (n >> 16) + ',' + (n >> 8 & 255) + ',' + (n & 255) + ',' + a + ')';
    }
    var m = String(color).match(/[\d.]+/g);
    return m && m.length >= 3 ? 'rgba(' + m[0] + ',' + m[1] + ',' + m[2] + ',' + a + ')' : color;
  }
  function fmtAvg(k, v) {
    if (v == null || !isFinite(+v)) return '';
    return (k === 'pace' || k === 'gap') ? mmss(v) : String(Math.round(v));
  }
  function paintButtons() {
    ORDER.forEach(function (k) {
      var btn = buttons[k], has = !!(data && data.series[k] && data.avg[k] != null);
      btn.hidden = !has;
      if (!has) { on[k] = false; return; }
      var text = fmtAvg(k, data.avg[k]);
      avgs[k].textContent = text;
      btn.setAttribute('aria-pressed', on[k] ? 'true' : 'false');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      btn.setAttribute('aria-label', NAME[k] + ', average ' + text + ' ' + UNIT[k]);
      if (k === 'cadence' && data.series.cadence.flat) btn.title = 'Average for this run';
      else btn.removeAttribute('title');
    });
  }
  function sample(arr, mile) {
    if (!arr || !data) return null;
    var xs = data.miles, i = idxOf(xs, mile), j = Math.min(arr.length - 1, i + 1);
    var a = arr[i], b = arr[j];
    var span = xs[j] - xs[i];
    var t = span > 0 ? clamp((mile - xs[i]) / span, 0, 1) : 0;
    if (a == null || b == null) return t < 0.5 ? a : b;
    return a + (b - a) * t;
  }
  function paintRead() {
    if (!open || !data) return;
    var mile = cursor * data.maxMile, parts = [mile.toFixed(2) + ' mi'], sig;
    function textFor(k) {
      if (!on[k] || !data.series[k]) return '';
      var v = sample(data.series[k].v, mile);
      if (k === 'pace' || k === 'gap') {
        if (v == null || v > 900 || v < 180) return 'stopped';
        return (k === 'gap' ? 'GAP ' : '') + mmss(v) + ' /mi';
      }
      if (v == null) return '';
      if (k === 'hr') return Math.round(v) + ' bpm';
      return Math.round(v) + ' spm';
    }
    ORDER.forEach(function (k) { parts.push(textFor(k)); });
    sig = parts.join('|');
    if (sig === readSig) return;
    readSig = sig;
    distBit.textContent = parts[0];
    ORDER.forEach(function (k, i) {
      var text = parts[i + 1];
      bits[k].hidden = !text;
      if (text) bits[k].textContent = text;
    });
  }
  function setAria() {
    if (!data) return;
    var mile = cursor * data.maxMile;
    slider.setAttribute('aria-valuemax', data.maxMile.toFixed(2));
    slider.setAttribute('aria-valuenow', mile.toFixed(2));
    slider.setAttribute('aria-valuetext', readSig.replace(/\|/g, ', ') || mile.toFixed(2) + ' miles');
  }

  function measure() {
    var w = canvas.clientWidth, h = canvas.clientHeight;
    if (w < 20 || h < 20) return false;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var bw = Math.round(w * dpr), bh = Math.round(h * dpr);
    if (canvas.width !== bw || canvas.height !== bh) { canvas.width = bw; canvas.height = bh; }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    plot.w = w - plot.l - plot.r;
    plot.h = h - plot.t - plot.b;
    viewW = w;
    viewH = h;
    return plot.w > 10 && plot.h > 10;
  }
  function xOf(mile) { return plot.l + clamp(mile / (data.maxMile || 1), 0, 1) * plot.w; }
  function yOf(series, lane, val) {
    if (val == null || !(lane.h > 2)) return null;
    var t = clamp((val - series.lo) / (series.hi - series.lo || 1), 0, 1);
    if (series.invert) t = 1 - t;
    var top = lane.y + Math.min(10, lane.h * 0.16);
    var bot = lane.y + lane.h - Math.min(10, lane.h * 0.16);
    return bot - t * (bot - top);
  }
  function targets() {
    var active = ORDER.filter(function (k) { return on[k] && data.series[k]; });
    var elevH = data.alt ? Math.min(plot.h * 0.32, Math.max(46, plot.h * 0.24)) : 0;
    var gap = active.length > 1 ? 6 : 0;
    var top = plot.t;
    var bottom = plot.t + plot.h - elevH - (elevH ? 6 : 0);
    var n = Math.max(1, active.length);
    var h = (bottom - top - gap * Math.max(0, active.length - 1)) / n;
    var y = top, next = {};
    active.forEach(function (k) {
      next[k] = { y: y, h: h };
      y += h + gap;
    });
    ORDER.forEach(function (k) {
      if (next[k]) return;
      var prev = laneNow[k] || { y: (top + bottom) / 2, h: 0 };
      next[k] = { y: prev.y + prev.h / 2, h: 0 };
    });
    laneTarget = next;
    elev = { y: plot.t + plot.h - elevH, h: elevH };
  }
  function applyLanes(snap) {
    ORDER.forEach(function (k) {
      var t = laneTarget[k];
      if (!t) return;
      if (snap || !laneNow[k]) laneNow[k] = { y: t.y, h: t.h };
    });
  }
  function tickList(max) {
    var step = max > 8 ? 2 : max > 3.2 ? 1 : 0.5, out = [], m;
    for (m = step; m < max - step * 0.4; m += step) out.push(Math.round(m * 10) / 10);
    out.push(max);
    return out;
  }
  function fmtMi(m) {
    var near = Math.abs(m - Math.round(m)) < 0.025;
    return (near ? String(Math.round(m)) : m.toFixed(1)) + ' mi';
  }

  function trace(arr, lane, series) {
    var pen = false, i, val, x, y;
    ctx.beginPath();
    for (i = 0; i < data.miles.length; i++) {
      val = arr[i];
      /* A stop has no pace. Draw it at the bottom of the lane so the line dips
         and recovers, instead of opening a hole. */
      if ((val == null || !isFinite(val)) && series.invert) val = series.hi;
      if (val == null || !isFinite(val)) { pen = false; continue; }
      x = xOf(data.miles[i]);
      y = yOf(series, lane, val);
      if (y == null) { pen = false; continue; }
      if (!pen) { ctx.moveTo(x, y); pen = true; }
      else ctx.lineTo(x, y);
    }
    return pen;
  }
  function drawElev() {
    var alt = data.alt;
    if (!alt || elev.h < 8) return;
    var vals = alt.filter(function (v) { return v != null && isFinite(v); });
    if (vals.length < 2) return;
    var lo0 = Math.min.apply(null, vals), hi0 = Math.max.apply(null, vals);
    var span = Math.max(hi0 - lo0, 16), mid = (lo0 + hi0) / 2;
    var lo = mid - span * 0.68, hi = mid + span * 0.5;
    function yA(v) {
      var t = clamp((v - lo) / (hi - lo || 1), 0, 1);
      return elev.y + elev.h - t * elev.h * 0.9 - 2;
    }
    var base = elev.y + elev.h, hold = vals[0], i, a, x, y, started = false, lastX = plot.l;
    ctx.save();
    ctx.beginPath();
    ctx.rect(plot.l, elev.y, Math.max(0, plot.w * reveal), elev.h + 1);
    ctx.clip();
    ctx.beginPath();
    for (i = 0; i < data.miles.length; i++) {
      a = alt[i];
      if (a == null) a = hold; else hold = a;
      x = xOf(data.miles[i]);
      y = yA(a);
      if (!started) { ctx.moveTo(x, base); started = true; }
      ctx.lineTo(x, y);
      lastX = x;
    }
    ctx.lineTo(lastX, base);
    ctx.closePath();
    ctx.fillStyle = 'rgba(23, 22, 19, 0.13)';
    ctx.fill();
    if (reveal > 0.97) {
      ctx.save();
      ctx.clip();
      ctx.fillStyle = 'rgba(23, 22, 19, 0.08)';
      ctx.fillRect(plot.l, elev.y, Math.max(0, xOf(cursor * data.maxMile) - plot.l), elev.h + 1);
      ctx.restore();
    }
    ctx.beginPath();
    hold = vals[0];
    penWalk(function (i) {
      a = alt[i];
      if (a == null) a = hold; else hold = a;
      return [xOf(data.miles[i]), yA(a)];
    });
    ctx.strokeStyle = 'rgba(23, 22, 19, 0.40)';
    ctx.lineWidth = 1.25;
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.restore();
  }
  function penWalk(at) {
    var pen = false, i, p;
    for (i = 0; i < data.miles.length; i++) {
      p = at(i);
      if (!p) { pen = false; continue; }
      if (!pen) { ctx.moveTo(p[0], p[1]); pen = true; }
      else ctx.lineTo(p[0], p[1]);
    }
  }
  function drawSeries() {
    ORDER.forEach(function (k) {
      var series = data.series[k], lane = laneNow[k];
      if (!on[k] || !series || !lane || lane.h < 3) return;
      var color = colors[k];
      ctx.save();
      ctx.beginPath();
      ctx.rect(plot.l, lane.y, Math.max(0, plot.w * reveal), lane.h);
      ctx.clip();
      if (hot === k) {
        ctx.fillStyle = withAlpha(color, 0.09);
        ctx.fillRect(plot.l, lane.y, plot.w, lane.h);
      }
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.strokeStyle = color;
      ctx.lineWidth = series.flat ? 1.4 : (hot === k ? 2.35 : 1.7);
      ctx.globalAlpha = series.flat ? 0.8 : 1;
      trace(series.v, lane, series);
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.restore();
    });
  }
  function drawCursor() {
    if (reveal < 0.98) return;
    var mile = cursor * data.maxMile;
    var x = xOf(mile), hx = Math.round(x) + 0.5;
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(23, 22, 19, 0.38)';
    ctx.lineWidth = 1;
    ctx.moveTo(hx, plot.t);
    ctx.lineTo(hx, plot.t + plot.h);
    ctx.stroke();
    ORDER.forEach(function (k) {
      if (!on[k] || !data.series[k]) return;
      var lane = laneNow[k];
      if (!lane || lane.h < 4) return;
      var v = sample(data.series[k].v, mile);
      if ((v == null || v > 900) && data.series[k].invert) v = data.series[k].hi;
      var y = yOf(data.series[k], lane, v);
      if (y == null) return;
      ctx.beginPath();
      ctx.fillStyle = paper;
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.fillStyle = colors[k];
      ctx.arc(x, y, 3.15, 0, Math.PI * 2);
      ctx.fill();
    });
  }
  function drawAxis() {
    ctx.save();
    ctx.globalAlpha = clamp(reveal * 1.35, 0, 1);
    ctx.fillStyle = ink2;
    ctx.font = '400 11px "Plex Sans", system-ui, sans-serif';
    ctx.textBaseline = 'top';
    var ticks = tickList(data.maxMile), last = ticks.length - 1;
    ticks.forEach(function (m, i) {
      var x = xOf(m), end = i === last;
      if (!end && plot.l + plot.w - x < 42) return;
      ctx.textAlign = end ? 'right' : (x < plot.l + 28 ? 'left' : 'center');
      ctx.fillStyle = ink2;
      ctx.fillText(fmtMi(m), end ? plot.l + plot.w : x, plot.t + plot.h + 8);
      ctx.fillStyle = 'rgba(23, 22, 19, 0.28)';
      ctx.fillRect(Math.round(x), plot.t + plot.h + 1, 1, 4);
    });
    ctx.restore();
  }
  function draw() {
    if (!data || !open || !measure()) return;
    ctx.clearRect(0, 0, viewW, viewH);
    drawElev();
    drawSeries();
    drawCursor();
    drawAxis();
    paintRead();
  }
  function kick() { if (!raf) raf = requestAnimationFrame(step); }
  function step() {
    raf = 0;
    var revDone = true, laneDone = true;
    if (Math.abs(reveal - revealTo) > 0.004) {
      reveal += (revealTo - reveal) * (motionOff() ? 1 : 0.16);
      revDone = false;
    } else reveal = revealTo;
    ORDER.forEach(function (k) {
      var t = laneTarget[k], n = laneNow[k];
      if (!t || !n) return;
      if (Math.abs(t.y - n.y) < 0.35 && Math.abs(t.h - n.h) < 0.35) { n.y = t.y; n.h = t.h; return; }
      n.y += (t.y - n.y) * 0.18;
      n.h += (t.h - n.h) * 0.18;
      laneDone = false;
    });
    draw();
    if (!revDone || !laneDone) kick();
  }
  function layout(snap) {
    if (!open || !data || !measure()) return;
    readColors();
    targets();
    applyLanes(snap || motionOff());
    if (snap || motionOff()) draw();
    else kick();
  }

  function nudgeIntoView() {
    if (!open) return;
    var r = chart.getBoundingClientRect();
    if (r.bottom > innerHeight - 8 || r.top > innerHeight - 120) {
      chart.scrollIntoView({ behavior: motionOff() ? 'auto' : 'smooth', block: 'nearest' });
    }
  }
  function armScroll() {
    if (motionOff()) { nudgeIntoView(); return; }
    var done = false;
    function finish(ev) {
      if (ev && (ev.target !== fold || ev.propertyName !== 'grid-template-rows')) return;
      if (done || !open) return;
      done = true;
      fold.removeEventListener('transitionend', finish);
      nudgeIntoView();
    }
    fold.addEventListener('transitionend', finish);
    setTimeout(function () { finish(); }, 700);
  }
  function setOpen(yes) {
    open = yes;
    fold.classList.toggle('open', yes);
    clip.inert = !yes;
    slider.tabIndex = yes ? 0 : -1;
    if (!yes) return;
    if (isFinite(+window.__routeAt)) lastFrame = clamp(+window.__routeAt, 0, 1);
    cursor = linked ? lastFrame : cursor;
    reveal = motionOff() ? 1 : 0;
    revealTo = 1;
    readSig = '';
    layout(true);
    if (reveal !== revealTo) kick();
    paintRead();
    setAria();
    armScroll();
  }

  row.addEventListener('click', function (e) {
    var btn = e.target.closest && e.target.closest('.metric');
    if (!btn || btn.hidden || !data) return;
    var key = btn.getAttribute('data-metric');
    if (!open) {
      ORDER.forEach(function (k) { on[k] = !!(data.series[k] && data.avg[k] != null); });
      setOpen(true);
    } else {
      on[key] = !on[key];
      if (!ORDER.some(function (k) { return on[k]; })) setOpen(false);
      else layout(false);
    }
    paintButtons();
  });
  row.addEventListener('pointerover', function (e) {
    var btn = e.target.closest && e.target.closest('.metric');
    var key = btn && !btn.hidden && on[btn.getAttribute('data-metric')] ? btn.getAttribute('data-metric') : '';
    if (key === hot) return;
    hot = key;
    if (open) draw();
  });
  row.addEventListener('pointerleave', function () {
    if (!hot) return;
    hot = '';
    if (open) draw();
  });

  function fracOf(e) {
    var r = canvas.getBoundingClientRect();
    return clamp((e.clientX - r.left - plot.l) / (plot.w || 1), 0, 1);
  }
  function seek(f, drag) {
    cursor = clamp(f, 0, 1);
    if (!linked) return;
    document.dispatchEvent(new CustomEvent('route:seek', { detail: { fraction: cursor, drag: !!drag } }));
  }
  slider.addEventListener('pointerdown', function (e) {
    if (e.button) return;
    down = { id: e.pointerId, x: e.clientX };
    dragging = false;
    hover = true;
    cursor = fracOf(e);
    draw();
    setAria();
  });
  slider.addEventListener('pointermove', function (e) {
    if (down && e.pointerId === down.id) {
      if (!dragging && Math.abs(e.clientX - down.x) > 3) {
        dragging = true;
        try { slider.setPointerCapture(e.pointerId); } catch (err) { /* a nicety */ }
      }
      cursor = fracOf(e);
      if (dragging) seek(cursor, true);
      draw();
      setAria();
      return;
    }
    if (e.pointerType === 'mouse') {
      hover = true;
      cursor = fracOf(e);
      draw();
    }
  });
  function endPointer(e) {
    if (!down || (e && e.pointerId !== down.id)) return;
    var f = e ? fracOf(e) : cursor;
    down = null;
    dragging = false;
    hover = false;
    seek(f, false);
    draw();
    setAria();
  }
  slider.addEventListener('pointerup', endPointer);
  slider.addEventListener('pointercancel', endPointer);
  slider.addEventListener('lostpointercapture', function (e) {
    if (down && e.pointerId === down.id) endPointer(e);
  });
  slider.addEventListener('pointerleave', function () {
    if (down || !hover) return;
    hover = false;
    cursor = linked ? lastFrame : cursor;
    draw();
  });
  var keyTimer = 0;
  slider.addEventListener('keydown', function (e) {
    var step = e.shiftKey ? 0.05 : 0.01, f = cursor;
    if (e.key === 'ArrowRight') f += step;
    else if (e.key === 'ArrowLeft') f -= step;
    else if (e.key === 'Home') f = 0;
    else if (e.key === 'End') f = 1;
    else return;
    e.preventDefault();
    dragging = true;
    hover = false;
    seek(f, true);
    draw();
    setAria();
    clearTimeout(keyTimer);
    keyTimer = setTimeout(function () { dragging = false; seek(cursor, false); }, 420);
  });

  document.addEventListener('route:frame', function (ev) {
    var f = +((ev.detail || {}).fraction);
    if (!isFinite(f)) return;
    lastFrame = clamp(f, 0, 1);
    if (!open || !linked || hover || dragging) return;
    cursor = lastFrame;
    if (raf) return;
    draw();
  });

  function onMotion() {
    if (!motionOff()) return;
    reveal = revealTo;
    applyLanes(true);
    if (open) draw();
  }
  if (mq.addEventListener) mq.addEventListener('change', onMotion); else mq.addListener(onMotion);
  document.addEventListener('motion:change', onMotion);
  if (window.ResizeObserver) new ResizeObserver(function () { if (open) layout(true); }).observe(chart);
  addEventListener('hashchange', function () {
    if (open) requestAnimationFrame(function () { layout(true); });
  });

  readColors();
  window.__analysis = function (run) {
    var model = run && build(run);
    if (!model) { root.hidden = true; data = null; linked = false; return; }
    var changed = !data || model.id !== data.id;
    data = model;
    linked = model.linked;
    root.hidden = false;
    if (changed) {
      if (isFinite(+window.__routeAt)) lastFrame = clamp(+window.__routeAt, 0, 1);
      cursor = linked ? lastFrame : 0;
      hot = '';
      readSig = '';
    }
    ORDER.forEach(function (k) { if (!data.series[k]) on[k] = false; });
    if (open && !ORDER.some(function (k) { return on[k]; })) {
      ORDER.forEach(function (k) { on[k] = !!data.series[k]; });
    }
    paintButtons();
    if (!open) return;
    if (changed && !motionOff()) { reveal = 0; revealTo = 1; }
    layout(true);
    if (reveal !== revealTo) kick();
    paintRead();
  };
})();
