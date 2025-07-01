"use client";

import { useState } from "react";
import {
  CodeBracketIcon,
  CommandLineIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import { SyntaxHighlighter } from "react-syntax-highlighter";

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
    accessKeyId: 'dummy',
    secretAccessKey: 'dummy'
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
    aws_access_key_id='dummy',
    aws_secret_access_key='dummy'
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
];

const testingExamples: CodeExample[] = [
  {
    language: "AWS CLI",
    title: "Test Connection with AWS CLI",
    code: `# Test S3
aws --endpoint-url=http://localhost:4566 s3 ls

# Test DynamoDB
aws --endpoint-url=http://localhost:4566 dynamodb list-tables

# Create a test bucket
aws --endpoint-url=http://localhost:4566 s3 mb s3://test-bucket

# List buckets
aws --endpoint-url=http://localhost:4566 s3 ls`,
    description: "Test your LocalStack connection using AWS CLI",
  },
  {
    language: "Health Check",
    title: "Check LocalStack Health",
    code: `# Check LocalStack health
curl http://localhost:4566/_localstack/health

# Check specific services
curl http://localhost:4566/_localstack/health/s3
curl http://localhost:4566/_localstack/health/dynamodb`,
    description: "Verify LocalStack services are running properly",
  },
];

const languageOptions = [
  { value: "JavaScript", label: "JavaScript" },
  { value: "Python", label: "Python" },
  { value: "Go", label: "Go" },
  { value: "Java", label: "Java" },
];

export default function ConnectionGuide() {
  const [activeTab, setActiveTab] = useState("setup");
  const [selectedLanguage, setSelectedLanguage] = useState("JavaScript");

  const tabs = [
    { id: "setup", name: "Basic Setup", icon: CodeBracketIcon },
    { id: "s3", name: "S3 Examples", icon: CommandLineIcon },
    { id: "dynamodb", name: "DynamoDB Examples", icon: CommandLineIcon },
    { id: "testing", name: "Testing", icon: CheckCircleIcon },
  ];

  const getExamples = () => {
    switch (activeTab) {
      case "setup":
        return codeExamples;
      case "s3":
        return s3Examples;
      case "dynamodb":
        return dynamoExamples;
      case "testing":
        return testingExamples;
      default:
        return codeExamples;
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Connecting to LocalStack
        </h1>
        <p className="text-lg text-gray-600">
          Learn how to connect to your LocalStack instance using various AWS
          SDKs.
        </p>
      </div>

      {/* Connection Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold text-blue-900 mb-4">
          🌐 LocalStack Endpoint
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-blue-700">Endpoint:</p>
            <code className="text-blue-900 bg-blue-100 px-2 py-1 rounded">
              http://localhost:4566
            </code>
          </div>
          <div>
            <p className="text-sm font-medium text-blue-700">Region:</p>
            <code className="text-blue-900 bg-blue-100 px-2 py-1 rounded">
              us-east-1
            </code>
          </div>
        </div>
        <div className="mt-4">
          <p className="text-sm font-medium text-blue-700">AWS Credentials:</p>
          <div className="bg-blue-100 p-3 rounded mt-2">
            <code className="text-blue-900 text-sm">
              AWS_ACCESS_KEY_ID=dummy
              <br />
              AWS_SECRET_ACCESS_KEY=dummy
              <br />
              AWS_DEFAULT_REGION=us-east-1
            </code>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Language Selector */}
      <div className="mb-6">
        <label className="text-sm font-medium text-gray-700 mr-4">
          Select Language:
        </label>
        <select
          value={selectedLanguage}
          onChange={(e) => setSelectedLanguage(e.target.value)}
          className="bg-white text-gray-900 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {languageOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Code Examples */}
      <div className="space-y-6">
        {getExamples()
          .filter((example) => example.language === selectedLanguage)
          .map((example, index) => (
            <div key={index} className="bg-white rounded-lg shadow border">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      {example.title}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {example.description}
                    </p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(example.code)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Copy Code
                  </button>
                </div>
              </div>
              <div className="px-6 py-4">
                <SyntaxHighlighter
                  language={example.language}
                  style={SyntaxHighlighter.styles.github}
                >
                  {example.code}
                </SyntaxHighlighter>
              </div>
            </div>
          ))}
      </div>

      {/* Additional Resources */}
      <div className="mt-12 bg-gray-50 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          📚 Additional Resources
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Documentation</h3>
            <ul className="space-y-1 text-sm text-gray-600">
              <li>
                •{" "}
                <a
                  href="https://docs.localstack.cloud/"
                  className="text-blue-600 hover:text-blue-800"
                >
                  LocalStack Documentation
                </a>
              </li>
              <li>
                •{" "}
                <a
                  href="https://aws.amazon.com/tools/"
                  className="text-blue-600 hover:text-blue-800"
                >
                  AWS SDK Documentation
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Troubleshooting</h3>
            <ul className="space-y-1 text-sm text-gray-600">
              <li>• Connection refused: Check if LocalStack is running</li>
              <li>
                • Invalid credentials: Use dummy credentials for LocalStack
              </li>
              <li>• S3 path style: Enable forcePathStyle for S3 operations</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
