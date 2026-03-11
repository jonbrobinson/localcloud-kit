# AWS SSM Parameter Store Integration

LocalCloud Kit includes AWS Systems Manager Parameter Store support for managing configuration data and secrets locally via LocalStack.

## Features

- **Hierarchical Parameters**: Organise with `/`-delimited path namespaces
- **Three Parameter Types**: String, StringList, and SecureString (encrypted)
- **Complete CRUD**: Create, read, update, and delete parameters
- **GUI Management**: Create parameters via the dashboard with type selection
- **API Endpoints**: RESTful endpoints for programmatic access
- **Shell Scripts**: Automation scripts for all parameter operations

## Quick Start

1. Start all services: `make start`
2. Open the GUI: https://app-local.localcloudkit.com:3030
3. Click **Resources → Parameter Store** to create a new parameter
4. Connect via the AWS SDK at `http://localhost:4566`

## Parameter Types

| Type | Use Case |
| ---- | -------- |
| `String` | Plain text values — hostnames, URLs, config flags |
| `StringList` | Comma-separated values — e.g. `us-east-1,eu-west-1` |
| `SecureString` | Sensitive data encrypted at rest using KMS |

## API Endpoints

| Method | Endpoint | Description |
| ------ | -------- | ----------- |
| `GET` | `/api/ssm/parameters` | List all parameters |
| `POST` | `/api/ssm/parameters` | Create / update a parameter |
| `GET` | `/api/ssm/parameters/:name` | Get a parameter value |
| `PUT` | `/api/ssm/parameters/:name` | Update a parameter |
| `DELETE` | `/api/ssm/parameters/:name` | Delete a parameter |

### Example Requests

#### List all parameters

```bash
curl http://localhost:3031/api/ssm/parameters
```

#### Create a parameter

```bash
curl -X POST http://localhost:3031/api/ssm/parameters \
  -H "Content-Type: application/json" \
  -d '{
    "name": "/my-app/database/host",
    "value": "localhost",
    "type": "String",
    "description": "Database hostname"
  }'
```

#### Get a parameter

```bash
curl "http://localhost:3031/api/ssm/parameters//my-app/database/host"
```

#### Delete a parameter

```bash
curl -X DELETE "http://localhost:3031/api/ssm/parameters//my-app/database/host"
```

## Shell Scripts

Located in `scripts/shell/`:

| Script | Description |
| ------ | ----------- |
| `list_parameters.sh` | List all SSM parameters |
| `create_parameter.sh` | Create or update a parameter |
| `get_parameter.sh` | Get a parameter value |
| `delete_parameter.sh` | Delete a parameter |

### Example Usage

```bash
# Create a parameter
./scripts/shell/create_parameter.sh "/my-app/db/host" "localhost" "String" "DB hostname"

# Get a parameter
./scripts/shell/get_parameter.sh "/my-app/db/host"

# List all parameters
./scripts/shell/list_parameters.sh

# Delete a parameter
./scripts/shell/delete_parameter.sh "/my-app/db/host"
```

## Using with AWS SDK

### Python (boto3)

```python
import boto3

ssm = boto3.client(
    "ssm",
    region_name="us-east-1",
    endpoint_url="http://localhost:4566",
    aws_access_key_id="test",
    aws_secret_access_key="test",
)

# Create parameters
ssm.put_parameter(
    Name="/my-app/database/host",
    Value="localhost",
    Type="String",
    Description="Database hostname",
    Overwrite=True,
)
ssm.put_parameter(
    Name="/my-app/database/password",
    Value="s3cr3t!",
    Type="SecureString",
    Overwrite=True,
)

# Get a parameter (decrypted)
response = ssm.get_parameter(
    Name="/my-app/database/password",
    WithDecryption=True,
)
print(response["Parameter"]["Value"])

# Get all parameters under a path
response = ssm.get_parameters_by_path(
    Path="/my-app/",
    Recursive=True,
    WithDecryption=True,
)
for p in response["Parameters"]:
    print(f"{p['Name']} = {p['Value']}")

# Delete
ssm.delete_parameter(Name="/my-app/database/host")
```

### AWS CLI

```bash
export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test
export AWS_DEFAULT_REGION=us-east-1

alias awslocal='aws --endpoint-url http://localhost:4566'

# Create parameters
awslocal ssm put-parameter \
  --name "/my-app/database/host" \
  --value "localhost" \
  --type String \
  --overwrite

awslocal ssm put-parameter \
  --name "/my-app/database/password" \
  --value "s3cr3t!" \
  --type SecureString \
  --overwrite

# Get a parameter
awslocal ssm get-parameter \
  --name "/my-app/database/host"

# Get all under a path
awslocal ssm get-parameters-by-path \
  --path "/my-app/" \
  --recursive \
  --with-decryption

# List all
awslocal ssm describe-parameters

# Delete
awslocal ssm delete-parameter --name "/my-app/database/host"
```

## Best Practices

1. **Use Hierarchical Paths**: Organise with `/app/env/service/key` patterns
   - ✅ `/my-app/prod/database/password`
   - ✅ `/shared/smtp/host`
   - ❌ `dbpassword`, `host1`

2. **SecureString for Sensitive Data**: Always use `SecureString` for passwords, API keys, and tokens

3. **String vs StringList**: Use `StringList` for comma-separated config values read as arrays

4. **Descriptions**: Add descriptions — they show up in the GUI and CLI

## Common Use Cases

### App Configuration Loading

```python
import boto3

def load_config(app_name: str, env: str) -> dict:
    ssm = boto3.client("ssm", endpoint_url="http://localhost:4566",
                       region_name="us-east-1",
                       aws_access_key_id="test", aws_secret_access_key="test")
    response = ssm.get_parameters_by_path(
        Path=f"/{app_name}/{env}/",
        Recursive=True,
        WithDecryption=True,
    )
    return {p["Name"].split("/")[-1]: p["Value"] for p in response["Parameters"]}

config = load_config("my-app", "dev")
print(config)  # {"host": "localhost", "port": "5432", ...}
```

## Troubleshooting

### Parameter not found

```bash
# List all parameters
awslocal ssm describe-parameters

# Check exact name
awslocal ssm get-parameter --name "/exact/parameter/name"
```

### SecureString decryption issues

LocalStack decrypts SecureString using a local KMS key automatically — ensure you pass `--with-decryption` or `WithDecryption=True`.

---

[← Back to Main Documentation](../README.md)
