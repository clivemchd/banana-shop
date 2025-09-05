import type { 
  AnalyzeImageArea,
  UploadImage,
  UploadImageChunk,
  FinalizeImageAnalysis
} from "wasp/server/operations";
import type { Image } from "wasp/entities";
import { HttpError } from "wasp/server";
import * as fal from "@fal-ai/serverless-client";

// In-memory storage for chunked uploads (in production, use Redis or similar)
const chunkStorage: Map<string, { chunks: string[], totalChunks: number, selection?: any }> = new Map();

type AnalyzeImageAreaArgs = {
  fullImageUrl: string;
  croppedImageUrl: string;
  selection: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
};

type UploadImageArgs = {
  imageData: string; // base64 encoded image
  description?: string;
};

type UploadImageChunkArgs = {
  uploadId: string;
  chunkIndex: number;
  totalChunks: number;
  chunkData: string;
  selection?: any;
};

type FinalizeImageAnalysisArgs = {
  uploadId: string;
};

export const analyzeImageArea: AnalyzeImageArea = async (args) => {
  try {
    const { imageData, selection } = args;
    console.log('analyzeImageArea called with selection:', selection);
    console.log('Image data type:', typeof imageData);
    
    // Parse the selection coordinates
    const { x, y, width, height } = selection;
    console.log('Selection coordinates:', { x, y, width, height });
    
    // Since we're now receiving the full quality cropped image directly from the frontend,
    // we can pass it directly to the AI analysis
    const imageDataStr = imageData as string;
    console.log('Received full quality cropped image, length:', imageDataStr.length);
    
    // Call the AI analysis with the image containing the red dotted marking
    // For fal.ai, we send the full image with the marked area
    const result = await analyzeWithFalAI(imageDataStr, selection);
    return result;
  } catch (error) {
    console.error('Error in analyzeImageArea:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to analyze image: ${errorMessage}`);
  }
};

export const uploadImageChunk: UploadImageChunk<UploadImageChunkArgs, any> = async ({ 
  uploadId, 
  chunkIndex, 
  totalChunks, 
  chunkData,
  selection 
}, context) => {
  try {
    console.log(`📦 Uploading chunk ${chunkIndex + 1}/${totalChunks} for upload ${uploadId}`);
    
    if (!chunkStorage.has(uploadId)) {
      chunkStorage.set(uploadId, { 
        chunks: new Array(totalChunks).fill(''),
        totalChunks,
        selection
      });
    }
    
    const uploadData = chunkStorage.get(uploadId)!;
    uploadData.chunks[chunkIndex] = chunkData;
    
    // Check if all chunks are received
    const receivedChunks = uploadData.chunks.filter(chunk => chunk !== '').length;
    
    return {
      success: true,
      receivedChunks,
      totalChunks,
      isComplete: receivedChunks === totalChunks
    };
  } catch (error) {
    console.error('Error uploading chunk:', error);
    throw new HttpError(500, "Failed to upload chunk");
  }
};

export const finalizeImageAnalysis: FinalizeImageAnalysis<FinalizeImageAnalysisArgs, any> = async ({ uploadId }, context) => {
  try {
    console.log(`🔄 Finalizing analysis for upload ${uploadId}`);
    
    const uploadData = chunkStorage.get(uploadId);
    if (!uploadData) {
      throw new HttpError(404, "Upload not found");
    }
    
    // Reconstruct the full image
    const fullImageData = uploadData.chunks.join('');
    console.log(`✅ Reconstructed image, total length: ${fullImageData.length}`);
    
    // Analyze with fal.ai
    const result = await analyzeWithFalAI(fullImageData, uploadData.selection);
    
    // Clean up storage
    chunkStorage.delete(uploadId);
    
    return {
      success: true,
      analysis: result
    };
  } catch (error) {
    console.error('❌ Error finalizing image analysis:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new HttpError(500, `Failed to finalize analysis: ${errorMessage}`);
  }
};
export const uploadImage: UploadImage<UploadImageArgs, any> = async (
  { imageData, description },
  context
) => {
  if (!context.user) {
    throw new HttpError(401, "User not authenticated");
  }

  try {
    // Here you would typically upload to a cloud storage service
    // For now, we'll simulate storing the image
    const imageUrl = `data:image/png;base64,${imageData}`;
    
    const image = await context.entities.Image.create({
      data: {
        url: imageUrl,
        description: description || "User uploaded image",
        userId: context.user.id
      }
    });

    return {
      success: true,
      imageId: image.id,
      imageUrl: image.url
    };
  } catch (error) {
    console.error('Error uploading image:', error);
    throw new HttpError(500, "Failed to upload image");
  }
};

async function analyzeWithFalAI(
  imageWithMarkingUrl: string, 
  selection: {x: number, y: number, width: number, height: number}
): Promise<string> {
  try {
    console.log('🔍 Analyzing with fal.ai SA2VA model...');
    console.log('📐 Selection area:', selection);
    console.log('🖼️ Image with marking length:', imageWithMarkingUrl.length);
    
    // Configure fal.ai client
    fal.config({
      credentials: process.env.FAL_KEY || 'your-fal-api-key'
    });

    const analysisPrompt = `Analyze the area marked by the red dotted line and provide a detailed analysis including:

Object Identification: What specific object(s), person(s), or element(s) are contained within the marked area?

Physical Description: Describe the visual characteristics - colors, textures, shapes, size relative to the image, condition/state.

Contextual Relationship: How does this marked element relate to and interact with the surrounding elements in the full image?

Spatial Analysis: Where is this positioned in the image (foreground/background, left/right, etc.) and what is its relationship to nearby objects?

Functional Analysis: What is the purpose or function of this element? What might it be used for?

Environmental Context: What does this tell us about the setting, time period, or situation depicted in the image?

Notable Details: Are there any text, logos, distinctive features, or unusual characteristics visible in this area?

Emotional/Atmospheric Context: What mood, emotion, or atmosphere does this element contribute to the overall image?

Technical Observations: Comment on lighting, focus, image quality, or photographic aspects specific to this region.

Please be as specific and detailed as possible, noting even small details that might be significant.`;

    console.log('� Sending request to fal.ai SA2VA model...');
    
    const result = await fal.subscribe("fal-ai/sa2va/8b/image", {
      input: {
        image_url: imageWithMarkingUrl,
        prompt: analysisPrompt
      }
    });

    console.log('✅ Got response from fal.ai');
    console.log('📄 Full response:', JSON.stringify(result, null, 2));

    const resultData = result as any;
    if (resultData.data && resultData.data.output) {
      const analysis = resultData.data.output;
      console.log('💬 AI Analysis:', analysis);
      return analysis;
    } else if (resultData.output) {
      const analysis = resultData.output;
      console.log('💬 AI Analysis:', analysis);
      return analysis;
    } else {
      console.error('❌ Invalid response format:', result);
      throw new Error('Invalid response format from fal.ai');
    }

  } catch (error) {
    console.error('❌ fal.ai API call failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return `Unable to analyze the selected area using fal.ai SA2VA model. Please check your API key and try again. Error: ${errorMessage}`;
  }
}
