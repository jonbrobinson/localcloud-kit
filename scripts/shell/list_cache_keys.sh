#!/bin/sh

# List all Redis keys and their values
REDIS_HOST=${REDIS_HOST:-redis}
REDIS_PORT=${REDIS_PORT:-6379}

if command -v redis-cli >/dev/null 2>&1; then
  STATUS=$(redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" ping 2>/dev/null)
  if [ "$STATUS" = "PONG" ]; then
    # Get all keys
    KEYS=$(redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" keys "*" 2>/dev/null)
    
    if [ -z "$KEYS" ]; then
      echo '{"success":true,"data":[],"message":"No keys found"}'
      exit 0
    fi
    
    # Build JSON array using jq for proper escaping
    if command -v jq >/dev/null 2>&1; then
      # Use jq to build the JSON array properly
      RESULT="["
      FIRST=true
      for key in $KEYS; do
        if [ "$FIRST" = true ]; then
          FIRST=false
        else
          RESULT="$RESULT,"
        fi
        
        # Get value for this key
        VALUE=$(redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" get "$key" 2>/dev/null)
        
        # Use jq to properly escape the value
        ESCAPED_VALUE=$(echo "$VALUE" | jq -R .)
        ESCAPED_KEY=$(echo "$key" | jq -R .)
        
        RESULT="$RESULT{\"key\":$ESCAPED_KEY,\"value\":$ESCAPED_VALUE}"
      done
      RESULT="$RESULT]"
      
      echo "{\"success\":true,\"data\":$RESULT}"
    else
      # Fallback without jq
      RESULT="["
      FIRST=true
      for key in $KEYS; do
        if [ "$FIRST" = true ]; then
          FIRST=false
        else
          RESULT="$RESULT,"
        fi
        
        # Get value for this key
        VALUE=$(redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" get "$key" 2>/dev/null)
        
        RESULT="$RESULT{\"key\":\"$key\",\"value\":\"$VALUE\"}"
      done
      RESULT="$RESULT]"
      
      echo "{\"success\":true,\"data\":$RESULT}"
    fi
    exit 0
  fi
fi

echo '{"success":false,"error":"Redis not available"}'
exit 1 