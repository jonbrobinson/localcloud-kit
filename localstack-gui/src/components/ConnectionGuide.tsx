"use client";

import { useState } from "react";
import { CodeBracketIcon, CommandLineIcon } from "@heroicons/react/24/outline";
import { useEffect } from "react";
import hljs from "highlight.js";

// Import language support
import "highlight.js/lib/languages/javascript";
import "highlight.js/lib/languages/python";
import "highlight.js/lib/languages/go";
import "highlight.js/lib/languages/java";

interface CodeExample {
  language: string;
  title: string;
  code: string;
  description: string;
}

const themeMap: Record<string, string> = {
  hljs: "github.css",
  "hljs-tomorrow": "base16/tomorrow.css",
  "hljs-atom-dark": "atom-one-dark.css",
  "hljs-solarized": "base16/solarized-light.css",
  "hljs-dark": "dark.css",
};

const CodeBlock = ({
  code,
  language,
  theme = "hljs",
}: {
  code: string;
  language: string;
  theme?: string;
}) => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Don't render anything until client-side
  if (!isClient) {
    return (
      <pre
        className={`p-4 rounded-lg overflow-x-auto ${
          theme === "hljs" ? "" : theme
        }`}
      >
        <code>{code}</code>
      </pre>
    );
  }

  // Client-side only rendering with highlight.js
  const ClientCodeBlock = () => {
    const [highlightedCode, setHighlightedCode] = useState("");

    useEffect(() => {
      // Dynamically inject theme CSS from public/hljs-themes
      const themeFile = themeMap[theme] || themeMap.hljs;
      const id = "hljs-theme-style";
      let link = document.getElementById(id) as HTMLLinkElement | null;
      if (link) {
        link.href = `/hljs-themes/${themeFile}`;
      } else {
        link = document.createElement("link");
        link.id = id;
        link.rel = "stylesheet";
        link.href = `/hljs-themes/${themeFile}`;
        document.head.appendChild(link);
      }
      return () => {
        // Optionally remove the theme link on unmount
        // if (link) link.remove();
      };
    }, [theme]);

    useEffect(() => {
      // Use highlight.js to generate highlighted HTML safely
      const highlighted = hljs.highlight(code, {
        language:
          language.toLowerCase() === "javascript"
            ? "javascript"
            : language.toLowerCase() === "python"
            ? "python"
            : language.toLowerCase() === "go"
            ? "go"
            : language.toLowerCase() === "java"
            ? "java"
            : "text",
      }).value;

      setHighlightedCode(highlighted);
    }, [code, language]);

    return (
      <pre className="p-4 rounded-lg overflow-x-auto">
        <code
          className="hljs"
          dangerouslySetInnerHTML={{ __html: highlightedCode }}
        />
      </pre>
    );
  };

  return <ClientCodeBlock />;
};

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

const languageOptions = [
  { value: "JavaScript", label: "JavaScript" },
  { value: "Python", label: "Python" },
  { value: "Go", label: "Go" },
  { value: "Java", label: "Java" },
];

export default function ConnectionGuide() {
  const [activeTab, setActiveTab] = useState("setup");
  const [selectedLanguage, setSelectedLanguage] = useState("JavaScript");
  const [selectedTheme, setSelectedTheme] = useState("hljs");

  const tabs = [
    { id: "setup", name: "Basic Setup", icon: CodeBracketIcon },
    { id: "s3", name: "S3 Examples", icon: CommandLineIcon },
    { id: "dynamodb", name: "DynamoDB Examples", icon: CommandLineIcon },
  ];

  const getExamples = () => {
    switch (activeTab) {
      case "setup":
        return codeExamples;
      case "s3":
        return s3Examples;
      case "dynamodb":
        return dynamoExamples;
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
              AWS_ACCESS_KEY_ID=test
              <br />
              AWS_SECRET_ACCESS_KEY=test
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

      {/* Language and Theme Selectors */}
      <div className="mb-6 flex flex-wrap gap-4 items-center">
        <div>
          <label
            htmlFor="language-selector"
            className="text-sm font-medium text-gray-700 mr-4"
          >
            Select Language:
          </label>
          <select
            id="language-selector"
            name="language-selector"
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
        <div>
          <label
            htmlFor="theme-selector"
            className="text-sm font-medium text-gray-700 mr-4"
          >
            Select Theme:
          </label>
          <select
            id="theme-selector"
            name="theme-selector"
            value={selectedTheme}
            onChange={(e) => setSelectedTheme(e.target.value)}
            className="bg-white text-gray-900 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="hljs">GitHub</option>
            <option value="hljs-tomorrow">Tomorrow</option>
            <option value="hljs-atom-dark">Atom One Dark</option>
            <option value="hljs-solarized">Solarized Light</option>
            <option value="hljs-dark">Dark</option>
          </select>
        </div>
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
                <CodeBlock
                  code={example.code}
                  language={example.language}
                  theme={selectedTheme}
                />
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
                • Invalid credentials: Use test credentials for LocalStack
              </li>
              <li>• S3 path style: Enable forcePathStyle for S3 operations</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
