# Google Cloud Storage Credentials Setup for Railway

## 🔒 Security Best Practice
**NEVER** commit your `banana-shop-470810-a4d04f8e0b63.json` credentials file to GitHub. It's already in `.gitignore` - keep it that way!

## 🌐 Step 0: Configure CORS for Your GCS Bucket

Before using GCS in production, you need to enable CORS to allow your frontend to upload/download files:

### Quick Setup (Recommended)
```bash
# Run the automated script
./bash/setup-gcs-cors.sh
```

### Manual Setup
If you prefer to do it manually:

```bash
# For development bucket
gcloud storage buckets update gs://banana-shop-bucket-dev --cors-file=cors-config.json

# For production bucket
gcloud storage buckets update gs://banana-shop-bucket-prod --cors-file=cors-config.json
```

### Verify CORS Configuration
```bash
gcloud storage buckets describe gs://banana-shop-bucket-dev --format='default(cors_config)'
```

You should see output showing your CORS configuration with allowed origins including your domain.

## 📝 How to Set Up GCS Credentials in Railway

### Step 1: Get Your Credentials JSON Content

1. Open your credentials file:
   ```bash
   cat banana-shop-470810-a4d04f8e0b63.json
   ```

2. Copy the **entire JSON content** (including the outer `{}` braces)

### Step 2: Add Environment Variable in Railway

1. Go to your Railway project dashboard
2. Navigate to your service
3. Click on **Variables** tab
4. Add a new variable:
   - **Name**: `GOOGLE_CREDENTIALS_JSON`
   - **Value**: Paste the entire JSON content from your credentials file

### Step 3: Ensure Other Required Variables Are Set

Make sure these environment variables are also set in Railway:

```env
# Required for GCS
GCP_PROJECT_ID=banana-shop-470810
GCP_BUCKET_NAME=banana-shop-bucket-prod  # Use your production bucket name
GOOGLE_CREDENTIALS_BASE64=<paste-base64-encoded-credentials-here>

# Other required variables
NODE_ENV=production
FAL_KEY=<your-fal-key>
GOOGLE_CLIENT_ID=<your-google-client-id>
GOOGLE_CLIENT_SECRET=<your-google-client-secret>
STRIPE_SECRET_KEY_TEST=<your-stripe-key>
# ... other environment variables
```

## 🚨 Common Issues

### CORS Errors
If you see errors like:
```
Access to fetch at 'https://storage.googleapis.com/...' has been blocked by CORS policy
```

**Solution**: Run the CORS setup script:
```bash
./bash/setup-gcs-cors.sh
```

Or manually configure CORS (see Step 0 above).

### Production Domain Not Working
Make sure to add your production domain to `cors-config.json`:
```json
{
  "origin": ["http://localhost:3000", "https://nanostudioai.com", "https://your-production-domain.com"],
  ...
}
```

Then re-run the CORS setup script.

## 🏠 Local Development

For local development, keep using the file-based approach:

```env
# .env.server (local only)
GOOGLE_APPLICATION_CREDENTIALS="../../../banana-shop-470810-a4d04f8e0b63.json"
GCP_PROJECT_ID=banana-shop-470810
GCP_BUCKET_NAME=banana-shop-bucket-dev
```

## 🔧 How It Works

The code automatically detects the environment:

- **Production (Railway)**: Uses `GOOGLE_CREDENTIALS_JSON` environment variable
- **Development (Local)**: Uses `GOOGLE_APPLICATION_CREDENTIALS` file path

The logic is in `src/server/lib/gcs-config.ts`:

```typescript
// Production: Uses JSON from environment variable
if (process.env.GOOGLE_CREDENTIALS_JSON) {
  const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON);
  return { projectId, credentials };
}

// Development: Uses credentials file path
if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  return { projectId, keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS };
}
```

## ✅ Verification

After deploying to Railway:

1. Check your Railway deployment logs
2. Look for any GCS-related errors
3. Test image upload/generation functionality
4. Verify images are being stored in your GCS bucket

## 🚨 Important Notes

1. **Never commit** the credentials JSON file to version control
2. Use **different buckets** for development and production:
   - Dev: `banana-shop-bucket-dev`
   - Prod: `banana-shop-bucket-prod` (or similar)
3. The credentials JSON contains sensitive data - treat it like a password
4. If credentials are compromised, rotate them immediately in Google Cloud Console

## 🔄 Alternative: Base64 Encoding (Optional)

If you prefer, you can also use base64 encoding:

```bash
# Encode the file
base64 -i banana-shop-470810-a4d04f8e0b63.json

# In Railway, set:
GOOGLE_CREDENTIALS_BASE64=<base64-encoded-string>
```

Then update `src/server/lib/gcs-config.ts` to handle base64 decoding. However, the JSON string approach is simpler and recommended.
