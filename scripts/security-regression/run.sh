#!/bin/sh
# Suite regresi keamanan — jalankan dari ROOT proyek setelah `npm run build`.
#   sh scripts/security-regression/run.sh            # semua grup
#   sh scripts/security-regression/run.sh media authz
# Setiap grup: salinan segar DB + unggahan → akun & fixture uji → server produksi di port uji → hasil.
# DB/unggahan ASLI hanya dibaca (sqlite .backup & salin berkas); tidak pernah diubah.
set -u
ROOT=$(pwd); W="${AUDIT_DIR:-$ROOT/.audit-work}"; PORT="${AUDIT_PORT:-3300}"
SRC_DB="${SOURCE_DB:-storage/db/ibkama.db}"; SRC_UP="${SOURCE_UPLOADS:-storage/uploads}"
GROUPS_RUN="${*:-media authz origin session content csv headers misc body}"
[ -d .next ] || { echo "Jalankan 'npm run build' dulu."; exit 2; }
FAILED=0
for g in $GROUPS_RUN; do
  rm -rf "$W"; mkdir -p "$W/uploads"
  sqlite3 "$SRC_DB" ".backup '$W/ibkama.db'" || exit 2
  cp -R "$SRC_UP/." "$W/uploads/" 2>/dev/null
  node scripts/security-regression/setup.mjs "$W" >/dev/null || exit 2
  DATABASE_URL="file:$W/ibkama.db" STORAGE_DIR="$W/uploads" npx next start -p "$PORT" > "$W/server.log" 2>&1 &
  i=0; until curl -s -m 2 -o /dev/null "http://localhost:$PORT/login"; do i=$((i+1)); [ $i -gt 40 ] && { echo "server tidak siap"; break; }; sleep 0.5; done
  E="$W" BASE="http://localhost:$PORT" node scripts/security-regression/audit.mjs "$g" || FAILED=1
  PID=$(lsof -ti "tcp:$PORT" -sTCP:LISTEN | head -1)
  [ -n "$PID" ] && echo "   server: cpu=$(ps -o pcpu= -p "$PID" | tr -d ' ')% rssMB=$(( $(ps -o rss= -p "$PID") / 1024 ))" && kill -9 "$PID" 2>/dev/null
  sleep 0.5
done
rm -rf "$W"
[ $FAILED -eq 0 ] && echo "SUITE: SEMUA LULUS" || echo "SUITE: ADA KEGAGALAN"
exit $FAILED
