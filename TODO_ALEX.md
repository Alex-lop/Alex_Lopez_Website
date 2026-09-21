# TODO_ALEX.md — what only you can do

## 1. Strava sync (secrets are set)

The three repo secrets are in place (`STRAVA_CLIENT_ID`, `STRAVA_CLIENT_SECRET`,
`STRAVA_REFRESH_TOKEN`), scoped `activity:read_all`. The 3-hour job caches a rotated refresh
token so it can keep running without a `GH_SECRETS_PAT`. Re-auth if a run dies with exit 2 or 3:
`bash scripts/setup-strava.sh`. Keep the privacy zone around home on; the file never stores
where you ran.

The first green run on this branch rewrites `data/strava.json` with the live week. After merge
to `main`, cron `17 */3 * * *` plus `workflow_dispatch` keep it fresh.

## 2. Graphene photos and videos (later)

The essay placeholders, horse Tinder, Terrance videos, and desk photo are off the page until you
have them. Graphene currently shows only the wordmark (`assets/projects/graphene-mission-control.webp`).
When you are ready, drop files in `assets/` and we can put a short photo/video row back under the
two paragraphs. Nothing is blocking on this.

## 3. Copy to confirm

Everything I wrote or changed is in `COPY_REVIEW.md`. The ones I'd read first:

- The four About sentences, now the lede on XP: experience.
- The hub greeting "Helloooo, I'm Alex".
- The Graphene tagline and the two origin paragraphs (CSS moment folded in; book story and images off until you have photos).
- The shortened Nemisis and RegLineage paragraphs.
- Luna as its own hobby row: "Chief Code Reviewer."

## 4. Photo captions

The strip captions are place and year in the Lando style. The running group has "Boston, 2026";
the golf swing and the chess image have none yet. Where and when was the golf photo taken? The
chess image is an illustration, so it can stay uncaptioned or take a line of yours.

## 5. The race

The countdown is on the page: "N days to Eversource Hartford, Oct 10." It needs two facts I do
not have: the distance (half marathon?) and your goal time. Add them to the `.countdown` line in
`index.html` once you decide, or tell me and I will.

## 6. When you merge

GitHub Pages deploys from `main`, so merging the PR publishes the redesign. The old branch
`trim-zeus-short-experience-youtube` can be deleted afterwards.
