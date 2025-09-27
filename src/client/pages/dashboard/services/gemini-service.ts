import { 
  generateImageWithGemini,
  editImageRegionFromStorage,
  generateImageUploadUrl,
  createTempImageRecord
} from 'wasp/client/operations';

export const generateImage = async (prompt: string): Promise<{ imageUrl: string; tempImageId: string }> => {
  try {
    const result = await generateImageWithGemini({ prompt });
    return result as { imageUrl: string; tempImageId: string };
  } catch (error) {
    console.error('Error generating image:', error);
    throw error;
  }
};



export const editImageRegionFromTempStorage = async (tempImageId: string, prompt: string): Promise<{ imageUrl: string; tempImageId: string }> => {
  try {
    const result = await editImageRegionFromStorage({ tempImageId, prompt });
    return result as { imageUrl: string; tempImageId: string };
  } catch (error) {
    console.error('Error editing image from storage:', error);
    throw error;
  }
};

export const uploadImageToGCS = async (file: File): Promise<{ imageUrl: string; tempImageId: string }> => {
  try {
    // Get presigned upload URL
    const uploadUrlResult = await generateImageUploadUrl({ 
      fileName: file.name, 
      mimeType: file.type 
    });
    
    // Upload file to GCS using presigned URL
    const uploadResponse = await fetch(uploadUrlResult.uploadUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      },
    });
    
    if (!uploadResponse.ok) {
      throw new Error(`Failed to upload file: ${uploadResponse.statusText}`);
    }
    
    // Create temp image record
    const tempImageResult = await createTempImageRecord({
      fileName: uploadUrlResult.fileName,
      mimeType: file.type,
      gcsFileName: uploadUrlResult.fileName,
      size: file.size,
    });
    
    return {
      imageUrl: tempImageResult.url,
      tempImageId: tempImageResult.id
    };
  } catch (error) {
    console.error('Error uploading image to GCS:', error);
    throw error;
  }
};