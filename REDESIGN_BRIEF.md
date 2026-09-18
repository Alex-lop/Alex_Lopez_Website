# Redesign brief — Alex_Lopez_Website

Repo: https://github.com/Alex-lop/Alex_Lopez_Website
Live: https://alex-lop.github.io/Alex_Lopez_Website/
Static site on GitHub Pages. No build step, no framework. Keep it that way.

This brief is the source of truth. Make calls without asking unless something is actually blocking; write every call you made into `DESIGN.md`, and everything you need from me into `TODO_ALEX.md`. If a fact here conflicts with the current site, the site's facts win. If a design instruction conflicts with readability, readability wins.

## 0. Read this first

You're redesigning my personal site. The audience is recruiters for SWE internships. It has to look genuinely good, load fast, and sound like me.

Today (Sep 17, 2026) the site is a dark rebuild in the style of my Nemisis project (commit `7e7b4bb`). It feels cluttered and off: images that don't fit, odd placement, boxed-in sections, and wording that isn't mine. I want to go back toward the feel of the earlier version (commit `3c50259`, Sep 7: off-white `#f5f5f0`, simple, easy to read) but done properly, with a small number of motion pieces that are actually memorable.

Before writing any code:

1. `git show 3c50259:index.html` and `git show 3c50259:styles.css`. That's the white/simple version. Take its palette direction, its readability, and its copy (the quips, the "Helloooo world" opener, "Luna: Chief Code Reviewer"). Don't take its three.js background, its accordion, or the "Impact" tagline (I removed that on purpose).
2. Read the current `index.html`, `styles.css`, `js/run-field.js`, `js/site.js`, `tools/strava_sync.py`, `.github/workflows/strava-sync.yml`, `data/strava.json`, `tests/site_check.py`. Keep every fact, number, date, and link from the current site. Keep the polyline decoder and the opacity-bucketed batch drawing from `run-field.js`; both work.
3. Open https://landonorris.com/ on desktop and mobile. It's the inspiration for motion, not for palette or tone. Borrow: the horizontal photo strip with short place/year captions that slides as you scroll; text that reveals in one orchestrated moment per section; numbers that roll into place; a repeating ticker band, used once. Don't borrow: the black/lime look, the store energy, the bravado. I'm a college student, not an F1 driver.

Work on a branch (`redesign-white`), commit per phase, open a PR at the end.

## 1. Look and feel

- Background: warm off-white / light beige, in the neighborhood of the old `#f5f5f0`. Not pure white, not grey, no texture, no gradients. One base tone plus one slightly deeper tone for panels. Text near-black (real near-black, not tinted `#0b0b0b`-style "dark mode black").
- One accent color, used sparingly: the live Strava mark, link hover, the running dot, the odometer digits. Choose it deliberately. Not the terracotta/clay every AI-generated "warm" site uses, and not neon. The old site's blue `#1a5fff` is acceptable; a deep green or a strong red also works. Commit to one and write it in `DESIGN.md`.
- Typography carries the design. One or two families max, clearly distinct if two. Body 16–18px, line length under 75ch, generous line-height. Headings big but not shouting. The essay in §5 needs a comfortable long-form column. Avoid the cream + high-contrast serif display + terracotta combination; it's the default "warm AI site."
- The uniqueness comes from the `|` field (§2) and the type, not from decoration.
- Remove: the dark theme, `color-scheme: dark`, the all-caps mono "eyebrow" labels above every heading, the 01/02/03 numbering on projects (they aren't a sequence), meta strings glued with " · ", the "↗" on every link, and the boxed plate/ledger/quad framing. Structure should come from spacing and type, not chrome. One grid, one left-aligned text edge, one consistent vertical rhythm between sections; that fixes "the placing feels weird."
- Images: every image needs a job and one consistent treatment (same corner radius, 0 or small; same caption style). Audit `assets/`. Keep `me-presenting.jpg`, `running-team.jpg`, `golf-swing.jpg`, `chess.jpg`, `luna-small.jpg`, `projects/graphene-mission-control.webp`. `hopkinslll.jpg` is the high-school photo the essay wants. Cut anything used as decoration: the Nemisis banner as a hero image, the RegLineage logo as a "mark," anything sitting behind text. No dead files in `assets/` when you're done. Photos get short captions in the Lando style where it fits: "New Haven, 2023" under the poster photo, "Boston, 2026" under the running group.
- Motion budget: the `|` field (§2), the route trace (§6b), the sliding stats in Running (§6c), the photo strip in Outside (§7), and one reveal per section. Nothing else animates. No fade-up on every card, no hover lift on every box.
- Quality floor: responsive down to 360px, visible focus states, `prefers-reduced-motion` respected everywhere, alt text on everything, lazy images with width/height, zero layout shift, Lighthouse performance 90+ on mobile. Set `color-scheme: light` explicitly so an OS dark setting can't flip the palette.

## 2. The `|` field — the one signature effect

The current site has a canvas of short vertical ticks over the running hero that tilt near a focus line and in the pointer's wake (`js/run-field.js`). I want that idea to become the whole site's background and to feel fluid, like it's following you around.

- One fixed full-viewport `<canvas>` behind all content (`position: fixed; inset: 0; z-index: 0; pointer-events: none; aria-hidden="true"`), content in a layer above. Sections are transparent over it. Only the essay column and any dense text panel get a solid base-tone background so reading stays easy.
- A grid of thin vertical strokes (`|`), 24–30px apart on desktop, wider on phones, ink at roughly 8–12% opacity at rest. Adapt density to the viewport and cap the count (~1,800 desktop, ~600 phone).
- Each tick has an angle and an angular velocity. Its target angle points at the pointer when the pointer is within ~220px, with influence falling off smoothly (smoothstep) with distance; outside the radius the target is vertical. Move toward the target with a damped spring (on the order of `v += (target - angle) * 0.12; v *= 0.82; angle += v`) so ticks swing past and settle instead of snapping. The spring is what makes it fluid. Tune it until dragging the cursor across the page leaves a soft wake that resolves in under a second.
- Wake: keep the last ~30 pointer positions with timestamps; ticks near a recent position also lean along the pointer's direction of travel, fading over ~800ms.
- Scroll: on scroll, every tick leans with the scroll velocity (clamped), then springs back. This keeps the field alive while someone is reading without the cursor.
- Idle: a very slow, low-amplitude wave drifting across the field so it's never completely dead. Subtle enough that you notice it only if you look for it.
- Touch: follow `pointermove` from touch too. On scroll-only phones the scroll lean is the whole effect.
- Ticks near the pointer may brighten (up to ~35% opacity) and lengthen a few px. That's the only color change. No glow, no gradients, no color shifts.
- One special moment: in the Running section, ticks inside the route's bounding box comb themselves along the route's local bearing as the trace passes (§6b), so the route looks like it's being drawn through the field. Everything else stays uniform.
- Performance: DPR capped at 2; batch strokes by opacity bucket like the current code; run `requestAnimationFrame` only while something is moving (pointer active, scroll settling, wake alive, trace running) and stop once the field has settled; pause on `visibilitychange`. Budget: under 3ms per frame on a mid-range laptop. If Playwright/Chromium is available, measure it; otherwise leave a note in `DESIGN.md` on what you'd measure.
- Reduced motion: draw the ticks once, static, no pointer or scroll response.

## 3. Page structure and order

Single page, in this order:

1. Hero — name, one line, the field behind it. Open in my voice ("Helloooo world" energy). Keep the resume and GitHub actions.
2. About — three or four plain sentences, mine.
3. Graphene — the main project (§4) plus the essay (§5).
4. Also built — Nemisis, RegLineage, IMC Prosperity 3. Compact, factual, same numbers as now.
5. Experience — Expandya, Northeastern TA, O'Hern Lab, SHPE. Resume facts verbatim, dash bullets, the poster photo with its caption. The degree/coursework/stack "Record" block stays, un-boxed.
6. Outside the terminal — running, golf, chess, Luna (§7).
7. Running — live Strava (§6).
8. Footer — email as plain text (no `mailto:`), GitHub, LinkedIn, YouTube, Strava, Chess.com, resume PDF.

Nav stays: Work · Projects · Outside · Running · Resume · GitHub, plus the skip link. No phone number anywhere.

## 4. Graphene is the main project

Graphene is the project I keep working on and believe in most. It goes first, gets the biggest space, and the only large project image on the page (`graphene-mission-control.webp`, sized to its column, not a background plate). Keep the current technical description and numbers exactly: 939 test functions across 129 files, 209 commits in 19 days, 25 known limitations each naming its fix; Python 3.13 · FastAPI · Google ADK · MCP SDK · Textual · SQLite · Cytoscape.js · Apache-2.0; the GitHub link. Below the technical part, run the essay in §5 under a heading like "Why I built it" as a real reading section, not a margin note.

Nemisis keeps its numbers (634 tests on CPython 3.12–3.14, 600/600 nightly red-team agreement, 14 turns) and both links at roughly a third of the space. The terminal snippet can stay if it fits; the dark banner image goes. RegLineage and IMC keep their numbers, tightened. Don't reorder the facts within a project or "improve" a metric.

## 5. The essay (Graphene background) — my words, don't polish the voice out

Render this as a long-form column (65–75ch) inside the Graphene section. The bracketed items are small inline figures with captions. I'll supply the actual images and video links; build sized placeholders (a labeled box with the caption text) rather than stock or generated images, and never draw a meme or a character yourself. Fix spelling and punctuation only. Keep the asides, the parentheses, the "right?". Anything you're unsure about gets an `<!-- ALEX: ... -->` comment and a line in `COPY_REVIEW.md`. Do not write an ending for me where I left one open.

BEGIN ESSAY

You'll never need to write CSS again

Now I know for most people the idea of never having to write CSS, or any front-end at all, may be old news. They might be a senior dev, or someone who's just learning to code. [IMG A — an old senior dev next to Patrick Star. Alex supplies.] But it really hit me when I was following some tutorial on APIs on YouTube. They were building out a simple front-end (hello world from localhost) and writing some CSS, and I thought to myself: "The last time I wrote CSS was junior year of high school." [IMG B — Hopkins School. `assets/hopkinslll.jpg` already exists.] And it hit me. Outside of this tutorial, I'm never going to need to write CSS ever again, because of AI.

I know there are already plenty of videos that talk about the use of AI, and you know the hype around which agent is the best (aka which one passes the TMBBM). [IMG C — the funny benchmark graph. Alex supplies.] [IMG D — horse Tinder. Alex supplies.] But at the end of the day, what is actually useful to learn, right? [ALEX: confirm "TMBBM" is what you want on the page.]

I know there are videos going around [VIDEO E — Terrance's video plus one more. Alex supplies links; render as click-to-load cards, never autoplaying iframes.] about how the involvement and the learning shouldn't be lost with AI, it should be gained, and how most people kind of use AI without actually gaining the knowledge. As an undergrad, I couldn't agree more. But if you could just get to a solution [IMG F — "looks good to me" meme. Alex supplies.], and it's honestly better than what you could've come up with in a day, why wouldn't you?

Even as I'm writing this [PHOTO G — over-the-shoulder shot of me writing this at my desk. Alex supplies. This is the essay's one real photo; give it more room than the memes.], I think to myself: why can't an AI just write this for me?

So, to be honest, I don't really have a definitive answer. I think AI and the models will keep improving, so I leave it up to you: do you even think it's necessary to learn the things your agent can probably do better than you? Or do you not worry about it, and focus on the higher-level design and logic?

The book was wrong

Just recently, as classes were starting up again, I was reading the textbook for my Group Theory class [BOOK — title and cover. Alex supplies.] and following along with one of the examples, and I noticed the calculation seemed off. (And I'm not saying this to shame the book. I think it's an amazing book, honestly one of the most well-written books I've read, almost of all time.) Instead of just asking AI like I've been doing lately, I spent 15 minutes working through the algebra of the problem (it was a simple FOIL problem a middle schooler could do in one minute), and I kept noticing that my answer wasn't the one in the book. Ultimately I did use AI to check what I was missing, and ultimately I was right. The book had a slight typo in the result. [ALEX: I rewrote "However, dealing with the recent use cases of AI" as "Instead of just asking AI like I've been doing lately" — change it back if that's not what you meant.]

I was shocked. I had never actually proven or contradicted something that was given to me by an authority for what feels like two years. Ever since the rise of AI, it seems it's gotten so good that you can blindly trust it and not worry about it. When ChatGPT and Claude first came out they'd have these hallucinations, but recently it's gotten to the point where I don't even bother to wonder if I could possibly be the one who's correct. I simply ask the agent to explain itself further. But this one moment, where I actually noticed I had figured something out, was so satisfying. It was like finding the hidden treasure my younger self was always digging for at the beach. That almost magical idea of "treasure" that I'd uncovered really woke up my curiosity and prompted me to think:

When is the last time that I…

[ALEX: finish this thought. Until then, style the line as a deliberate hanging ending. Agent: do not complete it.]

END ESSAY

Closing bridge back to Graphene. This line is already on the site; keep it as the hand-off, or propose a better one in `COPY_REVIEW.md` without replacing it silently:

"Graphene runs on the same reflex. Let the agents write. Keep a human at the decision, holding evidence, allowed to say no."

## 6. Running — live Strava, a two-minute trace, better stats

### 6a. Make the sync actually live

The pipeline exists (`tools/strava_sync.py` + `.github/workflows/strava-sync.yml`) but has never run on its own: `data/strava.json` was committed by hand on Sep 16 and there is no commit by the `strava-sync` bot. Right now Strava reads 20.2 mi for the week of Sep 14 (Mon 3.82, Tue 4.34, Wed 6.03, Thu 6.02) and the site still says 14.2.

- Check `git log --author=strava-sync` and the Actions tab. If the workflow has never succeeded, the three secrets (`STRAVA_CLIENT_ID`, `STRAVA_CLIENT_SECRET`, `STRAVA_REFRESH_TOKEN`) are probably missing. You can't set them. Put the exact steps in `TODO_ALEX.md` (the workflow header already documents them, scope `activity:read_all`) and don't fake data in the meantime. The seeded markup stays at whatever the JSON says.
- Schedule: every 3 hours (`0 */3 * * *`) plus `workflow_dispatch`. A handful of requests every three hours is nowhere near Strava's rate limits.
- Refresh-token rotation: the script only warns today. If a `GH_SECRETS_PAT` secret with secret-write permission exists, write the new token back with `gh secret set STRAVA_REFRESH_TOKEN`; otherwise fail the job with a message that says exactly which secret to update. Document both paths in the workflow header.
- Extend the JSON. Keep the current keys so the old front-end reads it during the transition, keep the hand-edited `feeling` and `pr` fields, keep the "only public activities with a polyline" rule and the privacy-zone behavior.
  - `latest`: from the detailed endpoint `GET /activities/{id}`: full-resolution `map.polyline` (not the reduced `summary_polyline`) downsampled to ≤ 800 points; `splits_standard` (per-mile pace, elevation, HR); `average_heartrate` and `max_heartrate` when `has_heartrate`; `average_cadence`; `suffer_score` (relative effort); `calories`; the activity `id` and `name`.
  - `latest.streams`: from `GET /activities/{id}/streams?keys=time,distance,velocity_smooth,altitude,heartrate&key_by_type=true`, downsampled to ≤ 300 samples. This is what lets the trace run "as I ran it" and the scrubber show pace, HR, and elevation at any point.
  - `weeks`: the last 8 weeks as `[{week_start, miles, runs, moving_time_s}]`, Monday-start, America/New_York.
  - `totals`: from `GET /athletes/141554769/stats`: `ytd_run_totals` and `all_run_totals` (distance and count). Plus `lifts_before_runs_this_week`: days this week with a `WeightTraining` activity starting within two hours before a `Run`. This week that's every run day.
  - `achievements`: PR and achievement counts from the last 30 days.
- Front-end: fetch `data/strava.json` with `cache: 'no-cache'`, render, and show "synced N hours ago" from `generated_at`. The seeded static markup must still read correctly if the fetch fails. Keep the >10-day stale warning.
- Extend `--self-check` in `strava_sync.py` to cover the new fields with fixture data; it must run offline.

### 6b. The route trace — start point first, then run it

Replace the current 1.4-second reveal.

- Start state: only the frame corners and the start point, a pulsing dot. No ghost of the full route; the shape should be a surprise.
- Over 120 seconds a runner dot moves along the route and a line draws behind it. If `latest.streams` exists, the dot's position at time t follows the real time/distance profile scaled to 120s, so it visibly slows on the climb and picks up on the way back. Otherwise constant speed.
- As each mile is passed, drop a small marker with the split (e.g. "1 mi · 7:38"). A readout near the frame counts up: distance, elapsed (real elapsed, scaled), current pace.
- Finish: the dot stops, the final line reads distance and time (right now that's 6.02 mi · 47:37), hold ~8s, then restart from the start point. Animate only while the section is on screen (IntersectionObserver); pause when it isn't.
- Hover or drag on the canvas scrubs the dot to the nearest point of the route and shows that point's pace, HR, and elevation. Release and the animation resumes from there.
- Reduced motion: draw the full route with markers immediately, readout at the finish values.
- Mobile: the route gets its own full-width panel above the stats; the trace still runs.
- Keep the `data-route`/`data-miles`/`data-pace`/`data-elev`/`data-date`/`data-place` seeding on the canvas so the trace works before the fetch and the test can assert it.

### 6c. Stats — not seven bars

Drop the Mon–Sun bar chart. Build two or three of these, whichever fit the layout best, in the Lando spirit (numbers roll in, elements slide as you scroll):

- Week odometer: this week's miles toward the 50-mile goal, digits rolling like a split-flap or odometer when they come into view, with a thin progress track. This is the headline number.
- Mile-split strip: the latest run's splits as cards that slide horizontally as you scroll or drag, each with pace, elevation, HR; the current split highlights as the runner dot passes it.
- Eight-week strip: last 8 weeks of mileage as a small sparkline with the 50-mile goal line, this week live.
- Live ticker band, one line, slow marquee, fed by the JSON: "this week 20.2 mi · latest 6.02 mi Thu · lifted before every run · synced 2h ago". Use it once on the page and nowhere else.
- Race countdown, only after I confirm: [ALEX: Eversource Hartford, Oct 10, 2026 — half marathon? goal time?] days to race and goal.

Keep my hand-written `feeling` note and the "Half marathon in 1:32, a first marathon in training" line. Everything must read correctly on a phone.

## 7. Voice and copy — sound like me, quips only where they belong

My writing sounds like this. Verbatim samples; match this, don't outdo it:

- "7 years in playing chess and I still blunder every other move, but add me — always down to get a quick game in."
- "One of my favorite hobbies. The feeling of just running is (I know this sounds cliché) really when I feel the most free."
- "Helloooo world"
- "Luna: Chief Code Reviewer"
- Golf, from the old site: "I picked up golf recently and I've really been loving it; it's one of those sports that really, really humbles you every single time you step on the course, but that one perfect shot keeps pulling you right back out there."

Rules:

- Quips go in the hero greeting, About, and Outside the terminal. Chess gets the quip, the Chess.com link (https://www.chess.com/member/cheboialex), and a small photo. Running gets the running quip and the Strava link (https://www.strava.com/athletes/141554769). Golf and Luna as above. The Outside section is where the Lando-style sliding photo strip lives: running group ("Boston, 2026"), golf swing, chess, Luna.
- Experience, project descriptions, and the Strava numbers stay plain and factual. No jokes in bullet points. Never a joke that undercuts the work.
- Light, not trying hard. If a line reads like a LinkedIn influencer or a brand voice, cut it. When in doubt, plainer.
- Don't invent anything about me. Every fact, number, date, and link comes from the current site or this brief.
- Every sentence you write or rewrite goes into `COPY_REVIEW.md` as `old → new` so I can review the copy in one pass.

## 8. Technical constraints

- Vanilla HTML/CSS/JS. No build step, no framework, no bundler, no npm. Fonts self-hosted in `assets/fonts/` (preferred) or from Google Fonts with a real fallback stack. No external images.
- GitHub Pages serves the default branch root; keep paths relative.
- `python3 tests/site_check.py` must pass. Update its assertions to the new structure (ids, script names, JSON keys) and keep its invariants: one `h1`; alt, width, and height on every image; external links `target="_blank" rel="noopener noreferrer"`; no `mailto:`; no phone number; `prefers-reduced-motion` in CSS and JS; seeded route on the canvas; JSON shape checks; `python3 tools/strava_sync.py --self-check` passes.
- Accessibility: skip link, `:focus-visible`, the canvas `aria-hidden` with the same information available as text, `sr-only` readout for the route.
- First load under ~600 KB including fonts; images lazy below the fold; the field's JS under ~10 KB.

## 9. Process and deliverables

Phase 0 — Plan. Write `DESIGN.md`: palette tokens (4–6 named hex values), type choices and scale, ASCII wireframes of the page at desktop and phone width, the motion plan (what moves, when, for how long), and the list of images you're keeping and cutting. Review the plan against the "remove" list in §1 and against the tells of a generic AI-made site (cream + terracotta, all-caps eyebrows, numbered cards, dot-joined meta strings, arrows on links, identical rounded cards with the same soft shadow, a fade-up on everything). Revise anything that reads as a default and say what you changed. Commit. Keep going unless I've told you "plan only."

Phase 1 — Tokens, base styles, typography, layout skeleton on the light theme. Screenshots at desktop and 390px to `screenshots/`. Look at them and fix what's off before moving on.

Phase 2 — The `|` field.

Phase 3 — Sections and copy. `COPY_REVIEW.md`.

Phase 4 — Strava: sync changes, JSON shape, self-check, trace, stats.

Phase 5 — QA: Lighthouse, reduced motion, keyboard only, widths 360/390/768/1280/1920, Safari + Chrome + Firefox, OS dark mode on. Update `README.md` with how the sync works and how to run the tests.

Final PR description: what changed, screenshots, `TODO_ALEX.md` (secrets, images to supply, copy to confirm, the race question), and what you'd do next.

## 10. Definition of done

- Light beige/white theme, one accent, no boxed sections, nothing sitting behind text.
- The `|` field runs across the whole site, follows the cursor and scroll with a spring, stays under budget, and goes static under reduced motion.
- Graphene first, with the essay as a real reading section and every placeholder labeled.
- Nemisis, RegLineage, IMC, Experience: same facts as today, fewer boxes.
- Outside: the quips, the sliding photo strip, Chess.com and Strava links, Luna.
- Running: two-minute trace from the start point with mile markers and scrubbing; two or three new stats instead of the bar chart; the sync scheduled every 3 hours and either running or blocked on a clearly documented secret; the week total will read 20.2 the first time the sync succeeds without anyone editing JSON.
- Tests and self-check pass; Lighthouse mobile performance 90+; `COPY_REVIEW.md`, `DESIGN.md`, `TODO_ALEX.md` in the PR.
