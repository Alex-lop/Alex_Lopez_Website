# COPY_REVIEW.md — every sentence that changed

`old → new`, in page order. "old" is the site at commit `1669e62` (the dark rebuild); where the
line comes from the Sep 7 white version (`3c50259`) or from the brief it says so. Nothing here is a
new fact about Alex. Items marked **confirm** are in `TODO_ALEX.md` as well.

## Head

- `<title>` "Alex Lopez — Northeastern CS + Math" → "Alex Lopez"
- og:title same change. The description is unchanged.

## Nav

- The hub is the nav: labeled lists in the manner of [skula.me](https://skula.me/).
- projects: graphene, other projects (Nemisis, RegLineage, IMC live on that page; they are not listed on the hub)
- XP: experience: internships, teaching, research (one line, so the label is not repeated)
- thing I like to do w/ my free time: this week's miles, golf, chess, luna (one line, `#outside`)
- links: github, linkedin, youtube. Resume is off the hub; it still sits in the inner-page footer.
- Inner pages get a `‹ index` back link. Email stays plain text on the inner footer, not a `mailto:`.

## Hub

Replaces the hero. Skula's sentence shape, Alex's words:

- "Helloooo world" / "Alex Lopez" / the lede / Resume and GitHub buttons → "Hi, I’m Alex, I keep a human in the loop." → "Helloooo, I'm Alex"

## About

Folded into Experience. The four sentences now open `#work`, they are not a separate destination. `#about` still aliases there.

The Sep 7 site said: "I'm Alex, a junior studying Math + CS at Northeastern and really trying to make an : Impact". New, four sentences:

- "I'm Alex, a third year at Northeastern studying CS and Math." (year updated from "junior"; the hero already says third year)
- "Most of what I build is about keeping a human in the loop when AI agents write code: Graphene, Nemisis, RegLineage." (summarises the three project write-ups on the page; no new claim) **confirm** this is how you'd say it
- "During the year I TA databases and discrete math and sit on the SHPE board." (from the Experience section)
- "The rest of the time I'm running, golfing, or losing at chess." (a quip in the spirit of the chess line; cut it if it reads as trying) **confirm**

## Section headings

- "Work and teaching." → "Experience" → "XP: experience" (matches the hub label)
- "What I have been building." → "Graphene" (main project) and "Also built" (the rest)
- "Outside the terminal." → "Outside the terminal"
- "Running" is now an h2 on the hobbies page, not its own destination

## Graphene

- Eyebrow "02" and the "Selected projects" eyebrow → removed.
- Stack line "Aug 2026 / Python 3.13 · FastAPI · Google ADK · MCP SDK / Textual · SQLite · Cytoscape.js · Apache-2.0" → "August 2026. Python 3.13, FastAPI, Google ADK, MCP SDK, Textual, SQLite, Cytoscape.js. Apache-2.0." (format only; same items, same order)
- Link "GitHub ↗" → "Graphene on GitHub"
- Tagline "Publication control for parallel coding agents" → "A visual way to see what you can build next with an agent" (your words: knowing what to build next)
- The three technical paragraphs (bounded agents / scheduler / exact-candidate ledger), then the long essay with placeholders, then the closing bridge → two short paragraphs next to the wordmark. The CSS moment and the "guiding and hoping" line fold into the origin story; the Group Theory book, TMBBM, horse Tinder, videos, and hanging ending come off until photos exist. **confirm** the two paragraphs:
  - "I kept leaving an agent running for hours and having no idea, at a high level, what it had done. The only way to find out was reading thousands of lines of a markdown file. The last time I wrote CSS was junior year of high school — sitting through a YouTube tutorial I realized I'm never going to need to write it again, because of AI. If an agent can get to a solution that's honestly better than what you could've come up with in a day, you use it. Then you feel disconnected, like you're just guiding it down a path and hoping it gets it right."
  - "Tokens are going to be cheap. How a developer works with an agent isn't going to be bounded by tokens. It's the ability to actually create initiative. Graphene tries to answer that with a visual approach to the decisions that can be made, because the limit for most developers is just that: knowing what to build next. Not another ledger of callbacks. A way to actually collaborate with the agent instead of steering it and hoping. Still working on this, and most likely going to submit it to a hackathon (probably the NVIDIA x Nebius hackathon)."
- Numbers, stack, GitHub link unchanged. Only the Graphene wordmark stays; screenshots, essay photos, and video cards stay off.

## Also built

Nemisis

- "01" and "Aug – Sep 2026" → "August – September 2026."
- Stack "Python 3.12+ · uv · pydantic · MCP SDK · pytest / v0.2.0 on PyPI · Docker 77 MB · Apache-2.0" → "Python 3.12+, uv, pydantic, MCP SDK, pytest. v0.2.0 on PyPI, Docker 77 MB, Apache-2.0."
- Links "GitHub ↗" / "Live page ↗" → "GitHub" / "Live page"
- Paragraphs 1–4 and the proof-strip cut for space → two short paragraphs: the webhook hook, then CrashCheck in one pass (SIGKILL, redelivery, independent read, 600/600, the not-proven bound). Terminal output unchanged. New image: the Nemisis banner (`nemisis-banner-dark.png`), used as a still, not a background.

RegLineage

- "03 · RegLineage" → "RegLineage"; "Jul – Aug 2026" → "July – August 2026."
- Stack "Python 3.11 · DataHub · DuckDB / FastAPI · MCP SDK · Docker" → "Python 3.11, DataHub, DuckDB, FastAPI, MCP SDK, Docker."
- "2,964,606 governed rows · 24 of 24 adversarial cases · 30 of 30 event-to-enforcement runs · 0 violations · 420 tests" → the same five numbers as a stats list: "2,964,606 governed rows", "24 of 24 adversarial cases", "30 of 30 event-to-enforcement runs, 0 violations", "420 tests"
- Link "GitHub ↗" → "RegLineage on GitHub"; the logo image is cut.
- Paragraph → "Revocable data access for AI agents. Analyses run under an immutable lease; when DataHub governance changes, only the intersecting lease suspends. Twenty-one MCP tools can request approval; none can grant it." (same facts, shorter)

IMC Prosperity 3

- "04 · IMC Prosperity 3" → "IMC Prosperity 3"; "Mar – Apr 2025" → "March – April 2025."
- Stack "Python · NumPy · Pandas" → "Python, NumPy, Pandas."
- The drawn rail "912 / ~13,000 TEAMS" → "912 of about 13,000 teams".
- "and balanced execution against risk-adjusted return" cut for length; the rest of the paragraph is unchanged.
- New image: `imc-prosperity-3.webp`, the competition key art.

## Experience

- Eyebrow "Experience" and the ledger framing → heading "Experience", no frame.
- Date lines take the resume's form: "Westport, CT · Jun – Sep 2026" → "June 2026 – September 2026, Westport, CT"; "Boston, MA · Sep 2025 – present" → "September 2025 – Present, Boston, MA" (twice); "New Haven, CT · Jun – Sep 2023" → "June 2023 – September 2023, New Haven, CT".
- All bullets unchanged.
- Photo caption "Closing poster, O'Hern Lab, Yale Computational Biology, summer 2023" → "New Haven, 2023".
- Northeastern TA sits next to the Northeastern seal (`northeastern.png`, the circular seal, not the wordmark). Hopkins "Before" sits next to the Hopkins seal.
- "Record" eyebrow → removed; the five rows keep their labels. Values lose the " · " glue:
  - Degree: "Northeastern University, Khoury College · Combined BSE, Computer Science and Mathematics, AI concentration · GPA 3.71, major 3.84 · Expected May 2028" → "Northeastern University, Khoury College. Combined BSE in Computer Science and Mathematics, AI concentration. GPA 3.71, major 3.84. Expected May 2028."
  - Coursework: dots → commas, same six courses, same order.
  - Stack: "Python · Java · JavaScript · OCaml · Kotlin · C — PyTorch · React · SQL · AWS · Pandas · MATLAB · GraphQL" → "Python, Java, JavaScript, OCaml, Kotlin, C. PyTorch, React, SQL, AWS, Pandas, MATLAB, GraphQL."
  - Before: "Hopkins School, New Haven, CT · 2024 · wrestling captain · Editor at Large, The Razor · Science Olympiad" → "Hopkins School, New Haven, CT, 2024. Wrestling captain, Editor at Large of The Razor, Science Olympiad."
  - Now: unchanged, with a full stop.

## Outside the terminal

The live running module now opens this page. `#running` aliases here. The sliding photo strip is gone; each hobby has its photo beside the copy.

- Running: "Training for a first marathon and still enjoying most of the steps." → "One of my favorite hobbies. The feeling of just running is (I know this sounds cliché) really when I feel the most free." (your line, from the brief). Link "Strava ↗" → "Check out my Strava" (Sep 7 site).
- Golf: "Reliably humbling; one clean shot is enough to bring me back." → "I picked up golf recently and I've really been loving it; it's one of those sports that really, really humbles you every single time you step on the course, but that one perfect shot keeps pulling you right back out there." (Sep 7 site, the underlined big "really" rendered as plain text).
- Chess: "Seven years in, still hanging pieces and queuing another game." → "7 years in playing chess and I still blunder every other move, but add me — always down to get a quick game in." (your line, from the brief). Link "Chess.com ↗" → "Add me on Chess.com" (Sep 7 site).
- Luna is its own row: heading "Luna", line "Chief Code Reviewer." (was only a strip caption: "Luna: Chief Code Reviewer").
- New photo caption: "Boston, 2026" (running group). The golf and chess photos carry no caption until you give a place and year (`TODO_ALEX.md` §4).
- Alt text rewritten: "Alex and six teammates after a race, most still wearing their bibs, under the trees" (six bibs are visible; the seventh runner has none); "Alex at the top of a golf swing, in an orange cap"; "A green chess pawn in front of a knight and a rook" (was "A chess pawn on a chessboard"); "Luna, a cream lop-eared rabbit, sitting on a rug" (was "Luna the rabbit").

## Running

Lives at the top of Outside, not as its own page. Copy below is unchanged; only the placement moved.

- "WHOO!" → removed.
- "this week / 14.2 / 50 mi" → "This week" label, the odometer "14.2", "/ 50 mi".
- "Half marathon in 1:32, a first marathon in training. The numbers come from Strava; the note is written by hand." → split into "Half marathon in 1:32, a first marathon in training." and, at the bottom, "Numbers from Strava, synced Sep 16, 2026. The note is written by hand."
- "week of Sep 14 · 1h 45m moving" and the Mon–Sun bar chart → removed (replaced by the odometer, the eight-week strip and the split strip).
- New: "3 runs, 7:25 per mile, 266 ft of climbing, 1h 45m moving." (the week line; every number is the JSON's, and a week under an hour reads "28m").
- New: "23 days to Eversource Hartford, Oct 10." (countdown; the number is live; on the day it reads "Race day: Eversource Hartford." and afterwards the line is hidden; distance and goal to add once confirmed).
- New: "Latest run, Sep 16, Boston, MA. Drag the tape to rewind."
- New progress-bar fallback text (shown only where `<progress>` does not render): "14.2 of 50 miles this week".
- New sparkline caption: "Last 8 weeks, with the 50-mile line".
- Screen-reader line "Sep 16 · 6.03 mi · 7:45 /mi · 115 ft · Boston, MA" → "Sep 16, 6.03 miles at 7:45 per mile, 115 feet of climbing, Boston, MA."
- "Note — Legs were flat Monday…" → the note alone, in italics, without the "Note —" label. Text unchanged.
- "strava athlete 141554769 ↗ · synced Sep 16, 2026" → folded into the "Numbers from Strava, synced …" line.
- New ticker: "this week 14.2 mi · latest 6.03 mi Wed · synced Sep 16" (the brief's format; grows "lifted before every run", or "lifted before 1 of 3 runs" when only some runs had a lift, once the sync supplies it).
- New stale warning, shown only when the data is more than 10 days old: "Last synced 2026-09-16; the log is behind."

## Closing and footer

- The closing section (the wordmark plate, "Every number here is one you can check. The repos are public.", GitHub/LinkedIn buttons, email) → removed; the email and links live in the footer, as the brief orders the page.
- Footer "Alex Lopez · New Haven, CT / Boston, MA" → replaced by the email as plain text. Links: GitHub, LinkedIn, YouTube, Strava, Chess.com, Resume (Strava and Chess.com added to the footer per the brief).
- New footer button: "Pause motion", which becomes "Resume motion" once pressed. It stops the ticker, the route trace, the `|` field, the photo strip and the reveals, the same as the OS reduced-motion setting; the page needs a pause of its own for keyboard users.

## Screen-reader and control copy (new)

Read aloud, never shown:

- Tape: "Position along the latest run", a slider whose value reads like the readout, e.g. "2.31 mi, 17:52, 7:41 /mi". Start / Pause sit next to it (Pause becomes Play while frozen).
- Before the route summary: "Latest run, drawn as a route on the canvas:" (then the summary sentence above).
- Progress track: "Miles this week toward 50". Odometer: "14.2 miles".
- Split strip: "Mile splits of the latest run". Sparkline: "Miles per week for the last 8 weeks", then per week "Aug 3: 31.2, …; goal 50".
- Terminal panel: "Real output of nemisis check".
- Route readout: a stream sample with no forward motion reads "stopped" in place of the pace.
