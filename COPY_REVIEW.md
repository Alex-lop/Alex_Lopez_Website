# COPY_REVIEW.md — every sentence that changed

`old → new`, in page order. "old" is the site at commit `1669e62` (the dark rebuild); where the
line comes from the Sep 7 white version (`3c50259`) or from the brief it says so. Nothing here is a
new fact about Alex. Items marked **confirm** are in `TODO_ALEX.md` as well.

## Head

- `<title>` "Alex Lopez — Northeastern CS + Math" → "Alex Lopez"
- og:title same change. The description is unchanged.

## Nav

- No copy change. Order: Work · Projects · Outside · Running · Resume · GitHub, as before.

## Hero

- Eyebrow "Northeastern CS + Math · AI concentration · Boston" → removed (the brief removes eyebrows).
- New greeting line above the name: "Helloooo world" (the About greeting from the Sep 7 site, moved up).
- Lede "Third year at Northeastern, CS and Math. Internships, research, and tools that check what AI-written code actually does." → "Third year at Northeastern, CS and Math. Tools that check what AI-written code actually does, and a first marathon in training." (this was already the page's meta description).
- Buttons "See the work" / "Resume" → "Resume" / "GitHub".

## About (new section)

The Sep 7 site said: "I'm Alex, a junior studying Math + CS at Northeastern and really trying to make an : Impact". New, four sentences:

- "I'm Alex, a third year at Northeastern studying CS and Math." (year updated from "junior"; the hero already says third year)
- "Most of what I build is about keeping a human in the loop when AI agents write code: Graphene, Nemisis, RegLineage." (summarises the three project write-ups on the page; no new claim) **confirm** this is how you'd say it
- "During the year I TA databases and discrete math and sit on the SHPE board." (from the Experience section)
- "The rest of the time I'm running, golfing, or losing at chess." (a quip in the spirit of the chess line; cut it if it reads as trying) **confirm**

## Section headings

- "Work and teaching." → "Experience"
- "What I have been building." → "Graphene" (main project) and "Also built" (the rest)
- "Outside the terminal." → "Outside the terminal"
- "Running" unchanged

## Graphene

- Eyebrow "02" and the "Selected projects" eyebrow → removed.
- Stack line "Aug 2026 / Python 3.13 · FastAPI · Google ADK · MCP SDK / Textual · SQLite · Cytoscape.js · Apache-2.0" → "August 2026. Python 3.13, FastAPI, Google ADK, MCP SDK, Textual, SQLite, Cytoscape.js. Apache-2.0." (format only; same items, same order)
- Link "GitHub ↗" → "Graphene on GitHub"
- The three technical paragraphs are unchanged, word for word.
- New image alt: "Graphene wordmark: a letter G drawn as a graph of linked nodes" (was empty).
- The margin note (eyebrow "Margin note · The book was wrong", four paragraphs, signature "— group theory, fall 2026") → replaced by the essay under the heading "Why I built it". The margin note was a paraphrase of the essay; the brief asks for the essay in your words instead.
- Closing bridge kept as is: "Graphene runs on the same reflex. Let the agents write. Keep a human at the decision, holding evidence, allowed to say no." No better line proposed.

## The essay

Rendered from the brief with spelling and punctuation only: straight quotes → curly quotes, the
ellipsis on the last line. Placeholders are labelled boxes with the captions below. Open items:

- **confirm** "TMBBM" (an `<!-- ALEX -->` comment sits above the sentence).
- **confirm** "Instead of just asking AI like I've been doing lately" (the brief's rewrite of "However, dealing with the recent use cases of AI"); comment in the HTML.
- **finish** "When is the last time that I…" — styled as a hanging ending; not completed.
- The brief's second paragraph is split in two so the IMG C / IMG D row sits between "…passes the TMBBM)." and "But at the end of the day…"; no words changed.
- New captions written for the placeholders: "An old senior dev next to Patrick Star", "Hopkins School", "The benchmark graph", "Horse Tinder", "“Looks good to me”", "Terrance's video", "One more", "Writing this, at my desk", "The Group Theory textbook". Change any of them when you send the images.
- New alt: "The Hopkins School seal, founded 1660".

## Also built

Nemisis

- "01" and "Aug – Sep 2026" → "August – September 2026."
- Stack "Python 3.12+ · uv · pydantic · MCP SDK · pytest / v0.2.0 on PyPI · Docker 77 MB · Apache-2.0" → "Python 3.12+, uv, pydantic, MCP SDK, pytest. v0.2.0 on PyPI, Docker 77 MB, Apache-2.0."
- Links "GitHub ↗" / "Live page ↗" → "GitHub" / "Live page"
- Paragraphs 1–3 and the terminal output are unchanged.
- Cut for space (the brief asks for roughly a third of the space): the banner image and the proof strip's four-row framing. Three of its rows are kept as one plain paragraph after "The model never judges…": "Red-teamed nightly: 600 of 600 generated handlers agreed with an independent oracle, 300 per scenario. 28 shapes are pinned as refusals: raw SQL, shadow tables, bytes past the last page. Not proven: anything outside two scenarios, one handler shape, SQLite and POSIX SIGKILL. The narrowness is what makes the verdict trustworthy." Still cut: "Caught by its own red team: The engine issued a false FIX_PROVEN on tail-bytes writes for five nights because SQLite's close-time checkpoint truncated the file before the engine read it. Fixed, and the shape is pinned as a refusal" and "A correct fix the engine cannot instrument exits 2 and names the remedy". Say if you want either back.

RegLineage

- "03 · RegLineage" → "RegLineage"; "Jul – Aug 2026" → "July – August 2026."
- Stack "Python 3.11 · DataHub · DuckDB / FastAPI · MCP SDK · Docker" → "Python 3.11, DataHub, DuckDB, FastAPI, MCP SDK, Docker."
- "2,964,606 governed rows · 24 of 24 adversarial cases · 30 of 30 event-to-enforcement runs · 0 violations · 420 tests" → the same five numbers as a stats list: "2,964,606 governed rows", "24 of 24 adversarial cases", "30 of 30 event-to-enforcement runs, 0 violations", "420 tests"
- Link "GitHub ↗" → "RegLineage on GitHub"; the logo image is cut. Paragraph unchanged.

IMC Prosperity 3

- "04 · IMC Prosperity 3" → "IMC Prosperity 3"; "Mar – Apr 2025" → "March – April 2025."
- Stack "Python · NumPy · Pandas" → "Python, NumPy, Pandas."
- The drawn rail "912 / ~13,000 TEAMS" → "912 of about 13,000 teams". Paragraph unchanged.

## Experience

- Eyebrow "Experience" and the ledger framing → heading "Experience", no frame.
- Date lines take the resume's form: "Westport, CT · Jun – Sep 2026" → "June 2026 – September 2026, Westport, CT"; "Boston, MA · Sep 2025 – present" → "September 2025 – Present, Boston, MA" (twice); "New Haven, CT · Jun – Sep 2023" → "June 2023 – September 2023, New Haven, CT".
- All bullets unchanged.
- Photo caption "Closing poster, O'Hern Lab, Yale Computational Biology, summer 2023" → "New Haven, 2023".
- "Record" eyebrow → removed; the five rows keep their labels. Values lose the " · " glue:
  - Degree: "Northeastern University, Khoury College · Combined BSE, Computer Science and Mathematics, AI concentration · GPA 3.71, major 3.84 · Expected May 2028" → "Northeastern University, Khoury College. Combined BSE in Computer Science and Mathematics, AI concentration. GPA 3.71, major 3.84. Expected May 2028."
  - Coursework: dots → commas, same six courses, same order.
  - Stack: "Python · Java · JavaScript · OCaml · Kotlin · C — PyTorch · React · SQL · AWS · Pandas · MATLAB · GraphQL" → "Python, Java, JavaScript, OCaml, Kotlin, C. PyTorch, React, SQL, AWS, Pandas, MATLAB, GraphQL."
  - Before: "Hopkins School, New Haven, CT · 2024 · wrestling captain · Editor at Large, The Razor · Science Olympiad" → "Hopkins School, New Haven, CT, 2024. Wrestling captain, Editor at Large of The Razor, Science Olympiad."
  - Now: unchanged, with a full stop.

## Outside the terminal

- Running: "Training for a first marathon and still enjoying most of the steps." → "One of my favorite hobbies. The feeling of just running is (I know this sounds cliché) really when I feel the most free." (your line, from the brief). Link "Strava ↗" → "Check out my Strava" (Sep 7 site).
- Golf: "Reliably humbling; one clean shot is enough to bring me back." → "I picked up golf recently and I've really been loving it; it's one of those sports that really, really humbles you every single time you step on the course, but that one perfect shot keeps pulling you right back out there." (Sep 7 site, the underlined big "really" rendered as plain text).
- Chess: "Seven years in, still hanging pieces and queuing another game." → "7 years in playing chess and I still blunder every other move, but add me — always down to get a quick game in." (your line, from the brief). Link "Chess.com ↗" → "Add me on Chess.com" (Sep 7 site).
- Luna caption "Luna" → "Luna: Chief Code Reviewer" (Sep 7 site).
- New photo caption: "Boston, 2026" (running group). The golf and chess photos carry no caption until you give a place and year (`TODO_ALEX.md` §4).
- Alt text rewritten: "Alex and six teammates after a race, most still wearing their bibs, under the trees" (six bibs are visible; the seventh runner has none); "Alex at the top of a golf swing, in an orange cap"; "A green chess pawn in front of a knight and a rook" (was "A chess pawn on a chessboard"); "Luna, a cream lop-eared rabbit, sitting on a rug" (was "Luna the rabbit").

## Running

- "WHOO!" → removed.
- "this week / 14.2 / 50 mi" → "This week" label, the odometer "14.2", "/ 50 mi".
- "Half marathon in 1:32, a first marathon in training. The numbers come from Strava; the note is written by hand." → split into "Half marathon in 1:32, a first marathon in training." and, at the bottom, "Numbers from Strava, synced Sep 16, 2026. The note is written by hand."
- "week of Sep 14 · 1h 45m moving" and the Mon–Sun bar chart → removed (replaced by the odometer, the eight-week strip and the split strip).
- New: "3 runs, 7:25 per mile, 266 ft of climbing, 1h 45m moving." (the week line; every number is the JSON's, and a week under an hour reads "28m").
- New: "23 days to Eversource Hartford, Oct 10." (countdown; the number is live; on the day it reads "Race day: Eversource Hartford." and afterwards the line is hidden; distance and goal to add once confirmed).
- New: "Latest run, Sep 16, Boston, MA. Hover, drag, or use the arrow keys on the route to scrub."
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

- Route canvas: "Position along the latest run", a slider whose value reads like the readout, e.g. "2.31 mi, 17:52, 7:41 /mi".
- Before the route summary: "Latest run, drawn as a route on the canvas:" (then the summary sentence above).
- Progress track: "Miles this week toward 50". Odometer: "14.2 miles".
- Split strip: "Mile splits of the latest run". Sparkline: "Miles per week for the last 8 weeks", then per week "Aug 3: 31.2, …; goal 50".
- Terminal panel: "Real output of nemisis check".
- Video buttons, once a video id is pasted: "Play video: Terrance's video" and "Play video: One more".
- Route readout: a stream sample with no forward motion reads "stopped" in place of the pace.
- Essay placeholders: "Placeholder for an image: an old senior dev next to Patrick Star", "…: the funny benchmark graph", "…: horse Tinder", "…: the looks good to me meme", "Placeholder for a photo: Alex writing this at his desk, shot over the shoulder", "Placeholder for an image: the Group Theory textbook cover", and on the two video cards "Video placeholder, link to come".
