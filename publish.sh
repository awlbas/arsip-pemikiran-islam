#!/bin/bash
set -e

VAULT="/mnt/f9b042d9-2ae1-4331-b0b6-e79d1da06e10/synologydrive/obsidian"
QUARTZ="/home/aldi/Apps/quartz"

# Load env vars
if [ -f "$QUARTZ/.env" ]; then
  export $(grep -v '^#' "$QUARTZ/.env" | xargs)
fi

echo "🔄 Sinkronisasi vault..."
rsync -a --delete \
  --exclude=".obsidian" \
  --exclude="Works" \
  --exclude="Templates" \
  --exclude="*.py" \
  --exclude="Clippings_backup_*" \
  --exclude="frontmatter_backup_*" \
  --exclude="Catatan/Private/" \
  --exclude="Clippings/Private/" \
  "$VAULT/" "$QUARTZ/content/"

echo "🔍 Update Algolia index..."
cd "$QUARTZ"
npx quartz build

echo "📦 Commit dan push ke GitHub..."
git add -A

if git diff --cached --quiet; then
  echo "✅ Tidak ada perubahan baru."
  notify-send "Arsip Pemikiran Islam" "Tidak ada perubahan baru." 2>/dev/null || true
  exit 0
fi

git commit -m "Update catatan $(date '+%Y-%m-%d %H:%M')"

if git push; then
  echo "✅ Berhasil dipublish! Cloudflare akan build dalam ~1 menit."
  notify-send "Arsip Pemikiran Islam" "Berhasil dipublish! Build sedang berjalan di Cloudflare." 2>/dev/null || true
else
  echo "❌ Gagal push ke GitHub. Cek koneksi internet."
  notify-send "Arsip Pemikiran Islam" "❌ Gagal push ke GitHub." 2>/dev/null || true
  exit 1
fi
