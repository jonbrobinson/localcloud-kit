#!/usr/bin/env python3
"""
LocalStack Resource Creation Script
Creates S3, DynamoDB, Lambda, and API Gateway resources using boto3
"""

import os
import json
import zipfile
import boto3
import click
from datetime import datetime
from botocore.exceptions import ClientError, NoCredentialsError
from colorama import init, Fore, Style

# Initialize colorama for colored output
init(autoreset=True)

class LocalStackResourceManager:
    def __init__(self):
        self.project_name = os.environ.get('PROJECT_NAME', 'localstack-template')
        self.environment = os.environ.get('ENVIRONMENT', 'dev')
        self.aws_endpoint = os.environ.get('AWS_ENDPOINT_URL', 'http://localhost:4566')
        self.aws_region = os.environ.get('AWS_REGION', 'us-east-1')
        
        # Validate environment
        if self.environment not in ['dev', 'uat', 'prod']:
            raise ValueError("Environment must be one of: dev, uat, prod")
        
        # Initialize AWS clients
        self.session = boto3.Session(
            aws_access_key_id='test',
            aws_secret_access_key='test',
            region_name=self.aws_region
        )
        
        # Configure clients for LocalStack
        self.s3_client = self.session.client('s3', endpoint_url=self.aws_endpoint)
        self.dynamodb_client = self.session.client('dynamodb', endpoint_url=self.aws_endpoint)
        self.lambda_client = self.session.client('lambda', endpoint_url=self.aws_endpoint)
        self.iam_client = self.session.client('iam', endpoint_url=self.aws_endpoint)
        self.apigateway_client = self.session.client('apigateway', endpoint_url=self.aws_endpoint)
        self.logs_client = self.session.client('logs', endpoint_url=self.aws_endpoint)
        
        # Resource names
        self.name_prefix = f"{self.project_name}-{self.environment}"
        self.tags = [
            {'Key': 'Project', 'Value': self.project_name},
            {'Key': 'Environment', 'Value': self.environment},
            {'Key': 'ManagedBy', 'Value': 'python-script'}
        ]
        
        # Store created resources
        self.created_resources = {}
    
    def log(self, message, level="INFO"):
        """Print colored log messages"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        if level == "SUCCESS":
            print(f"{Fore.GREEN}[{timestamp}] ✓ {message}{Style.RESET_ALL}")
        elif level == "ERROR":
            print(f"{Fore.RED}[{timestamp}] ✗ {message}{Style.RESET_ALL}")
        elif level == "WARNING":
            print(f"{Fore.YELLOW}[{timestamp}] ⚠ {message}{Style.RESET_ALL}")
        else:
            print(f"{Fore.BLUE}[{timestamp}] ℹ {message}{Style.RESET_ALL}")
    
    def create_lambda_function_code(self):
        """Create the Lambda function code"""
        lambda_code = '''
import json
import os
import boto3
from datetime import datetime

def handler(event, context):
    """
    Lambda function handler that responds to API Gateway requests
    and demonstrates interaction with S3 and DynamoDB
    """
    
    # Get environment variables
    s3_bucket_name = os.environ.get('S3_BUCKET_NAME')
    dynamodb_table = os.environ.get('DYNAMODB_TABLE')
    environment = os.environ.get('ENVIRONMENT')
    
    # Initialize AWS clients
    s3_client = boto3.client('s3')
    dynamodb_client = boto3.client('dynamodb')
    
    try:
        # Create a simple response
        response_data = {
            'message': f'Hello from {environment} environment!',
            'timestamp': datetime.now().isoformat(),
            'resources': {
                's3_bucket': s3_bucket_name,
                'dynamodb_table': dynamodb_table
            },
            'event': event
        }
        
        # Store some data in DynamoDB
        item = {
            'id': {'S': f"request-{datetime.now().isoformat()}"},
            'message': {'S': response_data['message']},
            'timestamp': {'S': response_data['timestamp']},
            'environment': {'S': environment}
        }
        
        dynamodb_client.put_item(
            TableName=dynamodb_table,
            Item=item
        )
        
        # Store response in S3
        s3_client.put_object(
            Bucket=s3_bucket_name,
            Key=f"responses/{datetime.now().isoformat()}.json",
            Body=json.dumps(response_data, indent=2),
            ContentType='application/json'
        )
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps(response_data, indent=2)
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'error': str(e),
                'message': 'Internal server error'
            }, indent=2)
        }
'''
        
        # Create zip file
        zip_filename = f"{self.name_prefix}-lambda-function.zip"
        with zipfile.ZipFile(zip_filename, 'w', zipfile.ZIP_DEFLATED) as zipf:
            zipf.writestr('index.py', lambda_code)
        
        return zip_filename
    
    def create_s3_bucket(self):
        """Create S3 bucket"""
        bucket_name = f"{self.name_prefix}-s3-bucket"
        
        try:
            self.log(f"Creating S3 bucket: {bucket_name}")
            
            # Create bucket
            self.s3_client.create_bucket(
                Bucket=bucket_name,
                CreateBucketConfiguration={'LocationConstraint': self.aws_region}
            )
            
            # Enable versioning
            self.s3_client.put_bucket_versioning(
                Bucket=bucket_name,
                VersioningConfiguration={'Status': 'Enabled'}
            )
            
            # Block public access
            self.s3_client.put_public_access_block(
                Bucket=bucket_name,
                PublicAccessBlockConfiguration={
                    'BlockPublicAcls': True,
                    'IgnorePublicAcls': True,
                    'BlockPublicPolicy': True,
                    'RestrictPublicBuckets': True
                }
            )
            
            self.created_resources['s3_bucket'] = bucket_name
            self.log(f"S3 bucket created successfully: {bucket_name}", "SUCCESS")
            
        except ClientError as e:
            if e.response['Error']['Code'] == 'BucketAlreadyExists':
                self.log(f"S3 bucket already exists: {bucket_name}", "WARNING")
                self.created_resources['s3_bucket'] = bucket_name
            else:
                self.log(f"Error creating S3 bucket: {e}", "ERROR")
                raise
    
    def create_dynamodb_table(self):
        """Create DynamoDB table"""
        table_name = f"{self.name_prefix}-dynamodb-table"
        
        try:
            self.log(f"Creating DynamoDB table: {table_name}")
            
            self.dynamodb_client.create_table(
                TableName=table_name,
                KeySchema=[
                    {'AttributeName': 'id', 'KeyType': 'HASH'}
                ],
                AttributeDefinitions=[
                    {'AttributeName': 'id', 'AttributeType': 'S'}
                ],
                BillingMode='PAY_PER_REQUEST',
                Tags=self.tags
            )
            
            # Wait for table to be active
            waiter = self.dynamodb_client.get_waiter('table_exists')
            waiter.wait(TableName=table_name)
            
            self.created_resources['dynamodb_table'] = table_name
            self.log(f"DynamoDB table created successfully: {table_name}", "SUCCESS")
            
        except ClientError as e:
            if e.response['Error']['Code'] == 'ResourceInUseException':
                self.log(f"DynamoDB table already exists: {table_name}", "WARNING")
                self.created_resources['dynamodb_table'] = table_name
            else:
                self.log(f"Error creating DynamoDB table: {e}", "ERROR")
                raise
    
    def create_iam_role(self):
        """Create IAM role for Lambda"""
        role_name = f"{self.name_prefix}-lambda-role"
        
        try:
            self.log(f"Creating IAM role: {role_name}")
            
            # Create role
            assume_role_policy = {
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Principal": {"Service": "lambda.amazonaws.com"},
                        "Action": "sts:AssumeRole"
                    }
                ]
            }
            
            self.iam_client.create_role(
                RoleName=role_name,
                AssumeRolePolicyDocument=json.dumps(assume_role_policy),
                Tags=self.tags
            )
            
            # Create policy
            policy_name = f"{self.name_prefix}-lambda-policy"
            policy_document = {
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "logs:CreateLogGroup",
                            "logs:CreateLogStream",
                            "logs:PutLogEvents"
                        ],
                        "Resource": "arn:aws:logs:*:*:*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "s3:GetObject",
                            "s3:PutObject",
                            "s3:DeleteObject"
                        ],
                        "Resource": f"arn:aws:s3:::{self.created_resources['s3_bucket']}/*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "dynamodb:GetItem",
                            "dynamodb:PutItem",
                            "dynamodb:UpdateItem",
                            "dynamodb:DeleteItem",
                            "dynamodb:Query",
                            "dynamodb:Scan"
                        ],
                        "Resource": f"arn:aws:dynamodb:{self.aws_region}:*:table/{self.created_resources['dynamodb_table']}"
                    }
                ]
            }
            
            self.iam_client.put_role_policy(
                RoleName=role_name,
                PolicyName=policy_name,
                PolicyDocument=json.dumps(policy_document)
            )
            
            self.created_resources['iam_role'] = role_name
            self.log(f"IAM role created successfully: {role_name}", "SUCCESS")
            
        except ClientError as e:
            if e.response['Error']['Code'] == 'EntityAlreadyExists':
                self.log(f"IAM role already exists: {role_name}", "WARNING")
                self.created_resources['iam_role'] = role_name
            else:
                self.log(f"Error creating IAM role: {e}", "ERROR")
                raise
    
    def create_lambda_function(self):
        """Create Lambda function"""
        function_name = f"{self.name_prefix}-lambda-function"
        
        try:
            self.log(f"Creating Lambda function: {function_name}")
            
            # Create function code
            zip_filename = self.create_lambda_function_code()
            
            with open(zip_filename, 'rb') as zip_file:
                zip_content = zip_file.read()
            
            # Create function
            self.lambda_client.create_function(
                FunctionName=function_name,
                Runtime='python3.9',
                Role=f"arn:aws:iam::000000000000:role/{self.created_resources['iam_role']}",
                Handler='index.handler',
                Code={'ZipFile': zip_content},
                Timeout=30,
                Environment={
                    'Variables': {
                        'S3_BUCKET_NAME': self.created_resources['s3_bucket'],
                        'DYNAMODB_TABLE': self.created_resources['dynamodb_table'],
                        'ENVIRONMENT': self.environment
                    }
                },
                Tags=dict(self.tags)
            )
            
            # Clean up zip file
            os.remove(zip_filename)
            
            self.created_resources['lambda_function'] = function_name
            self.log(f"Lambda function created successfully: {function_name}", "SUCCESS")
            
        except ClientError as e:
            if e.response['Error']['Code'] == 'ResourceConflictException':
                self.log(f"Lambda function already exists: {function_name}", "WARNING")
                self.created_resources['lambda_function'] = function_name
            else:
                self.log(f"Error creating Lambda function: {e}", "ERROR")
                raise
    
    def create_api_gateway(self):
        """Create API Gateway"""
        api_name = f"{self.name_prefix}-api"
        
        try:
            self.log(f"Creating API Gateway: {api_name}")
            
            # Create REST API
            api_response = self.apigateway_client.create_rest_api(
                name=api_name,
                description=f"API Gateway for {self.name_prefix}",
                tags=dict(self.tags)
            )
            
            api_id = api_response['id']
            self.created_resources['api_gateway_id'] = api_id
            
            # Get root resource
            resources = self.apigateway_client.get_resources(restApiId=api_id)
            root_resource_id = resources['items'][0]['id']
            
            # Create resource
            resource_response = self.apigateway_client.create_resource(
                restApiId=api_id,
                parentId=root_resource_id,
                pathPart='hello'
            )
            
            resource_id = resource_response['id']
            
            # Create method
            self.apigateway_client.put_method(
                restApiId=api_id,
                resourceId=resource_id,
                httpMethod='GET',
                authorizationType='NONE'
            )
            
            # Create integration
            self.apigateway_client.put_integration(
                restApiId=api_id,
                resourceId=resource_id,
                httpMethod='GET',
                type='AWS_PROXY',
                integrationHttpMethod='POST',
                uri=f"arn:aws:apigateway:{self.aws_region}:lambda:path/2015-03-31/functions/arn:aws:lambda:{self.aws_region}:000000000000:function:{self.created_resources['lambda_function']}/invocations"
            )
            
            # Add Lambda permission
            try:
                self.lambda_client.add_permission(
                    FunctionName=self.created_resources['lambda_function'],
                    StatementId='AllowExecutionFromAPIGateway',
                    Action='lambda:InvokeFunction',
                    Principal='apigateway.amazonaws.com',
                    SourceArn=f"arn:aws:execute-api:{self.aws_region}:000000000000:{api_id}/*/*"
                )
            except ClientError as e:
                if e.response['Error']['Code'] != 'ResourceConflictException':
                    raise
            
            # Deploy API
            self.apigateway_client.create_deployment(
                restApiId=api_id,
                stageName=self.environment
            )
            
            api_url = f"http://localhost:4566/restapis/{api_id}/{self.environment}/_user_request_/hello"
            self.created_resources['api_gateway_url'] = api_url
            
            self.log(f"API Gateway created successfully: {api_name}", "SUCCESS")
            self.log(f"API URL: {api_url}", "SUCCESS")
            
        except ClientError as e:
            self.log(f"Error creating API Gateway: {e}", "ERROR")
            raise
    
    def create_all_resources(self):
        """Create all resources in the correct order"""
        self.log(f"Starting resource creation for {self.project_name} in {self.environment} environment")
        
        try:
            # Create resources in dependency order
            self.create_s3_bucket()
            self.create_dynamodb_table()
            self.create_iam_role()
            self.create_lambda_function()
            self.create_api_gateway()
            
            self.log("All resources created successfully!", "SUCCESS")
            self.print_summary()
            
        except Exception as e:
            self.log(f"Error creating resources: {e}", "ERROR")
            raise
    
    def print_summary(self):
        """Print summary of created resources"""
        print(f"\n{Fore.CYAN}{'='*60}")
        print(f"RESOURCE CREATION SUMMARY")
        print(f"{'='*60}{Style.RESET_ALL}")
        print(f"Project: {self.project_name}")
        print(f"Environment: {self.environment}")
        print(f"LocalStack Endpoint: {self.aws_endpoint}")
        print(f"\n{Fore.YELLOW}Created Resources:{Style.RESET_ALL}")
        
        for resource_type, resource_name in self.created_resources.items():
            print(f"  • {resource_type}: {resource_name}")
        
        if 'api_gateway_url' in self.created_resources:
            print(f"\n{Fore.GREEN}Test your API:{Style.RESET_ALL}")
            print(f"  curl {self.created_resources['api_gateway_url']}")
        
        print(f"\n{Fore.CYAN}{'='*60}{Style.RESET_ALL}")

@click.command()
@click.option('--project-name', envvar='PROJECT_NAME', default='localstack-template', help='Project name')
@click.option('--environment', envvar='ENVIRONMENT', default='dev', type=click.Choice(['dev', 'uat', 'prod']), help='Environment')
@click.option('--aws-endpoint', envvar='AWS_ENDPOINT_URL', default='http://localhost:4566', help='LocalStack endpoint')
@click.option('--aws-region', envvar='AWS_REGION', default='us-east-1', help='AWS region')
def main(project_name, environment, aws_endpoint, aws_region):
    """Create AWS resources in LocalStack using Python"""
    
    # Set environment variables
    os.environ['PROJECT_NAME'] = project_name
    os.environ['ENVIRONMENT'] = environment
    os.environ['AWS_ENDPOINT_URL'] = aws_endpoint
    os.environ['AWS_REGION'] = aws_region
    
    try:
        manager = LocalStackResourceManager()
        manager.create_all_resources()
    except Exception as e:
        print(f"{Fore.RED}Failed to create resources: {e}{Style.RESET_ALL}")
        exit(1)

if __name__ == '__main__':
    main() 