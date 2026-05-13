#!/bin/bash
VAULT="/mnt/f9b042d9-2ae1-4331-b0b6-e79d1da06e10/synologydrive/obsidian"
QUARTZ="/home/aldi/Apps/quartz"

echo "🔄 Sinkronisasi vault..."
rsync -a --delete \
  --exclude=".obsidian" \
  --exclude="Works" \
  --exclude="Templates" \
  --exclude="*.py" \
  --exclude="Clippings_backup_*" \
  "$VAULT/" "$QUARTZ/content/"

echo "📦 Commit dan push ke GitHub..."
cd "$QUARTZ"
git add -A

if git diff --cached --quiet; then
  echo "✅ Tidak ada perubahan baru."
else
  git commit -m "Update catatan $(date '+%Y-%m-%d %H:%M')"
  git push
  echo "✅ Berhasil dipublish!"
fi

notify-send "Arsip Pemikiran Islam" "Catatan berhasil dipublish ke website!" 2>/dev/null || true
