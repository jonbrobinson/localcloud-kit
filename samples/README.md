# Sample Files

This directory contains sample files for testing the LocalStack Manager file viewer functionality.

## Files

- **sample.py** - Python script example
- **sample.js** - JavaScript file example
- **sample.ts** - TypeScript file example
- **sample.json** - JSON data example
- **sample.csv** - CSV data example
- **Sample.java** - Java class example

## Usage

These files can be uploaded to S3 buckets to test the file viewer's syntax highlighting and content display capabilities. Each file demonstrates different file types and content formats that the viewer can handle.

### Upload to S3

You can upload these files to your S3 buckets using the AWS CLI or the LocalStack Manager GUI:

```bash
# Using AWS CLI
aws --endpoint-url=http://localhost:4566 s3 cp samples/sample.py s3://your-bucket-name/

# Using the GUI
# 1. Open the LocalStack Manager GUI
# 2. Navigate to S3 buckets
# 3. Upload files from this directory
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
- **Text files**: Plain text (.txt)
- **Markdown**: (.md)
- **Images**: PNG, JPG, GIF, SVG, etc.
- **PDFs**: (.pdf)
