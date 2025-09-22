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