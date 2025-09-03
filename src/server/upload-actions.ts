import { 
  generateResumableUploadUrl, 
  checkUploadStatus
} from './gcs.js';
import { HttpError } from 'wasp/server';

export const createResumableUpload = async (
  args: any,
  context: any
) => {
  if (!context.user) {
    throw new HttpError(401, 'User not authenticated');
  }

  // Add user metadata
  const uploadOptions = {
    ...args,
    metadata: {
      ...args.metadata,
      userId: context.user.id.toString(),
      uploadedBy: context.user.id.toString(),
    },
  };

  return await generateResumableUploadUrl(uploadOptions);
}

export const getUploadStatus = async (
  args: any,
  context: any
) => {
  if (!context.user) {
    throw new HttpError(401, 'User not authenticated');
  }

  return await checkUploadStatus(args.uploadId);
}
