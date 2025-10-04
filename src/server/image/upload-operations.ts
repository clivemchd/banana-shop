import { getStorageBucket } from '../lib/gcs-config';
import { 
  logger,
  handleError, 
  AuthenticationError, 
  ValidationError,
  StorageError 
} from '../utils';

// Initialize Google Cloud Storage bucket
const bucket = getStorageBucket();

export interface GeneratePresignedUploadUrlArgs {
  fileName: string;
  mimeType: string;
  imageId?: string; // Optional: if provided, will update existing image
}

export interface ConfirmImageUploadArgs {
  imageId?: string; // Optional: if provided, updates existing record
  fileName: string;
  gcsFileName: string;
  mimeType: string;
}

/**
 * Generate presigned URL for uploading to GCS
 * Client will use this URL to upload file directly to GCS
 */
export const generatePresignedUploadUrl = async (
  args: GeneratePresignedUploadUrlArgs,
  context: any
): Promise<{ uploadUrl: string; gcsFileName: string; imageId?: string }> => {
  try {
    if (!context.user) {
      throw new AuthenticationError();
    }

    const { fileName, mimeType, imageId } = args;

    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(mimeType)) {
      throw new ValidationError(`Unsupported file type: ${mimeType}`);
    }

    // If updating existing image, delete old file first
    if (imageId) {
      const existingImage = await context.entities.Image.findUnique({
        where: { id: imageId },
      });

      if (existingImage && existingImage.userId === context.user.id) {
        try {
          const oldFile = bucket.file(existingImage.fileName);
          await oldFile.delete();
        } catch (deleteError) {
          logger.warn('Failed to delete old file', {
            userId: context.user.id,
            fileName: existingImage.fileName,
          });
        }
      }
    }

    // Generate unique filename - directly in root (no folders)
    const gcsFileName = `${context.user.id}-${Date.now()}-${Math.random().toString(36).substring(7)}-${fileName}`;

    // Generate presigned URL for upload (expires in 15 minutes)
    const [uploadUrl] = await bucket.file(gcsFileName).getSignedUrl({
      version: 'v4',
      action: 'write',
      expires: Date.now() + 15 * 60 * 1000, // 15 minutes
      contentType: mimeType,
    });

    return {
      uploadUrl,
      gcsFileName,
      imageId,
    };
  } catch (error) {
    throw handleError(error, {
      operation: 'generatePresignedUploadUrl',
      userId: context?.user?.id,
      fileName: args.fileName,
    });
  }
};

/**
 * Confirm upload and create/update Image record with signed URL
 * Call this after client successfully uploads to presigned URL
 */
export const confirmImageUpload = async (
  args: ConfirmImageUploadArgs,
  context: any
): Promise<{ imageUrl: string; imageId: string }> => {
  try {
    if (!context.user) {
      throw new AuthenticationError();
    }

    const { imageId, fileName, gcsFileName, mimeType } = args;

    const file = bucket.file(gcsFileName);

    // Generate SIGNED URL for reading (24 hour expiry - private, user-specific)
    const [signedUrl] = await file.getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
    });

    let image;

    if (imageId) {
      // UPDATE existing Image record
      image = await context.entities.Image.update({
        where: { id: imageId },
        data: {
          url: signedUrl,
          fileName: gcsFileName,
          mimeType: mimeType,
          updatedAt: new Date(),
        },
      });
    } else {
      // CREATE new Image record
      image = await context.entities.Image.create({
        data: {
          url: signedUrl,
          fileName: gcsFileName,
          mimeType: mimeType,
          description: fileName,
          userId: context.user.id,
        },
      });
    }

    return {
      imageUrl: signedUrl,
      imageId: image.id,
    };
  } catch (error) {
    throw handleError(error, {
      operation: 'confirmImageUpload',
      userId: context?.user?.id,
      fileName: args.fileName,
    });
  }
};