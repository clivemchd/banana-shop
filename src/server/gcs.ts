import Storage from '@google-cloud/storage';
import { HttpError } from 'wasp/server';

// Initialize Google Cloud Storage with credentials
const storage = new Storage({
  projectId: process.env.GCP_PROJECT_ID,
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
});

const bucket = storage.bucket(process.env.GCP_BUCKET_NAME!);

export interface ResumableUploadOptions {
  fileName: string;
  contentType: string;
  metadata?: Record<string, string>;
  maxFileSize?: number;
  [key: string]: any; // Add index signature for Wasp compatibility
}

export interface SignedUploadResponse {
  uploadUrl: string;
  uploadId: string;
  fileName: string;
  expiresAt: string; // Change Date to string for JSON compatibility
  [key: string]: any; // Add index signature for Wasp compatibility
}

/**
 * Generates a signed URL for resumable upload initiation
 * This URL is used to start a resumable upload session with GCS
 */
export async function generateResumableUploadUrl(
  options: any
): Promise<any> {
  try {
    const {
      fileName,
      contentType,
      metadata = {},
      maxFileSize = 10 * 1024 * 1024 // 10MB default
    } = options;

    // Create a unique file name to prevent conflicts
    const timestamp = Date.now();
    const uniqueFileName = `uploads/${timestamp}-${fileName}`;
    
    const file = bucket.file(uniqueFileName);

    // Generate a signed URL for PUT operation using the XML API
    // This will respect our CORS configuration
    const [url] = await file.getSignedUrl({
      action: 'write',
      expires: Date.now() + 60 * 60 * 1000, // 1 hour from now
      contentType,
    });

    return {
      uploadUrl: url,
      uploadId: uniqueFileName,
      fileName: uniqueFileName,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    };
  } catch (error) {
    console.error('Error generating resumable upload URL:', error);
    throw new HttpError(500, 'Failed to generate upload URL');
  }
}

/**
 * Check the status of a resumable upload
 */
export async function checkUploadStatus(uploadId: string): Promise<any> {
  try {
    const file = bucket.file(uploadId);
    const [exists] = await file.exists();
    
    if (exists) {
      const [metadata] = await file.getMetadata();
      return {
        status: 'completed',
        size: metadata.size || 0,
        contentType: metadata.contentType || '',
        timeCreated: metadata.timeCreated || '',
        publicUrl: `gs://${process.env.GCP_BUCKET_NAME}/${uploadId}`,
      };
    }

    return { status: 'in_progress' };
  } catch (error) {
    console.error('Error checking upload status:', error);
    throw new HttpError(500, 'Failed to check upload status');
  }
}

/**
 * Cancel a resumable upload session
 */
export async function cancelResumableUpload(uploadId: string) {
  try {
    const file = bucket.file(uploadId);
    try {
      await file.delete();
    } catch (error) {
      // File might not exist, which is fine
      console.log('File does not exist or already deleted');
    }
    return { success: true };
  } catch (error) {
    console.error('Error canceling upload:', error);
    throw new HttpError(500, 'Failed to cancel upload');
  }
}

// Keep the original function for backwards compatibility
export const getFilesFromBucket = async () => {
  const [files] = await storage.bucket(process.env.GCP_BUCKET_NAME || '').getFiles();
  return files;
};