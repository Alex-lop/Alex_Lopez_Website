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
| `--rule`    | `#d8d7ce` | the few hairlines: progress track, placeholder inset, the hanging line's end mark |
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
| body            | 17px → 16px, line-height 1.6    | 400    | prose measure 56ch (≈ 66 characters; Plex's `ch` is its tabular zero) |
| lede            | 1.2rem, 46ch                    | 400    | hero only                                   |
| hero greeting   | 1.15rem, sentence case, `--ink` | 400    | same face as body, same left edge; not caps, not an eyebrow |
| h1              | clamp(2.75rem, 7vw, 4.5rem)     | 600    | tracking −0.02em, line-height 1.02          |
| h2              | clamp(1.75rem, 3.4vw, 2.4rem)   | 600    | tracking −0.015em                           |
| h3              | 1.25rem                         | 600    | project and role names                      |
| essay           | 19px Plex Serif, line-height 1.65, 630px (≈ 74 characters) | 400 | one clear step up from body; "Why I built it" is Sans 600 at 1.6–1.9rem and its h4s stay a step below at 1.5rem (1.3rem on phones, where the heading sits at its 1.6rem floor) |
| small / caption | 0.9rem / 0.85rem, `--ink-2`     | 400    | dates, photo captions, source lines         |
| readout         | 0.92rem, tabular figures        | 400    | route readout, split cards, ticker, countdown |
| odometer        | clamp(2.5rem, 5.5vw, 3.75rem)   | 500    | the Running section's headline; smaller than the h1 at every width |

Vertical rhythm: `--gap` of 96px between sections on desktop (64px on phones), 24px between a
heading and its first block, 16px between paragraphs. One left text edge: everything sits on the
left edge of a `min(100%, 1120px)` column with 24px side padding (18px on phones). Nothing is
centred except the ticker.

## 3. Wireframes

Call, later (Sep 21): the landing page is no longer the long scroll. It follows
[skula.me](https://skula.me/) — a centered italic greeting and two labeled lists — and each former
section is a hash destination with a `‹ index` back link. Palette, type, the `|` field, and inner
page layout stay ours. The long-scroll wireframes below still describe each inner page.

Hub, desktop and phone (the rail is `min(460px, 88vw)`, vertically centered):

```
 | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | |
 | |         Hi, I’m Alex,          | | | | | | | | | | | | | | | | | | | | |
 | |  I keep a human in the loop.   | | | | | | | | | | | | | | | | | | | | |
 | |                                | | | | | | | | | | | | | | | | | | | | |
 | |  work     | about              | | | | | | | | | | | | | | | | | | | | |
 | |           | graphene           | | | | | | | | | | | | | | | | | | | | |
 | |           | also built         | | | | | | | | | | | | | | | | | | | | |
 | |           | experience         | | | | | | | | | | | | | | | | | | | | |
 | |           | outside            | | | | | | | | | | | | | | | | | | | | |
 | |           | running            | | | | | | | | | | | | | | | | | | | | |
 | |  signals  | github             | | | | | | | | | | | | | | | | | | | | |
 | |           | linkedin           | | | | | | | | | | | | | | | | | | | | |
 | |           | youtube            | | | | | | | | | | | | | | | | | | | | |
 | |           | resume             | | | | | | | | | | | | | | | | | | | | |
 | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | |
                                                    Pause motion (fixed, corner)
```

Inner page chrome: `‹ index` fixed top-left, same content as the matching block in the long-scroll
wireframe, Pause motion still in the corner. `#projects` is Graphene (and the essay); `#also` is
Nemisis, RegLineage, IMC.

Desktop (1280 wide). The `|` field is behind everything; sections are transparent except the two
blocks marked "solid". This is one inner page at a time now; the old single-page stack is the
no-JS fallback.

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
 | | ┌ solid --paper column, 630px, Plex Serif 19px ───────────────────────────┐  | | | |
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
 | | Latest run, Sep 16, Boston, MA. Drag    (the last two appear once synced)   | | | |
 | | the tape to rewind.                                                          | | | |
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
| hub rise                 | first paint of the home view           | greeting, then labels, then list items, staggered 40–580ms, 820ms ease-out, opacity + 12px (the hub's one reveal; inner pages keep the clip wipe). Off under reduced motion |
| week odometer            | the Running stats enter view           | three fixed digit columns roll to their values, 900ms, once (again only if the fetched value differs from the seed) |
| route trace              | Running section on screen              | start dot pulses ≈ 1.5s; the dot runs the route in 120s following the real time profile when streams exist; mile markers drop as passed; 8s hold at the finish; restart from the start point; pauses off screen and when the tab is hidden, on an accumulated clock so it never jumps. The canvas ignores the pointer, so looking at the map cannot steal the runner |
| route tape               | Start, Pause/Play, drag or arrow the track under the map | the playhead follows the runner; drag (or arrow keys on the focused track) rewinds and the readout shows that point's distance, elapsed, pace, HR and elevation; Start jumps to the beginning and plays; Pause freezes the runner where it is; on release the clock is reseated there and the run continues unless Pause is down. Reduced motion hides Start/Pause; the track still previews while dragged |
| split strip              | the runner passes a mile               | the matching card gets the accent inset; the strip nudges horizontally to keep it in view unless the reader touched the strip in the last 1.5s |
| photo strip (Outside)    | page scroll through the section (desktop, fine pointer) | the strip starts on the content column and is translated by exactly its overflow times the section's scroll progress, so the last photo ends flush with the column's right edge. The photos are 250px tall, so at 1280 and wider the overflow (93px) is smaller than the column's gutter and no photo ever leaves the column; a narrower fine-pointer window slides further and the first photo can leave; a strip that fits does not move; on phones it is a native swipe scroller and the scroll handler is not attached |
| ticker band              | always, once on the page               | one line, CSS marquee, ≈ 45s per loop; pauses on hover and while off screen |
| pause motion             | the footer's Pause motion button       | every row above takes its reduced-motion state until Resume motion; the OS setting does the same and each script listens for both. The page's own pause (WCAG 2.2.2) for the marquee, the trace and the field |

Reduced motion, per item: field drawn once and static; reveals off; odometer shows its value;
route drawn complete with all markers and the finish readout (the tape still previews while
dragged, it is user-driven); photo strip static; ticker becomes a static, wrapping line of the same text.

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

Single page in the source, one view at a time in the window. Hub (`#top` / `#` / empty hash) then
the destinations `about`, `projects` (Graphene and the essay; `#graphene` is an alias), `also`
(Nemisis, RegLineage, IMC), `work`, `outside`, `running`. A head script writes `data-view` before
first paint so the hub does not flash. Inner pages: `‹ index` back to the hub. Nav is the hub
lists; the old top bar is gone. Footer (email + links) on inner pages only. Pause motion is a
fixed corner control on every view.

Ids `{top, about, projects, also, work, outside, running, main}`; one `h1` on the hub and one on
each inner page.

Files:

- `index.html`, `styles.css`
- `js/field.js` — the `|` field (≤ 10 KB). The 8-bucket `globalAlpha` stroke loop is lifted from `git show 1669e62:js/run-field.js`.
- `js/route.js` — the route trace. The polyline decoder and its test vector are lifted from the same file.
- `js/site.js` — fetch + render, odometer, split strip, sparkline, ticker, countdown, reveals, photo strip, video cards, the Pause motion button
- `tools/strava_sync.py`, `.github/workflows/strava-sync.yml`, `data/strava.json`
- `tests/site_check.py`

### DOM hooks the scripts rely on

| hook                                   | used by    | meaning                                                               |
| -------------------------------------- | ---------- | --------------------------------------------------------------------- |
| `<canvas id="field" aria-hidden>`      | field.js   | fixed, full viewport, `z-index: 0`, `pointer-events: none`            |
| `<canvas id="route" aria-hidden data-route data-miles data-pace data-elev data-date data-place data-time>` | route.js | seeded latest run. `data-time` is `round(miles × pace)`, the only elapsed figure the seed can honestly carry. `pointer-events: none`: the canvas is the picture, not a control. The sr-only line carries the summary |
| `[data-tape]` with `.tape-track[role="slider"]`, `[data-tape-start]`, `[data-tape-play]`, `[data-tape-bar]`, `[data-tape-fill]`, `[data-tape-head]`, `[data-tape-ticks]` | route.js | the rewind control under the readout. The track is the slider (`aria-valuemin/max/now/valuetext`, `tabindex="0"`); arrow keys move it; its value text is the readout, written when the reader moves it or the run is at rest. Keyboard focus pins the trace until blur. Start / Pause are hidden under reduced motion |
| `[data-route-readout]` with `[data-ro="dist"]`, `[data-ro="time"]`, `[data-ro="pace"]`, `[data-ro="extra"]` | route.js | the counting readout under the panel (aria-hidden; the sr-only line carries the summary) |
| `[data-run="week.miles"]` etc.         | site.js    | text swaps from JSON, same keys as before plus the new ones below     |
| `[data-odo]` with three `.d` columns   | site.js    | the week odometer, columns shipped in the HTML: tens (blank under 10), ones, tenths; the decimal point is static text. `aria-label` carries the value; the columns are aria-hidden |
| `<progress data-week-goal max="50">`   | site.js    | the native progress track, styled 3px; value clamped by the element   |
| `[data-splits]` (`role="region"`)       | site.js    | the split strip, `hidden` until `latest.splits` exists (it is below the primary stats and below the fold at load, so revealing it shifts nothing in view) |
| `[data-weeks]`                         | site.js    | the sparkline `<svg>`, same rule                                      |
| `[data-ticker]`                        | site.js    | the marquee text; seeded statically, rebuilt from JSON                |
| `[data-countdown="2026-10-10"]`        | site.js    | days to race, computed from local date parts                          |
| `[data-synced]`                        | site.js    | "synced N hours ago"                                                  |
| `[data-run-stale]`                     | site.js    | the >10-day warning                                                   |
| `[data-reveal]`                        | site.js    | one per section; only the first two children animate                  |
| `[data-strip]`                         | site.js    | the Outside photo strip                                               |
| `[data-video]`                         | site.js    | click-to-load video `<button>`; empty attribute = disabled placeholder; on click the button is replaced by the `iframe` |
| `[data-motion-toggle]`                 | site.js    | the footer button; toggles `data-motion="off"` on `<html>` and dispatches `motion:change`, which all three scripts treat like the OS reduced-motion setting. Its label is its state ("Pause motion" / "Resume motion", no `aria-pressed`); under the OS setting it reads "Resume motion" and is disabled, since there is nothing for the page to resume |

### Script contracts

`js/field.js` exposes `window.__field = { comb(x, y, angle), static }`. `comb` sets the single live
comb point in CSS pixels of the viewport (`clientX`/`clientY` space) with the lean angle in radians
from vertical; angles are direction-agnostic (reduced modulo π inside the field), so callers pass
any bearing. The point expires 800ms after the last call. `static` is true under reduced motion.
The field rebuilds its tick grid only when the width changes or the height changes by more than
120px (the mobile address bar), debounced; a plain resize just re-sizes the backing store.

`js/route.js` exposes `window.__route(latest)` (the name the old code used) and dispatches one
idempotent state event on `document`: `route:at` with `detail = {mile, fraction, t, reset}`,
sent whenever the integer mile changes in either direction (`mile` is that integer, 0 at the start),
and with `reset: true` at a restart.
It reads the seeded `data-*` attributes at load so the trace runs before any fetch. It reads
`canvas.getBoundingClientRect()` once per frame to convert the dot into viewport pixels for
`__field.comb`, and throttles its own drawing and comb calls to 30fps (a 10px/s dot needs no more).
Index spaces: the polyline (≤ 800 points, cumulative chord length normalised to 0–1), the streams
(≤ 300 samples by activity time), and the 120s clock. At decode time it precomputes
`polyToStream[i]` by binary search of `streams.miles` for `cum[i] × miles`, and `timeToFraction(t)`
by binary search of `streams.time`; both are then O(1) per frame. Chord length approximates arc
length within a few percent at this resolution, which is accepted. Mile markers print the split
only when `latest.splits` exists; otherwise "1 mi" alone. The trace clock is an accumulator
(`elapsed += min(now − last, 50)`) reset on every resume, so pausing never teleports the dot. The
canvas ignores the pointer (`pointer-events: none`) so looking at the map cannot steal the runner.
The tape under the readout is the scrubber: Start rewinds and plays, Pause/Play freeze or continue,
and dragging the track (or the left/right arrows once it has focus; shift for bigger steps; Home
and End jump to the start and the finish) seats the runner by fraction of route length. On release
the 120s clock is reseated there and the run continues unless Pause is down. A pointer on the
track does not pin the trace; keyboard focus does, until blur. The split strip is focusable too
and scrolls with the arrow keys as a native scroller. Mile labels are painted over a small
`--paper` rectangle so they never sit on live ticks.

`js/site.js` fetches `data/strava.json` with `cache: 'no-cache'`; on failure the seeded markup
stands. It never writes a value the JSON does not contain. It adds the `reveal-ready` class that
turns on the reveal CSS, so if the script fails nothing is hidden, and a 2s fallback reveals
everything only if the observer never reported at all (a working one reports on its first frame).
The photo-strip scroll handler is not attached on coarse-pointer devices; on fine-pointer ones the
strip is translated by its overflow times the section's progress (see §4). The footer's Pause
motion button sets `data-motion="off"` on `<html>` and dispatches `motion:change`; the three
scripts treat it exactly like the OS setting, and Resume motion clears it. Split strip: the card
for the split being run (`mile + 1`, capped at the last card so the partial final split lights
after the last marker) gets a class from `route:at`; the nudge sets `scrollLeft` on the
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

`latest.polyline` is the full-resolution `map.polyline` (or the summary polyline when the detail
call failed) moved so that its first point is a fixed origin (42.0 N, 71.0 W), then evenly
downsampled to ≤ 800 points and re-encoded, so the decoder on the page does not change. That is
the sync's own privacy zone: Strava's zones hide the door from other viewers, not from the owner's
token that this sync uses, and trimming the ends would still publish a loop that passes home
mid-run. The page only draws the shape (route.js normalises it to unit space; `place` is its own
string), so the file never says where a run was; the seeded route in `index.html` and the
committed JSON were moved the same way. Moving 42.34 N to 42.0 N changes the drawn aspect by 0.5%. The encoder diffs against
the previously rounded integer (not the float) and is proven offline against the decoder's own test
vector plus a round-trip check. Only public activities with a polyline qualify as `latest`; the sync
narrows what Strava returns and never widens it. `totals.lifts_before_runs_this_week` counts the
week's runs that started within two hours after a WeightTraining, the same unit as `week.runs`. Stream arrays are written compactly so a
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
  persisted, with a message naming `STRAVA_REFRESH_TOKEN` and the re-authorisation steps. A
  `gh secret set` that fails for any reason (no Secrets permission, `gh` missing, GitHub down)
  counts as not persisted: the data is still written and the same message and exit 3 follow.
- Missing secrets stop the run before the token call with their names (the workflow passes every
  secret through, so an unset one arrives as an empty string). An HTTP error carries Strava's
  response body, which names the field and the code and never a secret. Activities are classified
  by `sport_type`, falling back to the deprecated `type`. Weeks and days bucket on the activity's
  own local date (`start_date_local`, Strava's date for the run); the Monday boundaries come from
  New York. The achievements window is today and the 29 days before it. The
  workflow commits the file whenever it changed (`if: always()`, pull-rebase before push for the
  eight-runs-a-day race) and then fails the job if the sync step did not succeed.
- `generated_at` is bumped when the data changed, and also once a day on quiet days (heartbeat),
  so "synced N hours ago" and the >10-day warning stay honest without eight commits a day.
- `--self-check` runs offline with fixtures and asserts: the week figures as before; `latest` from
  a detailed fixture (id, name, moving time, HR fields, cadence, suffer score, calories); splits
  with a partial last split and a negative elevation change; streams of 900 raw samples
  downsampled to exactly 300 with the stopped last sample → `null` pace; a 1,200-point route to
  exactly 800 starting at the origin with its shape intact and every point over 30 km from where
  it was, and a degenerate polyline publishing nothing; `weeks` of length 8 with the
  live week last and a week-9 run excluded; `totals.lifts_before_runs_this_week` counting the
  week's runs that started within two hours after a lift, and not a run whose lift was three hours
  earlier; achievements over today and the 29 days before it, and none a month later; `sport_type` and
  `type` both classify; the polyline encoder's test
  vector and a round-trip; and that the output serialises with `allow_nan=False`.

### Test contract (`tests/site_check.py`)

Ids `{top, about, projects, also, work, outside, running, main}`; one `h1` on the hub and on each inner page; alt, width and height on
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

What changed after the build was reviewed (five reviewers on the branch: brief compliance, front-end
code, the sync, accessibility and copy, visual; every finding was checked against the code before it
was fixed, and the ones below are what survived):

- Split highlight: `route:at` carried a fractional mile and the cards carry integers, so no card
  ever lit and the nudge never ran. The event now carries the integer, and the card for the split
  being run lights, the partial last one included.
- The field ignored `pointercancel`, which is what a touch that becomes a scroll fires, so a phone
  could be left with a bright sunburst at the last finger position. Bound.
- The reveal fallback fired unconditionally at 2s, revealing every section before the reader got
  there. It now fires only if the observer never reported.
- The ticker's loop width was measured in the fallback font; it is re-measured once the faces load.
  The loaded video replaces its button instead of nesting inside it.
- The route tape is a slider to assistive tech (arrow keys move it, the value text is the readout)
  instead of an image whose label promised numbers the readout hid. The canvas is `aria-hidden`. About, Experience, Outside and
  Running are named regions and Projects is labelled. Empty figcaptions, a duplicate
  `aria-disabled`, the invisible `.source` underline, the 1.3:1 goal line and the 4.2:1 terminal
  prompt are fixed. A Pause motion button in the footer is the page's own pause for the marquee,
  the trace and the field (WCAG 2.2.2), wired through the same path as the OS setting.
- Layout: the photo strip sits on the content column and travels exactly its overflow (it sat 24px
  from the viewport edge and was translated past its last photo); the hidden split strip no longer
  renders 32px of empty flex box; the essay column sits on the page's one left edge and its heading
  is a step above its subheads; Nemisis uses the Graphene grid; stat numbers right-align so labels
  share one edge; the meme placeholders are small inline figures; the prose measure is 56ch (≈ 66
  characters); the footer links sit on the left edge; the route's corner marks hug the route; the
  hanging last line is set as an ending; the sparkline's value label sits off the line (and right
  of the point when the current week is near zero); the essay measure is 630px (≈ 74 characters);
  the route is drawn from the column's left edge rather than centred in its canvas; the strip's
  photos are 250px tall so the strip's overflow fits its gutter at 1280 and wider.
- After the fixes were reviewed again: the tape pins the trace while it holds keyboard focus so
  the arrows step from the value that was read; a pointer on the tape does not pin, so dragging
  never fights the running trace; the Pause motion button has its own CSS rest state
  (no reveal burst on the press), its label is its state and it is disabled under the OS setting;
  Resume motion puts the strip back where the scroll left it; a same-route fetch re-announces the
  mile so the split card lights under reduced motion too; the paused ticker sits on the column.
- Copy: the three Nemisis proof rows the brief said to keep are back as one plain paragraph; the
  running-group alt text counts the bibs correctly; `COPY_REVIEW.md` matches the page and lists the
  screen-reader strings.
- Sync: a failed `gh secret set` no longer aborts the run before the data is written; the optional
  calls survive timeouts and non-JSON bodies; missing secrets are named; downsampling keeps exactly
  the cap; the achievements window is a real 30 days; `sport_type` is read first; the lifts figure
  counts runs, not days; the route is published as a shape at a fixed origin (the seed and the
  committed JSON too) because the owner's token sees past Strava's privacy zones and an end trim
  would still publish a loop that passes home mid-run. On the page, the elapsed clock falls back to distance × pace when a
  summary-only run has no moving time, and a week under an hour reads "28m", not "0h 28m".
- Left as decided: the countdown stays (Alex confirmed the race; distance and goal time are still
  his to add) and the mile labels on the canvas keep "1 mi · 7:38".
- Call, later: hovering the route mixed the cursor with the 120s trace (the runner jumped to the
  nearest point as you moved across the map). The canvas now ignores the pointer. Rewind lives on a
  tape under the readout — Start, Pause/Play, and a 3px track with an accent playhead and mile
  ticks, same language as the week progress track and the footer buttons. Drag the tape or arrow it;
  looking at the map no longer does anything to the runner.

## 9. Measurements

Taken on Sep 18, 2026 on this MacBook (headless Chrome 153 through Playwright 1.63, Lighthouse 13.4
with its mobile simulation, Playwright's WebKit and Firefox) against the local server, after the
review fixes in §8. The scripts (`qa.js`, `verify.js`, `xbrowser.js`, `lh.sh`, `trace_shot.js`)
live in the session scratchpad, not the repo.

| what                                          | result                                                       |
| --------------------------------------------- | ------------------------------------------------------------ |
| Lighthouse mobile                             | performance 99, accessibility 100, best practices 100, SEO 100; LCP 2.0 s, CLS 0, TBT 0 ms, FCP 1.4 s; no audit below 1, also with the split strip and sparkline force-rendered (axe clean at 1280 and 390) |
| Lighthouse desktop                            | performance 100, accessibility 100, best practices 100, SEO 100; LCP 0.5 s, CLS 0, TBT 0 ms |
| first load                                    | 14 requests, 243 KB: HTML 28 KB, CSS 17 KB, JS 39 KB, fonts 84 KB (five Plex faces), the Graphene webp 73 KB, JSON 1.6 KB, favicon |
| `\|` field, 1280×800, pointer sweeping        | 1,470 ticks at 26px; 0.2–0.5 ms per frame average and 0.3–0.8 ms max over 60 sampled frames, across three runs on a busy and an idle machine (budget 3 ms) |
| `\|` field, 390×844 touch                     | 264 ticks at 34px; a touch that turns into a scroll (`pointercancel`) leaves 0 brightened pixels around the last finger position 2.5 s later |
| field idle stop                               | frames stop advancing 20 s after the last input on fine-pointer devices and resume on the next; with Pause motion pressed, no frame is drawn for a pointer sweep |
| route trace                                   | 338-point seeded polyline, published as a shape at the fixed origin; the corner marks hug the route's box and the route sits on the column's left edge; with a synced-shape payload (7 splits, 300 stream samples) the arrow keys light split cards 2 → 3 → 4 → 5 → 7 (the partial one) and nudge the strip 0 → 142 → 284 → 426 → 561 px; Home lights card 1; the slider reads "1.21 mi, 9:21, 7:45 /mi, 169 bpm, 44 ft" |
| a summary-only latest run (no `moving_time_s`) | the readout counts (0.15 mi, 1:12 at 4.5 s in) instead of 0:00 |
| widths 360 / 390 / 768 / 1280 / 1920          | no page errors, `scrollWidth == viewport width` at every width; at 1280 and 1920 the essay (630px wide), its heading and its subheads, the h2s, the route frame and the footer share the 104 / 424 px left edge; the photo strip starts on that edge and travels 93 px, its overflow, so its first photo ends at x = 15 and its last flush with the column; on the phone the essay heading is 25.6px over 20.8px subheads |
| OS dark mode                                  | with `prefers-color-scheme: dark` emulated the page stays `#f5f5f0` / `#171613`, the panels `#ebeae2`; `color-scheme` computes to `light` |
| reduced motion (Chrome, WebKit, Firefox)      | field draws one static frame, ticker static, every section revealed, readout and `aria-valuetext` show the finish values ("6.03 mi, 46:44, 7:45 /mi") |
| Pause motion                                  | one click: `data-motion="off"`, the label "Resume motion", field static, ticker stopped, wrapping and on the column, trace at its finish, every section revealed with no transition running on the press; a second click restores all of it, the strip included; under the OS setting the button reads "Resume motion" and is disabled |
| keyboard                                      | skip link first, then nav, hero buttons, links in page order; 2px accent ring on `:focus-visible`; twenty ArrowRight presses on the tape move the readout 0.00 → 0.60 mi and the slider's value with it; focus 8 s into the run pins the trace (value 0.32 mi, still 0.32 after 6 s), one press steps it 0.03 mi, blur lets it run on, and a pointer drag on the tape then release keeps it running |
| Safari and Firefox                            | Playwright WebKit and Firefox at 1280 and 390: no errors, all five fonts loaded, essay in Plex Serif, trace running, odometer set, ticker running, strip transform on desktop only (`translateX(-93px)` at the section's end) |
| tests                                         | `python3 tests/site_check.py` passes (16 ids, 23 links, 7 images, 17 local assets; the seeded route and the JSON route start at the fixed origin) and runs `--self-check` (offline, also on Python 3.9, 3.13 and 3.14) |

What was not measured: a real mid-range laptop (the field budget was checked on this machine only),
a physical iOS device (the address-bar resize path and touch scrubbing were checked in WebKit's
emulation), a real screen reader (the slider and regions were checked in the accessibility tree
and by Lighthouse), and the sync against the live Strava API, which cannot run until the secrets
exist.
