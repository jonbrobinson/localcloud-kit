# AWS Lambda Integration

LocalCloud Kit includes AWS Lambda support for serverless function development and testing via the AWS Emulator (MiniStack).

## Features

- **Function Management**: Create, list, and delete Lambda functions
- **Multiple Runtimes**: Python 3.9–3.12, Node.js 18/20, Java 17/21, Go, .NET 8
- **Function Invocation**: Invoke functions directly from the dashboard or CLI
- **GUI Management**: Create functions via the dashboard with runtime and handler configuration
- **API Endpoints**: RESTful endpoints for programmatic access
- **Shell Scripts**: Automation scripts for Lambda operations

## Quick Start

1. Start all services: `make start`
2. Open the GUI: https://app-local.localcloudkit.com:3030
3. Click **Resources → Lambda Functions** to create a new function
4. Connect via the AWS SDK at `http://localhost:4566`

## Docker Setup

Lambda runs as part of the AWS Emulator (MiniStack) services:

- Enabled in `docker-compose.yml` by default
- No additional configuration required
- Functions run in-process in the emulator (no Docker-in-Docker needed)

## API Endpoints

| Method | Endpoint | Description |
| ------ | -------- | ----------- |
| `GET` | `/api/lambda/functions` | List all Lambda functions |
| `GET` | `/api/lambda/functions/:name` | Get function details |
| `DELETE` | `/api/lambda/functions/:name` | Delete a function |
| `POST` | `/api/lambda/functions/:name/invoke` | Invoke a function |

### Example Requests

#### List all functions

```bash
curl http://localhost:3031/api/lambda/functions
```

#### Invoke a function

```bash
curl -X POST http://localhost:3031/api/lambda/functions/my-function/invoke \
  -H "Content-Type: application/json" \
  -d '{"payload": {"key": "value"}}'
```

#### Delete a function

```bash
curl -X DELETE http://localhost:3031/api/lambda/functions/my-function
```

## Shell Scripts

Located in `scripts/shell/`:

| Script | Description |
| ------ | ----------- |
| `list_lambda_functions.sh` | List Lambda functions with optional project filter |

### Example Usage

```bash
# List all functions
./scripts/shell/list_lambda_functions.sh

# List functions for a specific project
./scripts/shell/list_lambda_functions.sh my-project
```

## Supported Runtimes

| Runtime | Notes |
| ------- | ----- |
| `python3.12` | Latest Python (recommended) |
| `python3.11` | Python 3.11 |
| `python3.10` | Python 3.10 |
| `python3.9` | Python 3.9 |
| `nodejs20.x` | Node.js 20 (recommended) |
| `nodejs18.x` | Node.js 18 |
| `java21` | Java 21 |
| `java17` | Java 17 |
| `go1.x` | Go |
| `dotnet8` | .NET 8 |

## Using with AWS SDK

### Python (boto3)

```python
import boto3, json, zipfile, io

lambda_client = boto3.client(
    "lambda",
    region_name="us-east-1",
    endpoint_url="http://localhost:4566",
    aws_access_key_id="test",
    aws_secret_access_key="test",
)

# Build a minimal zip in memory
code = b"def lambda_handler(e, c): return {'statusCode': 200, 'body': 'Hello!'}"
buf = io.BytesIO()
with zipfile.ZipFile(buf, "w") as z:
    z.writestr("lambda_function.py", code)

# Create function
lambda_client.create_function(
    FunctionName="my-function",
    Runtime="python3.12",
    Role="arn:aws:iam::000000000000:role/irrelevant",
    Handler="lambda_function.lambda_handler",
    Code={"ZipFile": buf.getvalue()},
)

# Invoke function
response = lambda_client.invoke(
    FunctionName="my-function",
    Payload=json.dumps({"key": "value"}),
)
print(json.loads(response["Payload"].read()))
```

### Node.js

```javascript
import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda";

const lambda = new LambdaClient({
  region: "us-east-1",
  endpoint: "http://localhost:4566",
  credentials: { accessKeyId: "test", secretAccessKey: "test" },
});

const response = await lambda.send(new InvokeCommand({
  FunctionName: "my-function",
  Payload: JSON.stringify({ key: "value" }),
}));
console.log(JSON.parse(Buffer.from(response.Payload).toString()));
```

### AWS CLI

```bash
export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test
export AWS_DEFAULT_REGION=us-east-1

alias awslocal='aws --endpoint-url http://localhost:4566'

# Create a function
echo 'def lambda_handler(e,c): return {"statusCode":200}' > lambda_function.py
zip function.zip lambda_function.py

awslocal lambda create-function \
  --function-name my-function \
  --runtime python3.12 \
  --role arn:aws:iam::000000000000:role/irrelevant \
  --handler lambda_function.lambda_handler \
  --zip-file fileb://function.zip

# Invoke
awslocal lambda invoke \
  --function-name my-function \
  --payload '{"key":"value"}' \
  response.json
cat response.json
```

## Troubleshooting

### Function not found

```bash
# List all functions to verify name
awslocal lambda list-functions
```

### Invocation error

```bash
# Check function logs (writes to stdout)
docker compose logs aws-emulator | grep my-function
```

### GUI not showing functions

```bash
# Verify functions exist via API
curl http://localhost:3031/api/lambda/functions
```

---

[← Back to Main Documentation](../README.md)
