#!/usr/bin/env python3
"""
LocalStack Resource Listing Script
Lists S3, DynamoDB, Lambda, and API Gateway resources using boto3
"""

import os
import boto3
import click
from datetime import datetime
from botocore.exceptions import ClientError
from colorama import init, Fore, Style

# Initialize colorama for colored output
init(autoreset=True)

class LocalStackResourceLister:
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
        
        # Store found resources
        self.found_resources = {}
    
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
    
    def list_s3_buckets(self):
        """List S3 buckets"""
        try:
            self.log("Listing S3 buckets...")
            response = self.s3_client.list_buckets()
            
            project_buckets = []
            for bucket in response['Buckets']:
                if bucket['Name'].startswith(self.name_prefix):
                    project_buckets.append({
                        'name': bucket['Name'],
                        'creation_date': bucket['CreationDate']
                    })
            
            self.found_resources['s3_buckets'] = project_buckets
            self.log(f"Found {len(project_buckets)} S3 bucket(s)", "SUCCESS")
            
        except ClientError as e:
            self.log(f"Error listing S3 buckets: {e}", "ERROR")
    
    def list_dynamodb_tables(self):
        """List DynamoDB tables"""
        try:
            self.log("Listing DynamoDB tables...")
            response = self.dynamodb_client.list_tables()
            
            project_tables = []
            for table_name in response['TableNames']:
                if table_name.startswith(self.name_prefix):
                    # Get table details
                    try:
                        table_info = self.dynamodb_client.describe_table(TableName=table_name)
                        project_tables.append({
                            'name': table_name,
                            'status': table_info['Table']['TableStatus'],
                            'item_count': table_info['Table'].get('ItemCount', 0)
                        })
                    except ClientError:
                        project_tables.append({
                            'name': table_name,
                            'status': 'Unknown',
                            'item_count': 0
                        })
            
            self.found_resources['dynamodb_tables'] = project_tables
            self.log(f"Found {len(project_tables)} DynamoDB table(s)", "SUCCESS")
            
        except ClientError as e:
            self.log(f"Error listing DynamoDB tables: {e}", "ERROR")
    
    def list_lambda_functions(self):
        """List Lambda functions"""
        try:
            self.log("Listing Lambda functions...")
            response = self.lambda_client.list_functions()
            
            project_functions = []
            for function in response['Functions']:
                if function['FunctionName'].startswith(self.name_prefix):
                    project_functions.append({
                        'name': function['FunctionName'],
                        'runtime': function['Runtime'],
                        'handler': function['Handler'],
                        'code_size': function['CodeSize'],
                        'description': function.get('Description', '')
                    })
            
            self.found_resources['lambda_functions'] = project_functions
            self.log(f"Found {len(project_functions)} Lambda function(s)", "SUCCESS")
            
        except ClientError as e:
            self.log(f"Error listing Lambda functions: {e}", "ERROR")
    
    def list_iam_roles(self):
        """List IAM roles"""
        try:
            self.log("Listing IAM roles...")
            response = self.iam_client.list_roles()
            
            project_roles = []
            for role in response['Roles']:
                if role['RoleName'].startswith(self.name_prefix):
                    project_roles.append({
                        'name': role['RoleName'],
                        'arn': role['Arn'],
                        'create_date': role['CreateDate']
                    })
            
            self.found_resources['iam_roles'] = project_roles
            self.log(f"Found {len(project_roles)} IAM role(s)", "SUCCESS")
            
        except ClientError as e:
            self.log(f"Error listing IAM roles: {e}", "ERROR")
    
    def list_api_gateways(self):
        """List API Gateways"""
        try:
            self.log("Listing API Gateways...")
            response = self.apigateway_client.get_rest_apis()
            
            project_apis = []
            for api in response['items']:
                if api['name'].startswith(self.name_prefix):
                    project_apis.append({
                        'name': api['name'],
                        'id': api['id'],
                        'description': api.get('description', ''),
                        'created_date': api['createdDate']
                    })
            
            self.found_resources['api_gateways'] = project_apis
            self.log(f"Found {len(project_apis)} API Gateway(s)", "SUCCESS")
            
        except ClientError as e:
            self.log(f"Error listing API Gateways: {e}", "ERROR")
    
    def list_all_resources(self):
        """List all resources"""
        self.log(f"Listing resources for {self.project_name} in {self.environment} environment")
        
        try:
            self.list_s3_buckets()
            self.list_dynamodb_tables()
            self.list_lambda_functions()
            self.list_iam_roles()
            self.list_api_gateways()
            
            self.print_summary()
            
        except Exception as e:
            self.log(f"Error listing resources: {e}", "ERROR")
            raise
    
    def print_summary(self):
        """Print summary of found resources"""
        print(f"\n{Fore.CYAN}{'='*60}")
        print(f"RESOURCE LISTING SUMMARY")
        print(f"{'='*60}{Style.RESET_ALL}")
        print(f"Project: {self.project_name}")
        print(f"Environment: {self.environment}")
        print(f"LocalStack Endpoint: {self.aws_endpoint}")
        print(f"Name Prefix: {self.name_prefix}")
        
        total_resources = 0
        
        # S3 Buckets
        if 's3_buckets' in self.found_resources and self.found_resources['s3_buckets']:
            print(f"\n{Fore.YELLOW}S3 Buckets:{Style.RESET_ALL}")
            for bucket in self.found_resources['s3_buckets']:
                print(f"  • {bucket['name']} (Created: {bucket['creation_date'].strftime('%Y-%m-%d %H:%M:%S')})")
                total_resources += 1
        
        # DynamoDB Tables
        if 'dynamodb_tables' in self.found_resources and self.found_resources['dynamodb_tables']:
            print(f"\n{Fore.YELLOW}DynamoDB Tables:{Style.RESET_ALL}")
            for table in self.found_resources['dynamodb_tables']:
                print(f"  • {table['name']} (Status: {table['status']}, Items: {table['item_count']})")
                total_resources += 1
        
        # Lambda Functions
        if 'lambda_functions' in self.found_resources and self.found_resources['lambda_functions']:
            print(f"\n{Fore.YELLOW}Lambda Functions:{Style.RESET_ALL}")
            for function in self.found_resources['lambda_functions']:
                print(f"  • {function['name']} ({function['runtime']}, Handler: {function['handler']})")
                total_resources += 1
        
        # IAM Roles
        if 'iam_roles' in self.found_resources and self.found_resources['iam_roles']:
            print(f"\n{Fore.YELLOW}IAM Roles:{Style.RESET_ALL}")
            for role in self.found_resources['iam_roles']:
                print(f"  • {role['name']} (Created: {role['create_date'].strftime('%Y-%m-%d %H:%M:%S')})")
                total_resources += 1
        
        # API Gateways
        if 'api_gateways' in self.found_resources and self.found_resources['api_gateways']:
            print(f"\n{Fore.YELLOW}API Gateways:{Style.RESET_ALL}")
            for api in self.found_resources['api_gateways']:
                print(f"  • {api['name']} (ID: {api['id']}, Created: {api['created_date'].strftime('%Y-%m-%d %H:%M:%S')})")
                total_resources += 1
        
        if total_resources == 0:
            print(f"\n{Fore.YELLOW}No resources found for this project and environment.{Style.RESET_ALL}")
        else:
            print(f"\n{Fore.GREEN}Total resources found: {total_resources}{Style.RESET_ALL}")
        
        print(f"\n{Fore.CYAN}{'='*60}{Style.RESET_ALL}")

@click.command()
@click.option('--project-name', envvar='PROJECT_NAME', default='localstack-template', help='Project name')
@click.option('--environment', envvar='ENVIRONMENT', default='dev', type=click.Choice(['dev', 'uat', 'prod']), help='Environment')
@click.option('--aws-endpoint', envvar='AWS_ENDPOINT_URL', default='http://localhost:4566', help='LocalStack endpoint')
@click.option('--aws-region', envvar='AWS_REGION', default='us-east-1', help='AWS region')
def main(project_name, environment, aws_endpoint, aws_region):
    """List AWS resources in LocalStack using Python"""
    
    # Set environment variables
    os.environ['PROJECT_NAME'] = project_name
    os.environ['ENVIRONMENT'] = environment
    os.environ['AWS_ENDPOINT_URL'] = aws_endpoint
    os.environ['AWS_REGION'] = aws_region
    
    try:
        lister = LocalStackResourceLister()
        lister.list_all_resources()
    except Exception as e:
        print(f"{Fore.RED}Failed to list resources: {e}{Style.RESET_ALL}")
        exit(1)

if __name__ == '__main__':
    main() 