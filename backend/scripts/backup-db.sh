#!/bin/sh
# Backup harian SQLite (aman walau layanan sedang jalan). Pasang di crontab STB:
#   0 2 * * * cd /www/apps/bolang/backend && sh scripts/backup-db.sh
set -e
mkdir -p backup
STAMP=$(date +%Y%m%d)
docker compose exec -T core-service python -c "import sqlite3; s=sqlite3.connect('/data/bolang.db'); d=sqlite3.connect('/data/backup.db'); s.backup(d); d.close()"
docker compose cp core-service:/data/backup.db "backup/bolang-$STAMP.db"
ls -1t backup/*.db | tail -n +8 | xargs -r rm --   # simpan 7 terakhir
echo "backup/bolang-$STAMP.db"
