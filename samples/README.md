# Sample Files

This directory contains sample files for testing the LocalCloud Kit file viewer functionality.

## Files

- **sample.py** - Python script example
- **sample.js** - JavaScript file example
- **sample.ts** - TypeScript file example
- **sample.json** - JSON data example
- **sample.csv** - CSV data example
- **Sample.java** - Java class example
- **sample.docx** - Word document example
- **sample.txt** - Plain text file example

## Usage

These files can be uploaded to S3 buckets to test the file viewer's syntax highlighting and content display capabilities. Each file demonstrates different file types and content formats that the viewer can handle.

### Upload to S3

You can upload these files to your S3 buckets using the AWS CLI or the LocalCloud Kit GUI:

#### Option 1: Using AWS CLI directly

**Recommended Method A: Inline credentials (safest)**

```bash
# Upload with inline credentials
AWS_ACCESS_KEY_ID="test" AWS_SECRET_ACCESS_KEY="test" AWS_DEFAULT_REGION="us-east-1" aws --endpoint-url=http://localhost:4566 s3 cp samples/sample.txt s3://localstack-dev-bucket/

# List contents with inline credentials
AWS_ACCESS_KEY_ID="test" AWS_SECRET_ACCESS_KEY="test" AWS_DEFAULT_REGION="us-east-1" aws --endpoint-url=http://localhost:4566 s3 ls s3://localstack-dev-bucket/

# Download with inline credentials
AWS_ACCESS_KEY_ID="test" AWS_SECRET_ACCESS_KEY="test" AWS_DEFAULT_REGION="us-east-1" aws --endpoint-url=http://localhost:4566 s3 cp s3://localstack-dev-bucket/sample.txt downloaded_sample.txt
```

**Recommended Method B: Using AWS CLI profile (convenient)**

```bash
# Configure a LocalStack profile (run once)
aws configure set aws_access_key_id test --profile localstack
aws configure set aws_secret_access_key test --profile localstack
aws configure set region us-east-1 --profile localstack

# Use the profile for commands
aws --profile localstack --endpoint-url=http://localhost:4566 s3 cp samples/sample.txt s3://localstack-dev-bucket/
aws --profile localstack --endpoint-url=http://localhost:4566 s3 ls s3://localstack-dev-bucket/
aws --profile localstack --endpoint-url=http://localhost:4566 s3 cp s3://localstack-dev-bucket/sample.txt downloaded_sample.txt
```

**Method C: Environment variables (use with caution)**

```bash
# ⚠️  WARNING: This will overwrite your existing AWS credentials
# Set LocalStack credentials
export AWS_ACCESS_KEY_ID="test"
export AWS_SECRET_ACCESS_KEY="test"
export AWS_DEFAULT_REGION="us-east-1"

# Upload the sample.txt file to the bucket
aws --endpoint-url=http://localhost:4566 s3 cp samples/sample.txt s3://localstack-dev-bucket/

# List the contents to verify the upload
aws --endpoint-url=http://localhost:4566 s3 ls s3://localstack-dev-bucket/

# Download the file to test (optional)
aws --endpoint-url=http://localhost:4566 s3 cp s3://localstack-dev-bucket/sample.txt downloaded_sample.txt
```

#### Option 2: Using the LocalCloud Kit GUI

1. Open the LocalCloud Kit GUI in your browser
2. Navigate to the S3 section
3. Open the `localstack-dev-bucket`
4. Use the upload functionality to add the `samples/sample.txt` file

#### Option 3: Using Docker exec (if containers are running)

```bash
# Execute the upload command inside the API container
docker exec localcloud-api aws --endpoint-url=http://localstack:4566 s3 cp /app/samples/sample.txt s3://localstack-dev-bucket/

# List contents from inside the container
docker exec localcloud-api aws --endpoint-url=http://localstack:4566 s3 ls s3://localstack-dev-bucket/

# Note: The container already has LocalStack credentials configured
```

### Testing File Viewer

After uploading, you can test the file viewer by:

1. Opening the S3 bucket in the GUI
2. Clicking the "View" button on any file
3. Verifying that syntax highlighting works correctly for each file type

## File Types Supported

The file viewer supports syntax highlighting for:

- **Code files**: Python (.py), JavaScript (.js), TypeScript (.ts), Java (.java)
- **Data files**: JSON (.json), CSV (.csv)
- **Documents**: Word documents (.doc, .docx)
- **Text files**: Plain text (.txt)
- **Markdown**: (.md)
- **Images**: PNG, JPG, GIF, SVG, etc.
- **PDFs**: (.pdf)
