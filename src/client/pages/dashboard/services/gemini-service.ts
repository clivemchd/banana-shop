import { 
  generateImageWithGemini,
  generatePresignedUploadUrl,
  confirmImageUpload,
  editImageFromGCS as editImageFromGCSAction
} from 'wasp/client/operations';

export const generateImage = async (prompt: string): Promise<{ imageUrl: string; imageId: string }> => {
  try {
    const result = await generateImageWithGemini({ prompt });
    return result as { imageUrl: string; imageId: string };
  } catch (error) {
    console.error('Error generating image:', error);
    throw error;
  }
};

/**
 * Upload image to GCS using presigned URL flow
 * @param file - File to upload
 * @param imageId - Optional: if provided, will REPLACE existing image (for updates)
 */
export const uploadImageToGCS = async (
  file: File, 
  imageId?: string
): Promise<{ imageUrl: string; imageId: string }> => {
  try {
    // Step 1: Get presigned upload URL
    const { uploadUrl, gcsFileName, imageId: existingImageId } = await generatePresignedUploadUrl({
      fileName: file.name,
      mimeType: file.type,
      imageId: imageId, // Pass imageId if updating existing
    });
    
    // Step 2: Upload file directly to GCS using presigned URL
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      },
    });
    
    if (!uploadResponse.ok) {
      throw new Error(`Failed to upload file: ${uploadResponse.statusText}`);
    }
    
    // Step 3: Confirm upload and get signed read URL
    const result = await confirmImageUpload({
      imageId: existingImageId || imageId,
      fileName: file.name,
      gcsFileName: gcsFileName,
      mimeType: file.type,
    });
    
    return result as { imageUrl: string; imageId: string };
  } catch (error) {
    console.error('Error uploading image to GCS:', error);
    throw error;
  }
};

/**
 * Edit image from GCS - REPLACES the existing image record
 * Frontend should maintain history for undo/redo
 * @param imageId - The image ID to edit
 * @param prompt - The user prompt for editing
 * @param shouldBlend - If true, server will use blending prompt instead
 * @param borderColor - Color name for blending (required if shouldBlend is true)
 */
export const editImageFromGCS = async (
  imageId: string, 
  prompt: string,
  shouldBlend?: boolean,
  borderColor?: string
): Promise<{ imageUrl: string; imageId: string }> => {
  try {
    const result = await editImageFromGCSAction({ 
      imageId, 
      prompt,
      shouldBlend,
      borderColor
    });
    return result as { imageUrl: string; imageId: string };
  } catch (error) {
    console.error('Error editing image:', error);
    throw error;
  }
};