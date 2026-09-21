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

  function drawWeeks(weeks) {
    var fig = doc.querySelector('[data-weeks]'), s = fig && fig.querySelector('svg');
    if (!s || !weeks || weeks.length < 2) return;
    var n = weeks.length, mi = weeks.map(function (w) { return +w.miles || 0; });
    var top = Math.max(50, Math.max.apply(null, mi)) * 1.1;
    var x = function (i) { return 10 + i * 290 / (n - 1); };
    var y = function (v) { return 70 - v / top * 58; };  // 0..top -> baseline 70 up to 12
    var g = y(50), lx = x(n - 1), ly = y(mi[n - 1]), dim = 'fill="var(--ink-2)"';
    var low = mi[n - 1] < mi[n - 2] && ly + 13 > 64;  // a near-zero last week: nothing fits under the point, so the value goes right of it
    var ty = low ? 73 : (mi[n - 1] >= mi[n - 2] ? ly - 6 : ly + 13);  // otherwise on the side the line does not come from
    s.setAttribute('font-size', 10);
    s.innerHTML =
      '<line x1="10" x2="300" y1="' + g + '" y2="' + g + '" stroke="var(--ink-2)" stroke-dasharray="3 3"/>' +
      '<text x="303" y="' + (g + 3.5) + '" ' + dim + '></text>' +
      '<polyline points="' + mi.map(function (v, i) { return x(i) + ',' + y(v); }).join(' ') + '" fill="none" stroke="var(--ink)" stroke-width="1.5"/>' +
      '<circle cx="' + lx + '" cy="' + ly + '" r="3.5" fill="var(--accent)"/>' +
      '<text x="' + (low ? lx + 6 : lx - 7) + '" y="' + ty + '"' + (low ? '' : ' text-anchor="end"') + ' fill="var(--ink)"></text>' +
      '<text x="10" y="78" ' + dim + '></text><text x="300" y="78" text-anchor="end" ' + dim + '></text>';
    ['50', mi[n - 1].toFixed(1), day(weeks[0].week_start), day(weeks[n - 1].week_start)]
      .forEach(function (v, i) { s.querySelectorAll('text')[i].textContent = v; });
    s.setAttribute('aria-label', weeks.map(function (w, i) { return day(w.week_start) + ': ' + mi[i].toFixed(1); }).join(', ') + ' miles; goal 50');
    fig.hidden = false;
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

  /* video cards */
  all('button.video[data-video]').forEach(function (btn) {
    var id = btn.getAttribute('data-video');
    if (!/^[\w-]{6,20}$/.test(id)) return;
    var cap = btn.parentNode.querySelector('figcaption');
    var caption = cap ? cap.textContent.trim() : '';
    btn.disabled = false;
    btn.setAttribute('aria-label', 'Play video: ' + caption);
    btn.addEventListener('click', function () {
      var f = doc.createElement('iframe');
      f.className = 'video-frame';
      f.src = 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1';
      f.title = caption;
      f.setAttribute('allow', 'autoplay; encrypted-media; picture-in-picture');
      f.setAttribute('allowfullscreen', '');
      f.setAttribute('loading', 'lazy');
      btn.replaceWith(f);  // the button goes with its click handler; a player inside a live button is not valid
      f.focus();
    });
  });

  /* reduced motion: the OS setting or the footer toggle, same effect. The button's label is its state;
     under the OS setting there is nothing for it to resume, so it is disabled rather than lying. */
  var toggle = doc.querySelector('[data-motion-toggle]');
  function applyMotion() {
    reduce = motionOff();
    if (reduce) { revealAll(); if (strip) strip.style.transform = ''; } else if (stripFrame) stripFrame();
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

    drawWeeks(d.weeks);
    buildSplits(l.splits);

    if (seg) {
      var lifts = d.totals && d.totals.lifts_before_runs_this_week, bits = [];
      if (num(w.miles)) bits.push('this week ' + w.miles.toFixed(1) + ' mi');
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
    about: 'About — Alex Lopez',
    projects: 'Graphene — Alex Lopez',
    also: 'Also built — Alex Lopez',
    work: 'Experience — Alex Lopez',
    outside: 'Outside — Alex Lopez',
    running: 'Running — Alex Lopez'
  };
  function onView(moveFocus) {
    var v = doc.documentElement.dataset.view || 'home';
    if (titles[v]) doc.title = titles[v];
    var root = v === 'home' ? doc.getElementById('top') : doc.getElementById(v);
    var rev = root && root.querySelector('[data-reveal]');
    if (rev) rev.classList.add('in');
    if (moveFocus && v !== 'home') {
      scrollTo(0, 0);
      var heading = root && root.querySelector('h1');
      if (heading) {
        heading.setAttribute('tabindex', '-1');
        heading.focus({ preventScroll: true });
      }
    } else if (moveFocus) {
      scrollTo(0, 0);
    }
    if (v === 'outside' && stripFrame) stripFrame();
    if (v === 'running') { rollOdo(); marquee(); }
  }
  addEventListener('hashchange', function () { onView(true); });
  onView(location.hash.length > 1);
})();
