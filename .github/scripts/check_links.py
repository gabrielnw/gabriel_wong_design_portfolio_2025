"""Fail if any page points at a local file that doesn't exist.

Checks src, href, poster, data-src and srcset in every .html file, plus url(...)
in every .css file. Skips external links, mailto/tel, anchors and templated paths
like the flipbook's {n}. Run from the repo root: python3 .github/scripts/check_links.py
"""
import os
import re
import sys
from urllib.parse import unquote, urlsplit

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
ATTR = re.compile(r'\b(?:src|href|poster|data-src)\s*=\s*"([^"]+)"', re.I)
SRCSET = re.compile(r'\bsrcset\s*=\s*"([^"]+)"', re.I)
CSS_URL = re.compile(r'url\(\s*["\']?([^"\')]+)["\']?\s*\)')
COMMENT = re.compile(r"<!--.*?-->", re.S)


def targets(path, text):
    if path.endswith(".css"):
        yield from CSS_URL.findall(text)
        return
    text = COMMENT.sub("", text)  # commented-out markup (like the thesis card) isn't live
    yield from ATTR.findall(text)
    for value in SRCSET.findall(text):
        for part in value.split(","):
            if part.strip():
                yield part.strip().split()[0]


def resolve(page, ref):
    parts = urlsplit(ref)
    if parts.scheme or parts.netloc or ref.startswith(("#", "data:", "mailto:", "tel:", "javascript:")):
        return None
    if "{" in ref or not parts.path:
        return None
    path = unquote(parts.path)
    base = ROOT if path.startswith("/") else os.path.dirname(page)
    full = os.path.normpath(os.path.join(base, path.lstrip("/")))
    if path.endswith("/") or os.path.isdir(full):
        full = os.path.join(full, "index.html")
    return full


missing = []
for dirpath, dirnames, filenames in os.walk(ROOT):
    dirnames[:] = [d for d in dirnames if not d.startswith(".")]
    for name in filenames:
        if not name.endswith((".html", ".css")):
            continue
        page = os.path.join(dirpath, name)
        with open(page, encoding="utf-8") as f:
            text = f.read()
        for ref in targets(page, text):
            full = resolve(page, ref)
            if full and not os.path.exists(full):
                missing.append(f"{os.path.relpath(page, ROOT)}: {ref}")

if missing:
    print("Missing files:")
    print("\n".join("  " + m for m in sorted(set(missing))))
    sys.exit(1)
print("All local links and images resolve.")
