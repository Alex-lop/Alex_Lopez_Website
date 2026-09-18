/* Running numbers. The markup ships with this week's real figures; this only overwrites them
   from data/strava.json, redraws the week bars, hands the latest route to the field, and
   labels the log as stale when the sync has not moved in ten days. A failed fetch changes nothing. */
(function () {
  'use strict';
  function mmss(s) { s = Math.round(s); return (s / 60 | 0) + ':' + String(s % 60).padStart(2, '0'); }
  function hm(s) { var m = Math.round(s / 60); return Math.floor(m / 60) + 'h ' + String(m % 60).padStart(2, '0') + 'm'; }
  function day(iso, year) { var d = new Date(iso + 'T12:00:00'); return isNaN(d) ? iso : d.toLocaleDateString('en-US', year ? { month: 'short', day: 'numeric', year: 'numeric' } : { month: 'short', day: 'numeric' }); }

  var DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  function drawBars(days, latestIdx) {
    var svg = document.querySelector('[data-week-bars]');
    var bars = svg ? svg.querySelectorAll('rect') : [];
    if (bars.length !== 7) return;
    svg.setAttribute('aria-label', 'Miles per day this week: ' + days.map(function (v, i) { return DAYS[i] + ' ' + (v ? v.toFixed(2) : '0'); }).join(', '));
    var max = Math.max(1, Math.max.apply(null, days));
    days.forEach(function (v, i) {
      var h = v ? Math.max(2, Math.round(52 * v / max)) : 1;
      bars[i].setAttribute('y', 56 - h);
      bars[i].setAttribute('height', h);
      bars[i].setAttribute('opacity', v ? 1 : .35);
      bars[i].setAttribute('fill', i === latestIdx ? 'var(--red)' : 'currentColor');
    });
  }

  fetch('data/strava.json', { cache: 'no-cache' }).then(function (r) { return r.json(); }).then(function (d) {
    var w = d.week, l = d.latest || {};
    var days = w.days || [];
    var out = {
      'week.miles': w.miles.toFixed(1),
      'week.pace': w.pace_sec_per_mi ? mmss(w.pace_sec_per_mi) : '—',
      'week.elev': String(w.elev_ft),
      'week.runs': String(w.runs),
      'week.time': hm(w.moving_time_s || 0),
      'week.range': d.week_start ? 'week of ' + day(d.week_start) + ' · ' + hm(w.moving_time_s || 0) + ' moving' : '',
      'feeling': d.feeling || '',
      'latest.line': l.miles ? day(l.date) + ' · ' + Number(l.miles).toFixed(2) + ' mi · ' + mmss(l.pace_sec_per_mi) + ' /mi · ' + l.elev_ft + ' ft · ' + l.place : '',
      'synced': d.generated_at ? 'synced ' + day(d.generated_at.slice(0, 10), true) : ''
    };
    for (var k in out) {
      if (out[k] === '') continue;
      var els = document.querySelectorAll('[data-run="' + k + '"]');
      for (var i = 0; i < els.length; i++) els[i].textContent = out[k];
    }
    var bar = document.querySelector('[data-week-goal]');
    if (bar) {
      bar.max = 50;
      bar.value = w.miles;
      bar.textContent = w.miles.toFixed(1) + ' of 50 miles this week';
    }
    var latestIdx = -1;
    if (l.date && d.week_start) { var diff = Math.round((Date.parse(l.date) - Date.parse(d.week_start)) / 864e5); if (diff >= 0 && diff < 7) latestIdx = diff; }
    if (days.length === 7) drawBars(days, latestIdx);
    if (l.polyline && window.__route) window.__route(l);
    var age = (Date.now() - Date.parse(d.generated_at)) / 864e5;
    var s = document.querySelector('[data-run-stale]');
    if (s && age > 10) { s.textContent = 'last synced ' + d.generated_at.slice(0, 10) + ' · the log is behind'; s.hidden = false; }
  }).catch(function () { /* static markup stands */ });
})();
