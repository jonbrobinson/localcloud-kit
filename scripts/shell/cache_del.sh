#!/bin/sh

REDIS_HOST=${REDIS_HOST:-redis}
REDIS_PORT=${REDIS_PORT:-6379}
KEY="$1"

if [ -z "$KEY" ]; then
  echo '{"success":false,"error":"Key required"}'
  exit 1
fi

if command -v redis-cli >/dev/null 2>&1; then
  RESULT=$(redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" del "$KEY" 2>/dev/null)
  if [ "$RESULT" -gt 0 ]; then
    echo '{"success":true}'
    exit 0
  else
    echo '{"success":false,"error":"Key not found"}'
    exit 1
  fi
fi

echo '{"success":false,"error":"Failed to delete key"}'
exit 1 