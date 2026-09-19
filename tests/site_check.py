"""Structural checks for the site. Run: python3 tests/site_check.py"""
import json
import re
import subprocess
import sys
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HTML = (ROOT / "index.html").read_text()
CSS = (ROOT / "styles.css").read_text()
SCRIPTS = {n: (ROOT / "js" / n).read_text() for n in ("field.js", "route.js", "site.js")}


class SiteParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids, self.anchors, self.images, self.assets, self.canvases = set(), [], [], [], []
        self.h1 = 0

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if a.get("id"):
            self.ids.add(a["id"])
        if tag == "a":
            self.anchors.append(a)
        elif tag == "img":
            self.images.append(a)
        elif tag == "h1":
            self.h1 += 1
        elif tag == "canvas":
            self.canvases.append(a)
        for name in ("href", "src"):
            v = a.get(name, "")
            if v and not v.startswith(("#", "http", "data:")):
                self.assets.append(v)


site = SiteParser()
site.feed(HTML)

assert {"top", "about", "projects", "work", "outside", "running", "main"} <= site.ids, sorted(site.ids)
assert site.h1 == 1, f"Expected one h1, found {site.h1}"
for img in site.images:
    assert "alt" in img and img.get("width") and img.get("height"), f"img needs alt, width, height: {img}"
for a in site.anchors:
    href = a.get("href", "")
    if href.startswith("#"):
        assert href[1:] in site.ids, f"Broken hash link: {href}"
    if href.startswith("http"):
        assert a.get("target") == "_blank", f"External link must open in a new tab: {href}"
        assert {"noopener", "noreferrer"} <= set(a.get("rel", "").split()), f"External link missing rel: {href}"
for asset in site.assets:
    assert (ROOT / asset).is_file(), f"Missing local asset: {asset}"
for url in (
    "https://github.com/Alex-lop/Nemisis", "https://alex-lop.github.io/Nemisis/",
    "https://github.com/Alex-lop/Graphene", "https://github.com/Alex-lop/RegLineage",
    "https://linkedin.com/in/lopezalexan/", "https://www.youtube.com/@alex17-OX",
    "https://www.strava.com/athletes/141554769", "https://www.chess.com/member/cheboialex",
    "assets/Alex_Lopez_Resume.pdf",
):
    assert url in HTML, f"Missing link: {url}"
assert "mailto:" not in HTML and "203-954" not in HTML
assert "↗" not in HTML, "the arrow-on-every-link tell is back"

for name in SCRIPTS:
    assert f'src="js/{name}"' in HTML, f"js/{name} not loaded"
assert "run-field.js" not in HTML, "run-field.js was replaced by field.js"

canvas = {c["id"]: c for c in site.canvases if c.get("id")}
route = canvas["route"]
assert len(route.get("data-route", "")) > 20, "canvas needs a seeded data-route"
for attr in ("data-miles", "data-pace", "data-time", "tabindex"):
    assert route.get(attr), f"#route needs {attr}"
assert canvas["field"].get("aria-hidden") == "true", "#field must be hidden from the a11y tree"

assert "prefers-reduced-motion" in CSS
for name, src in SCRIPTS.items():
    assert "prefers-reduced-motion" in src, f"js/{name} ignores reduced motion"
assert 'list-style-type: "- "' in CSS and 'content: "- "' in CSS
assert "color-scheme: light" in CSS
assert "Plex Mono" not in HTML and "Plex Mono" not in CSS, "no mono face is shipped"

for f in sorted((ROOT / "assets").rglob("*")):
    if f.is_file() and f.name not in ("README.md", "OFL.txt", ".DS_Store"):
        rel = f.relative_to(ROOT).as_posix()
        assert rel in HTML or rel in CSS, f"Dead file in assets/: {rel}"
for url in re.findall(r"""url\(\s*['"]?([^'")]+)""", CSS):
    assert (ROOT / url).is_file(), f"Missing font: {url}"

data = json.loads((ROOT / "data" / "strava.json").read_text())
week = data["week"]
for key in ("miles", "pace_sec_per_mi", "elev_ft", "runs", "days", "moving_time_s"):
    assert key in week, f"week.{key} missing"
assert len(week["days"]) == 7 and all(d >= 0 for d in week["days"])
assert abs(sum(week["days"]) - week["miles"]) < 0.15, "days should sum to the week's miles"
latest = data["latest"]
assert latest["polyline"], "route missing"
sys.path.insert(0, str(ROOT / "tools"))
from strava_sync import ORIGIN, decode_polyline  # noqa: E402
for label, poly in (("seeded data-route", route["data-route"]), ("latest.polyline", latest["polyline"])):
    assert decode_polyline(poly)[0] == ORIGIN, f"{label} is not published at the fixed origin, so it says where the run was"
assert isinstance(data.get("feeling"), str) and data["pr"]["half_marathon"] == "1:32"
assert data["generated_at"].endswith("Z")

# The keys the sync adds are optional: the page hides what the JSON does not carry yet.
if "splits" in latest:
    assert isinstance(latest["splits"], list) and latest["splits"], "splits should be a non-empty list"
    for sp in latest["splits"]:
        assert isinstance(sp, dict), f"split must be an object: {sp}"
        for key in ("mile", "pace_sec_per_mi", "elev_change_ft", "partial"):
            assert key in sp, f"split.{key} missing: {sp}"
if "streams" in latest:
    st = latest["streams"]
    assert isinstance(st.get("time"), list) and isinstance(st.get("miles"), list), "streams need time and miles"
    assert len(st["time"]) == len(st["miles"]) <= 300, "stream arrays must align and stay under 300"
if "weeks" in data:
    assert isinstance(data["weeks"], list) and len(data["weeks"]) <= 8, "at most 8 weeks"
    for w in data["weeks"]:
        for key in ("week_start", "miles", "runs", "moving_time_s"):
            assert key in w, f"weeks[].{key} missing: {w}"
if "lifts_before_runs_this_week" in data.get("totals", {}):
    assert isinstance(data["totals"]["lifts_before_runs_this_week"], int)
if "prs_30d" in data.get("achievements", {}):
    assert isinstance(data["achievements"]["prs_30d"], int)

check = subprocess.run([sys.executable, "tools/strava_sync.py", "--self-check"],
                       cwd=ROOT, capture_output=True, text=True, check=True)
assert "ok" in check.stdout, check.stdout + check.stderr

print(f"Site check passed: {len(site.ids)} ids, {len(site.anchors)} links, {len(site.images)} images, {len(site.assets)} local assets")
