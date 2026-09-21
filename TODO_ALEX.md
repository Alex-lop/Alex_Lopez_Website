# TODO_ALEX.md — what only you can do

## 1. Make the Strava sync live (blocking the running numbers)

The workflow has run once on its own (run 35241008683, Sep 17 2026 at 15:33 UTC) and failed in
9 seconds: `HTTP Error 400: Bad Request` from the token endpoint. `gh secret list` shows no
secrets on the repo, so the three Strava values are missing. Until they exist the site shows the
hand-committed JSON (14.2 mi for the week of Sep 14). Nothing was faked to cover for it.

Set them once (the workflow header has the same steps):

1. https://www.strava.com/settings/api → create an app, callback domain `localhost`. Note the
   Client ID and Client Secret.
2. Open this in a browser (replace CLIENT_ID) and approve, scope `activity:read_all`:
   `https://www.strava.com/oauth/authorize?client_id=CLIENT_ID&redirect_uri=http://localhost/exchange_token&response_type=code&approval_prompt=force&scope=activity:read_all`
   The redirect fails to load; copy the `code` value out of the address bar.
3. `curl -s -X POST https://www.strava.com/oauth/token -d client_id=CLIENT_ID -d client_secret=CLIENT_SECRET -d code=CODE -d grant_type=authorization_code`
   and copy `refresh_token` from the response.
4. In the repo: `gh secret set STRAVA_CLIENT_ID`, `gh secret set STRAVA_CLIENT_SECRET`,
   `gh secret set STRAVA_REFRESH_TOKEN` (each prompts for the value).
5. Keep the privacy zone around home on in Strava. Your own token sees past the zones, so the sync
   publishes the route as a shape moved to a fixed origin; the file never carries where you ran.
   The route already in the repo was moved the same way in this branch (older commits still hold
   the original; rewrite the history if that matters to you).
6. Actions → strava-sync → Run workflow. The first success rewrites `data/strava.json` with the
   real week (20.2 mi as of Sep 17) and the new fields, and Pages redeploys.

Optional, for refresh-token rotation: create a fine-grained PAT with **Secrets: read and write**
on this repo and `gh secret set GH_SECRETS_PAT`. With it, the job updates
`STRAVA_REFRESH_TOKEN` itself when Strava rotates it. Without it, the job still writes the data
but ends red with a message naming the secret to update, and you redo steps 2–4.

## 2. Images and videos for the essay

Drop files in `assets/essay/` and replace the placeholder `<figure>` in `index.html` with an
`<img>` (keep the `figcaption`, add `width`, `height`, `loading="lazy"` and alt text). Suggested
sizes are the placeholder aspect ratios:

| placeholder | what                                             | suggested size |
| ----------- | ------------------------------------------------ | -------------- |
| IMG A       | an old senior dev next to Patrick Star           | 4:3, ~800px wide |
| IMG C       | the funny benchmark graph                        | 4:3, ~800px wide |
| IMG D       | horse Tinder                                     | 4:3, ~800px wide |
| IMG F       | the "looks good to me" meme                      | 4:3, ~800px wide |
| PHOTO G     | over-the-shoulder shot of you writing at the desk (the essay's one real photo) | 3:2, ~1400px wide |
| BOOK        | the Group Theory textbook: title and cover       | 2:3, ~400px wide |
| VIDEO E     | Terrance's video plus one more                   | paste the YouTube id (the part after `v=`) into `data-video=""` on each button; they become click-to-load cards |

IMG B (Hopkins) already uses `assets/hopkinslll.jpg`.

## 3. Copy to confirm

Everything I wrote or changed is in `COPY_REVIEW.md`. The ones I'd read first:

- "TMBBM" in the essay (comment in the HTML above the sentence).
- "Instead of just asking AI like I've been doing lately" — the brief's rewrite of your original
  "However, dealing with the recent use cases of AI"; change it back if that is not what you meant.
- The hanging last line "When is the last time that I…" — finish it when you want to; it is
  styled as a deliberate ending until then.
- The four About sentences, especially the last one.
- Hub greeting "Hi, I’m Alex, I keep a human in the loop." — Skula's sentence shape, from the About
  line about keeping a human in the loop. "Helloooo world" came off the landing to make room.
- The Nemisis proof-strip rows that were cut for space (listed in `COPY_REVIEW.md`).
- The placeholder captions in the essay.

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
