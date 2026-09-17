"""Structural checks for the site. Run: python3 tests/site_check.py"""
import json
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HTML = (ROOT / "index.html").read_text()
CSS = (ROOT / "styles.css").read_text()
JS = "\n".join((ROOT / "js" / name).read_text() for name in ("run-field.js", "site.js"))


class SiteParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids, self.anchors, self.images, self.assets, self.h1 = set(), [], [], [], 0
        self.canvas = {}

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if a.get("id"):
            self.ids.add(a["id"])
        if tag == "a":
            self.anchors.append(a)
        if tag == "img":
            self.images.append(a)
        if tag == "h1":
            self.h1 += 1
        if tag == "canvas":
            self.canvas = a
        for name in ("href", "src"):
            v = a.get(name, "")
            if v and not v.startswith(("#", "http", "data:")):
                self.assets.append(v)


site = SiteParser()
site.feed(HTML)

assert {"top", "projects", "work", "running", "main"} <= site.ids, sorted(site.ids)
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
    "https://www.strava.com/athletes/141554769", "assets/Alex_Lopez_Resume.pdf",
):
    assert url in HTML, f"Missing link: {url}"
assert "mailto:" not in HTML and "203-954" not in HTML
assert "three" not in HTML.lower().replace("three.js", "") or "importmap" not in HTML
assert 'src="js/run-field.js"' in HTML and 'src="js/site.js"' in HTML
assert site.canvas.get("data-route"), "canvas needs a seeded data-route"
assert "prefers-reduced-motion" in CSS and "prefers-reduced-motion" in JS
assert 'list-style-type: "- "' in CSS and 'content: "- "' in CSS

data = json.loads((ROOT / "data" / "strava.json").read_text())
week = data["week"]
for key in ("miles", "pace_sec_per_mi", "elev_ft", "runs", "days", "moving_time_s"):
    assert key in week, f"week.{key} missing"
assert len(week["days"]) == 7 and all(d >= 0 for d in week["days"])
assert abs(sum(week["days"]) - week["miles"]) < 0.15, "days should sum to the week's miles"
assert data["latest"]["polyline"] and len(site.canvas["data-route"]) > 20, "route missing"
assert isinstance(data.get("feeling"), str) and data["pr"]["half_marathon"] == "1:32"
assert data["generated_at"].endswith("Z")

print(f"Site check passed: {len(site.ids)} ids, {len(site.anchors)} links, {len(site.images)} images, {len(site.assets)} local assets")
