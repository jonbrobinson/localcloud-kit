# AWS Secrets Manager Integration

LocalCloud Kit includes comprehensive AWS Secrets Manager support for secure secret management in local development and testing.

## Features

- **Complete CRUD Operations**: Create, read, update, and delete secrets
- **Secure Value Handling**: Mask/reveal secret values with toggle functionality
- **Rich Metadata Support**: Descriptions, tags, and KMS key encryption
- **Dynamic Resource Display**: Shows secrets count in resources list
- **Conditional Visibility**: Secrets resource only appears when secrets exist
- **GUI Management**: Dedicated Secrets Manager interface with full-screen management
- **Shell Scripts**: Automation scripts for all secrets operations
- **API Endpoints**: RESTful endpoints for programmatic access
- **Error Handling**: Comprehensive error handling and user feedback

## Quick Start

1. Start all services: `docker compose up --build`
2. Open the GUI: http://localhost:3030
3. Click the "🔑 Secrets" button in the Resources section
4. Create and manage secrets through the full-screen interface

## Docker Setup

Secrets Manager runs as part of LocalStack services:

- Enabled in `docker-compose.yml` by default
- No additional configuration required
- Works out of the box with LocalStack

## API Endpoints

| Method   | Endpoint                    | Description                      |
| -------- | --------------------------- | -------------------------------- |
| `GET`    | `/api/secrets`              | List all secrets                 |
| `POST`   | `/api/secrets`              | Create a new secret              |
| `GET`    | `/api/secrets/[secretName]` | Get secret details and value     |
| `PUT`    | `/api/secrets/[secretName]` | Update secret value and metadata |
| `DELETE` | `/api/secrets/[secretName]` | Delete a secret                  |

### Example Requests

#### List all secrets

```bash
curl http://localhost:3030/api/secrets
```

#### Create a secret

```bash
curl -X POST http://localhost:3030/api/secrets \
  -H "Content-Type: application/json" \
  -d '{
    "name": "my-api-key",
    "value": "super-secret-value",
    "description": "API key for external service",
    "tags": [
      {"Key": "Environment", "Value": "dev"},
      {"Key": "Team", "Value": "backend"}
    ]
  }'
```

#### Get a secret

```bash
curl http://localhost:3030/api/secrets/my-api-key
```

#### Update a secret

```bash
curl -X PUT http://localhost:3030/api/secrets/my-api-key \
  -H "Content-Type: application/json" \
  -d '{
    "value": "new-secret-value",
    "description": "Updated API key"
  }'
```

#### Delete a secret

```bash
curl -X DELETE http://localhost:3030/api/secrets/my-api-key
```

## Shell Scripts

Located in `scripts/shell/`:

| Script             | Description                                |
| ------------------ | ------------------------------------------ |
| `create_secret.sh` | Create a new secret with optional metadata |
| `delete_secret.sh` | Delete a secret (with force delete option) |
| `list_secrets.sh`  | List all secrets with filtering            |
| `get_secret.sh`    | Retrieve secret details and value          |

### Example Usage

```bash
# Create a secret
./scripts/shell/create_secret.sh \
  "my-secret" \
  "secret-value" \
  "My secret description" \
  "Environment=dev,Team=backend" \
  ""

# List all secrets
./scripts/shell/list_secrets.sh

# Get a specific secret
./scripts/shell/get_secret.sh "my-secret"

# Delete a secret
./scripts/shell/delete_secret.sh "my-secret" false

# Force delete a secret (bypass recovery window)
./scripts/shell/delete_secret.sh "my-secret" true
```

## GUI Features

### Dashboard Integration

- Secrets Manager appears as a resource with dynamic count
- Shows number of secrets currently stored
- Quick access to full-screen management interface

### Full-Screen Management Interface

- **Create Secrets**: Rich form with validation for secret creation

  - Secret name (required)
  - Secret value (required, masked by default)
  - Description (optional)
  - Tags (optional, key-value pairs)
  - KMS encryption key (optional)

- **View Secrets**: Table view of all secrets

  - Secret name and ARN
  - Description
  - Creation and last modified dates
  - One-click ARN copy functionality

- **Mask/Reveal Toggle**:

  - Values are masked by default for security
  - Click eye icon to reveal/hide values
  - Individual control for each secret

- **Edit Secrets**:

  - Update secret values
  - Modify descriptions
  - Add/remove tags
  - Change KMS encryption settings

- **Delete Secrets**:
  - Individual secret deletion
  - Bulk deletion with checkboxes
  - Confirmation dialogs for safety

### Tag Management

- Add multiple tags to each secret
- Key-value pair format
- Useful for organization and filtering
- Edit tags without changing secret value

### ARN Display & Copy

- Full ARN displayed for each secret
- One-click copy to clipboard
- Easy integration with application code

## Using with AWS SDK

### Node.js Example

```javascript
const AWS = require("aws-sdk");

// Configure AWS SDK for LocalStack
const secretsManager = new AWS.SecretsManager({
  endpoint: "http://localhost:4566",
  region: "us-east-1",
  credentials: {
    accessKeyId: "test",
    secretAccessKey: "test",
  },
});

// Create a secret
async function createSecret() {
  const params = {
    Name: "my-app-secret",
    SecretString: JSON.stringify({
      username: "admin",
      password: "super-secret",
    }),
    Description: "Application credentials",
  };

  const result = await secretsManager.createSecret(params).promise();
  console.log("Created secret:", result.ARN);
}

// Get a secret
async function getSecret() {
  const params = {
    SecretId: "my-app-secret",
  };

  const result = await secretsManager.getSecretValue(params).promise();
  const secret = JSON.parse(result.SecretString);
  console.log("Secret value:", secret);
}

// Update a secret
async function updateSecret() {
  const params = {
    SecretId: "my-app-secret",
    SecretString: JSON.stringify({
      username: "admin",
      password: "new-password",
    }),
  };

  await secretsManager.updateSecret(params).promise();
  console.log("Secret updated");
}

// Delete a secret
async function deleteSecret() {
  const params = {
    SecretId: "my-app-secret",
    ForceDeleteWithoutRecovery: true,
  };

  await secretsManager.deleteSecret(params).promise();
  console.log("Secret deleted");
}
```

### Python Example (boto3)

```python
import boto3
import json

# Configure boto3 for LocalStack
client = boto3.client(
    'secretsmanager',
    endpoint_url='http://localhost:4566',
    region_name='us-east-1',
    aws_access_key_id='test',
    aws_secret_access_key='test'
)

# Create a secret
def create_secret():
    response = client.create_secret(
        Name='my-app-secret',
        SecretString=json.dumps({
            'username': 'admin',
            'password': 'super-secret'
        }),
        Description='Application credentials'
    )
    print(f"Created secret: {response['ARN']}")

# Get a secret
def get_secret():
    response = client.get_secret_value(SecretId='my-app-secret')
    secret = json.loads(response['SecretString'])
    print(f"Secret value: {secret}")

# Update a secret
def update_secret():
    client.update_secret(
        SecretId='my-app-secret',
        SecretString=json.dumps({
            'username': 'admin',
            'password': 'new-password'
        })
    )
    print("Secret updated")

# Delete a secret
def delete_secret():
    client.delete_secret(
        SecretId='my-app-secret',
        ForceDeleteWithoutRecovery=True
    )
    print("Secret deleted")
```

## Best Practices

1. **Use JSON for Complex Secrets**: Store structured data as JSON strings

   ```json
   {
     "api_key": "abc123",
     "api_secret": "xyz789",
     "endpoint": "https://api.example.com"
   }
   ```

2. **Add Descriptive Names**: Use clear, descriptive secret names

   - ✅ `prod/database/master-password`
   - ✅ `dev/api/stripe-key`
   - ❌ `secret1`, `temp`, `test`

3. **Use Tags for Organization**: Tag secrets by environment, team, or application

   ```
   Environment: dev
   Team: backend
   Application: payment-service
   ```

4. **Descriptions Are Your Friend**: Add clear descriptions explaining what each secret is for

5. **KMS Encryption**: Use KMS keys for additional security when needed

6. **Regular Rotation**: Practice rotating secrets regularly (simulate production)

7. **Clean Up**: Delete unused secrets to keep your environment tidy

## Common Use Cases

### Database Credentials

```javascript
{
  "host": "localhost",
  "port": 5432,
  "database": "myapp",
  "username": "dbuser",
  "password": "dbpass"
}
```

### API Keys

```javascript
{
  "api_key": "sk_test_abc123",
  "api_secret": "sk_secret_xyz789"
}
```

### OAuth Credentials

```javascript
{
  "client_id": "oauth_client_123",
  "client_secret": "oauth_secret_456",
  "redirect_uri": "http://localhost:3000/callback"
}
```

### Service Account Keys

```javascript
{
  "service_account": "app@project.iam.gserviceaccount.com",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...",
  "project_id": "my-project"
}
```

## Troubleshooting

### Secret not found

```bash
# List all secrets to verify name
./scripts/shell/list_secrets.sh

# Check if secret exists with AWS CLI
aws --endpoint-url=http://localhost:4566 secretsmanager list-secrets
```

### Permission denied

LocalStack doesn't enforce IAM by default, but if you've configured it:

```bash
# Check IAM permissions
aws --endpoint-url=http://localhost:4566 iam list-attached-user-policies --user-name test
```

### Secret value not updating

```bash
# Force update with version stages
aws --endpoint-url=http://localhost:4566 secretsmanager update-secret \
  --secret-id my-secret \
  --secret-string "new-value"
```

### GUI not showing secrets

```bash
# Verify secrets exist
curl http://localhost:3030/api/secrets

# Check API server logs
docker compose logs api
```

---

[← Back to Main Documentation](../README.md)
