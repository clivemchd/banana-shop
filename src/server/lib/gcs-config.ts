import { Storage, StorageOptions } from '@google-cloud/storage';

/**
 * Get Google Cloud Storage configuration
 * In production (Railway), uses GOOGLE_CREDENTIALS_BASE64 environment variable (base64-encoded JSON)
 * In development, uses GOOGLE_APPLICATION_CREDENTIALS path
 */
function getStorageConfig(): StorageOptions {
  const projectId = process.env.GCP_PROJECT_ID;
  const isProduction = process.env.NODE_ENV === 'production';

  if (!projectId) {
    throw new Error('GCP_PROJECT_ID environment variable is required');
  }

  // Production: Use credentials from environment variable
  if (isProduction) {
    const credentialsBase64 = process.env.GOOGLE_CREDENTIALS_BASE64;
    
    if (!credentialsBase64) {
      throw new Error('GOOGLE_CREDENTIALS_BASE64 environment variable is required in production');
    }
    
    try {
      // Decode from base64
      const credentialsString = Buffer.from(credentialsBase64, 'base64').toString('utf-8');
      const credentials = JSON.parse(credentialsString);
      
      return {
        projectId,
        credentials,
      };
    } catch (error) {
      throw new Error('Failed to parse GOOGLE_CREDENTIALS_BASE64: ' + (error as Error).message);
    }
  }

  // Development: Use credentials file path
  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    throw new Error('GOOGLE_APPLICATION_CREDENTIALS environment variable is required in development');
  }

  return {
    projectId,
    keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
  };
}

/**
 * Create a new Storage instance with proper configuration
 */
export function createStorageClient(): Storage {
  const config = getStorageConfig();
  return new Storage(config);
}

/**
 * Get the configured GCS bucket
 */
export function getStorageBucket(): ReturnType<Storage['bucket']> {
  const bucketName = process.env.GCP_BUCKET_NAME;
  
  if (!bucketName) {
    throw new Error('GCP_BUCKET_NAME environment variable is required');
  }

  const storage = createStorageClient();
  return storage.bucket(bucketName);
}

