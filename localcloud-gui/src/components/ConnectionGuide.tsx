"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@iconify/react";
import { toast } from "react-hot-toast";
import ThemeableCodeBlock from "@/components/ThemeableCodeBlock";
import { Button, IconButton } from "@/components/ui";

interface CodeExample {
  language: string;
  title: string;
  code: string;
  description: string;
}

const codeExamples: CodeExample[] = [
  {
    language: "JavaScript",
    title: "AWS SDK v3 - Basic Setup",
    code: `import { S3Client } from '@aws-sdk/client-s3';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';

// LocalStack configuration
const localstackConfig = {
  endpoint: 'http://localhost:4566',
  region: 'us-east-1',
  credentials: {
    accessKeyId: 'test',
    secretAccessKey: 'test'
  },
  forcePathStyle: true // Required for S3
};

// Create clients
const s3Client = new S3Client(localstackConfig);
const dynamoClient = new DynamoDBClient(localstackConfig);`,
    description:
      "Install with: npm install @aws-sdk/client-s3 @aws-sdk/client-dynamodb",
  },
  {
    language: "Python",
    title: "boto3 - Basic Setup",
    code: `import boto3
from botocore.config import Config

# LocalStack configuration
localstack_config = Config(
    region_name='us-east-1',
    endpoint_url='http://localhost:4566',
    aws_access_key_id='test',
    aws_secret_access_key='test'
)

# Create clients
s3_client = boto3.client('s3', config=localstack_config)
dynamodb_client = boto3.client('dynamodb', config=localstack_config)`,
    description: "Install with: pip install boto3",
  },
  {
    language: "Go",
    title: "AWS SDK v2 - Basic Setup",
    code: `package main

import (
    "context"
    "log"

    "github.com/aws/aws-sdk-go-v2/aws"
    "github.com/aws/aws-sdk-go-v2/config"
    "github.com/aws/aws-sdk-go-v2/credentials"
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
        config.WithRegion("us-east-1"),
        config.WithCredentialsProvider(credentials.NewStaticCredentialsProvider("test", "test", "")),
        config.WithEndpointResolverWithOptions(customResolver),
    )
    if err != nil {
        log.Fatal(err)
    }

    // Create clients
    s3Client := s3.NewFromConfig(cfg)
    dynamoClient := dynamodb.NewFromConfig(cfg)
}`,
    description: "Install with: go get github.com/aws/aws-sdk-go-v2",
  },
  {
    language: "Java",
    title: "AWS SDK v2 - Basic Setup",
    code: `import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
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
                AwsBasicCredentials.create("test", "test")
            ))
            .region(Region.US_EAST_1)
            .forcePathStyle(true) // Required for S3
            .build();

        DynamoDbClient dynamoClient = DynamoDbClient.builder()
            .endpointOverride(URI.create("http://localhost:4566"))
            .credentialsProvider(StaticCredentialsProvider.create(
                AwsBasicCredentials.create("test", "test")
            ))
            .region(Region.US_EAST_1)
            .build();
    }
}`,
    description:
      "Add to pom.xml: software.amazon.awssdk:s3 and software.amazon.awssdk:dynamodb",
  },
];

const s3Examples: CodeExample[] = [
  {
    language: "JavaScript",
    title: "S3 - List and Create Buckets",
    code: `import { ListBucketsCommand, CreateBucketCommand } from '@aws-sdk/client-s3';

// List buckets
async function listBuckets() {
  try {
    const command = new ListBucketsCommand({});
    const response = await s3Client.send(command);
    console.log('Buckets:', response.Buckets);
  } catch (error) {
    console.error('Error listing buckets:', error);
  }
}

// Create bucket
async function createBucket(bucketName) {
  try {
    const command = new CreateBucketCommand({
      Bucket: bucketName
    });
    await s3Client.send(command);
    console.log(\`Bucket \${bucketName} created successfully\`);
  } catch (error) {
    console.error('Error creating bucket:', error);
  }
}

// Usage
listBuckets();
createBucket('my-test-bucket');`,
    description: "Basic S3 operations with AWS SDK v3",
  },
  {
    language: "Python",
    title: "S3 - List and Create Buckets",
    code: `# List buckets
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
upload_file('my-python-bucket', 'local-file.txt', 'remote-file.txt')`,
    description: "Basic S3 operations with boto3",
  },
  {
    language: "Go",
    title: "S3 - List and Create Buckets",
    code: `package main

import (
    "context"
    "fmt"
    "log"

    "github.com/aws/aws-sdk-go-v2/aws"
    "github.com/aws/aws-sdk-go-v2/config"
    "github.com/aws/aws-sdk-go-v2/credentials"
    "github.com/aws/aws-sdk-go-v2/service/s3"
)

func main() {
    customResolver := aws.EndpointResolverWithOptionsFunc(func(service, region string, options ...interface{}) (aws.Endpoint, error) {
        return aws.Endpoint{
            URL: "http://localhost:4566",
        }, nil
    })
    cfg, err := config.LoadDefaultConfig(context.TODO(),
        config.WithRegion("us-east-1"),
        config.WithCredentialsProvider(credentials.NewStaticCredentialsProvider("test", "test", "")),
        config.WithEndpointResolverWithOptions(customResolver),
    )
    if err != nil {
        log.Fatal(err)
    }
    s3Client := s3.NewFromConfig(cfg)

    // List buckets
    out, err := s3Client.ListBuckets(context.TODO(), &s3.ListBucketsInput{})
    if err != nil {
        log.Fatal("ListBuckets error:", err)
    }
    for _, b := range out.Buckets {
        fmt.Println("Bucket:", *b.Name)
    }

    // Create bucket
    _, err = s3Client.CreateBucket(context.TODO(), &s3.CreateBucketInput{
        Bucket: aws.String("my-go-bucket"),
    })
    if err != nil {
        log.Fatal("CreateBucket error:", err)
    }
    fmt.Println("Bucket my-go-bucket created successfully")
}`,
    description: "Basic S3 operations with AWS SDK v2 for Go",
  },
];

const dynamoExamples: CodeExample[] = [
  {
    language: "JavaScript",
    title: "DynamoDB - List and Create Tables",
    code: `import {
  ListTablesCommand,
  CreateTableCommand,
  PutItemCommand
} from '@aws-sdk/client-dynamodb';

// List tables
async function listTables() {
  try {
    const command = new ListTablesCommand({});
    const response = await dynamoClient.send(command);
    console.log('Tables:', response.TableNames);
  } catch (error) {
    console.error('Error listing tables:', error);
  }
}

// Create table
async function createTable(tableName) {
  try {
    const command = new CreateTableCommand({
      TableName: tableName,
      AttributeDefinitions: [
        { AttributeName: 'id', AttributeType: 'S' }
      ],
      KeySchema: [
        { AttributeName: 'id', KeyType: 'HASH' }
      ],
      BillingMode: 'PAY_PER_REQUEST'
    });
    await dynamoClient.send(command);
    console.log(\`Table \${tableName} created successfully\`);
  } catch (error) {
    console.error('Error creating table:', error);
  }
}

// Put item
async function putItem(tableName, item) {
  try {
    const command = new PutItemCommand({
      TableName: tableName,
      Item: item
    });
    await dynamoClient.send(command);
    console.log('Item added successfully');
  } catch (error) {
    console.error('Error adding item:', error);
  }
}

// Usage
listTables();
createTable('my-test-table');
putItem('my-test-table', {
  id: { S: 'user123' },
  name: { S: 'John Doe' },
  email: { S: 'john@example.com' }
});`,
    description: "Basic DynamoDB operations with AWS SDK v3",
  },
  {
    language: "Python",
    title: "DynamoDB - List and Create Tables",
    code: `# List tables
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
})`,
    description: "Basic DynamoDB operations with boto3",
  },
  {
    language: "Go",
    title: "DynamoDB - List and Create Tables",
    code: `package main

import (
    "context"
    "fmt"
    "log"

    "github.com/aws/aws-sdk-go-v2/aws"
    "github.com/aws/aws-sdk-go-v2/config"
    "github.com/aws/aws-sdk-go-v2/credentials"
    "github.com/aws/aws-sdk-go-v2/service/dynamodb"
    "github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
)

func main() {
    customResolver := aws.EndpointResolverWithOptionsFunc(func(service, region string, options ...interface{}) (aws.Endpoint, error) {
        return aws.Endpoint{
            URL: "http://localhost:4566",
        }, nil
    })
    cfg, err := config.LoadDefaultConfig(context.TODO(),
        config.WithRegion("us-east-1"),
        config.WithCredentialsProvider(credentials.NewStaticCredentialsProvider("test", "test", "")),
        config.WithEndpointResolverWithOptions(customResolver),
    )
    if err != nil {
        log.Fatal(err)
    }
    dynamoClient := dynamodb.NewFromConfig(cfg)

    // List tables
    out, err := dynamoClient.ListTables(context.TODO(), &dynamodb.ListTablesInput{})
    if err != nil {
        log.Fatal("ListTables error:", err)
    }
    fmt.Println("Tables:", out.TableNames)

    // Create table
    _, err = dynamoClient.CreateTable(context.TODO(), &dynamodb.CreateTableInput{
        TableName: aws.String("my-go-table"),
        AttributeDefinitions: []types.AttributeDefinition{{
            AttributeName: aws.String("id"),
            AttributeType: types.ScalarAttributeTypeS,
        }},
        KeySchema: []types.KeySchemaElement{{
            AttributeName: aws.String("id"),
            KeyType:       types.KeyTypeHash,
        }},
        BillingMode: types.BillingModePayPerRequest,
    })
    if err != nil {
        log.Fatal("CreateTable error:", err)
    }
    fmt.Println("Table my-go-table created successfully")

    // Put item
    _, err = dynamoClient.PutItem(context.TODO(), &dynamodb.PutItemInput{
        TableName: aws.String("my-go-table"),
        Item: map[string]types.AttributeValue{
            "id":   &types.AttributeValueMemberS{Value: "user123"},
            "name": &types.AttributeValueMemberS{Value: "Jane Doe"},
            "email": &types.AttributeValueMemberS{Value: "jane@example.com"},
        },
    })
    if err != nil {
        log.Fatal("PutItem error:", err)
    }
    fmt.Println("Item added successfully")
}`,
    description: "Basic DynamoDB operations with AWS SDK v2 for Go",
  },
];

type ResourceTabId = "setup" | "s3" | "dynamodb";

const resourceTabs: { id: ResourceTabId; name: string; icon: string; examples: CodeExample[] }[] = [
  { id: "setup", name: "Basic Setup", icon: "lucide:zap", examples: codeExamples },
  { id: "s3", name: "S3", icon: "logos:aws-s3", examples: s3Examples },
  { id: "dynamodb", name: "DynamoDB", icon: "logos:aws-dynamodb", examples: dynamoExamples },
];

const languageOptions = ["JavaScript", "Python", "Go", "Java"] as const;
type Language = (typeof languageOptions)[number];

function InfoField({
  label,
  value,
  badge,
  masked,
  onToggleMask,
  onCopy,
}: {
  label: string;
  value: string;
  badge?: string;
  masked?: boolean;
  onToggleMask?: () => void;
  onCopy: () => void;
}) {
  return (
    <div className="flex flex-col gap-1.5 bg-surface border border-border rounded-xl shadow-e1 p-3.5">
      <span className="text-[11px] font-semibold tracking-wider uppercase text-faint">
        {label}
      </span>
      <div className="flex items-center gap-2">
        <span className="font-mono text-[13px] text-ink truncate">
          {masked ? "••••" : value}
        </span>
        {badge && (
          <span className="px-1.5 py-0.5 rounded-full bg-surface-3 text-muted text-[10px] font-semibold whitespace-nowrap">
            {badge}
          </span>
        )}
        {onToggleMask && (
          <IconButton
            icon={masked ? "lucide:eye" : "lucide:eye-off"}
            label={masked ? `Show ${label.toLowerCase()}` : `Hide ${label.toLowerCase()}`}
            variant="outline"
            size="sm"
            onClick={onToggleMask}
            className="shrink-0"
          />
        )}
        <IconButton
          icon="lucide:copy"
          label={`Copy ${label.toLowerCase()}`}
          variant="outline"
          size="sm"
          onClick={onCopy}
          className="ml-auto shrink-0"
        />
      </div>
    </div>
  );
}

export default function ConnectionGuide() {
  const [activeTab, setActiveTab] = useState<ResourceTabId>("setup");
  const [selectedLanguage, setSelectedLanguage] = useState<Language>("JavaScript");
  const [secretVisible, setSecretVisible] = useState(false);
  const [resourceMenuOpen, setResourceMenuOpen] = useState(false);
  const resourceMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (resourceMenuRef.current && !resourceMenuRef.current.contains(e.target as Node)) {
        setResourceMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const activeResourceTab = resourceTabs.find((tab) => tab.id === activeTab) ?? resourceTabs[0];
  const activeExample = activeResourceTab.examples.find(
    (example) => example.language === selectedLanguage
  );

  const copyToClipboard = async (text: string, message: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(message);
    } catch {
      toast.error("Copy failed");
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-semibold tracking-tight text-ink">
          Connecting to the AWS Emulator
        </h1>
        <p className="text-xs text-muted mt-1">
          Point any AWS SDK at the emulator — credentials are dummies
        </p>
      </div>

      {/* Connection info cards */}
      <div className="grid gap-3 grid-cols-[repeat(auto-fit,minmax(220px,1fr))]">
        <InfoField
          label="Endpoint"
          value="http://localhost:4566"
          onCopy={() => copyToClipboard("http://localhost:4566", "Endpoint copied")}
        />
        <InfoField
          label="Region"
          value="us-east-1"
          onCopy={() => copyToClipboard("us-east-1", "Region copied")}
        />
        <InfoField
          label="Access key"
          value="test"
          badge="dummy"
          onCopy={() => copyToClipboard("test", "Access key copied")}
        />
        <InfoField
          label="Secret key"
          value="test"
          masked={!secretVisible}
          onToggleMask={() => setSecretVisible((v) => !v)}
          onCopy={() => copyToClipboard("test", "Secret key copied")}
        />
      </div>

      {/* Code sample card */}
      <div className="bg-surface border border-border rounded-xl shadow-e1 overflow-hidden">
        <div className="flex items-center gap-3 px-3 border-b border-divider flex-wrap">
          <div className="flex gap-1">
            {languageOptions.map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => setSelectedLanguage(lang)}
                className={`px-3 py-2 text-xs font-medium border-b-2 -mb-px transition-colors cursor-pointer ${
                  selectedLanguage === lang
                    ? "border-primary text-primary"
                    : "border-transparent text-muted hover:text-ink"
                }`}
              >
                {lang}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 ml-auto py-2">
            <div className="relative" ref={resourceMenuRef}>
              <button
                type="button"
                onClick={() => setResourceMenuOpen((v) => !v)}
                aria-expanded={resourceMenuOpen}
                className="flex items-center justify-between gap-2 h-7 min-w-[150px] px-2.5 border border-border-strong rounded-md bg-surface-2 text-xs cursor-pointer whitespace-nowrap transition-colors hover:bg-surface hover:border-ink-2"
              >
                <span className="flex items-center gap-1.5">
                  <Icon icon={activeResourceTab.icon} width={13} />
                  {activeResourceTab.name}
                </span>
                <Icon icon="lucide:chevron-down" width={13} className="text-faint" />
              </button>
              {resourceMenuOpen && (
                <div className="absolute right-0 z-10 mt-1 w-40 bg-surface border border-border rounded-md shadow-e2 py-1">
                  {resourceTabs.map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => {
                        setActiveTab(tab.id);
                        setResourceMenuOpen(false);
                      }}
                      className={`flex items-center gap-2 w-full px-3 py-1.5 text-xs text-left cursor-pointer hover:bg-surface-2 ${
                        activeTab === tab.id ? "text-primary font-medium" : "text-ink-2"
                      }`}
                    >
                      <Icon icon={tab.icon} width={13} />
                      {tab.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Button
              variant="secondary"
              size="sm"
              icon="lucide:copy"
              disabled={!activeExample}
              onClick={() => activeExample && copyToClipboard(activeExample.code, "Code copied")}
            >
              Copy
            </Button>
          </div>
        </div>

        {activeExample ? (
          <>
            <div className="px-4 pt-3">
              <ThemeableCodeBlock
                code={activeExample.code}
                language={activeExample.language.toLowerCase()}
                showCopyButton={false}
              />
            </div>
            <div className="flex items-center gap-2 px-3.5 py-2.5 border-t border-divider">
              <Icon icon="lucide:info" width={14} className="text-muted shrink-0" />
              <span className="text-xs text-muted">{activeExample.description}</span>
            </div>
          </>
        ) : (
          <p className="px-4 py-10 text-sm text-faint italic text-center">
            No {selectedLanguage} example available for {activeResourceTab.name}.
          </p>
        )}
      </div>

      {/* Additional Resources */}
      <div className="bg-surface-2 border border-border rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Icon icon="lucide:book-open" width={16} className="text-muted" />
          <h2 className="text-sm font-semibold text-ink">Additional Resources</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="text-xs font-semibold text-ink-2 mb-2">Documentation</h3>
            <ul className="space-y-1.5 text-sm text-muted">
              <li>
                <a
                  href="https://github.com/nahuelnucera/ministack"
                  className="text-primary hover:text-primary-hover"
                >
                  MiniStack Documentation
                </a>
              </li>
              <li>
                <a
                  href="https://aws.amazon.com/tools/"
                  className="text-primary hover:text-primary-hover"
                >
                  AWS SDK Documentation
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-semibold text-ink-2 mb-2">Troubleshooting</h3>
            <ul className="space-y-1.5 text-sm text-muted">
              <li>Connection refused: Check if AWS Emulator is running</li>
              <li>Invalid credentials: Use test credentials for AWS Emulator</li>
              <li>S3 path style: Enable forcePathStyle for S3 operations</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
