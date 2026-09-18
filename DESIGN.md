# DESIGN.md — the calls behind the white redesign

Source of truth for how the site looks and moves. Every decision that is not spelled out in
`REDESIGN_BRIEF.md` is written here so it can be argued with. Facts, numbers, dates and links come
from the site as it stood at commit `1669e62` (Sep 17, 2026); none were invented. §8 records what
changed after the plan was reviewed.

## 1. Palette

Six tokens. One base tone, one deeper tone for panels, near-black ink on the same warm ramp, a
secondary ink, a hairline, one accent.

| token       | hex       | job                                                                        |
| ----------- | --------- | -------------------------------------------------------------------------- |
| `--paper`   | `#f5f5f0` | page background; also the solid ground under the essay and Experience      |
| `--paper-2` | `#ebeae2` | panels: the terminal snippet, split cards, placeholder boxes, the ticker   |
| `--ink`     | `#171613` | text, the `\|` ticks, the route line. Warm near-black, not dark-mode black |
| `--ink-2`   | `#55554f` | captions, dates, secondary lines (6.9:1 on paper)                          |
| `--rule`    | `#d8d7ce` | the few hairlines: progress track, placeholder inset, underline at rest    |
| `--accent`  | `#1a5fff` | link hover and focus, the live Strava mark, the runner dot, odometer digits |

The accent is the old site's blue (commit `3c50259`), kept on purpose: it is the one colour Alex
already chose, it is nowhere near the terracotta "warm site" default, and blue on warm off-white is
a poster combination that has aged well. Contrast on `--paper` is 4.7:1, so it is used for marks,
hover and focus, and for the odometer digits (36px+), never for small running text.
`color-scheme: light` is set on `:root` and in a meta tag so an OS dark setting cannot invert it.

The `|` ticks are `--ink` at 8% alpha at rest, up to 35% and 2–3px longer near the pointer. That is
the only colour change on the page.

States that every interactive thing shares:

- Links: `--ink` with a 1px underline in `--ink-2` at rest; underline and text go `--accent` on
  hover. Nav and footer links have no underline at rest and turn `--accent` on hover.
- Focus: `:focus-visible` draws a 2px `--accent` outline, 3px offset, on links, buttons, the
  terminal region, the split strip and the route canvas. Never removed.
- Buttons (hero only): 1px `--ink` box at 2px radius, 44px tall; the primary one is filled with
  `--ink`, the secondary is not. Hover fills or colours with `--accent`. No shadow, no pill.

## 2. Type

Two families, self-hosted in `assets/fonts/` (SIL OFL, licence included), 84 KB in total:

- **IBM Plex Sans** for everything that is UI, heading or factual prose. Static Regular, Medium,
  SemiBold and Italic, subset to Latin (16–18 KB each). Its figures are fixed-width by default,
  so the odometer, readouts, split cards and ticker use it directly; no mono face is shipped.
  The one `<pre>` on the page (Nemisis output) uses the system monospace stack.
- **IBM Plex Serif** Regular (15 KB) for the essay only. A low-contrast text serif, not a display
  face: the essay is the one reading section on the page and the register change (Alex's own
  writing vs. facts) should be visible before you read a word. Same skeleton as the sans, so the
  two sit together without looking like a collage.

Why not the usual suspects: Inter, DM Sans and Space Grotesk are what the last thousand portfolio
sites shipped; an italic serif display over cream is the "warm AI site" the brief names. Plex is
readable at 17px, slightly engineered, and the sans/serif split does real work.

`font-display: swap` on all five faces; only Sans Regular and SemiBold (the hero) are preloaded.
Fallback stack is `system-ui, -apple-system, "Segoe UI", Roboto, sans-serif` and `Georgia, serif`.

Scale (desktop → phone):

| role            | size                            | weight | notes                                       |
| --------------- | ------------------------------- | ------ | ------------------------------------------- |
| body            | 17px → 16px, line-height 1.6    | 400    | prose measure 66ch                          |
| lede            | 1.2rem, 46ch                    | 400    | hero only                                   |
| hero greeting   | 1.15rem, sentence case, `--ink` | 400    | same face as body, same left edge; not caps, not an eyebrow |
| h1              | clamp(2.75rem, 7vw, 4.5rem)     | 600    | tracking −0.02em, line-height 1.02          |
| h2              | clamp(1.75rem, 3.4vw, 2.4rem)   | 600    | tracking −0.015em                           |
| h3              | 1.25rem                         | 600    | project and role names                      |
| essay           | 19px Plex Serif, line-height 1.65, 68ch | 400 | one clear step up from body; its h4s stay in Sans 600 at 1.5rem |
| small / caption | 0.9rem / 0.85rem, `--ink-2`     | 400    | dates, photo captions, source lines         |
| readout         | 0.92rem, tabular figures        | 400    | route readout, split cards, ticker, countdown |
| odometer        | clamp(2.5rem, 5.5vw, 3.75rem)   | 500    | the Running section's headline; smaller than the h1 at every width |

Vertical rhythm: `--gap` of 96px between sections on desktop (64px on phones), 24px between a
heading and its first block, 16px between paragraphs. One left text edge: everything sits on the
left edge of a `min(100%, 1120px)` column with 24px side padding (18px on phones). Nothing is
centred except the ticker.

## 3. Wireframes

Desktop (1280 wide). The `|` field is behind everything; sections are transparent except the two
blocks marked "solid".

```
 Alex Lopez                          Work   Projects   Outside   Running   Resume   GitHub
 | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | |
 | | Helloooo world  | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | |
 | | Alex Lopez      | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | |
 | | Third year at Northeastern, CS and Math. Tools that check what   | | | | | | | | |
 | | AI-written code actually does, and a first marathon in training. | | | | | | | | |
 | | [ Resume ]  [ GitHub ]   | | | | | | | | | | | | | | | | | | | | | | | | | | | | |
 | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | |
 | | About       | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | |
 | | Four plain sentences, 66ch wide.  | | | | | | | | | | | | | | | | | | | | | | | | |
 | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | |
 | | Graphene                                                                     | | | |
 | | Publication control for parallel coding agents                               | | | |
 | | +---------------------------+   Two to five bounded coding agents, one       | | | |
 | | | graphene wordmark (5/12)  |   repository, one operator ... (three          | | | |
 | | +---------------------------+   technical paragraphs in the 7/12 column,     | | | |
 | | August 2026. Python 3.13, ...   66ch)                                        | | | |
 | | 939  test functions across      ...                                          | | | |
 | | 209  commits in 19 days         ...                                          | | | |
 | |  25  known limitations, ...     ...                                          | | | |
 | | Graphene on GitHub                                                           | | | |
 | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | |
 | | Why I built it                                                               | | | |
 | | ┌ solid --paper column, 68ch, Plex Serif 19px ────────────────────────────┐  | | | |
 | | │ You'll never need to write CSS again                                    │  | | | |
 | | │ Now I know for most people ...            [ IMG A placeholder, 4:3 ]    │  | | | |
 | | │ [ hopkinslll.jpg 112px ] I know there are already plenty of videos ...  │  | | | |
 | | │ [ IMG C ] [ IMG D ]  side by side                                       │  | | | |
 | | │ But at the end of the day, what is actually useful to learn, right?     │  | | | |
 | | │ I know there are videos going around ...  [ IMG F placeholder ]         │  | | | |
 | | │ [ ▶ VIDEO E card ] [ ▶ VIDEO E card ]                                   │  | | | |
 | | │ [ PHOTO G placeholder, 3:2, full width ]                                │  | | | |
 | | │ Even as I'm writing this ...                                            │  | | | |
 | | │ The book was wrong                                                      │  | | | |
 | | │ Just recently, as classes ...             [ BOOK placeholder, 2:3 ]     │  | | | |
 | | │ When is the last time that I…                                           │  | | | |
 | | └─────────────────────────────────────────────────────────────────────────┘  | | | |
 | | Graphene runs on the same reflex. Let the agents write. Keep a human at the  | | | |
 | | decision, holding evidence, allowed to say no.                               | | | |
 | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | |
 | | Also built                                                                   | | | |
 | | Nemisis (4/12)                  A payment webhook credits an order twice ... | | | |
 | | Crash-safety verification ...   CrashCheck runs the patched handler ...      | | | |
 | | 634  tests on CPython 3.12–3.14 The model never judges. ...                   | | | |
 | | 600 / 600  nightly agreement    $ uv run nemisis check ...  (terminal panel) | | | |
 | | 14  turns to prove a fix                                                     | | | |
 | | GitHub   Live page                                                           | | | |
 | | RegLineage                        IMC Prosperity 3                           | | | |
 | | July – August 2026. Python 3.11,  March – April 2025. Python, NumPy, Pandas. | | | |
 | | one paragraph                     one paragraph                              | | | |
 | | 2,964,606 governed rows ...       912  of about 13,000 teams                 | | | |
 | | RegLineage on GitHub                                                         | | | |
 | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | |
 | | Experience                                                                   | | | |
 | | ┌ solid --paper block ────────────────────────────────────────────────────┐  | | | |
 | | │ Expandya  Software Engineering Intern                                   │  | | | |
 | | │ June 2026 – September 2026, Westport, CT                                │  | | | |
 | | │ - bullet / - bullet                                                     │  | | | |
 | | │ Northeastern University  Teaching Assistant ...                         │  | | | |
 | | │ O'Hern Lab, Yale University                      +------------------+   │  | | | |
 | | │ Computational Biology Research Assistant         | me-presenting.jpg |  │  | | | |
 | | │ June 2023 – September 2023, New Haven, CT        | New Haven, 2023   |  │  | | | |
 | | │ - bullet / - bullet                              +------------------+   │  | | | |
 | | │ Society of Hispanic Professional Engineers ...                          │  | | | |
 | | │ Degree      Northeastern University, Khoury College. Combined BSE ...   │  | | | |
 | | │ Coursework  Group Theory, Number Theory, ...                            │  | | | |
 | | │ Stack       Python, Java, JavaScript, OCaml, Kotlin, C. PyTorch, ...    │  | | | |
 | | │ Before      Hopkins School, New Haven, CT, 2024. Wrestling captain, ... │  | | | |
 | | │ Now         TA for CS 3200 and CS 1800, on the SHPE board, ...          │  | | | |
 | | └─────────────────────────────────────────────────────────────────────────┘  | | | |
 | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | |
 | | Outside the terminal                                                         | | | |
 | | Running quip + Strava.   Golf line.   Chess quip + Chess.com.                | | | |
 | | <── [ running-team  ] [ golf-swing ] [ chess ] [ luna ] ──> slides on scroll  | | | |
 | |      Boston, 2026                             Luna: Chief Code Reviewer       | | | |
 | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | |
 | | Running                                                                      | | | |
 | | ┌ route panel (transparent, 7/12) ─┐   This week                             | | | |
 | | │ ⌜                              ⌝ │   ▌1▐▌4▐.▌2▐  / 50 mi     ← odometer    | | | |
 | | │      ● start dot pulses          │   ━━━━━━━━━━━━━━░░░░░░░░░░░░ <progress> | | | |
 | | │      then a line draws for 120s  │   Half marathon in 1:32, a first ...    | | | |
 | | │      1 mi · 7:45 markers, paper- │   23 days to Eversource Hartford, Oct 10| | | |
 | | │      backed labels               │   note in italics, "Numbers from Strava,| | | |
 | | │ ⌞                              ⌟ │   synced 2 hours ago."                  | | | |
 | | └──────────────────────────────────┘   [ last 8 weeks sparkline, 50 line ]   | | | |
 | | 2.31 mi   17:52   7:41 /mi   readout    [1 mi 7:38][2 mi 7:41][3 mi ...]     | | | |
 | | Latest run, Sep 16, Boston, MA. Hover    (the last two appear once synced)   | | | |
 | | or drag the route to scrub.                                                  | | | |
 | | ═══ this week 14.2 mi · latest 6.03 mi Wed · lifted before every run · synced 2h ago ═══
 | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | |
 | | lopez.alexan@northeastern.edu    GitHub  LinkedIn  YouTube  Strava  Chess.com  Resume
```

Phone (390 wide). Same order, one column, wider tick spacing (≈ 600 ticks), the route panel gets
the full width above the stats, the photo strip and split strip are native swipe scrollers.

```
 Alex Lopez        Work Projects Outside
                   Running Resume GitHub
 |  |  |  |  |  |  |  |  |  |  |  |  |  |
 |  Helloooo world  |  |  |  |  |  |  |  |
 |  Alex Lopez      |  |  |  |  |  |  |  |
 |  Third year at Northeastern, CS and  |
 |  Math. Tools that check what ...     |
 |  [ Resume ] [ GitHub ]   |  |  |  |  |
 |  About  ...                          |
 |  Graphene                            |
 |  +--------------------------------+  |
 |  |  graphene wordmark             |  |
 |  +--------------------------------+  |
 |  August 2026. Python 3.13, ...       |
 |  939  test functions across 129 files|
 |  209  commits in 19 days             |
 |   25  known limitations ...          |
 |  paragraphs ...                      |
 |  Why I built it (solid column)       |
 |  Also built: Nemisis / RegLineage /  |
 |  IMC stacked                         |
 |  Experience (solid block), poster    |
 |  photo full width, "New Haven, 2023" |
 |  Outside ... strip swipes            |
 |  Running                             |
 |  +------ route panel, 4:3 --------+  |
 |  |  ● ... line draws ...          |  |
 |  +--------------------------------+  |
 |  2.31 mi  17:52  7:41 /mi            |
 |  This week                           |
 |  ▌1▐▌4▐.▌2▐ / 50 mi                  |
 |  ━━━━━━━━━░░░░░░░░░░░                |
 |  Half marathon in 1:32 ...           |
 |  23 days to Eversource Hartford      |
 |  sparkline, split strip (swipe),     |
 |  note, synced                        |
 |  ═══ ticker ═══                      |
 |  footer stacked                      |
```

## 4. Motion plan

What moves, when, for how long. Nothing else animates: no fade-up on cards, no hover lift, no
parallax, no smooth-scroll hijack. Under `prefers-reduced-motion: reduce` every item below is
replaced by its final, static state, and each script listens for the media query changing so
flipping the OS setting takes effect without a reload.

| piece                    | trigger                                | duration / feel                                                                 |
| ------------------------ | -------------------------------------- | ------------------------------------------------------------------------------- |
| `\|` field: pointer      | pointermove (mouse, pen, touch)        | ticks within 220px turn toward the pointer on a damped spring (`v += e × 0.12; v ×= 0.82`, where `e` is the angle error reduced modulo π because a tick is symmetric), swing past and settle in ≈ 0.8s |
| `\|` field: wake         | the last 30 pointer positions          | ticks within 120px of a recent position lean along the travel direction, fading over 800ms |
| `\|` field: scroll       | scroll velocity, read inside the frame and low-passed, clamped | all ticks lean up to ≈ 30° with the scroll, spring back in ≈ 0.6s |
| `\|` field: idle wave    | for 20s after the last pointer or scroll input, on fine-pointer devices only | ≈ 3° drift, 20s period across the field; then the loop stops and the field is still until the next input |
| `\|` field: comb         | the route trace's runner dot           | ticks near the dot lean along the route's local bearing while it passes; one live comb point, expiring 800ms after the last update |
| section reveal           | section enters 80% of the viewport     | the heading wipes in behind a clip edge (`clip-path` inset from the bottom → 0, 600ms), then its first block rises 8px and fades in, 120ms later. Once. Only those two elements; everything else in the section renders at rest |
| week odometer            | the Running stats enter view           | three fixed digit columns roll to their values, 900ms, once (again only if the fetched value differs from the seed) |
| route trace              | Running section on screen              | start dot pulses ≈ 1.5s; the dot runs the route in 120s following the real time profile when streams exist; mile markers drop as passed; 8s hold at the finish; restart from the start point; pauses off screen and when the tab is hidden, on an accumulated clock so it never jumps |
| route scrub              | hover or drag on the route canvas      | the dot snaps to the nearest route point and the readout shows that point's distance, elapsed, pace, HR and elevation; on release the clock is reseated there and the run continues |
| split strip              | the runner passes a mile               | the matching card gets the accent inset; the strip nudges horizontally to keep it in view unless the reader touched the strip in the last 1.5s |
| photo strip (Outside)    | page scroll through the section (desktop, fine pointer) | translateX linked to scroll progress, the strip travels ≈ 35% of its width across the section; on phones it is a native swipe scroller and the scroll handler is not attached |
| ticker band              | always, once on the page               | one line, CSS marquee, ≈ 45s per loop; pauses on hover and focus and while off screen |

Reduced motion, per item: field drawn once and static; reveals off; odometer shows its value;
route drawn complete with all markers and the finish readout (scrub still works, it is
user-driven); photo strip static; ticker becomes a static, wrapping line of the same text.

The field runs one `requestAnimationFrame` loop with a mode: active while a pointer moved, a
scroll is settling, a wake or comb point is alive, or the idle window is open; the idle window
draws at ≈ 20fps through a frame-skip gate; when everything has settled the loop stops. It never
starts before `load`. There is no IntersectionObserver on the field (a fixed canvas always
intersects); the route has one, with a 25% threshold. Frame budget for the field: under 3ms on a
mid-range laptop with the 1,800-tick cap (≈ 600 on phones), achieved by comparing squared
distances, a bounding-box early-out before any wake or comb test, and strokes batched into 8
opacity buckets. Measured numbers go in §9.

## 5. Images

Every image has a job, one treatment: 2px corner radius, no border, no shadow, caption in
`--ink-2` at 0.85rem beneath, `loading="lazy"` with width and height so nothing shifts.

Keep:

| file                                            | where                         | caption                   |
| ----------------------------------------------- | ----------------------------- | ------------------------- |
| `assets/me-presenting.jpg`                      | Experience, beside O'Hern Lab | New Haven, 2023           |
| `assets/running-team.jpg`                       | Outside, photo strip          | Boston, 2026              |
| `assets/golf-swing.jpg`                         | Outside, photo strip          | none yet; place and year asked for in TODO_ALEX.md |
| `assets/chess.jpg`                              | Outside, photo strip          | none; it is an illustration, so no place or year |
| `assets/luna-small.jpg`                         | Outside, photo strip          | Luna: Chief Code Reviewer |
| `assets/hopkinslll.jpg`                         | essay, IMG B                  | Hopkins School            |
| `assets/projects/graphene-mission-control.webp` | Graphene, sized to its column | (alt text only; it has a transparent background so it sits on the paper) |
| `assets/Alex_Lopez_Resume.pdf`                  | nav, hero, footer             |                           |
| `assets/fonts/*`                                | type                          |                           |

Cut (decoration, logos used as marks, or unused):

- `assets/nemisis-banner-dark.png` (a banner behind nothing)
- `assets/projects/reglineage-logo.png` (a logo used as a "mark")
- `assets/projects/x-api-analyst.jpg` (X-Scraper was dropped from the site earlier)
- `assets/projects/imc-prosperity-3.webp` (unused since the dark rebuild)
- `assets/expandya.jpg`, `assets/northeastern.png`, `assets/northeastern_shcool.png`, `assets/shpe.jpg` (employer and school logos)
- `assets/ohern-header4.gif` (lab banner)
- `assets/.DS_Store`
- `screenshots/phase1-*.png` from August (replaced by the new set)

`assets/projects/README.md` keeps only the Graphene provenance entry.

Placeholders in the essay are labelled boxes (`--paper-2`, a 1px `--rule` inset, the label, the
caption beneath) at a fixed aspect ratio so the column does not shift when the real image arrives.
No stock, no generated art, no drawn characters.

## 6. Structure, hooks and contracts

Single page, in this order, one landmark each with these ids: `top` (hero), `about`, `projects`
(Graphene, the essay, then "Also built"), `work` (Experience and the Record list), `outside`,
`running`; footer last. Nav: Work · Projects · Outside · Running · Resume · GitHub, plus the skip
link to `#main`.

Files:

- `index.html`, `styles.css`
- `js/field.js` — the `|` field (≤ 10 KB). The 8-bucket `globalAlpha` stroke loop is lifted from `git show 1669e62:js/run-field.js`.
- `js/route.js` — the route trace. The polyline decoder and its test vector are lifted from the same file.
- `js/site.js` — fetch + render, odometer, split strip, sparkline, ticker, countdown, reveals, photo strip, video cards
- `tools/strava_sync.py`, `.github/workflows/strava-sync.yml`, `data/strava.json`
- `tests/site_check.py`

### DOM hooks the scripts rely on

| hook                                   | used by    | meaning                                                               |
| -------------------------------------- | ---------- | --------------------------------------------------------------------- |
| `<canvas id="field" aria-hidden>`      | field.js   | fixed, full viewport, `z-index: 0`, `pointer-events: none`            |
| `<canvas id="route" data-route data-miles data-pace data-elev data-date data-place data-time tabindex="0">` | route.js | seeded latest run. `data-time` is `round(miles × pace)`, the only elapsed figure the seed can honestly carry. `pointer-events: auto`, `touch-action: pan-y` |
| `[data-route-readout]` with `[data-ro="dist"]`, `[data-ro="time"]`, `[data-ro="pace"]`, `[data-ro="extra"]` | route.js | the counting readout under the panel (aria-hidden; the sr-only line carries the summary) |
| `[data-run="week.miles"]` etc.         | site.js    | text swaps from JSON, same keys as before plus the new ones below     |
| `[data-odo]` with three `.d` columns   | site.js    | the week odometer, columns shipped in the HTML: tens (blank under 10), ones, tenths; the decimal point is static text. `aria-label` carries the value; the columns are aria-hidden |
| `<progress data-week-goal max="50">`   | site.js    | the native progress track, styled 3px; value clamped by the element   |
| `[data-splits]`                        | site.js    | the split strip, `hidden` until `latest.splits` exists (it is below the primary stats and below the fold at load, so revealing it shifts nothing in view) |
| `[data-weeks]`                         | site.js    | the sparkline `<svg>`, same rule                                      |
| `[data-ticker]`                        | site.js    | the marquee text; seeded statically, rebuilt from JSON                |
| `[data-countdown="2026-10-10"]`        | site.js    | days to race, computed from local date parts                          |
| `[data-synced]`                        | site.js    | "synced N hours ago"                                                  |
| `[data-run-stale]`                     | site.js    | the >10-day warning                                                   |
| `[data-reveal]`                        | site.js    | one per section; only the first two children animate                  |
| `[data-strip]`                         | site.js    | the Outside photo strip                                               |
| `[data-video]`                         | site.js    | click-to-load video `<button>`; empty attribute = disabled placeholder |

### Script contracts

`js/field.js` exposes `window.__field = { comb(x, y, angle), static }`. `comb` sets the single live
comb point in CSS pixels of the viewport (`clientX`/`clientY` space) with the lean angle in radians
from vertical; angles are direction-agnostic (reduced modulo π inside the field), so callers pass
any bearing. The point expires 800ms after the last call. `static` is true under reduced motion.
The field rebuilds its tick grid only when the width changes or the height changes by more than
120px (the mobile address bar), debounced; a plain resize just re-sizes the backing store.

`js/route.js` exposes `window.__route(latest)` (the name the old code used) and dispatches one
idempotent state event on `document`: `route:at` with `detail = {mile, fraction, t, reset}`,
sent whenever the integer mile changes in either direction, and with `reset: true` at a restart.
It reads the seeded `data-*` attributes at load so the trace runs before any fetch. It reads
`canvas.getBoundingClientRect()` once per frame to convert the dot into viewport pixels for
`__field.comb`, and throttles its own drawing and comb calls to 30fps (a 10px/s dot needs no more).
Index spaces: the polyline (≤ 800 points, cumulative chord length normalised to 0–1), the streams
(≤ 300 samples by activity time), and the 120s clock. At decode time it precomputes
`polyToStream[i]` by binary search of `streams.miles` for `cum[i] × miles`, and `timeToFraction(t)`
by binary search of `streams.time`; both are then O(1) per frame. Chord length approximates arc
length within a few percent at this resolution, which is accepted. Mile markers print the split
only when `latest.splits` exists; otherwise "1 mi" alone. The trace clock is an accumulator
(`elapsed += min(now − last, 50)`) reset on every resume, so pausing never teleports the dot. Scrub:
hover moves the dot to the nearest point and shows its numbers; on a phone a drag scrubs only once
it is clearly horizontal (|dx| > 10 and |dx| > |dy|), so vertical swipes scroll the page; the canvas
is focusable and the left/right arrow keys step the dot along the route (shift for bigger steps),
so the scrub has a keyboard path. The split strip is focusable too and scrolls with the arrow keys
as a native scroller. Mile
labels are painted over a small `--paper` rectangle so they never sit on live ticks.

`js/site.js` fetches `data/strava.json` with `cache: 'no-cache'`; on failure the seeded markup
stands. It never writes a value the JSON does not contain. It adds the `reveal-ready` class that
turns on the reveal CSS, so if the script fails nothing is hidden, and it has a 2s fallback that
reveals everything still pending. The photo-strip scroll handler is not attached on coarse-pointer
devices. Split strip: highlight via a class from `route:at`; the nudge sets `scrollLeft` on the
strip only (never `scrollIntoView`) and skips if the strip was touched in the last 1.5s. Countdown:
`> 0` days → "23 days to Eversource Hartford, Oct 10"; `0` → "Race day: Eversource Hartford";
past → the line is hidden. Distance and goal time are not on the page until Alex confirms them.

### Before the first successful sync

Today's JSON has the week, the latest run and the polyline, nothing else. So the page shows: the
route trace at constant speed with distance-only mile markers, the odometer and track (14.2 / 50),
the countdown, the note, "synced Sep 16, 2026", and the ticker without the lifts segment. Hidden
until the sync supplies them: the split strip, the sparkline, HR and elevation in the readout, the
lifts segment. Nothing is hand-edited into the JSON to fake that state; `TODO_ALEX.md` has the
secrets steps.

### JSON shape (`data/strava.json`)

Existing keys are unchanged so the current front-end keeps reading it during the transition.
New keys are optional; the page hides what it does not have. Units are miles, feet, seconds.
`null` stands for "Strava has none" (no heart-rate strap, a stopped sample); the file is written
with `allow_nan=False` so `Infinity`/`NaN` can never reach the page.

```
generated_at, week_start, week{runs, miles, pace_sec_per_mi, elev_ft, moving_time_s, days[7]},
latest{
  id, date, name, place, miles, pace_sec_per_mi, elev_ft, polyline,
  moving_time_s, elapsed_time_s,                             # new
  avg_hr, max_hr, cadence, suffer_score, calories,           # new, null when absent
  splits[{mile, miles, moving_time_s, pace_sec_per_mi, elev_change_ft, hr, partial}],   # new, from splits_standard; the trailing partial split is kept with partial: true and no pace
  streams{time[], miles[], pace_sec_per_mi[], alt_ft[], hr[]}   # new, ≤ 300 samples; pace null when v < 0.3 m/s
},
weeks[8]{week_start, miles, runs, moving_time_s},   # new, oldest first, Monday-start, New York; the last one is the live week
totals{ytd_runs, ytd_miles, all_runs, all_miles, lifts_before_runs_this_week},   # new
achievements{prs_30d, achievements_30d},            # new
feeling, pr{half_marathon}                          # hand-edited, preserved
```

`latest.polyline` becomes the full-resolution `map.polyline` downsampled by uniform stride to
≤ 800 points and re-encoded, so the decoder on the page does not change. The encoder diffs against
the previously rounded integer (not the float) and is proven offline against the decoder's own test
vector plus a round-trip check. Only public activities with a polyline qualify as `latest`; privacy
zones are Strava's job and the sync never widens them. Stream arrays are written compactly so a
sync is a small diff.

### The sync (`tools/strava_sync.py`, `strava-sync.yml`)

- Schedule `17 */3 * * *` (off the top of the hour, which GitHub delays) plus `workflow_dispatch`;
  the job runs only when `github.repository == 'Alex-lop/Alex_Lopez_Website'` so forks stay green.
- Order of operations: token exchange; **then, before any other call**, if Strava rotated the
  refresh token: with `GH_SECRETS_PAT` present, `gh secret set STRAVA_REFRESH_TOKEN` from stdin
  (never printed); without it, remember to fail. Then the activity window (`after` = this Monday
  − 56 days, `per_page=200`, paged until short), the detail call and the streams call (each
  optional: a 4xx/5xx there falls back to the summary fields and omits the new keys, and the run
  still writes the week), the athlete stats. Write, then exit 3 if a rotation could not be
  persisted, with a message naming `STRAVA_REFRESH_TOKEN` and the re-authorisation steps. The
  workflow commits the file whenever it changed (`if: always()`, pull-rebase before push for the
  eight-runs-a-day race) and then fails the job if the sync step did not succeed.
- `generated_at` is bumped when the data changed, and also once a day on quiet days (heartbeat),
  so "synced N hours ago" and the >10-day warning stay honest without eight commits a day.
- `--self-check` runs offline with fixtures and asserts: the week figures as before; `latest` from
  a detailed fixture (id, name, moving time, HR fields, cadence, suffer score, calories); splits
  with a partial last split and a negative elevation change; streams of 900 raw samples
  downsampled to ≤ 300 with a zero-velocity sample → `null` pace; `weeks` of length 8 with the
  live week last and a week-9 run excluded; `totals.lifts_before_runs_this_week` counting only
  lifts within two hours before a run; achievements over 30 days; the polyline encoder's test
  vector and a round-trip; and that the output serialises with `allow_nan=False`.

### Test contract (`tests/site_check.py`)

Ids `{top, about, projects, work, outside, running, main}`; one `h1`; alt, width and height on
every `<img>`; external links `target="_blank" rel="noopener noreferrer"`; no `mailto:`; no phone
number; the three script names; the canvases collected by id, `#route` carrying `data-route` and
`#field` carrying `aria-hidden`; `prefers-reduced-motion` in the CSS and in each script; the
dash-bullet CSS (`list-style-type: "- "` and `content: "- "`); `color-scheme: light`; no "↗";
every file under `assets/` (except the licence and README) referenced from the page; the fonts
present; the JSON's existing keys as before plus type checks on the new keys when present; and the
sync's `--self-check` run as a subprocess.

## 7. Copy rules applied

Quips live in the hero greeting, About, and Outside. Everything else is plain. Every sentence I
wrote or changed is in `COPY_REVIEW.md` as `old → new`. The About sentences are assembled only
from facts already on the page (third year, CS and Math, the three projects and what they share,
the TA courses, the SHPE board, running, golf, chess) and are listed there for approval. The essay
is Alex's text with spelling and punctuation fixes only; its three `[ALEX: …]` notes ("TMBBM", the
"Instead of just asking AI" rewrite, and "finish this thought") are HTML comments plus lines in
`COPY_REVIEW.md` and `TODO_ALEX.md`, and the hanging last line is styled as a deliberate ending,
not completed.

## 8. Review against the remove list and the tells

Checked against §1 of the brief and the usual signs of a generated site:

| tell                                            | status                                                                 |
| ----------------------------------------------- | ---------------------------------------------------------------------- |
| cream + terracotta                              | off-white + blue                                                       |
| high-contrast serif display                     | none; a low-contrast text serif for the essay body only, headings stay sans |
| all-caps mono eyebrows over every heading       | removed; headings stand alone; the hero greeting is sentence-case body type |
| 01/02/03 numbering on projects                  | removed                                                                |
| meta strings glued with " · "                   | dates and places are sentences; lists use commas; the countdown is a sentence. The one exception is the ticker band, whose format the brief specifies |
| "↗" on every link                               | removed; links are underlined at rest instead                          |
| boxed plate / ledger / quad framing             | removed; structure from spacing and one left edge. What remains: two invisible solid grounds (essay, Experience) and three reading aids with a `--paper-2` fill (terminal, split cards, placeholders) |
| identical rounded cards with the same shadow    | no cards, no shadows                                                   |
| fade-up on everything                           | one reveal per section, two elements, a clip wipe rather than the stock rise-and-fade |
| dark theme / `color-scheme: dark`               | `color-scheme: light`, `#f5f5f0`                                       |
| decoration images                               | cut (see §5)                                                           |

What changed after the plan was reviewed (three independent critics, then a judge):

- Type: Plex Sans + Plex Mono was one voice doing everything and the standard developer pairing.
  The essay now sets in Plex Serif at 19px so the reading section looks like one; the mono files
  went (Plex's figures are fixed-width by default; the system monospace covers the one `<pre>`).
- The idle wave contradicted "stop when settled". Resolved: the wave runs for 20s after the last
  input on fine-pointer devices, then the loop stops. Phones get the scroll lean only.
- The reveal contract said "children get `.in` in order", which is a fade-up on everything by
  another name. It now names two elements per section and uses a clip wipe.
- The spring needs its angle error reduced modulo π or ticks whip 180° when the pointer crosses
  their axis; the comb needed the same, and a single live point rather than a 12-slot trail.
- The trace clock is an accumulator, not a start timestamp, so pausing never teleports the dot;
  `route:mile` became the idempotent `route:at` so a backwards scrub can be expressed.
- The odometer has fixed geometry (three columns shipped in the HTML) so a 4-glyph week cannot
  reflow the section; the progress track is the native `<progress>` again; the countdown is a
  sentence with local-date arithmetic and a past state.
- The sync persists a rotated refresh token before any other call, widens its window to 8 weeks
  with pagination, treats the detail and streams calls as optional, writes `null` for stopped
  samples with `allow_nan=False`, keeps the partial split flagged, names split elevation as a net
  change, adds a daily heartbeat to `generated_at`, and runs off the top of the hour.
- Experience gets a solid ground like the essay: it is the block a recruiter reads line by line.
  Everything else stays transparent at 8% ticks; Graphene and Nemisis paragraphs are checked on the
  Phase 2 screenshots and get the same ground only if they need it.
- Smaller: the odometer is capped below the h1; the poster photo wireframe sits with O'Hern Lab;
  the ticker carries the lifts segment and pauses on hover, focus and off screen; the reduced-motion
  ticker is a wrapping static line; the split strip nudges instead of `scrollIntoView` and never
  fights a touch; the photo strip is a transform on desktop and a native scroller on phones, never
  both; the field rebuilds its grid only on real resizes; scroll velocity is read in the frame.

## 9. Measurements

Filled in during QA (Phase 5): field frame time at 1280 and 390 wide, Lighthouse mobile
performance, first-load bytes, the widths checked and what broke.
