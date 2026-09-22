from pathlib import Path
import re


ROOT = Path(__file__).parent


def test_live_html_references_are_present():
    public = ROOT / "dist"
    assert (public / "index.html").is_file(), "Run npm run build first"
    for page in public.rglob("*.html"):
        for url in re.findall(r'(?:src|href)=["\']([^"\']+)', page.read_text()):
            if url.startswith("/") and not url.startswith("//"):
                assert (public / url.lstrip("/")).exists(), f"{page}: {url}"


def test_publish_directory_contains_only_public_assets():
    public = ROOT / "dist"
    assert (public / "_headers").is_file()
    assert (public / "_redirects").is_file()
    for path in public.rglob("*"):
        assert path.suffix not in {".md", ".zip", ".py", ".mjs", ".cjs"}, path
        assert not {"creative", "writer", "src", "node_modules", ".git", "ops"}.intersection(path.relative_to(public).parts), path


def test_edge_keeps_required_fallback_and_blob_preview_policy():
    caddyfile = (ROOT / "ops" / "Caddyfile").read_text()
    assert "/still-have-it/index.html" in caddyfile
    assert "img-src 'self' data: blob:" in caddyfile
