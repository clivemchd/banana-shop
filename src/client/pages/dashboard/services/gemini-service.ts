import { generateImageWithGemini, editImageRegionWithGemini } from 'wasp/client/operations';

export const generateImage = async (prompt: string): Promise<string> => {
  try {
    const result = await generateImageWithGemini({ prompt });
    return result;
  } catch (error) {
    console.error('Error generating image:', error);
    throw error;
  }
};

export const editImageRegion = async (croppedBase64Image: string, mimeType: string, prompt: string): Promise<string> => {
  try {
    const result = await editImageRegionWithGemini({ croppedBase64Image, mimeType, prompt });
    return result;
  } catch (error) {
    console.error('Error editing image region:', error);
    throw error;
  }
};