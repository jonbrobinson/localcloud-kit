#!/bin/sh

# Check if Redis is running and return status/info
REDIS_HOST=${REDIS_HOST:-redis}
REDIS_PORT=${REDIS_PORT:-6379}

if command -v redis-cli >/dev/null 2>&1; then
  STATUS=$(redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" ping 2>/dev/null)
  if [ "$STATUS" = "PONG" ]; then
    INFO=$(redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" info server 2>/dev/null | grep -E 'redis_version|tcp_port|uptime_in_seconds' | tr '\n' ' ' | sed 's/"/\\"/g' | xargs)
    echo "{\"status\":\"running\",\"info\":\"$INFO\"}"
    exit 0
  fi
fi

echo '{"status":"stopped"}'
exit 1 