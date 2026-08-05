from html.parser import HTMLParser
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
HTML = (ROOT / "index.html").read_text()
CSS = (ROOT / "styles.css").read_text()
SCRIPTS = "\n".join((ROOT / name).read_text() for name in ("app.js", "scene.js"))


class SiteParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids = set()
        self.anchors = []
        self.assets = []
        self.images = []
        self.project_panels = 0
        self.h1_count = 0

    def handle_starttag(self, tag, attrs):
        values = dict(attrs)
        if values.get("id"):
            self.ids.add(values["id"])
        if tag == "a":
            self.anchors.append(values)
        if tag == "img":
            self.images.append(values)
        if tag == "h1":
            self.h1_count += 1
        if "project-solo-panel" in values.get("class", "").split():
            self.project_panels += 1
        for name in ("href", "src"):
            value = values.get(name, "")
            if value and not value.startswith(("#", "http", "mailto:", "data:")):
                self.assets.append(value)


site = SiteParser()
site.feed(HTML)

restored_panels = {
    "top",
    "main-content",
    "intro-panel",
    "about-panel",
    "proj-panel-0",
    "proj-panel-1",
    "proj-panel-2",
    "education-panel",
    "experience-panel",
    "skills-panel",
    "interests-panel",
    "contact-panel",
}
assert restored_panels <= site.ids, f"Missing restored anchors: {sorted(restored_panels - site.ids)}"
assert site.project_panels == 3, f"Expected three project panels, found {site.project_panels}"
assert site.h1_count == 1, f"Expected one h1, found {site.h1_count}"
assert all("alt" in image for image in site.images), "Every image needs an alt attribute"

for anchor in site.anchors:
    href = anchor.get("href", "")
    if href.startswith("#"):
        assert href[1:] in site.ids, f"Broken hash link: {href}"
    if href.startswith("http"):
        rel = set(anchor.get("rel", "").split())
        assert anchor.get("target") == "_blank", f"External link must open in a new tab: {href}"
        assert {"noopener", "noreferrer"} <= rel, f"External link missing rel safety: {href}"

for asset in site.assets:
    assert (ROOT / asset).is_file(), f"Missing local asset: {asset}"

assert "https://github.com/Alex-lop/RegLineage" in HTML
assert "https://github.com/Alex-lop/X-Scraper" in HTML
assert "Coin Shroud" not in HTML
assert "*boop*" not in HTML + CSS + SCRIPTS
assert ".boop-label" not in HTML + CSS + SCRIPTS
assert "prefers-reduced-motion: reduce" in CSS
assert "prefers-reduced-motion: reduce" in SCRIPTS
assert "OrbitControls" in SCRIPTS
assert "addEventListener(\"wheel\"" in SCRIPTS
assert "window.scrollTo" in SCRIPTS
assert "Training for my first marathon is no joke" in HTML
assert 'class="golf-emphasis"' in HTML and "feeling of incompleteness" in HTML
assert "gridGroup.add(group)" in SCRIPTS and "const pulseDuration = 1700" in SCRIPTS
assert "const pulsePurple = 0x7c3aed" in SCRIPTS

print(f"Site check passed: {len(site.ids)} ids, {len(site.anchors)} links, {len(site.assets)} local assets")
