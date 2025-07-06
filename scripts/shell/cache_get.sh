#!/bin/sh

REDIS_HOST=${REDIS_HOST:-redis}
REDIS_PORT=${REDIS_PORT:-6379}
KEY="$1"

if [ -z "$KEY" ]; then
  echo '{"success":false,"error":"Key required"}'
  exit 1
fi

if command -v redis-cli >/dev/null 2>&1; then
  VALUE=$(redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" get "$KEY" 2>/dev/null)
  if [ -n "$VALUE" ]; then
    echo '{"success":true,"value":"'"$VALUE"'"}'
    exit 0
  else
    echo '{"success":false,"error":"Key not found"}'
    exit 1
  fi
fi

echo '{"success":false,"error":"Failed to get key"}'
exit 1 