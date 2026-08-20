from html.parser import HTMLParser
from hashlib import sha256
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
        self.details = []
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
        if tag == "details":
            self.details.append(values)
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
    "education-panel",
    "experience-panel",
    "skills-panel",
    "interests-panel",
    "contact-panel",
    "scene-outro",
}
assert restored_panels <= site.ids, f"Missing restored anchors: {sorted(restored_panels - site.ids)}"
assert site.project_panels == 1, f"Expected one project panel, found {site.project_panels}"
assert len(site.details) == 4, f"Expected four expandable projects, found {len(site.details)}"
assert all(item.get("name") == "selected-projects" for item in site.details)
assert "open" in site.details[0] and all("open" not in item for item in site.details[1:])
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

assert "https://github.com/Alex-lop/Graphene" in HTML
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
assert "window.portfolioHandleWheel" in SCRIPTS and "Soft takeoff, long coast, soft landing" in SCRIPTS
assert HTML.index('id="about-panel"') < HTML.index('id="proj-panel-0"')
assert 'src="assets/me-presenting.jpg"' in HTML
assert "%236d28d9" in HTML and "%23f5f3ff" in HTML
assert "Private competition code" in HTML
assert "What drives me most is building things that can make someone's life better" in HTML
assert "Training for my first marathon and still enjoying most of the steps" in HTML
assert 'class="golf-emphasis"' in HTML and "immediately queue another game" in HTML
assert "r\u00e9sum\u00e9" not in (HTML + SCRIPTS).lower()
assert "site-monogram" not in HTML + CSS
assert "assets/projects/graphene-mission-control.webp" in HTML
assert "assets/projects/reglineage-workflow.svg" in HTML
assert 'href="assets/projects/reglineage-workflow.svg" target="_blank"' in HTML
assert "assets/projects/x-api-analyst.jpg" in HTML
assert "assets/projects/imc-prosperity-3.webp" in HTML
assert "assets/northeastern_shcool.png" in HTML and "assets/hopkinslll.jpg" in HTML
assert HTML.count('<use href="#icon-github">') == 4 and '<use href="#icon-linkedin">' in HTML
assert "View on GitHub" in HTML and "Open full screen" in HTML
assert "Alex_Lopez_Resume-preview.webp" in HTML and "<iframe" not in HTML
assert '<dialog id="lightbox"' in HTML
assert sha256((ROOT / "assets/Alex_Lopez_Resume.pdf").read_bytes()).hexdigest() == "d6db4523871bfff37ef0e5ba962f5d20b27373d4bf33367ec6a0314631bd2338"
assert "Click for the wrath of Zeus!" in HTML
assert "gridGroup.add(group)" in SCRIPTS and "const pulseDuration = 2600" in SCRIPTS
assert "const pulsePurple = 0x7c3aed" in SCRIPTS
assert 'document.addEventListener("pointerup"' in SCRIPTS
assert "const pulseBoltPointCount = 27" in SCRIPTS
assert "pulse.nextJitter = milliseconds + 55" in SCRIPTS
assert "const flash = reducedMotion ? 1" in SCRIPTS and "strike.frustumCulled = false" in SCRIPTS
assert "if (reducedMotion || !clickStart" in SCRIPTS
assert "const lineColor = below ? 0x1a5fff : pulsePurple" in SCRIPTS
assert HTML.count("https://skillicons.dev/icons?i=") == 4
assert "const outroEase" in SCRIPTS and "scene-outro-active" in SCRIPTS

print(f"Site check passed: {len(site.ids)} ids, {len(site.anchors)} links, {len(site.assets)} local assets")
