import type { 
  AnalyzeImageArea,
  UploadImage
} from "wasp/server/operations";
import type { Image } from "wasp/entities";
import { HttpError } from "wasp/server";
import { LMStudioClient } from "@lmstudio/sdk";

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
    
    // Call the AI analysis with the cropped image
    const result = await analyzeWithVisionAI(imageDataStr, selection);
    return result;
  } catch (error) {
    console.error('Error in analyzeImageArea:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to analyze image: ${errorMessage}`);
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

async function analyzeWithVisionAI(
  croppedImageUrl: string, 
  selection: {x: number, y: number, width: number, height: number}
): Promise<string> {
  try {
    console.log('🔍 Analyzing with LM Studio...');
    console.log('📐 Selection area:', selection);
    console.log('✂️ Cropped image length:', croppedImageUrl.length);
    
    // Check if we have a valid data URL
    if (!croppedImageUrl.startsWith('data:image/')) {
      throw new Error('Invalid image format - not a data URL');
    }
    
    console.log('🔧 Using direct HTTP API call to LM Studio...');
    console.log('📸 Cropped image preview:', croppedImageUrl.substring(0, 100) + '...');
    
    // Use direct HTTP API call to LM Studio's OpenAI-compatible endpoint
    const requestBody = {
      model: 'minicpm-o-2_6',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'What do you see in this image? Describe it in detail, including any objects, colors, text, people, or activities visible.'
            },
            {
              type: 'image_url',
              image_url: {
                url: croppedImageUrl  // Use the full data URL including the header
              }
            }
          ]
        }
      ],
      max_tokens: 500,
      temperature: 0.1
    };

    console.log('📤 Sending request to LM Studio...');
    
    const response = await fetch('http://localhost:1234/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    console.log('📡 Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ HTTP error response:', errorText);
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ Got response from LM Studio via HTTP API');
    console.log('📄 Full response:', JSON.stringify(result, null, 2));

    if (result.choices && result.choices[0] && result.choices[0].message) {
      const content = result.choices[0].message.content;
      console.log('💬 AI Response:', content);
      return content || "Unable to analyze the selected area.";
    } else {
      console.error('❌ Invalid response format:', result);
      throw new Error('Invalid response format from LM Studio');
    }

  } catch (error) {
    console.error('❌ LM Studio HTTP API call failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return `Unable to analyze the selected area using local LM Studio model. Please ensure LM Studio is running with the MiniCPM-o-2_6 model loaded. Error: ${errorMessage}`;
  }
}