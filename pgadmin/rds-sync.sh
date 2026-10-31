#!/bin/sh
# LocalCloud Kit — keep pgAdmin's server list in sync with RDS instances.
#
# The API drops one file pair per RDS PostgreSQL instance into $IMPORT_DIR:
#   <db-id>.json    pgAdmin servers.json document with a single server
#   <db-id>.pgpass  one pgpass line used by that server
# This loop registers new/changed servers with `setup.py load-servers` and
# removes servers whose files have been deleted (instance destroyed or the
# pgAdmin option turned off). It runs alongside pgAdmin inside its container.

IMPORT_DIR="${RDS_IMPORT_DIR:-/pgadmin-import}"
STATE_DIR="/var/lib/pgadmin/rds-sync"
PASSFILE="/var/lib/pgadmin/rds.pgpass"
DB="/var/lib/pgadmin/pgadmin4.db"
PY="/venv/bin/python3"
GROUP="LocalCloud RDS"
INTERVAL="${RDS_SYNC_INTERVAL:-5}"

mkdir -p "$STATE_DIR"

log() { echo "[rds-sync] $*"; }

# Remove a server (by display name) from the RDS group in pgAdmin's SQLite store.
remove_server() {
  "$PY" - "$DB" "$1" "$GROUP" <<'PY'
import sqlite3, sys
db, name, group = sys.argv[1:4]
con = sqlite3.connect(db, timeout=10)
con.execute(
    "DELETE FROM server WHERE name = ? AND servergroup_id IN "
    "(SELECT id FROM servergroup WHERE name = ?)",
    (name, group),
)
con.commit()
con.close()
PY
}

server_name() {
  "$PY" -c 'import json,sys; s=json.load(open(sys.argv[1]))["Servers"]; print(next(iter(s.values()))["Name"])' "$1"
}

sync_once() {
  # pgAdmin creates its database on first start; wait for it.
  [ -f "$DB" ] || return 0

  # Rebuild the pgpass file from every instance's line.
  tmp="$PASSFILE.tmp"
  : > "$tmp"
  for p in "$IMPORT_DIR"/*.pgpass; do
    [ -f "$p" ] && cat "$p" >> "$tmp" && echo >> "$tmp"
  done
  chmod 600 "$tmp" && mv "$tmp" "$PASSFILE"

  # Register new or changed servers.
  for f in "$IMPORT_DIR"/*.json; do
    [ -f "$f" ] || continue
    id=$(basename "$f" .json)
    sum=$(md5sum "$f" | cut -d' ' -f1)
    [ "$(cat "$STATE_DIR/$id.sum" 2>/dev/null)" = "$sum" ] && continue
    name=$(server_name "$f") || continue
    remove_server "$name"
    if "$PY" /pgadmin4/setup.py load-servers "$f" >/dev/null 2>&1; then
      echo "$sum" > "$STATE_DIR/$id.sum"
      echo "$name" > "$STATE_DIR/$id.name"
      log "registered $name"
    else
      log "failed to register $name (will retry)"
    fi
  done

  # Remove servers whose import file is gone.
  for s in "$STATE_DIR"/*.sum; do
    [ -f "$s" ] || continue
    id=$(basename "$s" .sum)
    [ -f "$IMPORT_DIR/$id.json" ] && continue
    name=$(cat "$STATE_DIR/$id.name" 2>/dev/null)
    [ -n "$name" ] && remove_server "$name" && log "removed $name"
    rm -f "$s" "$STATE_DIR/$id.name"
  done
}

while true; do
  sync_once
  sleep "$INTERVAL"
done
