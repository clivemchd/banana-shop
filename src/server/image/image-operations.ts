import { HttpError } from 'wasp/server';
import { generateTextToImage as generateTextToImageCore, generateImageToImage as generateImageToImageCore } from '../fal-test';
import { hasEnoughCredits, deductCredits } from '../credits/credits-operations';

interface ImageOptionTypes {
    image_size?: "square_hd" | "square" | "portrait_4_3" | "portrait_16_9" | "landscape_4_3" | "landscape_16_9";
    num_inference_steps?: number;
    guidance_scale?: number;
    num_images?: number;
    enable_safety_checker?: boolean;
}

interface GenerateTextToImageTypes {
    prompt: string;
    options?: ImageOptionTypes;
}

interface GenerateImageToImageTypes extends GenerateTextToImageTypes {
    image_urls: string[];
}

/**
 * Generate text-to-image with credit checking and deduction
 */
export const generateTextToImage = async (
    { prompt, options }: GenerateTextToImageTypes, 
    context: any
) => {
    if (!context.user) {
        throw new HttpError(401, 'User must be logged in to generate images');
    }

    // Check if user has enough credits
    const creditCheck = await hasEnoughCredits(context.user.id, 'IMAGE_GENERATION', context);
    
    if (!creditCheck.hasEnough) {
        throw new HttpError(402, `Insufficient credits. Required: ${creditCheck.required}, Available: ${creditCheck.available}`);
    }

    try {
        // Generate the image
        const result = await generateTextToImageCore({ prompt, options });

        // Only deduct credits if generation was successful
        if (result) {
            const creditResult = await deductCredits(context.user.id, 'IMAGE_GENERATION', context);
            
            // Add credit info to the response
            return {
                ...result,
                creditInfo: {
                    creditsCost: creditResult.creditCost,
                    remainingCredits: creditResult.newBalance
                }
            };
        }

        return result;
    } catch (error: any) {
        console.error('Error generating text-to-image:', error);
        throw new HttpError(500, `Image generation failed: ${error.message}`);
    }
};

/**
 * Generate image-to-image with credit checking and deduction
 */
export const generateImageToImage = async (
    { prompt, options, image_urls }: GenerateImageToImageTypes, 
    context: any
) => {
    if (!context.user) {
        throw new HttpError(401, 'User must be logged in to edit images');
    }

    // Check if user has enough credits for image editing
    const creditCheck = await hasEnoughCredits(context.user.id, 'IMAGE_EDIT', context);
    
    if (!creditCheck.hasEnough) {
        throw new HttpError(402, `Insufficient credits. Required: ${creditCheck.required}, Available: ${creditCheck.available}`);
    }

    try {
        // Generate the image
        const result = await generateImageToImageCore({ prompt, options, image_urls });

        // Only deduct credits if generation was successful
        if (result) {
            const creditResult = await deductCredits(context.user.id, 'IMAGE_EDIT', context);
            
            // Add credit info to the response
            return {
                ...result,
                creditInfo: {
                    creditsCost: creditResult.creditCost,
                    remainingCredits: creditResult.newBalance
                }
            };
        }

        return result;
    } catch (error: any) {
        console.error('Error generating image-to-image:', error);
        throw new HttpError(500, `Image editing failed: ${error.message}`);
    }
};

// New image management operations for permanent storage

export interface SaveImagePermanentlyArgs {
  tempImageId: string;
  description?: string;
}

export interface CreateImageEditArgs {
  imageId: string;
  editType: string;
  prompt?: string;
  beforeUrl?: string;
  afterUrl: string;
}

export const saveImagePermanently = async (
  args: SaveImagePermanentlyArgs,
  context: any
): Promise<{ id: string; url: string }> => {
  if (!context.user) {
    throw new Error('User must be authenticated');
  }

  const { tempImageId, description } = args;

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

    // Create permanent image record
    const permanentImage = await context.entities.Image.create({
      data: {
        url: tempImage.url,
        originalUrl: tempImage.url,
        description: description || `Generated image - ${tempImage.fileName}`,
        fileName: tempImage.fileName,
        mimeType: tempImage.mimeType,
        userId: context.user.id,
      },
    });

    // Create initial edit record
    await context.entities.ImageEdit.create({
      data: {
        imageId: permanentImage.id,
        editType: 'generation',
        afterUrl: tempImage.url,
        userId: context.user.id,
      },
    });

    // Clean up temp image record
    await context.entities.TempImage.delete({
      where: { id: tempImageId },
    });

    return {
      id: permanentImage.id,
      url: permanentImage.url,
    };
  } catch (error) {
    console.error('Error saving image permanently:', error);
    throw new Error('Failed to save image permanently');
  }
};

export const createImageEdit = async (
  args: CreateImageEditArgs,
  context: any
): Promise<{ id: string }> => {
  if (!context.user) {
    throw new Error('User must be authenticated');
  }

  const { imageId, editType, prompt, beforeUrl, afterUrl } = args;

  try {
    // Verify user owns the image
    const image = await context.entities.Image.findUnique({
      where: { id: imageId },
    });

    if (!image) {
      throw new Error('Image not found');
    }

    if (image.userId !== context.user.id) {
      throw new Error('Unauthorized access to image');
    }

    // Create edit record
    const imageEdit = await context.entities.ImageEdit.create({
      data: {
        imageId: imageId,
        editType: editType,
        prompt: prompt,
        beforeUrl: beforeUrl,
        afterUrl: afterUrl,
        userId: context.user.id,
      },
    });

    // Update the main image URL to the latest version
    await context.entities.Image.update({
      where: { id: imageId },
      data: {
        url: afterUrl,
        updatedAt: new Date(),
      },
    });

    return {
      id: imageEdit.id,
    };
  } catch (error) {
    console.error('Error creating image edit:', error);
    throw new Error('Failed to create image edit');
  }
};