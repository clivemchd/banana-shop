import { GoogleGenAI, Modality } from "@google/genai";

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

export const generateImage = async (args: GenerateImageArgs, context: any): Promise<string> => {
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
            return imagePartData;
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