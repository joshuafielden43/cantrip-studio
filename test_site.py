from pathlib import Path
import re


ROOT = Path(__file__).parent


def test_live_html_references_are_present():
    for page in ROOT.rglob("*.html"):
        if "creative" in page.parts:
            continue
        for url in re.findall(r'(?:src|href)=["\']([^"\']+)', page.read_text()):
            if url.startswith("/") and not url.startswith("//"):
                assert (ROOT / url.lstrip("/")).exists(), f"{page}: {url}"


def test_edge_keeps_required_fallback_and_blob_preview_policy():
    caddyfile = (ROOT / "ops" / "Caddyfile").read_text()
    assert "/still-have-it/index.html" in caddyfile
    assert "img-src 'self' data: blob:" in caddyfile
