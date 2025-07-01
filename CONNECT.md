# Connecting to LocalStack

This guide shows how to connect to your LocalStack instance using various AWS SDKs.

## 🌐 LocalStack Endpoint

Your LocalStack instance is running at:

- **Endpoint**: `http://localhost:4566`
- **Region**: `us-east-1` (default)

## 📋 Prerequisites

- LocalStack Manager running (see [Quick Start](README.md#-quick-start))
- AWS CLI configured (optional, for testing)
- Your preferred programming language and AWS SDK

## 🔧 AWS Credentials

For LocalStack, you can use dummy credentials:

```bash
export AWS_ACCESS_KEY_ID=dummy
export AWS_SECRET_ACCESS_KEY=dummy
export AWS_DEFAULT_REGION=us-east-1
```

## 🚀 SDK Examples

### JavaScript/Node.js (AWS SDK v3)

#### Installation

```bash
npm install @aws-sdk/client-s3 @aws-sdk/client-dynamodb
```

#### Basic Configuration

```javascript
import { S3Client } from "@aws-sdk/client-s3";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

// LocalStack configuration
const localstackConfig = {
  endpoint: "http://localhost:4566",
  region: "us-east-1",
  credentials: {
    accessKeyId: "dummy",
    secretAccessKey: "dummy",
  },
  forcePathStyle: true, // Required for S3
};

// Create clients
const s3Client = new S3Client(localstackConfig);
const dynamoClient = new DynamoDBClient(localstackConfig);
```

#### S3 Example

```javascript
import { ListBucketsCommand, CreateBucketCommand } from "@aws-sdk/client-s3";

// List buckets
async function listBuckets() {
  try {
    const command = new ListBucketsCommand({});
    const response = await s3Client.send(command);
    console.log("Buckets:", response.Buckets);
  } catch (error) {
    console.error("Error listing buckets:", error);
  }
}

// Create bucket
async function createBucket(bucketName) {
  try {
    const command = new CreateBucketCommand({
      Bucket: bucketName,
    });
    await s3Client.send(command);
    console.log(`Bucket ${bucketName} created successfully`);
  } catch (error) {
    console.error("Error creating bucket:", error);
  }
}

// Usage
listBuckets();
createBucket("my-test-bucket");
```

#### DynamoDB Example

```javascript
import {
  ListTablesCommand,
  CreateTableCommand,
  PutItemCommand,
  GetItemCommand,
} from "@aws-sdk/client-dynamodb";

// List tables
async function listTables() {
  try {
    const command = new ListTablesCommand({});
    const response = await dynamoClient.send(command);
    console.log("Tables:", response.TableNames);
  } catch (error) {
    console.error("Error listing tables:", error);
  }
}

// Create table
async function createTable(tableName) {
  try {
    const command = new CreateTableCommand({
      TableName: tableName,
      AttributeDefinitions: [{ AttributeName: "id", AttributeType: "S" }],
      KeySchema: [{ AttributeName: "id", KeyType: "HASH" }],
      BillingMode: "PAY_PER_REQUEST",
    });
    await dynamoClient.send(command);
    console.log(`Table ${tableName} created successfully`);
  } catch (error) {
    console.error("Error creating table:", error);
  }
}

// Put item
async function putItem(tableName, item) {
  try {
    const command = new PutItemCommand({
      TableName: tableName,
      Item: item,
    });
    await dynamoClient.send(command);
    console.log("Item added successfully");
  } catch (error) {
    console.error("Error adding item:", error);
  }
}

// Usage
listTables();
createTable("my-test-table");
putItem("my-test-table", {
  id: { S: "user123" },
  name: { S: "John Doe" },
  email: { S: "john@example.com" },
});
```

### Python (boto3)

#### Installation

```bash
pip install boto3
```

#### Basic Configuration

```python
import boto3
from botocore.config import Config

# LocalStack configuration
localstack_config = Config(
    region_name='us-east-1',
    endpoint_url='http://localhost:4566',
    aws_access_key_id='dummy',
    aws_secret_access_key='dummy'
)

# Create clients
s3_client = boto3.client('s3', config=localstack_config)
dynamodb_client = boto3.client('dynamodb', config=localstack_config)
```

#### S3 Example

```python
# List buckets
def list_buckets():
    try:
        response = s3_client.list_buckets()
        print("Buckets:", [bucket['Name'] for bucket in response['Buckets']])
    except Exception as e:
        print(f"Error listing buckets: {e}")

# Create bucket
def create_bucket(bucket_name):
    try:
        s3_client.create_bucket(Bucket=bucket_name)
        print(f"Bucket {bucket_name} created successfully")
    except Exception as e:
        print(f"Error creating bucket: {e}")

# Upload file
def upload_file(bucket_name, file_path, object_name):
    try:
        s3_client.upload_file(file_path, bucket_name, object_name)
        print(f"File {file_path} uploaded to {bucket_name}/{object_name}")
    except Exception as e:
        print(f"Error uploading file: {e}")

# Usage
list_buckets()
create_bucket('my-python-bucket')
upload_file('my-python-bucket', 'local-file.txt', 'remote-file.txt')
```

#### DynamoDB Example

```python
# List tables
def list_tables():
    try:
        response = dynamodb_client.list_tables()
        print("Tables:", response['TableNames'])
    except Exception as e:
        print(f"Error listing tables: {e}")

# Create table
def create_table(table_name):
    try:
        response = dynamodb_client.create_table(
            TableName=table_name,
            AttributeDefinitions=[
                {'AttributeName': 'id', 'AttributeType': 'S'}
            ],
            KeySchema=[
                {'AttributeName': 'id', 'KeyType': 'HASH'}
            ],
            BillingMode='PAY_PER_REQUEST'
        )
        print(f"Table {table_name} created successfully")
    except Exception as e:
        print(f"Error creating table: {e}")

# Put item
def put_item(table_name, item):
    try:
        dynamodb_client.put_item(
            TableName=table_name,
            Item=item
        )
        print("Item added successfully")
    except Exception as e:
        print(f"Error adding item: {e}")

# Usage
list_tables()
create_table('my-python-table')
put_item('my-python-table', {
    'id': {'S': 'user123'},
    'name': {'S': 'Jane Doe'},
    'email': {'S': 'jane@example.com'}
})
```

### Go (AWS SDK v2)

#### Installation

```bash
go mod init localstack-example
go get github.com/aws/aws-sdk-go-v2
go get github.com/aws/aws-sdk-go-v2/config
go get github.com/aws/aws-sdk-go-v2/service/s3
go get github.com/aws/aws-sdk-go-v2/service/dynamodb
```

#### Basic Configuration

```go
package main

import (
    "context"
    "log"

    "github.com/aws/aws-sdk-go-v2/config"
    "github.com/aws/aws-sdk-go-v2/service/s3"
    "github.com/aws/aws-sdk-go-v2/service/dynamodb"
)

func main() {
    // LocalStack configuration
    customResolver := aws.EndpointResolverWithOptionsFunc(func(service, region string, options ...interface{}) (aws.Endpoint, error) {
        return aws.Endpoint{
            URL: "http://localhost:4566",
        }, nil
    })

    cfg, err := config.LoadDefaultConfig(context.TODO(),
        config.WithEndpointResolverWithOptions(customResolver),
        config.WithRegion("us-east-1"),
    )
    if err != nil {
        log.Fatal(err)
    }

    // Create clients
    s3Client := s3.NewFromConfig(cfg)
    dynamoClient := dynamodb.NewFromConfig(cfg)
}
```

#### S3 Example

```go
import (
    "context"
    "log"

    "github.com/aws/aws-sdk-go-v2/service/s3"
)

// List buckets
func listBuckets(ctx context.Context, client *s3.Client) {
    result, err := client.ListBuckets(ctx, &s3.ListBucketsInput{})
    if err != nil {
        log.Printf("Error listing buckets: %v", err)
        return
    }

    for _, bucket := range result.Buckets {
        log.Printf("Bucket: %s", *bucket.Name)
    }
}

// Create bucket
func createBucket(ctx context.Context, client *s3.Client, bucketName string) {
    _, err := client.CreateBucket(ctx, &s3.CreateBucketInput{
        Bucket: aws.String(bucketName),
    })
    if err != nil {
        log.Printf("Error creating bucket: %v", err)
        return
    }
    log.Printf("Bucket %s created successfully", bucketName)
}

// Usage
listBuckets(context.TODO(), s3Client)
createBucket(context.TODO(), s3Client, "my-go-bucket")
```

#### DynamoDB Example

```go
import (
    "context"
    "log"

    "github.com/aws/aws-sdk-go-v2/service/dynamodb"
    "github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
)

// List tables
func listTables(ctx context.Context, client *dynamodb.Client) {
    result, err := client.ListTables(ctx, &dynamodb.ListTablesInput{})
    if err != nil {
        log.Printf("Error listing tables: %v", err)
        return
    }

    for _, tableName := range result.TableNames {
        log.Printf("Table: %s", tableName)
    }
}

// Create table
func createTable(ctx context.Context, client *dynamodb.Client, tableName string) {
    _, err := client.CreateTable(ctx, &dynamodb.CreateTableInput{
        TableName: aws.String(tableName),
        AttributeDefinitions: []types.AttributeDefinition{
            {
                AttributeName: aws.String("id"),
                AttributeType: types.ScalarAttributeTypeS,
            },
        },
        KeySchema: []types.KeySchemaElement{
            {
                AttributeName: aws.String("id"),
                KeyType:       types.KeyTypeHash,
            },
        },
        BillingMode: types.BillingModePayPerRequest,
    })
    if err != nil {
        log.Printf("Error creating table: %v", err)
        return
    }
    log.Printf("Table %s created successfully", tableName)
}

// Put item
func putItem(ctx context.Context, client *dynamodb.Client, tableName string, item map[string]types.AttributeValue) {
    _, err := client.PutItem(ctx, &dynamodb.PutItemInput{
        TableName: aws.String(tableName),
        Item:      item,
    })
    if err != nil {
        log.Printf("Error adding item: %v", err)
        return
    }
    log.Println("Item added successfully")
}

// Usage
listTables(context.TODO(), dynamoClient)
createTable(context.TODO(), dynamoClient, "my-go-table")
putItem(context.TODO(), dynamoClient, "my-go-table", map[string]types.AttributeValue{
    "id":    &types.AttributeValueMemberS{Value: "user123"},
    "name":  &types.AttributeValueMemberS{Value: "Bob Smith"},
    "email": &types.AttributeValueMemberS{Value: "bob@example.com"},
})
```

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
</dependencies>
```

#### Basic Configuration

```java
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;

import java.net.URI;

public class LocalStackExample {
    public static void main(String[] args) {
        // LocalStack configuration
        S3Client s3Client = S3Client.builder()
            .endpointOverride(URI.create("http://localhost:4566"))
            .credentialsProvider(StaticCredentialsProvider.create(
                AwsBasicCredentials.create("dummy", "dummy")
            ))
            .region(Region.US_EAST_1)
            .forcePathStyle(true) // Required for S3
            .build();

        DynamoDbClient dynamoClient = DynamoDbClient.builder()
            .endpointOverride(URI.create("http://localhost:4566"))
            .credentialsProvider(StaticCredentialsProvider.create(
                AwsBasicCredentials.create("dummy", "dummy")
            ))
            .region(Region.US_EAST_1)
            .build();
    }
}
```

#### S3 Example

```java
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.*;

public class S3Example {
    private final S3Client s3Client;

    public S3Example(S3Client s3Client) {
        this.s3Client = s3Client;
    }

    // List buckets
    public void listBuckets() {
        try {
            ListBucketsResponse response = s3Client.listBuckets();
            response.buckets().forEach(bucket ->
                System.out.println("Bucket: " + bucket.name())
            );
        } catch (Exception e) {
            System.err.println("Error listing buckets: " + e.getMessage());
        }
    }

    // Create bucket
    public void createBucket(String bucketName) {
        try {
            CreateBucketRequest request = CreateBucketRequest.builder()
                .bucket(bucketName)
                .build();
            s3Client.createBucket(request);
            System.out.println("Bucket " + bucketName + " created successfully");
        } catch (Exception e) {
            System.err.println("Error creating bucket: " + e.getMessage());
        }
    }

    // Upload file
    public void uploadFile(String bucketName, String key, String filePath) {
        try {
            PutObjectRequest request = PutObjectRequest.builder()
                .bucket(bucketName)
                .key(key)
                .build();
            s3Client.putObject(request, Paths.get(filePath));
            System.out.println("File uploaded to " + bucketName + "/" + key);
        } catch (Exception e) {
            System.err.println("Error uploading file: " + e.getMessage());
        }
    }
}
```

#### DynamoDB Example

```java
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.*;

import java.util.HashMap;
import java.util.Map;

public class DynamoDBExample {
    private final DynamoDbClient dynamoClient;

    public DynamoDBExample(DynamoDbClient dynamoClient) {
        this.dynamoClient = dynamoClient;
    }

    // List tables
    public void listTables() {
        try {
            ListTablesResponse response = dynamoClient.listTables();
            response.tableNames().forEach(tableName ->
                System.out.println("Table: " + tableName)
            );
        } catch (Exception e) {
            System.err.println("Error listing tables: " + e.getMessage());
        }
    }

    // Create table
    public void createTable(String tableName) {
        try {
            CreateTableRequest request = CreateTableRequest.builder()
                .tableName(tableName)
                .attributeDefinitions(AttributeDefinition.builder()
                    .attributeName("id")
                    .attributeType(ScalarAttributeType.S)
                    .build())
                .keySchema(KeySchemaElement.builder()
                    .attributeName("id")
                    .keyType(KeyType.HASH)
                    .build())
                .billingMode(BillingMode.PAY_PER_REQUEST)
                .build();

            dynamoClient.createTable(request);
            System.out.println("Table " + tableName + " created successfully");
        } catch (Exception e) {
            System.err.println("Error creating table: " + e.getMessage());
        }
    }

    // Put item
    public void putItem(String tableName, Map<String, AttributeValue> item) {
        try {
            PutItemRequest request = PutItemRequest.builder()
                .tableName(tableName)
                .item(item)
                .build();

            dynamoClient.putItem(request);
            System.out.println("Item added successfully");
        } catch (Exception e) {
            System.err.println("Error adding item: " + e.getMessage());
        }
    }

    // Usage example
    public void example() {
        listTables();
        createTable("my-java-table");

        Map<String, AttributeValue> item = new HashMap<>();
        item.put("id", AttributeValue.builder().s("user123").build());
        item.put("name", AttributeValue.builder().s("Alice Johnson").build());
        item.put("email", AttributeValue.builder().s("alice@example.com").build());

        putItem("my-java-table", item);
    }
}
```

## 🧪 Testing Your Connection

### Using AWS CLI

```bash
# Test S3
aws --endpoint-url=http://localhost:4566 s3 ls

# Test DynamoDB
aws --endpoint-url=http://localhost:4566 dynamodb list-tables

# Create a test bucket
aws --endpoint-url=http://localhost:4566 s3 mb s3://test-bucket

# List buckets
aws --endpoint-url=http://localhost:4566 s3 ls
```

### Health Check

```bash
# Check LocalStack health
curl http://localhost:4566/_localstack/health

# Check specific services
curl http://localhost:4566/_localstack/health/s3
curl http://localhost:4566/_localstack/health/dynamodb
```

## 🔍 Troubleshooting

### Common Issues

1. **Connection refused**: Make sure LocalStack is running
2. **Invalid credentials**: Use dummy credentials for LocalStack
3. **S3 path style**: Enable `forcePathStyle` for S3 operations
4. **Region mismatch**: Use `us-east-1` as default region

### Debug Mode

Enable debug logging in your SDK:

```javascript
// JavaScript
const s3Client = new S3Client({
  ...localstackConfig,
  logger: console,
});
```

```python
# Python
import boto3
import logging
boto3.set_stream_logger('botocore', logging.DEBUG)
```

```go
// Go
import "github.com/aws/aws-sdk-go-v2/aws"
cfg.LogLevel = aws.LogDebug
```

## 📚 Additional Resources

- [LocalStack Documentation](https://docs.localstack.cloud/)
- [AWS SDK Documentation](https://aws.amazon.com/tools/)
- [LocalStack Manager README](README.md)

---

**Need help?** Check the [LocalStack Manager documentation](README.md) or create an issue on GitHub.
