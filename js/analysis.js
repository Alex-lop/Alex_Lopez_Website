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
  window.__analysis = function (run) {
    var model = run && build(run);
    if (!model) { root.hidden = true; data = null; return; }
    data = model;
    root.hidden = false;
    paintButtons();
  };
})();
