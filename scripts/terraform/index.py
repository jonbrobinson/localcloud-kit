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