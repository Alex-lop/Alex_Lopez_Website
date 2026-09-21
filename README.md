# Alex_Lopez_Website

Personal site: a static hub plus inner pages, no build step, no framework, no dependencies. GitHub
Pages serves `main` from the repo root, so a push to `main` is a deploy. Plain HTML, CSS and three
vanilla JS files; every path is relative. The landing page is a Skula-style rail (greeting, then
labeled groups: projects, XP: experience, thing I like to do w/ my free time, links). Each section is a hash
destination (`#projects`, `#nemisis` / `#reglineage` / `#imc`, `#work`, `#outside`) with
a `‹ index` back link. `#running` opens Outside at the live log. About lives on XP: experience. Resume is in the inner footer, not on the hub.

## Layout

```
index.html                         hub + every inner page (shown one at a time)
styles.css                         all of the CSS
js/field.js                        the | field: the canvas of vertical ticks behind everything
js/route.js                        the route trace in Running
js/site.js                         reads data/strava.json; odometer, splits, ticker, countdown,
                                   reveals, the Pause motion button
data/strava.json                   the running data, written by the sync
tools/strava_sync.py               the sync (stdlib only)
.github/workflows/strava-sync.yml  runs the sync every 3 hours
tests/site_check.py                structural checks
assets/                            fonts, photos, resume PDF
DESIGN.md                          palette, type, wireframes, motion plan, DOM contracts
REDESIGN_BRIEF.md                  the brief this was built from
COPY_REVIEW.md                     every line of copy, old -> new
TODO_ALEX.md                       what still needs Alex: secrets, images, copy to confirm
```

## The Running section

It lives at the top of Outside (hobbies). It reads `data/strava.json`: the week odometer against the 50-mile goal and its progress track, the
route trace of the latest run with mile markers and a tape to rewind, the mile-split strip, the last eight
weeks as a sparkline, the ticker band, "synced N hours ago", and the countdown to Oct 10.

Every number is also seeded in the HTML with the value the JSON held at commit time. `js/site.js`
fetches the file and overwrites only the values it actually finds; if the fetch fails the seeded
markup stands, and the parts that need data the JSON does not carry yet (split strip, sparkline)
stay `hidden`. Nothing is written that the JSON does not contain, and nothing is hand-edited into
the JSON to fake a state.

`feeling` and `pr.half_marathon` are hand-written; the sync preserves them.

## How the Strava sync works

`.github/workflows/strava-sync.yml` runs `python3 tools/strava_sync.py` on `17 */3 * * *` (every
three hours, off the top of the hour) plus `workflow_dispatch`, commits `data/strava.json` when it
changed, and Pages redeploys on that push. The job is skipped on forks. `generated_at` is also
bumped once a day on quiet days, so "synced N hours ago" and the 10-day stale warning stay honest
without eight commits a day.

Three repo secrets, Strava scope `activity:read_all`: `STRAVA_CLIENT_ID`, `STRAVA_CLIENT_SECRET`,
`STRAVA_REFRESH_TOKEN`. The step-by-step setup is in the workflow file's header.

Strava rotates the refresh token from time to time. Two paths:

- With an optional `GH_SECRETS_PAT` secret (a fine-grained PAT on this repo with Secrets: write),
  the script writes the new token straight back with `gh secret set` and keeps running unattended.
  The token is never printed.
- Without it, the sync still writes and commits today's data, then exits 3 and the job fails with a
  message naming `STRAVA_REFRESH_TOKEN` and the re-authorisation steps.

`data/strava.json` contains `generated_at`, `week_start`, `week` (runs, miles, pace, elevation,
moving time, the seven day miles), `latest` (id, date, name, place, miles, pace, elevation, the
polyline downsampled to <= 800 points, moving and elapsed time, heart rate, cadence, relative
effort, calories, per-mile `splits`, and `streams` of <= 300 samples of time/miles/pace/altitude/HR),
`weeks` (the last eight Monday-start weeks, America/New_York), `totals` (year-to-date and all-time
runs and miles, plus the runs this week that started within two hours after a lift), `achievements` (PRs
and achievements in the last 30 days), and the hand-edited `feeling` and `pr`. Units are miles, feet
and seconds; `null` means Strava has no value. The detail and stream calls are optional, so their
keys are simply absent when Strava refuses them. Full shape: DESIGN.md section 6.

Only public activities with a polyline are used as `latest`, and the route is written as a shape
moved to a fixed origin (42.0 N, 71.0 W): Strava's privacy zones hide the door from other viewers,
not from the owner's own token, and the page only draws the shape. The file never says where a run
was; `place` is its own string.

## Checks

```
python3 tests/site_check.py            structure, links, assets, JSON shape; also runs the self-check
python3 tools/strava_sync.py --self-check   offline fixture asserts, no network, writes nothing
```

## Preview locally

```
python3 -m http.server 8765 --bind 127.0.0.1
```

Then open <http://127.0.0.1:8765/>. Opening `index.html` over `file://` is not enough: the fetch of
`data/strava.json` needs HTTP.
