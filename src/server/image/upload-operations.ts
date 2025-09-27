import { Storage } from '@google-cloud/storage';

// Initialize Google Cloud Storage
const storage = new Storage({
  projectId: process.env.GCP_PROJECT_ID,
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
});

const bucket = storage.bucket(process.env.GCP_BUCKET_NAME!);

export interface GenerateImageUploadUrlArgs {
  fileName: string;
  mimeType: string;
}

export interface CreateTempImageRecordArgs {
  fileName: string;
  mimeType: string;
  gcsFileName: string;
  size: number;
}

export const generateImageUploadUrl = async (
  args: GenerateImageUploadUrlArgs,
  context: any
): Promise<{ uploadUrl: string; fileName: string }> => {
  if (!context.user) {
    throw new Error('User must be authenticated');
  }

  const { fileName, mimeType } = args;
  
  // Validate file type
  const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
  if (!allowedTypes.includes(mimeType)) {
    throw new Error(`Unsupported file type: ${mimeType}`);
  }

  // Generate unique filename with user prefix
  const timestamp = Date.now();
  const uniqueFileName = `temp/${context.user.id}/${timestamp}-${fileName}`;

  try {
    // Generate presigned URL for upload (expires in 15 minutes)
    const [url] = await bucket.file(uniqueFileName).getSignedUrl({
      version: 'v4',
      action: 'write',
      expires: Date.now() + 15 * 60 * 1000, // 15 minutes
      contentType: mimeType,
    });

    return {
      uploadUrl: url,
      fileName: uniqueFileName,
    };
  } catch (error) {
    console.error('Error generating upload URL:', error);
    throw new Error('Failed to generate upload URL');
  }
};

export const createTempImageRecord = async (
  args: CreateTempImageRecordArgs,
  context: any
): Promise<{ id: string; url: string }> => {
  if (!context.user) {
    throw new Error('User must be authenticated');
  }

  const { fileName, mimeType, gcsFileName, size } = args;

  try {
    // Create public URL for the uploaded file
    const publicUrl = `https://storage.googleapis.com/${process.env.GCP_BUCKET_NAME}/${gcsFileName}`;
    
    // Set expiration time (24 hours from now)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    // Create temp image record in database
    const tempImage = await context.entities.TempImage.create({
      data: {
        url: publicUrl,
        fileName: fileName,
        mimeType: mimeType,
        size: size,
        userId: context.user.id,
        expiresAt: expiresAt,
      },
    });

    return {
      id: tempImage.id,
      url: tempImage.url,
    };
  } catch (error) {
    console.error('Error creating temp image record:', error);
    throw new Error('Failed to create temp image record');
  }
};

export const cleanupExpiredTempImages = async (context: any): Promise<void> => {
  try {
    const now = new Date();
    
    // Find expired temp images
    const expiredImages = await context.entities.TempImage.findMany({
      where: {
        expiresAt: {
          lt: now,
        },
      },
    });

    // Delete files from GCS and database records
    for (const tempImage of expiredImages) {
      try {
        // Extract filename from URL
        const urlParts = tempImage.url.split('/');
        const fileName = urlParts.slice(-2).join('/'); // Get last two parts (folder/filename)
        
        // Delete from GCS
        await bucket.file(fileName).delete();
        console.log(`Deleted GCS file: ${fileName}`);
      } catch (gcsError) {
        console.error(`Failed to delete GCS file for temp image ${tempImage.id}:`, gcsError);
        // Continue with database cleanup even if GCS deletion fails
      }
    }

    // Delete database records
    const deletedCount = await context.entities.TempImage.deleteMany({
      where: {
        expiresAt: {
          lt: now,
        },
      },
    });

    console.log(`Cleaned up ${deletedCount.count} expired temp images`);
  } catch (error) {
    console.error('Error during temp image cleanup:', error);
    throw error;
  }
};

export const validateImageUpload = (file: File): { isValid: boolean; error?: string } => {
  // File type validation
  const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: `Unsupported file type: ${file.type}. Allowed types: ${allowedTypes.join(', ')}`,
    };
  }

  // File size validation (50MB max)
  const maxSize = 50 * 1024 * 1024; // 50MB
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: `File size too large: ${(file.size / 1024 / 1024).toFixed(2)}MB. Maximum allowed: 50MB`,
    };
  }

  return { isValid: true };
};