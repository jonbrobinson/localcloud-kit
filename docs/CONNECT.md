# Connecting to LocalStack

This guide shows how to connect to your LocalStack instance using various AWS SDKs. All examples cover S3, DynamoDB, and Secrets Manager.

## 🌐 LocalStack Endpoint

Your LocalStack instance is running at:

- **Endpoint**: `http://localhost:4566`
- **Region**: `us-east-1` (default)

## 📋 Prerequisites

- LocalCloud Kit running (see [Quick Start](../README.md#-quick-start))
- AWS CLI configured (optional, for testing)
- Your preferred programming language and AWS SDK

## 🔧 AWS Credentials

LocalStack accepts any non-empty dummy credentials:

```bash
export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test
export AWS_DEFAULT_REGION=us-east-1
```

---

## 🚀 SDK Examples

### JavaScript / Node.js (AWS SDK v3)

#### Installation

```bash
npm install @aws-sdk/client-s3 @aws-sdk/client-dynamodb @aws-sdk/client-secrets-manager
```

#### Basic Configuration

```javascript
import { S3Client } from "@aws-sdk/client-s3";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { SecretsManagerClient } from "@aws-sdk/client-secrets-manager";

const localstackConfig = {
  endpoint: "http://localhost:4566",
  region: "us-east-1",
  credentials: {
    accessKeyId: "test",
    secretAccessKey: "test",
  },
  forcePathStyle: true, // required for S3
};

const s3Client = new S3Client(localstackConfig);
const dynamoClient = new DynamoDBClient(localstackConfig);
const secretsClient = new SecretsManagerClient(localstackConfig);
```

#### S3 Example

```javascript
import {
  ListBucketsCommand,
  CreateBucketCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";

async function listBuckets() {
  const response = await s3Client.send(new ListBucketsCommand({}));
  console.log("Buckets:", response.Buckets);
}

async function createBucket(bucketName) {
  await s3Client.send(new CreateBucketCommand({ Bucket: bucketName }));
  console.log(`Bucket "${bucketName}" created`);
}

async function uploadObject(bucket, key, body) {
  await s3Client.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: body }));
  console.log(`Uploaded "${key}" to "${bucket}"`);
}

await listBuckets();
await createBucket("my-test-bucket");
await uploadObject("my-test-bucket", "hello.txt", "Hello, LocalStack!");
```

#### DynamoDB Example

```javascript
import {
  ListTablesCommand,
  CreateTableCommand,
  PutItemCommand,
  GetItemCommand,
} from "@aws-sdk/client-dynamodb";

async function listTables() {
  const response = await dynamoClient.send(new ListTablesCommand({}));
  console.log("Tables:", response.TableNames);
}

async function createTable(tableName) {
  await dynamoClient.send(new CreateTableCommand({
    TableName: tableName,
    AttributeDefinitions: [{ AttributeName: "id", AttributeType: "S" }],
    KeySchema: [{ AttributeName: "id", KeyType: "HASH" }],
    BillingMode: "PAY_PER_REQUEST",
  }));
  console.log(`Table "${tableName}" created`);
}

async function putItem(tableName, item) {
  await dynamoClient.send(new PutItemCommand({ TableName: tableName, Item: item }));
  console.log("Item written");
}

await listTables();
await createTable("my-test-table");
await putItem("my-test-table", {
  id: { S: "user123" },
  name: { S: "Jane Doe" },
  email: { S: "jane@example.com" },
});
```

#### Secrets Manager Example

```javascript
import {
  ListSecretsCommand,
  CreateSecretCommand,
  GetSecretValueCommand,
  DeleteSecretCommand,
} from "@aws-sdk/client-secrets-manager";

async function listSecrets() {
  const response = await secretsClient.send(new ListSecretsCommand({}));
  console.log("Secrets:", response.SecretList.map((s) => s.Name));
}

async function createSecret(name, value) {
  const response = await secretsClient.send(new CreateSecretCommand({
    Name: name,
    SecretString: typeof value === "string" ? value : JSON.stringify(value),
  }));
  console.log(`Secret "${name}" created — ARN: ${response.ARN}`);
}

async function getSecret(name) {
  const response = await secretsClient.send(new GetSecretValueCommand({ SecretId: name }));
  return response.SecretString;
}

async function deleteSecret(name) {
  await secretsClient.send(new DeleteSecretCommand({
    SecretId: name,
    ForceDeleteWithoutRecovery: true, // skips the 30-day recovery window
  }));
  console.log(`Secret "${name}" deleted`);
}

await listSecrets();
await createSecret("my-api-key", "super-secret-value");
await createSecret("my-db-config", { host: "localhost", port: 5432, password: "dev" });
console.log("Secret value:", await getSecret("my-api-key"));
await deleteSecret("my-api-key");
```

---

### Python (boto3)

#### Installation

```bash
pip install boto3
```

#### Basic Configuration

```python
import boto3

localstack_opts = {
    "endpoint_url": "http://localhost:4566",
    "region_name": "us-east-1",
    "aws_access_key_id": "test",
    "aws_secret_access_key": "test",
}

s3 = boto3.client("s3", **localstack_opts)
dynamodb = boto3.client("dynamodb", **localstack_opts)
secrets = boto3.client("secretsmanager", **localstack_opts)
```

#### S3 Example

```python
def list_buckets():
    response = s3.list_buckets()
    print("Buckets:", [b["Name"] for b in response["Buckets"]])

def create_bucket(name):
    s3.create_bucket(Bucket=name)
    print(f'Bucket "{name}" created')

def upload_file(bucket, key, filepath):
    s3.upload_file(filepath, bucket, key)
    print(f'Uploaded "{filepath}" → "{bucket}/{key}"')

list_buckets()
create_bucket("my-python-bucket")
upload_file("my-python-bucket", "hello.txt", "local-hello.txt")
```

#### DynamoDB Example

```python
def list_tables():
    response = dynamodb.list_tables()
    print("Tables:", response["TableNames"])

def create_table(name):
    dynamodb.create_table(
        TableName=name,
        AttributeDefinitions=[{"AttributeName": "id", "AttributeType": "S"}],
        KeySchema=[{"AttributeName": "id", "KeyType": "HASH"}],
        BillingMode="PAY_PER_REQUEST",
    )
    print(f'Table "{name}" created')

def put_item(table, item):
    dynamodb.put_item(TableName=table, Item=item)
    print("Item written")

list_tables()
create_table("my-python-table")
put_item("my-python-table", {
    "id": {"S": "user123"},
    "name": {"S": "Jane Doe"},
    "email": {"S": "jane@example.com"},
})
```

#### Secrets Manager Example

```python
import json

def list_secrets():
    response = secrets.list_secrets()
    print("Secrets:", [s["Name"] for s in response["SecretList"]])

def create_secret(name, value):
    body = value if isinstance(value, str) else json.dumps(value)
    response = secrets.create_secret(Name=name, SecretString=body)
    print(f'Secret "{name}" created — ARN: {response["ARN"]}')

def get_secret(name):
    response = secrets.get_secret_value(SecretId=name)
    return response["SecretString"]

def delete_secret(name):
    secrets.delete_secret(SecretId=name, ForceDeleteWithoutRecovery=True)
    print(f'Secret "{name}" deleted')

list_secrets()
create_secret("my-api-key", "super-secret-value")
create_secret("my-db-config", {"host": "localhost", "port": 5432, "password": "dev"})
print("Secret value:", get_secret("my-api-key"))
delete_secret("my-api-key")
```

---

### Go (AWS SDK v2)

#### Installation

```bash
go mod init localstack-example
go get github.com/aws/aws-sdk-go-v2/aws
go get github.com/aws/aws-sdk-go-v2/config
go get github.com/aws/aws-sdk-go-v2/credentials
go get github.com/aws/aws-sdk-go-v2/service/s3
go get github.com/aws/aws-sdk-go-v2/service/dynamodb
go get github.com/aws/aws-sdk-go-v2/service/secretsmanager
```

#### Basic Configuration

Use service-specific `BaseEndpoint` overrides — the global `EndpointResolverWithOptions` API was deprecated in SDK v1.17:

```go
package main

import (
    "context"
    "log"

    "github.com/aws/aws-sdk-go-v2/aws"
    "github.com/aws/aws-sdk-go-v2/config"
    "github.com/aws/aws-sdk-go-v2/credentials"
    "github.com/aws/aws-sdk-go-v2/service/dynamodb"
    "github.com/aws/aws-sdk-go-v2/service/s3"
    "github.com/aws/aws-sdk-go-v2/service/secretsmanager"
)

const localstackEndpoint = "http://localhost:4566"

func main() {
    cfg, err := config.LoadDefaultConfig(context.TODO(),
        config.WithRegion("us-east-1"),
        config.WithCredentialsProvider(credentials.StaticCredentialsProvider{
            Value: aws.Credentials{
                AccessKeyID:     "test",
                SecretAccessKey: "test",
            },
        }),
    )
    if err != nil {
        log.Fatal(err)
    }

    s3Client := s3.NewFromConfig(cfg, func(o *s3.Options) {
        o.BaseEndpoint = aws.String(localstackEndpoint)
        o.UsePathStyle = true // required for LocalStack S3
    })

    dynamoClient := dynamodb.NewFromConfig(cfg, func(o *dynamodb.Options) {
        o.BaseEndpoint = aws.String(localstackEndpoint)
    })

    secretsClient := secretsmanager.NewFromConfig(cfg, func(o *secretsmanager.Options) {
        o.BaseEndpoint = aws.String(localstackEndpoint)
    })

    _ = s3Client
    _ = dynamoClient
    _ = secretsClient
}
```

#### S3 Example

```go
import (
    "context"
    "log"
    "strings"

    "github.com/aws/aws-sdk-go-v2/aws"
    "github.com/aws/aws-sdk-go-v2/service/s3"
)

func listBuckets(ctx context.Context, client *s3.Client) {
    result, err := client.ListBuckets(ctx, &s3.ListBucketsInput{})
    if err != nil {
        log.Printf("ListBuckets error: %v", err)
        return
    }
    for _, b := range result.Buckets {
        log.Printf("Bucket: %s", *b.Name)
    }
}

func createBucket(ctx context.Context, client *s3.Client, name string) {
    _, err := client.CreateBucket(ctx, &s3.CreateBucketInput{
        Bucket: aws.String(name),
    })
    if err != nil {
        log.Printf("CreateBucket error: %v", err)
        return
    }
    log.Printf("Bucket %q created", name)
}

func uploadObject(ctx context.Context, client *s3.Client, bucket, key, body string) {
    _, err := client.PutObject(ctx, &s3.PutObjectInput{
        Bucket: aws.String(bucket),
        Key:    aws.String(key),
        Body:   strings.NewReader(body),
    })
    if err != nil {
        log.Printf("PutObject error: %v", err)
        return
    }
    log.Printf("Uploaded %q to %q", key, bucket)
}
```

#### DynamoDB Example

```go
import (
    "context"
    "log"

    "github.com/aws/aws-sdk-go-v2/aws"
    "github.com/aws/aws-sdk-go-v2/service/dynamodb"
    "github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
)

func listTables(ctx context.Context, client *dynamodb.Client) {
    result, err := client.ListTables(ctx, &dynamodb.ListTablesInput{})
    if err != nil {
        log.Printf("ListTables error: %v", err)
        return
    }
    log.Printf("Tables: %v", result.TableNames)
}

func createTable(ctx context.Context, client *dynamodb.Client, name string) {
    _, err := client.CreateTable(ctx, &dynamodb.CreateTableInput{
        TableName: aws.String(name),
        AttributeDefinitions: []types.AttributeDefinition{
            {AttributeName: aws.String("id"), AttributeType: types.ScalarAttributeTypeS},
        },
        KeySchema: []types.KeySchemaElement{
            {AttributeName: aws.String("id"), KeyType: types.KeyTypeHash},
        },
        BillingMode: types.BillingModePayPerRequest,
    })
    if err != nil {
        log.Printf("CreateTable error: %v", err)
        return
    }
    log.Printf("Table %q created", name)
}

func putItem(ctx context.Context, client *dynamodb.Client, table string, item map[string]types.AttributeValue) {
    _, err := client.PutItem(ctx, &dynamodb.PutItemInput{
        TableName: aws.String(table),
        Item:      item,
    })
    if err != nil {
        log.Printf("PutItem error: %v", err)
        return
    }
    log.Println("Item written")
}
```

#### Secrets Manager Example

```go
import (
    "context"
    "log"

    "github.com/aws/aws-sdk-go-v2/aws"
    "github.com/aws/aws-sdk-go-v2/service/secretsmanager"
)

func listSecrets(ctx context.Context, client *secretsmanager.Client) {
    result, err := client.ListSecrets(ctx, &secretsmanager.ListSecretsInput{})
    if err != nil {
        log.Printf("ListSecrets error: %v", err)
        return
    }
    for _, s := range result.SecretList {
        log.Printf("Secret: %s", *s.Name)
    }
}

func createSecret(ctx context.Context, client *secretsmanager.Client, name, value string) {
    result, err := client.CreateSecret(ctx, &secretsmanager.CreateSecretInput{
        Name:         aws.String(name),
        SecretString: aws.String(value),
    })
    if err != nil {
        log.Printf("CreateSecret error: %v", err)
        return
    }
    log.Printf("Secret %q created — ARN: %s", name, *result.ARN)
}

func getSecret(ctx context.Context, client *secretsmanager.Client, name string) string {
    result, err := client.GetSecretValue(ctx, &secretsmanager.GetSecretValueInput{
        SecretId: aws.String(name),
    })
    if err != nil {
        log.Printf("GetSecretValue error: %v", err)
        return ""
    }
    return *result.SecretString
}

func deleteSecret(ctx context.Context, client *secretsmanager.Client, name string) {
    forceDelete := true
    _, err := client.DeleteSecret(ctx, &secretsmanager.DeleteSecretInput{
        SecretId:                   aws.String(name),
        ForceDeleteWithoutRecovery: &forceDelete,
    })
    if err != nil {
        log.Printf("DeleteSecret error: %v", err)
        return
    }
    log.Printf("Secret %q deleted", name)
}
```

---

### Java (AWS SDK v2)

#### Maven Dependencies

```xml
<dependencies>
    <dependency>
        <groupId>software.amazon.awssdk</groupId>
        <artifactId>s3</artifactId>
        <version>2.20.162</version>
    </dependency>
    <dependency>
        <groupId>software.amazon.awssdk</groupId>
        <artifactId>dynamodb</artifactId>
        <version>2.20.162</version>
    </dependency>
    <dependency>
        <groupId>software.amazon.awssdk</groupId>
        <artifactId>secretsmanager</artifactId>
        <version>2.20.162</version>
    </dependency>
</dependencies>
```

#### Basic Configuration

```java
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.secretsmanager.SecretsManagerClient;

import java.net.URI;

public class LocalStackConfig {
    private static final URI ENDPOINT = URI.create("http://localhost:4566");
    private static final StaticCredentialsProvider CREDS =
        StaticCredentialsProvider.create(AwsBasicCredentials.create("test", "test"));

    public static S3Client s3() {
        return S3Client.builder()
            .endpointOverride(ENDPOINT)
            .credentialsProvider(CREDS)
            .region(Region.US_EAST_1)
            .forcePathStyle(true) // required for LocalStack S3
            .build();
    }

    public static DynamoDbClient dynamo() {
        return DynamoDbClient.builder()
            .endpointOverride(ENDPOINT)
            .credentialsProvider(CREDS)
            .region(Region.US_EAST_1)
            .build();
    }

    public static SecretsManagerClient secrets() {
        return SecretsManagerClient.builder()
            .endpointOverride(ENDPOINT)
            .credentialsProvider(CREDS)
            .region(Region.US_EAST_1)
            .build();
    }
}
```

#### S3 Example

```java
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.*;

public class S3Example {
    private final S3Client s3 = LocalStackConfig.s3();

    public void listBuckets() {
        s3.listBuckets().buckets()
            .forEach(b -> System.out.println("Bucket: " + b.name()));
    }

    public void createBucket(String name) {
        s3.createBucket(CreateBucketRequest.builder().bucket(name).build());
        System.out.println("Bucket \"" + name + "\" created");
    }

    public void uploadObject(String bucket, String key, String body) {
        s3.putObject(
            PutObjectRequest.builder().bucket(bucket).key(key).build(),
            RequestBody.fromString(body)
        );
        System.out.println("Uploaded \"" + key + "\" to \"" + bucket + "\"");
    }
}
```

#### DynamoDB Example

```java
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.*;

import java.util.Map;

public class DynamoDBExample {
    private final DynamoDbClient dynamo = LocalStackConfig.dynamo();

    public void listTables() {
        dynamo.listTables().tableNames()
            .forEach(t -> System.out.println("Table: " + t));
    }

    public void createTable(String name) {
        dynamo.createTable(CreateTableRequest.builder()
            .tableName(name)
            .attributeDefinitions(AttributeDefinition.builder()
                .attributeName("id").attributeType(ScalarAttributeType.S).build())
            .keySchema(KeySchemaElement.builder()
                .attributeName("id").keyType(KeyType.HASH).build())
            .billingMode(BillingMode.PAY_PER_REQUEST)
            .build());
        System.out.println("Table \"" + name + "\" created");
    }

    public void putItem(String table, Map<String, AttributeValue> item) {
        dynamo.putItem(PutItemRequest.builder().tableName(table).item(item).build());
        System.out.println("Item written");
    }
}
```

#### Secrets Manager Example

```java
import software.amazon.awssdk.services.secretsmanager.SecretsManagerClient;
import software.amazon.awssdk.services.secretsmanager.model.*;

public class SecretsExample {
    private final SecretsManagerClient secrets = LocalStackConfig.secrets();

    public void listSecrets() {
        secrets.listSecrets().secretList()
            .forEach(s -> System.out.println("Secret: " + s.name()));
    }

    public String createSecret(String name, String value) {
        CreateSecretResponse response = secrets.createSecret(CreateSecretRequest.builder()
            .name(name)
            .secretString(value)
            .build());
        System.out.println("Secret \"" + name + "\" created — ARN: " + response.arn());
        return response.arn();
    }

    public String getSecret(String name) {
        return secrets.getSecretValue(GetSecretValueRequest.builder()
            .secretId(name)
            .build()).secretString();
    }

    public void deleteSecret(String name) {
        secrets.deleteSecret(DeleteSecretRequest.builder()
            .secretId(name)
            .forceDeleteWithoutRecovery(true)
            .build());
        System.out.println("Secret \"" + name + "\" deleted");
    }
}
```

---

## 🧪 Testing Your Connection

### Using AWS CLI

```bash
# S3
aws --endpoint-url=http://localhost:4566 s3 ls
aws --endpoint-url=http://localhost:4566 s3 mb s3://test-bucket
aws --endpoint-url=http://localhost:4566 s3 ls s3://test-bucket

# DynamoDB
aws --endpoint-url=http://localhost:4566 dynamodb list-tables
aws --endpoint-url=http://localhost:4566 dynamodb create-table \
  --table-name test-table \
  --attribute-definitions AttributeName=id,AttributeType=S \
  --key-schema AttributeName=id,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST

# Secrets Manager
aws --endpoint-url=http://localhost:4566 secretsmanager list-secrets
aws --endpoint-url=http://localhost:4566 secretsmanager create-secret \
  --name my-test-secret \
  --secret-string "hello-localstack"
aws --endpoint-url=http://localhost:4566 secretsmanager get-secret-value \
  --secret-id my-test-secret
```

### Health Check

```bash
curl http://localhost:4566/_localstack/health
curl http://localhost:4566/_localstack/health | jq .services
```

---

## 🔍 Troubleshooting

| Problem | Cause | Fix |
|---------|-------|-----|
| `Connection refused` | LocalStack not running | `make start` or `docker compose up -d` |
| `InvalidSignatureException` | Bad credentials format | Use any non-empty string for key/secret |
| S3 `NoSuchBucket` / path errors | Path style not enabled | Set `forcePathStyle: true` (JS/Java) or `UsePathStyle: true` (Go) |
| `ResourceNotFoundException` | Wrong region | Use `us-east-1` unless you changed the default |
| Go compile error on `EndpointResolverWithOptions` | Deprecated API | Use service-specific `BaseEndpoint` option (see Go section above) |

### Enable Debug Logging

```javascript
// JavaScript
const s3Client = new S3Client({ ...localstackConfig, logger: console });
```

```python
# Python
import boto3, logging
boto3.set_stream_logger("botocore", logging.DEBUG)
```

```go
// Go — add to config.LoadDefaultConfig
config.WithClientLogMode(aws.LogRequestWithBody | aws.LogResponseWithBody),
```

---

## 📚 Additional Resources

- [LocalStack Documentation](https://docs.localstack.cloud/)
- [AWS SDK for JavaScript v3](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/)
- [AWS SDK for Python (boto3)](https://boto3.amazonaws.com/v1/documentation/api/latest/index.html)
- [AWS SDK for Go v2](https://aws.github.io/aws-sdk-go-v2/docs/)
- [AWS SDK for Java v2](https://docs.aws.amazon.com/sdk-for-java/latest/developer-guide/)
- [LocalCloud Kit README](../README.md)
