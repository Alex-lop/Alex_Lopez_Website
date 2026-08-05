from html.parser import HTMLParser
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
HTML = (ROOT / "index.html").read_text()


class SiteParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids = set()
        self.anchors = []
        self.assets = []
        self.images = []
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
        for name in ("href", "src"):
            value = values.get(name, "")
            if value and not value.startswith(("#", "http", "mailto:", "data:")):
                self.assets.append(value)


site = SiteParser()
site.feed(HTML)

required_ids = {"top", "main-content", "work", "experience", "about", "contact"}
assert required_ids <= site.ids, f"Missing anchors: {sorted(required_ids - site.ids)}"
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

scripts = "\n".join((ROOT / name).read_text() for name in ("app.js", "scene.js"))
assert "window.scrollTo" not in scripts
assert "addEventListener(\"wheel\"" not in scripts
assert "addEventListener('wheel'" not in scripts
assert "Coin Shroud" not in HTML
assert "Playwright scraping" not in HTML
assert "RegLineage" in HTML and "X API Analyst" in HTML and "IMC Prosperity 3" in HTML

print(f"Site check passed: {len(site.ids)} ids, {len(site.anchors)} links, {len(site.assets)} local assets")
