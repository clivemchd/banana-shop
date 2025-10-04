import { GoogleGenAI, Modality } from "@google/genai";
import { HttpError } from 'wasp/server';
import { validateAndDeductCredits } from '../credits/credit-guard';
import { createStorageClient } from '../lib/gcs-config';
import { logger, handleError, AuthenticationError, ImageGenerationError, ConfigurationError } from '../utils';

export interface GenerateImageArgs {
  prompt: string;
}

let ai: GoogleGenAI;

const getAiInstance = () => {
    if (!ai) {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new ConfigurationError("GEMINI_API_KEY environment variable is not set.");
        }
        ai = new GoogleGenAI({ apiKey });
    }
    return ai;
};

export const generateImage = async (args: GenerateImageArgs, context: any): Promise<{ imageUrl: string; imageId: string }> => {
    try {
        if (!context.user) {
            throw new AuthenticationError();
        }

        // Validate subscription and deduct credits using common guard
        await validateAndDeductCredits(context.user.id, 'IMAGE_GENERATION', context);

        const ai = getAiInstance();
        const { prompt } = args;
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
            logger.error('Invalid response from Gemini API', { prompt });
            throw new ImageGenerationError("The AI model did not return a valid response. Please try again.");
        }

        if (candidate.finishReason && candidate.finishReason !== 'STOP') {
            const reason = candidate.finishReason;
            logger.warn('Gemini API returned non-STOP finishReason', {
                reason,
                prompt,
            });
            
            let errorMessage = 'Image generation failed. ';
            
            switch (reason) {
                case 'SAFETY':
                    errorMessage += 'The prompt was blocked by safety filters. Please try a different description.';
                    break;
                case 'RECITATION':
                    errorMessage += 'The prompt may reference copyrighted content. Please use original ideas.';
                    break;
                case 'MAX_TOKENS':
                case 'OTHER':
                    errorMessage += 'Unable to generate the image. Try simplifying your prompt or using different words.';
                    break;
                default:
                    errorMessage += `Unexpected error (${reason}). Please try again with a different prompt.`;
            }
            
            throw new ImageGenerationError(errorMessage);
        }
        
        const imagePartData = candidate.content?.parts?.find(part => part.inlineData)?.inlineData?.data;

        if (imagePartData) {
            // Upload generated image to GCS ROOT (no folders)
            const storage = createStorageClient();
            
            const bucketName = process.env.GCP_BUCKET_NAME;
            if (!bucketName) {
                throw new Error('GCP_BUCKET_NAME environment variable is not set');
            }
            
            const bucket = storage.bucket(bucketName);
            // Upload directly to root - no folders
            const fileName = `${context.user.id}-${Date.now()}-${Math.random().toString(36).substring(7)}.png`;
            const file = bucket.file(fileName);
            
            // Convert base64 to buffer
            const imageBuffer = Buffer.from(imagePartData, 'base64');
            
            // Upload to GCS
            await file.save(imageBuffer, {
                metadata: {
                    contentType: 'image/png',
                },
            });
            
            // Generate SIGNED URL (24 hour expiry - private, user-specific)
            const [signedUrl] = await file.getSignedUrl({
                version: 'v4',
                action: 'read',
                expires: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
            });
            
            // Create Image record in database
            const image = await context.entities.Image.create({
                data: {
                    url: signedUrl,
                    fileName: fileName,
                    mimeType: 'image/png',
                    description: prompt,
                    userId: context.user.id,
                },
            });
            
            return {
                imageUrl: signedUrl,
                imageId: image.id
            };
        }

        logger.error('No image part found in Gemini response', { prompt });
        throw new ImageGenerationError("The AI did not generate an image. Try a different prompt or simplify your description.");

    } catch (error) {
        throw handleError(error, {
            operation: 'generateImage',
            userId: context?.user?.id,
            prompt: args.prompt.substring(0, 100),
        });
    }
};
// New function for editing images from storage
export interface EditImageFromStorageArgs {
  tempImageId: string;
  prompt: string;
}

export interface EditImageFromGCSArgs {
  imageId: string;
  prompt: string;
  shouldBlend?: boolean;
  borderColor?: string;
}

export const editImageFromGCS = async (
  args: EditImageFromGCSArgs,
  context: any
): Promise<{ imageUrl: string; imageId: string }> => {
  if (!context.user) {
    throw new HttpError(401, 'User must be authenticated');
  }

  const { imageId, prompt, shouldBlend, borderColor } = args;

  // Validate subscription and deduct credits using common guard
  // Skip credit deduction for blending operations (second step of editing)
  await validateAndDeductCredits(
    context.user.id, 
    'IMAGE_EDIT', 
    context, 
    shouldBlend // skipDeduction = true if blending
  );

  try {
    // Find the image record
    const image = await context.entities.Image.findUnique({
      where: { id: imageId },
    });

    if (!image) {
      throw new Error('Image not found');
    }

    if (image.userId !== context.user.id) {
      throw new Error('Unauthorized access to image');
    }

    // Download image from GCS
    const storage = createStorageClient();
    
    const bucketName = process.env.GCP_BUCKET_NAME;
    if (!bucketName) {
        throw new Error('GCP_BUCKET_NAME environment variable is not set');
    }
    
    const bucket = storage.bucket(bucketName);
    const file = bucket.file(image.fileName);
    
    // Download the image
    const [imageBuffer] = await file.download();
    const base64Image = imageBuffer.toString('base64');
    
    // Determine the final prompt based on blending flag
    let finalPrompt = prompt;
    let temperature = 0.4;
    
    if (shouldBlend && borderColor) {
      // Simplified blending prompt to avoid safety filters
      finalPrompt = `Smooth and blend the ${borderColor} border line into the surrounding image. Remove the ${borderColor} line completely while preserving all image content.`;
    }
    
    // Process with Gemini API
    const ai = getAiInstance();
    const imagePart = {
      inlineData: {
        data: base64Image,
        mimeType: image.mimeType,
      },
    };
    const textPart = { text: finalPrompt };

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image-preview',
      contents: { parts: [imagePart, textPart] },
      config: {
        responseModalities: [Modality.IMAGE, Modality.TEXT],
        temperature: temperature,
        systemInstruction: `Ensure to change the cropped image as it is in structure and return the same exact image with the specified modifications.`
      },
    });

    const candidate = response?.candidates?.[0];

    if (!candidate) {
      logger.error('Invalid response from Gemini API for editing', { 
        imageId, 
        shouldBlend, 
        borderColor,
      });
      throw new ImageGenerationError("The AI model did not return a valid response. Please try again.");
    }

    if (candidate.finishReason && candidate.finishReason !== 'STOP') {
      const reason = candidate.finishReason;
      logger.warn('Gemini API returned non-STOP finishReason for editing', {
        reason,
        imageId,
        shouldBlend,
      });
      
      // Provide user-friendly error messages based on finish reason
      let errorMessage = 'Image editing failed. ';
      
      switch (reason) {
        case 'SAFETY':
          errorMessage += shouldBlend 
            ? 'The blending operation was blocked by safety filters. This may be due to the image content. Please try uploading a different image.'
            : 'The edit was blocked by safety filters. Please try a different edit prompt or upload a different image.';
          break;
        case 'RECITATION':
          errorMessage += 'The AI detected potential copyrighted content. Please use original images.';
          break;
        case 'MAX_TOKENS':
        case 'OTHER':
          errorMessage += shouldBlend
            ? 'Unable to blend the image edges. This sometimes happens with complex images. Try selecting a smaller region or simplifying the edit.'
            : 'Unable to complete the edit. Please try a simpler edit prompt or a smaller selection area.';
          break;
        default:
          errorMessage += `Unexpected error (${reason}). Please try again with a different approach.`;
      }
      
      throw new ImageGenerationError(errorMessage);
    }

    const editedImageData = candidate.content?.parts?.find(part => part.inlineData)?.inlineData?.data;
    
    if (!editedImageData) {
      logger.error('No image data in Gemini edit response', {
        imageId,
        shouldBlend,
      });
      throw new ImageGenerationError("The AI did not return an edited image. Please try again.");
    }

    // Delete old file from GCS (cleanup)
    try {
      const oldFile = bucket.file(image.fileName);
      await oldFile.delete();
    } catch (deleteError) {
      console.warn(`Failed to delete old file ${image.fileName}:`, deleteError);
      // Continue even if delete fails
    }

    // Upload edited image to GCS ROOT (no folders) - REPLACE old file
    const newFileName = `${context.user.id}-${Date.now()}-${Math.random().toString(36).substring(7)}.png`;
    const editedFile = bucket.file(newFileName);
    const editedImageBuffer = Buffer.from(editedImageData, 'base64');
    
    await editedFile.save(editedImageBuffer, {
      metadata: {
        contentType: 'image/png',
      },
    });
    
    // Generate SIGNED URL (24 hour expiry - private, user-specific)
    const [signedUrl] = await editedFile.getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
    });
    
    // UPDATE existing Image record (replace URL and filename)
    const updatedImage = await context.entities.Image.update({
      where: { id: imageId },
      data: {
        url: signedUrl,
        fileName: newFileName,
        description: prompt,
        updatedAt: new Date(),
      },
    });
    
    return {
      imageUrl: signedUrl,
      imageId: updatedImage.id
    };
  } catch (error) {
    throw handleError(error, {
      operation: 'editImageFromStorage',
      userId: context?.user?.id,
      imageId: args.imageId,
      shouldBlend,
    });
  }
};