#!/bin/bash
# Sync Obsidian vault ke Quartz content/
# Jalankan sebelum build atau push ke GitHub

VAULT="/mnt/f9b042d9-2ae1-4331-b0b6-e79d1da06e10/synologydrive/obsidian"
CONTENT="/home/aldi/Apps/quartz/content"

rsync -av --delete \
  --exclude=".obsidian" \
  --exclude="Works" \
  --exclude="Templates" \
  --exclude="*.py" \
  --exclude="Clippings_backup_*" \
  "$VAULT/" "$CONTENT/"

echo ""
echo "Sync selesai. Sekarang jalankan:"
echo "  cd /home/aldi/Apps/quartz && npx quartz build"
