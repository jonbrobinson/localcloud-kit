# Redis Cache Management

LocalCloud Kit includes full Redis cache support for local development and testing.

## Features

- **Standalone Redis**: Runs as a container alongside LocalStack and the API
- **Full CRUD Operations**: Set, get, delete, and flush cache keys
- **List All Keys**: View all keys and values in the cache
- **JSON-Aware**: Pretty-prints JSON values in the GUI
- **GUI Management**: Dedicated `/cache` page for full-screen cache management
- **Shell Scripts**: Automation scripts for cache operations
- **API Endpoints**: RESTful endpoints for cache management

## Quick Start

1. Start all services: `docker compose up --build`
2. Open the GUI: http://localhost:3030
3. Click "Redis Cache" in the dashboard or resource list
4. Use the full-page interface to manage your cache

## Docker Setup

Redis runs as a service in `docker-compose.yml`:

- **Host Port**: 6380
- **Container Port**: 6379
- **Password**: None (for local development)

## API Endpoints

| Method   | Endpoint                 | Description                   |
| -------- | ------------------------ | ----------------------------- |
| `GET`    | `/api/cache/status`      | Check Redis connection status |
| `POST`   | `/api/cache/set`         | Set a key-value pair          |
| `GET`    | `/api/cache/get?key=...` | Get value by key              |
| `DELETE` | `/api/cache/del`         | Delete a key                  |
| `POST`   | `/api/cache/flush`       | Flush all keys                |
| `GET`    | `/api/cache/keys`        | List all keys and values      |

### Example Requests

#### Set a key-value pair

```bash
curl -X POST http://localhost:3030/api/cache/set \
  -H "Content-Type: application/json" \
  -d '{"key": "user:123", "value": "{\"name\":\"John\",\"email\":\"john@example.com\"}"}'
```

#### Get a value

```bash
curl http://localhost:3030/api/cache/get?key=user:123
```

#### Delete a key

```bash
curl -X DELETE http://localhost:3030/api/cache/del \
  -H "Content-Type: application/json" \
  -d '{"key": "user:123"}'
```

#### List all keys

```bash
curl http://localhost:3030/api/cache/keys
```

#### Flush all keys

```bash
curl -X POST http://localhost:3030/api/cache/flush
```

## Shell Scripts

Located in `scripts/shell/`:

| Script               | Description           |
| -------------------- | --------------------- |
| `cache_set.sh`       | Set a key-value pair  |
| `cache_get.sh`       | Get value by key      |
| `cache_del.sh`       | Delete a key          |
| `cache_flush.sh`     | Flush all keys        |
| `list_cache.sh`      | List all cache keys   |
| `list_cache_keys.sh` | List keys with values |

### Example Usage

```bash
# Set a cache key
./scripts/shell/cache_set.sh "session:abc123" '{"userId":"123","expires":"2024-12-31"}'

# Get a cache value
./scripts/shell/cache_get.sh "session:abc123"

# Delete a key
./scripts/shell/cache_del.sh "session:abc123"

# List all keys
./scripts/shell/list_cache_keys.sh

# Flush entire cache
./scripts/shell/cache_flush.sh
```

## GUI Features

### Dashboard Integration

- Redis cache appears as a resource in the main dashboard
- Shows connection status and quick access link

### Full-Page Cache Management (`/cache`)

- **Set Key-Value**: Form to set new cache entries
- **Get Value**: Retrieve and display values by key
- **Delete Key**: Remove specific keys
- **Flush Cache**: Clear all cache entries with confirmation
- **View All Keys**: Table view of all keys and values
- **JSON Formatting**: Automatic pretty-printing of JSON values
- **Connection Info**: Display host/port for external Redis tools

### Connection Info

Use these settings to connect external Redis tools:

- **Host**: `localhost`
- **Port**: `6380`
- **Password**: None

## Using with Redis CLI

```bash
# Connect with redis-cli
redis-cli -h localhost -p 6380

# Example commands
SET mykey "Hello World"
GET mykey
DEL mykey
KEYS *
FLUSHALL
```

## Using with Node.js

```javascript
const redis = require("redis");

const client = redis.createClient({
  host: "localhost",
  port: 6380,
});

client.on("error", (err) => console.log("Redis Client Error", err));

await client.connect();

// Set a value
await client.set("key", "value");

// Get a value
const value = await client.get("key");

// Delete a key
await client.del("key");
```

## Using with Python

```python
import redis

# Create Redis client
r = redis.Redis(host='localhost', port=6380, decode_responses=True)

# Set a value
r.set('key', 'value')

# Get a value
value = r.get('key')

# Delete a key
r.delete('key')

# List all keys
keys = r.keys('*')
```

## Best Practices

1. **Use Descriptive Keys**: Use namespacing like `user:123` or `session:abc`
2. **JSON for Complex Data**: Store objects as JSON strings for better structure
3. **TTL for Sessions**: Set expiration times for temporary data (when needed)
4. **Flush Carefully**: Use `FLUSH` sparingly as it clears all data
5. **Monitor Size**: Keep cache size reasonable for local development

## Troubleshooting

### Redis not starting

```bash
# Check if Redis container is running
docker compose ps redis

# View Redis logs
docker compose logs redis

# Restart Redis
docker compose restart redis
```

### Connection refused

Make sure you're using the correct port:

- **From host machine**: `localhost:6380`
- **From other containers**: `redis:6379`

### Cache not persisting

By default, Redis data is stored in Docker volumes. To clear:

```bash
# Remove volumes
docker compose down -v

# Restart
docker compose up
```

---

[← Back to Main Documentation](../README.md)
