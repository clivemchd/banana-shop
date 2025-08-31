import { fal } from "@fal-ai/client";

fal.config({
    credentials: process?.env?.FAL_KEY,
});

interface ImageOptionTypes {
    image_size?: "square_hd" | "square" | "portrait_4_3" | "portrait_16_9" | "landscape_4_3" | "landscape_16_9";
    num_inference_steps?: number;
    guidance_scale?: number;
    num_images?: number;
    enable_safety_checker?: boolean;
}

interface GenerateTextToImageTypes {
    prompt: string,
    options?: ImageOptionTypes
}

interface GenerateImageToImageTypes extends GenerateTextToImageTypes {
    image_urls: string[];
}

export const generateTextToImage = async ({ prompt, options }: GenerateTextToImageTypes) => {
    try {
        const result = await fal.subscribe("fal-ai/nano-banana", {
            input: {
                prompt,
                image_size: options?.image_size || "square_hd",
                num_inference_steps: options?.num_inference_steps || 4,
                guidance_scale: options?.guidance_scale || 3.5,
                num_images: options?.num_images || 1,
                enable_safety_checker: options?.enable_safety_checker ?? true,
            },
        });

        return result;
    } catch (error) {
        console.error("Error generating image:", error);
        throw error;
    }
};

export const generateImageToImage = async ({ prompt, options, image_urls }: GenerateImageToImageTypes) => {
    try {
        const result = await fal.subscribe("fal-ai/nano-banana/edit", {
            input: {
                prompt,
                image_size: options?.image_size || "square_hd",
                num_inference_steps: options?.num_inference_steps || 4,
                guidance_scale: options?.guidance_scale || 3.5,
                num_images: options?.num_images || 1,
                enable_safety_checker: options?.enable_safety_checker ?? true,
                image_urls: image_urls || []
            },
        });

        return result;
    } catch (error) {
        console.error("Error generating image:", error);
        throw error;
    }
};