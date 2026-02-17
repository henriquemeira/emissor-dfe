# API Testing Guide

This guide provides quick reference for testing the Emissor DFe API.

## Prerequisites

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env` and configure `ENCRYPTION_KEY`
3. Start server: `npm start` or `npm run dev`

## Test Certificate

For testing purposes, you can generate a self-signed certificate:

```bash
# Generate test certificate
cd /tmp
mkdir test-cert && cd test-cert

# Create private key
openssl genrsa -out key.pem 2048

# Create certificate with CNPJ
openssl req -new -key key.pem -out csr.pem \
  -subj "/C=BR/ST=SP/L=São Paulo/O=Empresa Teste LTDA/CN=Empresa Teste LTDA:12345678000195/serialNumber=12345678000195"

# Generate self-signed certificate
openssl x509 -req -in csr.pem -signkey key.pem -out cert.pem -days 365

# Create PKCS#12 (.pfx) file
openssl pkcs12 -export -out test-certificate.pfx -inkey key.pem -in cert.pem -passout pass:senha123
```

## API Endpoints

### 1. Health Check

```bash
curl http://localhost:3000/health | jq .
```

Expected response:
```json
{
  "success": true,
  "status": "healthy",
  "timestamp": "2026-02-17T10:00:00.000Z",
  "environment": "development",
  "storage": {
    "writable": true
  }
}
```

### 2. Create Account

```bash
curl -X POST http://localhost:3000/api/v1/account/setup \
  -F "certificado=@/tmp/test-cert/test-certificate.pfx" \
  -F "senha=senha123" | jq .
```

Save the `apiKey` from the response for subsequent requests.

### 3. Get Account Status

```bash
# Replace with your actual API Key
API_KEY="your-api-key-here"

curl http://localhost:3000/api/v1/account/status \
  -H "X-API-Key: $API_KEY" | jq .
```

### 4. Update Certificate

```bash
curl -X PUT http://localhost:3000/api/v1/account/certificate \
  -H "X-API-Key: $API_KEY" \
  -F "certificado=@/tmp/test-cert/test-certificate.pfx" \
  -F "senha=senha123" | jq .
```

### 5. Delete Account

```bash
curl -X DELETE http://localhost:3000/api/v1/account \
  -H "X-API-Key: $API_KEY" | jq .
```

## Error Testing

### Invalid API Key
```bash
curl http://localhost:3000/api/v1/account/status \
  -H "X-API-Key: invalid-key" | jq .
```

### Wrong Certificate Password
```bash
curl -X POST http://localhost:3000/api/v1/account/setup \
  -F "certificado=@/tmp/test-cert/test-certificate.pfx" \
  -F "senha=wrongpassword" | jq .
```

### Missing Certificate
```bash
curl -X POST http://localhost:3000/api/v1/account/setup \
  -F "senha=senha123" | jq .
```

### Unknown Route
```bash
curl http://localhost:3000/api/v1/unknown | jq .
```

### Duplicate CNPJ
```bash
# Create first account
curl -X POST http://localhost:3000/api/v1/account/setup \
  -F "certificado=@/tmp/test-cert/test-certificate.pfx" \
  -F "senha=senha123" | jq .

# Try to create second account with same certificate
curl -X POST http://localhost:3000/api/v1/account/setup \
  -F "certificado=@/tmp/test-cert/test-certificate.pfx" \
  -F "senha=senha123" | jq .
```

## Comprehensive Test Script

```bash
#!/bin/bash

echo "Running comprehensive API tests..."

# Health check
echo "1. Testing health check..."
curl -s http://localhost:3000/health | jq '.status'

# Create account
echo "2. Creating account..."
RESPONSE=$(curl -s -X POST http://localhost:3000/api/v1/account/setup \
  -F "certificado=@/tmp/test-cert/test-certificate.pfx" \
  -F "senha=senha123")
API_KEY=$(echo "$RESPONSE" | jq -r '.data.apiKey')
echo "API Key: $API_KEY"

# Get status
echo "3. Getting account status..."
curl -s http://localhost:3000/api/v1/account/status \
  -H "X-API-Key: $API_KEY" | jq '.data.certificado'

# Update certificate
echo "4. Updating certificate..."
curl -s -X PUT http://localhost:3000/api/v1/account/certificate \
  -H "X-API-Key: $API_KEY" \
  -F "certificado=@/tmp/test-cert/test-certificate.pfx" \
  -F "senha=senha123" | jq '.success'

# Delete account
echo "5. Deleting account..."
curl -s -X DELETE http://localhost:3000/api/v1/account \
  -H "X-API-Key: $API_KEY" | jq '.success'

echo "Tests completed!"
```

## Rate Limiting

By default, the API is limited to 100 requests per 15 minutes. You can test this with:

```bash
# Make multiple rapid requests
for i in {1..101}; do
  curl -s http://localhost:3000/health | jq '.status' &
done
wait
```

The 101st request should return a rate limit error.

## Production Testing

When deployed to production:

1. Ensure HTTPS is enabled
2. Set `NODE_ENV=production` in environment variables
3. Use a strong random `ENCRYPTION_KEY` (32+ characters)
4. Configure `ALLOWED_ORIGINS` for your frontend URLs
5. Monitor the `/health` endpoint for uptime

## Troubleshooting

### Server won't start
- Check if port 3000 is available: `lsof -i :3000`
- Verify `.env` file exists and has valid `ENCRYPTION_KEY`
- Check logs for error messages

### Certificate validation fails
- Ensure certificate is in .pfx or .p12 format
- Verify password is correct
- Check that certificate is not expired
- Confirm certificate contains CNPJ in subject or serialNumber field

### API Key not working
- Verify API Key format (must be valid UUID v4)
- Check that account file exists in `data/` directory
- Ensure `X-API-Key` header is properly set

### Data not persisting
- Check file permissions on `data/` directory
- Verify `DATA_DIR` in `.env` points to correct location
- Look for write errors in server logs
