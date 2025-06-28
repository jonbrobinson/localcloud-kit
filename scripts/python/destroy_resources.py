#!/usr/bin/env python3
"""
LocalStack Resource Destruction Script
Destroys S3, DynamoDB, Lambda, and API Gateway resources using boto3
"""

import os
import boto3
import click
from datetime import datetime
from botocore.exceptions import ClientError
from colorama import init, Fore, Style

# Initialize colorama for colored output
init(autoreset=True)

class LocalStackResourceDestroyer:
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
        
        # Resource names
        self.name_prefix = f"{self.project_name}-{self.environment}"
        
        # Store destroyed resources
        self.destroyed_resources = []
    
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
    
    def destroy_api_gateway(self):
        """Destroy API Gateway"""
        api_name = f"{self.name_prefix}-api"
        
        try:
            self.log(f"Destroying API Gateway: {api_name}")
            
            # List APIs and find the one to destroy
            apis = self.apigateway_client.get_rest_apis()
            api_id = None
            
            for api in apis['items']:
                if api['name'] == api_name:
                    api_id = api['id']
                    break
            
            if api_id:
                # Delete the API
                self.apigateway_client.delete_rest_api(restApiId=api_id)
                self.destroyed_resources.append(f"API Gateway: {api_name}")
                self.log(f"API Gateway destroyed successfully: {api_name}", "SUCCESS")
            else:
                self.log(f"API Gateway not found: {api_name}", "WARNING")
                
        except ClientError as e:
            self.log(f"Error destroying API Gateway: {e}", "ERROR")
    
    def destroy_lambda_function(self):
        """Destroy Lambda function"""
        function_name = f"{self.name_prefix}-lambda-function"
        
        try:
            self.log(f"Destroying Lambda function: {function_name}")
            
            # Delete function
            self.lambda_client.delete_function(FunctionName=function_name)
            self.destroyed_resources.append(f"Lambda Function: {function_name}")
            self.log(f"Lambda function destroyed successfully: {function_name}", "SUCCESS")
            
        except ClientError as e:
            if e.response['Error']['Code'] == 'ResourceNotFoundException':
                self.log(f"Lambda function not found: {function_name}", "WARNING")
            else:
                self.log(f"Error destroying Lambda function: {e}", "ERROR")
    
    def destroy_iam_role(self):
        """Destroy IAM role"""
        role_name = f"{self.name_prefix}-lambda-role"
        
        try:
            self.log(f"Destroying IAM role: {role_name}")
            
            # Delete inline policies
            try:
                policies = self.iam_client.list_role_policies(RoleName=role_name)
                for policy_name in policies['PolicyNames']:
                    self.iam_client.delete_role_policy(RoleName=role_name, PolicyName=policy_name)
            except ClientError:
                pass  # Role might not exist
            
            # Delete the role
            self.iam_client.delete_role(RoleName=role_name)
            self.destroyed_resources.append(f"IAM Role: {role_name}")
            self.log(f"IAM role destroyed successfully: {role_name}", "SUCCESS")
            
        except ClientError as e:
            if e.response['Error']['Code'] == 'NoSuchEntity':
                self.log(f"IAM role not found: {role_name}", "WARNING")
            else:
                self.log(f"Error destroying IAM role: {e}", "ERROR")
    
    def destroy_dynamodb_table(self):
        """Destroy DynamoDB table"""
        table_name = f"{self.name_prefix}-dynamodb-table"
        
        try:
            self.log(f"Destroying DynamoDB table: {table_name}")
            
            # Delete table
            self.dynamodb_client.delete_table(TableName=table_name)
            
            # Wait for table to be deleted
            waiter = self.dynamodb_client.get_waiter('table_not_exists')
            waiter.wait(TableName=table_name)
            
            self.destroyed_resources.append(f"DynamoDB Table: {table_name}")
            self.log(f"DynamoDB table destroyed successfully: {table_name}", "SUCCESS")
            
        except ClientError as e:
            if e.response['Error']['Code'] == 'ResourceNotFoundException':
                self.log(f"DynamoDB table not found: {table_name}", "WARNING")
            else:
                self.log(f"Error destroying DynamoDB table: {e}", "ERROR")
    
    def destroy_s3_bucket(self):
        """Destroy S3 bucket"""
        bucket_name = f"{self.name_prefix}-s3-bucket"
        
        try:
            self.log(f"Destroying S3 bucket: {bucket_name}")
            
            # List and delete all objects
            try:
                objects = self.s3_client.list_objects_v2(Bucket=bucket_name)
                if 'Contents' in objects:
                    for obj in objects['Contents']:
                        self.s3_client.delete_object(Bucket=bucket_name, Key=obj['Key'])
            except ClientError:
                pass  # Bucket might not exist
            
            # Delete bucket
            self.s3_client.delete_bucket(Bucket=bucket_name)
            self.destroyed_resources.append(f"S3 Bucket: {bucket_name}")
            self.log(f"S3 bucket destroyed successfully: {bucket_name}", "SUCCESS")
            
        except ClientError as e:
            if e.response['Error']['Code'] == 'NoSuchBucket':
                self.log(f"S3 bucket not found: {bucket_name}", "WARNING")
            else:
                self.log(f"Error destroying S3 bucket: {e}", "ERROR")
    
    def destroy_all_resources(self):
        """Destroy all resources in the correct order"""
        self.log(f"Starting resource destruction for {self.project_name} in {self.environment} environment")
        
        try:
            # Destroy resources in reverse dependency order
            self.destroy_api_gateway()
            self.destroy_lambda_function()
            self.destroy_iam_role()
            self.destroy_dynamodb_table()
            self.destroy_s3_bucket()
            
            self.log("All resources destroyed successfully!", "SUCCESS")
            self.print_summary()
            
        except Exception as e:
            self.log(f"Error destroying resources: {e}", "ERROR")
            raise
    
    def print_summary(self):
        """Print summary of destroyed resources"""
        print(f"\n{Fore.CYAN}{'='*60}")
        print(f"RESOURCE DESTRUCTION SUMMARY")
        print(f"{'='*60}{Style.RESET_ALL}")
        print(f"Project: {self.project_name}")
        print(f"Environment: {self.environment}")
        print(f"LocalStack Endpoint: {self.aws_endpoint}")
        print(f"\n{Fore.YELLOW}Destroyed Resources:{Style.RESET_ALL}")
        
        if self.destroyed_resources:
            for resource in self.destroyed_resources:
                print(f"  • {resource}")
        else:
            print(f"  {Fore.YELLOW}No resources were destroyed{Style.RESET_ALL}")
        
        print(f"\n{Fore.CYAN}{'='*60}{Style.RESET_ALL}")

@click.command()
@click.option('--project-name', envvar='PROJECT_NAME', default='localstack-template', help='Project name')
@click.option('--environment', envvar='ENVIRONMENT', default='dev', type=click.Choice(['dev', 'uat', 'prod']), help='Environment')
@click.option('--aws-endpoint', envvar='AWS_ENDPOINT_URL', default='http://localhost:4566', help='LocalStack endpoint')
@click.option('--aws-region', envvar='AWS_REGION', default='us-east-1', help='AWS region')
def main(project_name, environment, aws_endpoint, aws_region):
    """Destroy AWS resources in LocalStack using Python"""
    
    # Set environment variables
    os.environ['PROJECT_NAME'] = project_name
    os.environ['ENVIRONMENT'] = environment
    os.environ['AWS_ENDPOINT_URL'] = aws_endpoint
    os.environ['AWS_REGION'] = aws_region
    
    try:
        destroyer = LocalStackResourceDestroyer()
        destroyer.destroy_all_resources()
    except Exception as e:
        print(f"{Fore.RED}Failed to destroy resources: {e}{Style.RESET_ALL}")
        exit(1)

if __name__ == '__main__':
    main() 