#!/bin/sh

REDIS_HOST=${REDIS_HOST:-redis}
REDIS_PORT=${REDIS_PORT:-6379}

if command -v redis-cli >/dev/null 2>&1; then
  RESULT=$(redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" flushall 2>/dev/null)
  if [ "$RESULT" = "OK" ]; then
    echo '{"success":true}'
    exit 0
  fi
fi

echo '{"success":false,"error":"Failed to flush cache"}'
exit 1 