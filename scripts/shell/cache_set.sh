#!/bin/sh

REDIS_HOST=${REDIS_HOST:-redis}
REDIS_PORT=${REDIS_PORT:-6379}
KEY="$1"
VALUE="$2"

if [ -z "$KEY" ] || [ -z "$VALUE" ]; then
  echo '{"success":false,"error":"Key and value required"}'
  exit 1
fi

if command -v redis-cli >/dev/null 2>&1; then
  RESULT=$(redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" set "$KEY" "$VALUE" 2>/dev/null)
  if [ "$RESULT" = "OK" ]; then
    echo '{"success":true}'
    exit 0
  fi
fi

echo '{"success":false,"error":"Failed to set key"}'
exit 1 