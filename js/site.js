/* Running numbers from data/strava.json plus the small motion pieces. Fetch failure: nothing changes. */
(function () {
  'use strict';
  var doc = document;
  doc.documentElement.classList.add('reveal-ready');

  var mq = matchMedia('(prefers-reduced-motion: reduce)'), IO = window.IntersectionObserver;
  function motionOff() { return mq.matches || doc.documentElement.dataset.motion === 'off'; }
  var reduce = motionOff();

  function all(sel, ctx) { return (ctx || doc).querySelectorAll(sel); }
  function mmss(s) { s = Math.round(s); return (s / 60 | 0) + ':' + String(s % 60).padStart(2, '0'); }
  function hm(s) { var m = Math.round(s / 60), h = Math.floor(m / 60); return h ? h + 'h ' + String(m % 60).padStart(2, '0') + 'm' : m + 'm'; }
  function day(iso, opts) { var d = new Date(iso + 'T12:00:00'); return isNaN(d) ? iso : d.toLocaleDateString('en-US', opts || { month: 'short', day: 'numeric' }); }
  function ago(iso) {
    var s = (Date.now() - Date.parse(iso)) / 1e3, n, u;
    if (!isFinite(s)) return '';
    if (s < 3600) { n = Math.max(1, Math.round(s / 60)); u = 'minute'; }
    else if (s < 1728e2) { n = Math.round(s / 3600); u = 'hour'; }
    else { n = Math.round(s / 864e2); u = 'day'; }
    return 'synced ' + n + ' ' + u + (n === 1 ? '' : 's') + ' ago';
  }

  var reveals = all('[data-reveal]');
  function revealAll() { reveals.forEach(function (el) { el.classList.add('in'); }); }
  if (reduce || !IO) revealAll();
  else {
    var seen = false;
    var ro = new IO(function (es) {
      seen = true;
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); ro.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -20% 0px' });
    reveals.forEach(function (el) { ro.observe(el); });
    setTimeout(function () { if (!seen) revealAll(); }, 2000);  // only for an observer that never reports at all
  }

  /* week odometer */
  var odo = doc.querySelector('[data-odo]'), cols = odo ? all('.d', odo) : [];
  var miles = odo ? parseFloat(odo.getAttribute('data-odo')) : NaN, rolled = false;

  function paintOdo(v) {
    if (cols.length !== 3) return;
    odo.setAttribute('aria-label', v.toFixed(1) + ' miles');
    if (v >= 100) { odo.textContent = v.toFixed(1); cols = []; return; }  // the columns are gone; say so
    var s = v.toFixed(1).replace('.', ''), blank = s.length < 3;  // "142", or "97" under ten
    cols[0].classList.toggle('blank', blank);
    [blank ? 0 : s[0], s[s.length - 2], s[s.length - 1]].forEach(function (n, i) {
      cols[i].firstElementChild.style.setProperty('--n', n);
    });
  }
  function rollOdo() {
    if (rolled || reduce || cols.length !== 3) return;
    rolled = true;
    var inner = all('.d > span', odo);
    inner.forEach(function (n) { n.style.transition = 'none'; n.style.setProperty('--n', 0); });
    void odo.offsetWidth;  // commit the zeros, then roll
    inner.forEach(function (n) { n.style.transition = ''; });
    paintOdo(miles);
  }
  var stats = doc.querySelector('.run-stats');
  if (stats && odo && IO) {
    var oo = new IO(function (es) {
      if (es.some(function (e) { return e.isIntersecting; })) { rollOdo(); oo.disconnect(); }
    }, { threshold: 0.3 });
    oo.observe(stats);
  }

  /* avg miles / week since data-avg-from (last week of the Hartford block). Bars are the last
     N Monday weeks; the headline average skips anything before that date and the live week. */
  var avgRoot = doc.querySelector('[data-avg]');
  var avgFrom = (avgRoot && avgRoot.getAttribute('data-avg-from')) || '2026-09-14';
  var avgNum = avgRoot && avgRoot.querySelector('[data-avg-num]');
  var avgSince = avgRoot && avgRoot.querySelector('[data-avg-since]');
  var avgPlot = avgRoot && avgRoot.querySelector('[data-avg-plot]');
  var avgBars = avgRoot && avgRoot.querySelector('[data-avg-bars]');
  var avgMean = avgRoot && avgRoot.querySelector('[data-avg-mean]');
  var avgMeanLabel = avgRoot && avgRoot.querySelector('[data-avg-mean-label]');
  var avgGoal = avgRoot && avgRoot.querySelector('[data-avg-goal]');
  var avgAxis = avgRoot && avgRoot.querySelector('[data-avg-axis]');
  var avgCap = avgRoot && avgRoot.querySelector('[data-avg-caption]');
  var avgSum = avgRoot && avgRoot.querySelector('[data-avg-summary]');
  var avgRows = [], avgTop = 50, avgShown = NaN, avgGoalVal = 27, avgRaf = 0, avgSel = -1, avgLive = -1, avgGrown = false, avgKey = false, blockAvgVal = 0;

  function weekEnd(iso) {
    var d = new Date(iso + 'T12:00:00');
    d.setDate(d.getDate() + 6);
    return isNaN(d) ? iso : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  function weekRange(iso) {
    var a = day(iso), b = weekEnd(iso), m = a.replace(/\s.*/, '');
    if (b.indexOf(m) === 0) b = b.slice(m.length).trim();
    return a + '–' + b;
  }

  function avgThrough(i) {
    var sum = 0, n = 0, k, last = i < 0 ? avgRows.length - 1 : i;
    for (k = 0; k <= last; k++) {
      if (!avgRows[k] || avgRows[k].pre || avgRows[k].live) continue;
      sum += avgRows[k].miles;
      n++;
    }
    if (n) return sum / n;
    for (k = 0; k < avgRows.length; k++) if (avgRows[k] && !avgRows[k].pre) return avgRows[k].miles;
    return 0;
  }

  function setMean(v) {
    var p = avgTop ? (Math.max(0, v) / avgTop * 100) : 0;
    if (avgMean) avgMean.style.setProperty('--p', p + '%');
    if (avgMeanLabel) avgMeanLabel.textContent = v.toFixed(1);
  }

  function easeAvg(v, instant) {
    avgGoalVal = v;
    if (instant || reduce || !avgNum) {
      avgShown = v;
      avgNum.textContent = v.toFixed(1);
      setMean(v);
      return;
    }
    if (!isFinite(avgShown)) avgShown = v;
    cancelAnimationFrame(avgRaf);
    (function step() {
      avgShown += (avgGoalVal - avgShown) * 0.22;
      if (Math.abs(avgGoalVal - avgShown) < 0.04) avgShown = avgGoalVal;
      avgNum.textContent = avgShown.toFixed(1);
      setMean(avgShown);
      if (avgShown !== avgGoalVal) avgRaf = requestAnimationFrame(step);
    })();
  }

  function idleCaption() {
    var n = 0, last = null, live = avgLive >= 0 ? avgRows[avgLive] : null, i;
    for (i = 0; i < avgRows.length; i++) {
      if (avgRows[i].pre || avgRows[i].live) continue;
      n++;
      last = avgRows[i];
    }
    var bits = [n === 1 ? '1 week in' : n + ' weeks in'];
    if (last) bits.push('last week ' + last.miles.toFixed(1) + ' mi');
    if (live && live.miles > 0) bits.push('this week ' + live.miles.toFixed(1));
    else if (live) bits.push('this week just opened');
    return bits.join(' · ');
  }

  function selectAvg(i) {
    avgSel = i;
    var row = i >= 0 ? avgRows[i] : null;
    avgRows.forEach(function (r, k) {
      r.el.setAttribute('aria-selected', k === i ? 'true' : 'false');
    });
    if (avgBars) avgBars.setAttribute('aria-activedescendant', row ? row.el.id : '');
    if (!row) {
      easeAvg(blockAvgVal);
      if (avgSince) avgSince.textContent = 'since ' + day(avgFrom);
      if (avgCap) avgCap.textContent = idleCaption();
      return;
    }
    if (avgSince) {
      avgSince.textContent = row.live || row.pre ? 'since ' + day(avgFrom) : 'through ' + weekEnd(row.week_start);
    }
    if (avgCap) {
      avgCap.textContent = row.live
        ? 'This week · ' + row.miles.toFixed(1) + ' mi so far' + (row.runs ? ' · ' + row.runs + ' run' + (row.runs === 1 ? '' : 's') : '')
        : weekRange(row.week_start) + ' · ' + row.miles.toFixed(1) + ' mi · ' + row.runs + ' run' + (row.runs === 1 ? '' : 's')
          + (row.pre ? ' · before the average' : '');
    }
    easeAvg(row.pre || row.live ? blockAvgVal : avgThrough(i));
  }

  function avgAt(x) {
    var best = 0, dist = Infinity, k, r, d;
    for (k = 0; k < avgRows.length; k++) {
      r = avgRows[k].el.getBoundingClientRect();
      d = x < r.left ? r.left - x : x > r.right ? x - r.right : 0;
      if (d < dist) { dist = d; best = k; }
    }
    return best;
  }

  function growAvg() {
    if (avgGrown || reduce || !avgRows.length) return;
    avgGrown = true;
    avgRows.forEach(function (row, i) {
      row.fill.style.transitionDelay = (i * 40) + 'ms';
      row.fill.style.setProperty('--h', '0%');
    });
    void avgPlot.offsetWidth;
    avgRows.forEach(function (row) { row.fill.style.setProperty('--h', row.h); });
    setTimeout(function () {
      avgRows.forEach(function (row) { row.fill.style.transitionDelay = ''; });
    }, 900 + avgRows.length * 40);
  }

  function drawAvg(weeks, liveStart, from) {
    if (!avgRoot || !avgBars || !weeks || weeks.length < 1) return;
    if (from) avgFrom = from;
    var start = liveStart || weeks[weeks.length - 1].week_start;
    avgRows = weeks.map(function (w, i) {
      var miles = +w.miles || 0;
      return {
        week_start: w.week_start,
        miles: miles,
        runs: +w.runs || 0,
        pre: w.week_start < avgFrom,
        live: w.week_start === start,
        i: i
      };
    });
    avgLive = -1;
    avgRows.forEach(function (row, i) { if (row.live) avgLive = i; });
    var mi = avgRows.map(function (r) { return r.miles; });
    avgTop = Math.max(50, Math.max.apply(null, mi));
    blockAvgVal = avgThrough(-1);
    avgBars.textContent = '';
    avgRows.forEach(function (row, i) {
      var opt = doc.createElement('div'), fill = doc.createElement('span'), val = doc.createElement('span');
      var started = !row.pre && (i === 0 || avgRows[i - 1].pre);
      row.h = (avgTop ? row.miles / avgTop * 100 : 0) + '%';
      opt.id = 'avg-w-' + i;
      opt.className = 'avg-bar' + (row.pre ? ' pre' : '') + (row.live ? ' live' : '') + (started ? ' start' : '');
      opt.setAttribute('role', 'option');
      opt.setAttribute('aria-selected', 'false');
      opt.setAttribute('aria-label', day(row.week_start) + ', ' + row.miles.toFixed(1) + ' miles, ' + row.runs + ' run' + (row.runs === 1 ? '' : 's') + (row.pre ? ', before the average' : row.live ? ', this week' : ''));
      fill.className = 'avg-fill';
      val.className = 'avg-val';
      val.textContent = row.miles >= 10 ? row.miles.toFixed(0) : row.miles.toFixed(1);
      fill.style.setProperty('--h', reduce ? row.h : '0%');
      opt.appendChild(fill);
      opt.appendChild(val);
      avgBars.appendChild(opt);
      row.el = opt;
      row.fill = fill;
    });
    if (avgGoal) avgGoal.style.setProperty('--p', (50 / avgTop * 100) + '%');
    if (avgAxis) {
      avgAxis.hidden = false;
      avgAxis.children[0].textContent = day(avgRows[0].week_start);
      avgAxis.children[1].textContent = avgLive === avgRows.length - 1 ? 'now' : day(avgRows[avgRows.length - 1].week_start);
    }
    avgPlot.hidden = false;
    avgBars.setAttribute('aria-label', 'Miles each week from ' + day(avgRows[0].week_start) + ' to ' + day(avgRows[avgRows.length - 1].week_start) + '. Average starts ' + day(avgFrom) + '.');
    if (avgSum) avgSum.textContent = 'Averaging ' + blockAvgVal.toFixed(1) + ' miles per week since ' + day(avgFrom) + '.';
    avgGrown = false;
    selectAvg(-1);
    easeAvg(blockAvgVal, true);
    if (reduce) avgGrown = true;
    else requestAnimationFrame(function () {
      var r = avgPlot.getBoundingClientRect();
      if (r.height && r.top < innerHeight && r.bottom > 0) growAvg();
    });
  }

  if (avgBars) {
    avgBars.addEventListener('pointermove', function (e) {
      if (e.pointerType === 'mouse' || avgBars.hasPointerCapture(e.pointerId)) selectAvg(avgAt(e.clientX));
    });
    avgBars.addEventListener('pointerdown', function (e) {
      avgKey = false;
      avgBars.setPointerCapture(e.pointerId);
      selectAvg(avgAt(e.clientX));
    });
    avgBars.addEventListener('pointerleave', function (e) {
      if (e.pointerType === 'mouse' && !avgKey && !avgBars.hasPointerCapture(e.pointerId)) selectAvg(-1);
    });
    avgBars.addEventListener('focus', function () {
      if (avgSel < 0 && avgRows.length) selectAvg(avgLive > 0 ? avgLive - 1 : Math.max(0, avgLive));
    });
    avgBars.addEventListener('blur', function () { avgKey = false; selectAvg(-1); });
    avgBars.addEventListener('keydown', function (e) {
      var n = avgRows.length, i = avgSel;
      if (!n) return;
      avgKey = true;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); selectAvg(Math.min(n - 1, (i < 0 ? avgLive : i) + 1)); }
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); selectAvg(Math.max(0, (i < 0 ? avgLive : i) - 1)); }
      else if (e.key === 'Home') { e.preventDefault(); selectAvg(0); }
      else if (e.key === 'End') { e.preventDefault(); selectAvg(n - 1); }
      else if (e.key === 'Escape') { e.preventDefault(); selectAvg(-1); }
    });
  }
  if (avgPlot && IO) {
    var ao = new IO(function (es) {
      if (es.some(function (e) { return e.isIntersecting; })) { growAvg(); ao.disconnect(); }
    }, { threshold: 0.3 });
    ao.observe(avgPlot);
  }

  var splits = doc.querySelector('[data-splits]'), touched = 0, selfScroll = false;

  function buildSplits(list) {
    if (!splits || !list || !list.length) return;
    splits.textContent = '';
    list.forEach(function (sp) {
      var card = doc.createElement('div'), lines = [];
      card.className = 'split';
      card.setAttribute('data-mile', sp.mile);
      card.innerHTML = '<b></b>';
      card.firstChild.textContent = sp.partial ? (+sp.miles).toFixed(2) + ' mi' : sp.mile + ' mi';
      if (!sp.partial && sp.pace_sec_per_mi) lines.push(mmss(sp.pace_sec_per_mi) + ' /mi');
      if (typeof sp.elev_change_ft === 'number') lines.push((sp.elev_change_ft < 0 ? '−' : '+') + Math.abs(Math.round(sp.elev_change_ft)) + ' ft');
      if (sp.hr) lines.push(Math.round(sp.hr) + ' bpm');
      lines.forEach(function (t) { var d = doc.createElement('div'); d.textContent = t; card.appendChild(d); });
      splits.appendChild(card);
    });
    splits.hidden = false;
  }

  function nudge(card) {
    if (Date.now() - touched < 1500) return;
    // rect-based: main, not .splits, is the cards' offsetParent
    var want = splits.scrollLeft + card.getBoundingClientRect().left - splits.getBoundingClientRect().left
      - (splits.clientWidth - card.offsetWidth) / 2;
    var before = splits.scrollLeft;
    selfScroll = true;
    splits.scrollLeft = Math.max(0, want);
    if (splits.scrollLeft === before) selfScroll = false;  // no scroll event is coming
  }

  if (splits) {
    ['pointerdown', 'wheel', 'touchstart'].forEach(function (t) {
      splits.addEventListener(t, function () { touched = Date.now(); }, { passive: true });
    });
    splits.addEventListener('scroll', function () {
      if (selfScroll) selfScroll = false; else touched = Date.now();
    }, { passive: true });
    doc.addEventListener('route:at', function (ev) {
      var d = ev.detail || {}, on = null, cards = all('.split', splits);
      var cur = Math.min(cards.length, (d.mile || 0) + 1);  // d.mile is the integer mile passed; the split being run is the next card
      cards.forEach(function (card) {
        var hit = !d.reset && +card.getAttribute('data-mile') === cur;
        card.classList.toggle('on', hit);
        if (hit) on = card;
      });
      if (on) nudge(on);
    });
  }

  /* ticker: clone the segment past two viewports, scroll it at ~40px/s */
  var track = doc.querySelector('.ticker-track'), seg = doc.querySelector('[data-ticker]');

  function marquee() {
    if (!track || !seg) return;
    while (track.children.length > 1) track.removeChild(track.lastElementChild);
    track.classList.remove('go');
    if (reduce) return;
    var w = seg.offsetWidth;
    if (!w) return;
    for (var i = 0; i < 20 && track.scrollWidth < innerWidth * 2 + w; i++) {
      var c = seg.cloneNode(true);
      c.removeAttribute('data-ticker');
      track.appendChild(c);
    }
    track.style.setProperty('--w', w + 'px');
    track.style.setProperty('--ticker-s', w / 40 + 's');
    track.classList.add('go');
  }

  var band = doc.querySelector('.ticker');
  if (band && IO) new IO(function (es) { band.classList.toggle('paused', !es[0].isIntersecting); }).observe(band);
  var rt;
  addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(marquee, 200); });

  /* race countdown */
  var cd = doc.querySelector('[data-countdown]');
  if (cd) {
    var p = cd.getAttribute('data-countdown').split('-'), now = new Date();
    var days = Math.round((new Date(+p[0], p[1] - 1, +p[2]) - new Date(now.getFullYear(), now.getMonth(), now.getDate())) / 864e5);
    var b = cd.querySelector('[data-days]');
    if (days > 0) { if (b) b.textContent = days; }
    else if (days === 0) cd.textContent = 'Race day: Eversource Hartford.';
    else cd.hidden = true;
  }

  /* photo strip, desktop only */
  var strip = doc.querySelector('[data-strip]'), outside = doc.getElementById('outside'), stripFrame = null;
  if (strip && outside && matchMedia('(pointer: fine)').matches) {
    var queued = false;
    var frame = stripFrame = function () {
      queued = false;
      if (reduce) return;
      var r = outside.getBoundingClientRect();
      var prog = Math.min(1, Math.max(0, (innerHeight - r.top) / (innerHeight + r.height)));
      var over = Math.max(0, strip.scrollWidth - strip.parentNode.clientWidth);  // travel the real overflow, never past the last photo
      strip.style.transform = over ? 'translateX(' + (-prog * over) + 'px)' : '';
    };
    addEventListener('scroll', function () {
      if (!queued && !reduce) { queued = true; requestAnimationFrame(frame); }
    }, { passive: true });
  }

  /* reduced motion: the OS setting or the footer toggle, same effect. The button's label is its state;
     under the OS setting there is nothing for it to resume, so it is disabled rather than lying. */
  var toggle = doc.querySelector('[data-motion-toggle]');
  function applyMotion() {
    reduce = motionOff();
    if (reduce) {
      revealAll();
      if (strip) strip.style.transform = '';
      avgRows.forEach(function (row) { if (row.fill) row.fill.style.setProperty('--h', row.h); });
      avgGrown = true;
      cancelAnimationFrame(avgRaf);
      if (avgNum && isFinite(avgGoalVal)) { avgShown = avgGoalVal; avgNum.textContent = avgGoalVal.toFixed(1); setMean(avgGoalVal); }
    } else if (stripFrame) stripFrame();
    if (toggle) { toggle.textContent = reduce ? 'Resume motion' : 'Pause motion'; toggle.disabled = mq.matches; }
    marquee();
  }
  mq.addEventListener('change', applyMotion);
  doc.addEventListener('motion:change', applyMotion);
  if (toggle) toggle.addEventListener('click', function () {
    if (doc.documentElement.dataset.motion === 'off') delete doc.documentElement.dataset.motion; else doc.documentElement.dataset.motion = 'off';
    doc.dispatchEvent(new CustomEvent('motion:change'));
  });

  applyMotion();
  if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(marquee);  // --w must be a real-font width

  fetch('data/strava.json', { cache: 'no-cache' }).then(function (r) { return r.json(); }).then(function (d) {
    var w = d.week || {}, l = d.latest || {}, synced = d.generated_at ? ago(d.generated_at) : '';
    var num = function (v) { return typeof v === 'number'; };
    var out = {
      'week.miles': num(w.miles) ? w.miles.toFixed(1) : '',
      'week.pace': w.pace_sec_per_mi ? mmss(w.pace_sec_per_mi) : '',
      'week.elev': num(w.elev_ft) ? w.elev_ft + '' : '',
      'week.runs': num(w.runs) ? w.runs + '' : '',
      'week.time': w.moving_time_s ? hm(w.moving_time_s) : '',
      'feeling': d.feeling || '',
      'latest.line': l.miles ? day(l.date) + ', ' + (+l.miles).toFixed(2) + ' miles at ' + mmss(l.pace_sec_per_mi) + ' per mile, ' + l.elev_ft + ' feet of climbing, ' + l.place + '.' : '',
      'latest.when': l.date && l.place ? day(l.date) + ', ' + l.place : '',
      'synced': synced
    };
    Object.keys(out).forEach(function (k) {
      if (out[k]) all('[data-run="' + k + '"]').forEach(function (el) { el.textContent = out[k]; });
    });

    if (num(w.miles)) {
      miles = w.miles;
      paintOdo(miles);  // the observer rolls it from zero on first view
      var bar = doc.querySelector('[data-week-goal]');
      if (bar) { bar.value = w.miles; bar.textContent = w.miles.toFixed(1) + ' of 50 miles this week'; }
    }

    drawAvg(d.weeks, d.week_start, d.avg_from);
    buildSplits(l.splits);

    if (seg) {
      var lifts = d.totals && d.totals.lifts_before_runs_this_week, bits = [];
      if (num(w.miles)) bits.push('this week ' + w.miles.toFixed(1) + ' mi');
      if (blockAvgVal) bits.push('avg ' + blockAvgVal.toFixed(1) + ' mi/wk');
      if (l.miles && l.date) bits.push('latest ' + (+l.miles).toFixed(2) + ' mi ' + day(l.date, { weekday: 'short' }));
      if (num(lifts) && w.runs > 0 && lifts > 0) bits.push(lifts === w.runs ? 'lifted before every run' : 'lifted before ' + lifts + ' of ' + w.runs + ' runs');
      if (synced) bits.push(synced);
      if (bits.length) { seg.textContent = bits.join(' · '); marquee(); }
    }

    var stale = doc.querySelector('[data-run-stale]');
    if (stale && d.generated_at && (Date.now() - Date.parse(d.generated_at)) / 864e5 > 10) {
      stale.textContent = 'Last synced ' + d.generated_at.slice(0, 10) + '; the log is behind.';
      stale.hidden = false;
    }

    if (l.polyline && window.__route) window.__route(l);
  }).catch(function () { /* the seeded markup stands */ });

  var titles = {
    home: 'Alex Lopez',
    projects: 'Graphene — Alex Lopez',
    also: 'Also built — Alex Lopez',
    work: 'XP: experience — Alex Lopez',
    outside: 'Outside — Alex Lopez'
  };
  var pin = { nemisis: 'nemisis', reglineage: 'reglineage', imc: 'imc', running: 'running', golf: 'golf' };
  function onView(moveFocus) {
    var v = doc.documentElement.dataset.view || 'home';
    var hash = location.hash.slice(1);
    if (hash === 'running') doc.title = 'Running — Alex Lopez';
    else if (titles[v]) doc.title = titles[v];
    var root = v === 'home' ? doc.getElementById('top') : doc.getElementById(v);
    var rev = root && root.querySelector('[data-reveal]');
    if (rev) rev.classList.add('in');
    if (moveFocus && v !== 'home') {
      var target = doc.getElementById(pin[hash]) || (root && root.querySelector('h1'));
      scrollTo(0, 0);
      if (pin[hash] && target && hash !== 'running') target.scrollIntoView();
      var heading = root && root.querySelector('h1');
      if (heading) {
        heading.setAttribute('tabindex', '-1');
        heading.focus({ preventScroll: true });
      }
    } else if (moveFocus) {
      scrollTo(0, 0);
    }
    if (v === 'outside') { rollOdo(); growAvg(); marquee(); if (stripFrame) stripFrame(); }
  }
  addEventListener('hashchange', function () { onView(true); });
  onView(location.hash.length > 1);
})();
