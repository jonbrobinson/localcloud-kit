# AWS API Gateway Integration

LocalCloud Kit includes AWS API Gateway support for building and testing REST APIs locally via LocalStack.

## Features

- **REST API Management**: Create, list, and delete REST APIs
- **Resource & Method Definition**: Add resources, methods, and integrations via SDK or CLI
- **Mock & Lambda Integrations**: Connect to Lambda functions or use mock responses
- **Stage Deployments**: Deploy APIs to named stages (dev, staging, prod)
- **GUI Management**: Create APIs via the dashboard with name and description
- **API Endpoints**: RESTful management endpoints
- **Shell Scripts**: Automation scripts for API Gateway operations

## Quick Start

1. Start all services: `make start`
2. Open the GUI: https://app-local.localcloudkit.com:3030
3. Click **Resources → API Gateway** to create a new REST API
4. Add resources and methods via the AWS CLI or SDK at `http://localhost:4566`

## Invoke URL Pattern

After deploying to a stage, APIs are accessible at:

```
http://localhost:4566/restapis/{apiId}/{stage}/_user_request_/{path}
```

### About `_user_request_`

LocalStack uses the special `_user_request_` path segment when emulating API Gateway invoke URLs. This is **expected and correct** for local development.

- **LocalStack (local)**:

  ```
  http://localhost:4566/restapis/{apiId}/{stage}/_user_request_/{path}
  ```

- **AWS (real API Gateway)**:

  ```
  https://{apiId}.execute-api.{region}.amazonaws.com/{stage}/{path}
  ```

When you see a URL like:

```
http://localhost:4566/restapis/c2w1l17b8w/dev/_user_request_/hello
```

this is the LocalStack equivalent of a real AWS invoke URL such as:

```
https://c2w1l17b8w.execute-api.us-east-1.amazonaws.com/dev/hello
```

You should **keep `_user_request_` in the URL** when invoking APIs against LocalStack; it is not a typo and does not appear in real AWS URLs.

## API Endpoints

| Method | Endpoint | Description |
| ------ | -------- | ----------- |
| `GET` | `/api/apigateway/apis` | List all REST APIs |
| `GET` | `/api/apigateway/apis/:apiId` | Get API details |
| `DELETE` | `/api/apigateway/apis/:apiId` | Delete a REST API |

### Example Requests

#### List all APIs

```bash
curl http://localhost:3031/api/apigateway/apis
```

#### Delete an API

```bash
curl -X DELETE http://localhost:3031/api/apigateway/apis/abc123xyz
```

## Shell Scripts

Located in `scripts/shell/`:

| Script | Description |
| ------ | ----------- |
| `list_apis.sh` | List REST APIs with optional project filter |

### Example Usage

```bash
# List all APIs
./scripts/shell/list_apis.sh

# List APIs for a specific project
./scripts/shell/list_apis.sh my-project
```

## Using with AWS SDK

### Python (boto3)

```python
import boto3

apigw = boto3.client(
    "apigateway",
    region_name="us-east-1",
    endpoint_url="http://localhost:4566",
    aws_access_key_id="test",
    aws_secret_access_key="test",
)

# Create a REST API
api = apigw.create_rest_api(name="my-api")
api_id = api["id"]

# Get the root resource
resources = apigw.get_resources(restApiId=api_id)
root_id = resources["items"][0]["id"]

# Create a resource path
resource = apigw.create_resource(
    restApiId=api_id,
    parentId=root_id,
    pathPart="hello",
)

# Add a GET method with mock integration
apigw.put_method(
    restApiId=api_id,
    resourceId=resource["id"],
    httpMethod="GET",
    authorizationType="NONE",
)
apigw.put_integration(
    restApiId=api_id,
    resourceId=resource["id"],
    httpMethod="GET",
    type="MOCK",
    requestTemplates={"application/json": '{"statusCode": 200}'},
)

# Deploy to dev stage
apigw.create_deployment(restApiId=api_id, stageName="dev")
invoke_url = f"http://localhost:4566/restapis/{api_id}/dev/_user_request_/hello"
print(f"Invoke at: {invoke_url}")
```

### AWS CLI

```bash
export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test
export AWS_DEFAULT_REGION=us-east-1

alias awslocal='aws --endpoint-url http://localhost:4566'

# Create API
API_ID=$(awslocal apigateway create-rest-api \
  --name my-api --query 'id' --output text)

# Get root resource
ROOT_ID=$(awslocal apigateway get-resources \
  --rest-api-id $API_ID \
  --query 'items[0].id' --output text)

# Create /hello resource
RESOURCE_ID=$(awslocal apigateway create-resource \
  --rest-api-id $API_ID \
  --parent-id $ROOT_ID \
  --path-part hello \
  --query 'id' --output text)

# Add GET method + mock integration
awslocal apigateway put-method \
  --rest-api-id $API_ID \
  --resource-id $RESOURCE_ID \
  --http-method GET \
  --authorization-type NONE

awslocal apigateway put-integration \
  --rest-api-id $API_ID \
  --resource-id $RESOURCE_ID \
  --http-method GET \
  --type MOCK \
  --request-templates '{"application/json":"{\"statusCode\":200}"}'

# Deploy to dev
awslocal apigateway create-deployment \
  --rest-api-id $API_ID \
  --stage-name dev

# Invoke
curl http://localhost:4566/restapis/$API_ID/dev/_user_request_/hello
```

## Lambda Proxy Integration

```python
# After creating a Lambda function named "hello-fn":
apigw.put_integration(
    restApiId=api_id,
    resourceId=resource["id"],
    httpMethod="GET",
    type="AWS_PROXY",
    integrationHttpMethod="POST",
    uri=f"arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/arn:aws:lambda:us-east-1:000000000000:function:hello-fn/invocations",
)
```

## Troubleshooting

### API not found

```bash
# List all APIs to find the ID
awslocal apigateway get-rest-apis
```

### 404 on invocation

- Verify the stage has been deployed with `create-deployment`
- Confirm the path matches exactly (case-sensitive)
- Check the integration is correctly configured

---

[← Back to Main Documentation](../README.md)
