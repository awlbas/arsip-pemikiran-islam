#!/usr/bin/env python3
"""
Normalize frontmatter for all Clippings and Catatan files.

Clipping standard:
  title, date, author, source, tags, draft

Catatan standard:
  title, date, tags, draft
"""

import re
import shutil
from datetime import datetime
from pathlib import Path

import yaml

VAULT = Path("/mnt/f9b042d9-2ae1-4331-b0b6-e79d1da06e10/synologydrive/obsidian")
CLIPPINGS_DIR = VAULT / "Clippings"
CATATAN_DIR = VAULT / "Catatan"
BACKUP_DIR = VAULT / f"frontmatter_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"

# Fields to remove from all files
REMOVE_FIELDS = {
    "published", "created", "description", "authors", "categories",
    "series", "last edited time", "sumber",
}

stats = {"clipping": 0, "catatan": 0, "skipped": 0}


def parse_frontmatter(text):
    """Return (frontmatter_dict, body) or (None, text) if no frontmatter."""
    if not text.startswith("---"):
        return None, text
    end = text.find("\n---", 3)
    if end == -1:
        return None, text
    raw = text[3:end].strip()
    body = text[end + 4:].lstrip("\n")
    try:
        data = yaml.safe_load(raw) or {}
    except yaml.YAMLError:
        return None, text
    return data, body


def normalize_tags(tags):
    if not tags:
        return []
    if isinstance(tags, str):
        # "My Note, Politik" → list
        return [t.strip() for t in re.split(r"[,;]", tags) if t.strip()]
    if isinstance(tags, list):
        result = []
        for t in tags:
            if t:
                result.extend(t.strip() for t in re.split(r"[,;]", str(t)) if t.strip())
        return result
    return []


def normalize_date(val):
    if not val or str(val).strip().lower() in ("null", "none", ""):
        return None
    s = str(val).strip()
    # Already ISO format
    if re.match(r"^\d{4}-\d{2}-\d{2}", s):
        return s[:10]
    return None


def normalize_draft(val):
    if isinstance(val, bool):
        return val
    if str(val).strip().lower() in ("no", "false", "0", ""):
        return False
    if str(val).strip().lower() in ("yes", "true", "1"):
        return True
    return False


def build_clipping(data):
    out = {}
    out["title"] = data.get("title") or ""
    date = normalize_date(data.get("date"))
    if date:
        out["date"] = date
    author = data.get("author") or data.get("authors") or ""
    if isinstance(author, list):
        author = ", ".join(str(a) for a in author if a)
    if author:
        out["author"] = str(author).strip()
    source = data.get("source") or data.get("sumber") or ""
    if source:
        out["source"] = str(source).strip()
    tags = normalize_tags(data.get("tags") or data.get("categories"))
    out["tags"] = tags if tags else []
    out["draft"] = normalize_draft(data.get("draft", False))
    return out


def build_catatan(data):
    out = {}
    out["title"] = data.get("title") or ""
    date = normalize_date(data.get("date"))
    if date:
        out["date"] = date
    tags = normalize_tags(data.get("tags") or data.get("categories"))
    out["tags"] = tags if tags else []
    out["draft"] = normalize_draft(data.get("draft", False))
    return out


def dump_frontmatter(data):
    return yaml.dump(data, allow_unicode=True, default_flow_style=False, sort_keys=False)


def process_file(path, kind):
    text = path.read_text(encoding="utf-8")
    data, body = parse_frontmatter(text)
    if data is None:
        stats["skipped"] += 1
        return

    if kind == "clipping":
        new_data = build_clipping(data)
        stats["clipping"] += 1
    else:
        new_data = build_catatan(data)
        stats["catatan"] += 1

    new_text = f"---\n{dump_frontmatter(new_data)}---\n\n{body}"
    path.write_text(new_text, encoding="utf-8")


def backup_and_run(directory, kind):
    md_files = list(directory.rglob("*.md"))
    if not md_files:
        return

    # Backup
    for f in md_files:
        rel = f.relative_to(VAULT)
        dest = BACKUP_DIR / rel
        dest.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(f, dest)

    # Normalize
    for f in md_files:
        try:
            process_file(f, kind)
        except Exception as e:
            print(f"  ERROR {f.name}: {e}")


print(f"Backup ke: {BACKUP_DIR}")
print()

print(f"Memproses Clippings ({len(list(CLIPPINGS_DIR.rglob('*.md')))} file)...")
backup_and_run(CLIPPINGS_DIR, "clipping")

print(f"Memproses Catatan ({len(list(CATATAN_DIR.rglob('*.md')))} file)...")
backup_and_run(CATATAN_DIR, "catatan")

print()
print(f"Selesai!")
print(f"  Clipping : {stats['clipping']} file")
print(f"  Catatan  : {stats['catatan']} file")
print(f"  Skipped  : {stats['skipped']} file (tidak ada frontmatter)")
print(f"  Backup   : {BACKUP_DIR}")
