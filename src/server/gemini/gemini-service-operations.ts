// @ts-nocheck - Temporary to avoid GCS library type issues
import { GoogleGenAI, Modality } from "@google/genai";
import { Storage } from '@google-cloud/storage';

export interface GenerateImageArgs {
  prompt: string;
}

export interface EditImageRegionArgs {
  croppedBase64Image: string;
  mimeType: string;
  prompt: string;
}

let ai: GoogleGenAI;

const getAiInstance = () => {
    if (!ai) {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error("GEMINI_API_KEY environment variable is not set.");
        }
        ai = new GoogleGenAI({ apiKey });
    }
    return ai;
};

export const generateImage = async (args: GenerateImageArgs, context: any): Promise<{ imageUrl: string; tempImageId: string }> => {
    const ai = getAiInstance();
    const { prompt } = args;
    try {
        const textPart = { text: prompt };

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image-preview',
            contents: { parts: [textPart] },
            config: {
                responseModalities: [Modality.IMAGE, Modality.TEXT],
                temperature: 0.8, // A bit more creative for generation
            }
        });
        
        const candidate = response?.candidates?.[0];

        if (!candidate) {
            console.error("Invalid response from Gemini API for image generation.", { response });
            throw new Error("The model did not return a valid response.");
        }

        if (candidate.finishReason && candidate.finishReason !== 'STOP') {
             throw new Error(`Image generation failed. Reason: ${candidate.finishReason}. This can happen due to safety policies or an invalid prompt.`);
        }
        
        const imagePartData = candidate.content?.parts?.find(part => part.inlineData)?.inlineData?.data;

        if (imagePartData) {
            // Upload generated image to GCS and create temp image record
            const storage = new Storage({
                projectId: process.env.GCP_PROJECT_ID,
                keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
            });
            
            const bucketName = process.env.GCP_BUCKET_NAME;
            if (!bucketName) {
                throw new Error('GCP_BUCKET_NAME environment variable is not set');
            }
            
            const bucket = storage.bucket(bucketName);
            const fileName = `generated-images/${Date.now()}-${Math.random().toString(36).substring(7)}.png`;
            const file = bucket.file(fileName);
            
            // Convert base64 to buffer
            const imageBuffer = Buffer.from(imagePartData, 'base64');
            
            // Upload to GCS
            await file.save(imageBuffer, {
                metadata: {
                    contentType: 'image/png',
                },
            });
            
            // Generate public URL
            const [url] = await file.getSignedUrl({
                action: 'read',
                expires: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
            });
            
            // Create temp image record
            const tempImage = await context.entities.TempImage.create({
                data: {
                    id: `temp-${Date.now()}-${Math.random().toString(36).substring(7)}`,
                    url: url,
                    fileName: fileName,
                    mimeType: 'image/png',
                    size: imageBuffer.length,
                    userId: context.user?.id || null,
                    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
                },
            });
            
            return {
                imageUrl: url,
                tempImageId: tempImage.id
            };
        }

        console.error("No image part found in the response for image generation. Full response:", JSON.stringify(response, null, 2));
        throw new Error("The model response did not contain an image. This might be because the prompt was too ambiguous or couldn't be fulfilled.");

    } catch (error) {
        console.error("Error generating image with Gemini API:", error);
        if (error instanceof Error && error.message.includes('SAFETY')) {
             throw new Error(`Image generation failed due to safety policies. Please try a different prompt.`);
        }
        throw error;
    }
};

export const editImageRegion = async (args: EditImageRegionArgs, context: any): Promise<string> => {
    const ai = getAiInstance();
    const { croppedBase64Image, mimeType, prompt } = args;
    try {
        const imagePart = {
            inlineData: {
                data: croppedBase64Image,
                mimeType,
            },
        };
        const textPart = { text: prompt };

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image-preview',
            contents: { parts: [imagePart, textPart] },
            config: {
                responseModalities: [Modality.IMAGE, Modality.TEXT],
                temperature: 0.4,
                systemInstruction: `
                    Ensure to change the cropped image as it is in structure and return the same exact image with the specified modifications.
                `
            },
        });

        const candidate = response?.candidates?.[0];

        if (!candidate) {
            console.error("Invalid response from Gemini API for image editing.", { response });
            throw new Error("The model did not return a valid response.");
        }

        if (candidate.finishReason && candidate.finishReason !== 'STOP') {
             throw new Error(`Image generation failed. Reason: ${candidate.finishReason}. This can happen due to safety policies or an invalid prompt.`);
        }

        const imagePartData = candidate.content?.parts?.find(part => part.inlineData)?.inlineData?.data;
        
        if (imagePartData) {
            return imagePartData;
        }

        console.error("No image part found in the response for image editing. Full response:", JSON.stringify(response, null, 2));
        throw new Error("The model response did not contain an image. This might be because the prompt was too ambiguous or couldn't be fulfilled.");

    } catch (error) {
        console.error("Error editing image with Gemini API:", error);
        throw error;
    }
};

// New function for editing images from storage
export interface EditImageFromStorageArgs {
  tempImageId: string;
  prompt: string;
}

export const editImageRegionFromStorage = async (
  args: EditImageFromStorageArgs,
  context: any
): Promise<{ imageUrl: string; tempImageId: string }> => {
  if (!context.user) {
    throw new Error('User must be authenticated');
  }

  const { tempImageId, prompt } = args;

  try {
    // Find the temp image
    const tempImage = await context.entities.TempImage.findUnique({
      where: { id: tempImageId },
    });

    if (!tempImage) {
      throw new Error('Temp image not found');
    }

    if (tempImage.userId !== context.user.id) {
      throw new Error('Unauthorized access to temp image');
    }

    // Download image from GCS
    const storage = new Storage({
        projectId: process.env.GCP_PROJECT_ID,
        keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    });
    
    const bucketName = process.env.GCP_BUCKET_NAME;
    if (!bucketName) {
        throw new Error('GCP_BUCKET_NAME environment variable is not set');
    }
    if (!bucketName) {
        throw new Error('GCS_BUCKET_NAME environment variable is not set');
    }
    
    const bucket = storage.bucket(bucketName);
    const file = bucket.file(tempImage.fileName);
    
    // Download the image
    const [imageBuffer] = await file.download();
    const base64Image = imageBuffer.toString('base64');
    
    // Process with Gemini API
    const ai = getAiInstance();
    const imagePart = {
      inlineData: {
        data: base64Image,
        mimeType: tempImage.mimeType,
      },
    };
    const textPart = { text: prompt };

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image-preview',
      contents: { parts: [imagePart, textPart] },
      config: {
        responseModalities: [Modality.IMAGE, Modality.TEXT],
        temperature: 0.4,
        systemInstruction: `
          Ensure to change the image as requested while maintaining the overall structure and return the modified image.
        `
      },
    });

    const candidate = response?.candidates?.[0];

    if (!candidate) {
      console.error("Invalid response from Gemini API for image editing.", { response });
      throw new Error("The model did not return a valid response.");
    }

    if (candidate.finishReason && candidate.finishReason !== 'STOP') {
      throw new Error(`Image editing failed. Reason: ${candidate.finishReason}. This can happen due to safety policies or an invalid prompt.`);
    }

    const editedImageData = candidate.content?.parts?.find(part => part.inlineData)?.inlineData?.data;
    
    if (!editedImageData) {
      throw new Error("The model response did not contain an edited image.");
    }

    // Upload edited image to GCS
    const editedFileName = `edited-images/${Date.now()}-${Math.random().toString(36).substring(7)}.png`;
    const editedFile = bucket.file(editedFileName);
    const editedImageBuffer = Buffer.from(editedImageData, 'base64');
    
    await editedFile.save(editedImageBuffer, {
      metadata: {
        contentType: 'image/png',
      },
    });
    
    // Generate public URL
    const [editedUrl] = await editedFile.getSignedUrl({
      action: 'read',
      expires: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
    });
    
    // Create new temp image record for edited image
    const editedTempImage = await context.entities.TempImage.create({
      data: {
        id: `edited-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        url: editedUrl,
        fileName: editedFileName,
        mimeType: 'image/png',
        size: editedImageBuffer.length,
        userId: context.user.id,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      },
    });
    
    return {
      imageUrl: editedUrl,
      tempImageId: editedTempImage.id
    };
  } catch (error) {
    console.error('Error editing image from storage:', error);
    throw new Error('Failed to edit image from storage');
  }
};