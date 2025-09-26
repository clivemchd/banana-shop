# Building an AI-Powered Image Area Analyzer with Wasp, React, and fal.ai

## Complete Tutorial: From Setup to Production

This comprehensive tutorial will guide you through building a sophisticated image analysis tool that allows users to upload images, select specific areas with visual selection tools, and get detailed AI-powered analysis using fal.ai's SA2VA model. We'll cover everything from initial setup to handling large file uploads with chunking and streaming.

## Table of Contents

1. [Project Overview](#project-overview)
2. [Prerequisites and Setup](#prerequisites-and-setup)
3. [Wasp Configuration](#wasp-configuration)
4. [Database Schema Design](#database-schema-design)
5. [Server-Side Implementation](#server-side-implementation)
6. [Frontend Development](#frontend-development)
7. [Image Processing and Coordinate Systems](#image-processing-and-coordinate-systems)
8. [Chunked Upload Implementation](#chunked-upload-implementation)
9. [AI Integration with fal.ai](#ai-integration-with-falai)
10. [Visual Selection Tool](#visual-selection-tool)
11. [Troubleshooting Common Issues](#troubleshooting-common-issues)
12. [Performance Optimization](#performance-optimization)
13. [Deployment Considerations](#deployment-considerations)

## Project Overview

### What We're Building

Our Image Area Analyzer allows users to:
- Upload high-quality images without compression
- Select specific areas using an intuitive click-and-drag interface
- View selected areas marked with red dotted lines
- Get detailed AI analysis of selected regions
- Handle large files through chunked uploads with pause/resume functionality

### Key Features

- **Visual Selection Tool**: Interactive image selection with real-time visual feedback
- **AI-Powered Analysis**: Integration with fal.ai's SA2VA model for detailed image analysis
- **Chunked Upload System**: Handle large files without payload size limitations
- **Coordinate System Management**: Accurate mapping between display and natural image coordinates
- **Real-time Progress Tracking**: Upload progress with pause/resume capabilities
- **Detailed Analysis Prompts**: Comprehensive analysis covering multiple aspects of the selected area

### Architecture Overview

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Wasp Server    │    │   fal.ai API    │
│   (React)       │◄──►│   (Node.js)      │◄──►│   (SA2VA Model) │
│                 │    │                  │    │                 │
│ • Image Upload  │    │ • Chunk Storage  │    │ • Image Analysis│
│ • Area Selection│    │ • Image Processing│    │ • AI Processing │
│ • Progress UI   │    │ • Coordinate Calc│    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Prerequisites and Setup

### Required Dependencies

```bash
# Core Wasp framework
npm install -g @wasp-lang/cli

# AI and Image Processing
npm install @fal-ai/serverless-client
npm install canvas  # For server-side image manipulation

# Development dependencies
npm install -D @types/canvas
```

### Environment Configuration

Create a `.env.server` file in your project root:

```env
# fal.ai API Configuration
FAL_KEY=your_fal_ai_api_key_here

# Database (handled by Wasp)
DATABASE_URL=postgresql://...
```

### Project Structure

```
micro-banana/
├── main.wasp                 # Wasp configuration
├── schema.prisma            # Database schema
├── .env.server             # Environment variables
├── src/
│   ├── client/
│   │   └── pages/
│   │       └── imageAnalyzer/
│   │           └── ImageAnalyzerPage.tsx
│   └── server/
│       └── imageAnalysis.ts
├── public/
│   └── assets/
└── migrations/
```

## Wasp Configuration

### Main Application Configuration

The `main.wasp` file defines our application structure:

```wasp
app MicroBanana {
  wasp: {
    version: "^0.17.1"
  },
  title: "Micro Banana",
  head: [
    "<link rel='icon' href='/favicon.ico' />",
  ],
  auth: {
    userEntity: Users,
    methods: {
      usernameAndPassword: {}
    },
    onAuthFailedRedirectTo: "/signin"
  }
}

// Authentication routes
route SignUpPageRoute { path: "/signup", to: SignUpPage }
page SignUpPage {
  component: import { SignUpPage } from "@src/client/pages/auth/sign-up"
}

route SignInPageRoute { path: "/signin", to: SignInPage }
page SignInPage {
  component: import { SignInPage } from "@src/client/pages/auth/sign-in"
}

// Main application routes
route DashboardPageRoute { path: "/", to: DashboardPage }
page DashboardPage {
  authRequired: true,
  component: import { DashboardPage } from "@src/client/pages/dashboard/dashboard"
}

route ImageAnalyzerPageRoute { path: "/analyzer", to: ImageAnalyzerPage }
page ImageAnalyzerPage {
  authRequired: true,
  component: import { ImageAnalyzerPage } from "@src/client/pages/imageAnalyzer/ImageAnalyzerPage"
}

// Image analysis operations
action analyzeImageArea {
  fn: import { analyzeImageArea } from "@src/server/imageAnalysis"
}

action uploadImage {
  fn: import { uploadImage } from "@src/server/imageAnalysis"
}

action uploadImageChunk {
  fn: import { uploadImageChunk } from "@src/server/imageAnalysis"
}

action finalizeImageAnalysis {
  fn: import { finalizeImageAnalysis } from "@src/server/imageAnalysis"
}

// Entities
entity Users {=psl
  id       Int     @id @default(autoincrement())
  username String  @unique
  password String
  images   Image[]
psl=}

entity Image {=psl
  id          Int      @id @default(autoincrement())
  url         String
  description String?
  createdAt   DateTime @default(now())
  user        Users    @relation(fields: [userId], references: [id])
  userId      Int
psl=}
```

### Key Configuration Decisions

1. **Authentication**: We use username/password authentication for simplicity
2. **Route Protection**: The analyzer requires authentication (`authRequired: true`)
3. **Operations**: We define multiple actions for different stages of image processing
4. **Modular Structure**: Separate components for different functionalities

## Database Schema Design

### User and Image Entities

```prisma
entity Users {=psl
  id          Int     @id @default(autoincrement())
  username    String  @unique
  password    String
  images      Image[]
psl=}

entity Image {=psl
  id          Int      @id @default(autoincrement())
  url         String
  description String?
  createdAt   DateTime @default(now())
  user        Users    @relation(fields: [userId], references: [id])
  userId      Int
psl=}
```

### Schema Considerations

- **URL Storage**: We store image URLs rather than raw data for better performance
- **User Relationship**: Each image belongs to a user
- **Scalability**: In production, consider storing images in cloud storage (S3, etc.)
- **Metadata**: Description field for additional context

## Server-Side Implementation

### Core Server Functions

Let's examine the complete server-side implementation in `src/server/imageAnalysis.ts`:

```typescript
import type { 
  AnalyzeImageArea,
  UploadImage,
  UploadImageChunk,
  FinalizeImageAnalysis
} from "wasp/server/operations";
import type { Image } from "wasp/entities";
import { HttpError } from "wasp/server";
import * as fal from "@fal-ai/serverless-client";

// In-memory storage for chunked uploads (use Redis in production)
const chunkStorage: Map<string, { 
  chunks: string[], 
  totalChunks: number, 
  selection?: any 
}> = new Map();

// Type definitions for our operations
type AnalyzeImageAreaArgs = {
  imageData: string;
  selection: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
};

type UploadImageArgs = {
  imageData: string;
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
```

### AI Analysis Function

The core AI integration function using fal.ai's SA2VA model:

```typescript
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

    // Detailed analysis prompt covering all aspects
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

    console.log('📡 Sending request to fal.ai SA2VA model...');
    
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
```

### Chunked Upload Implementation

To handle large image files, we implement a chunked upload system:

```typescript
// Upload image in chunks to handle large files
export const uploadImageChunk: UploadImageChunk<UploadImageChunkArgs, any> = async ({ 
  uploadId, 
  chunkIndex, 
  totalChunks, 
  chunkData,
  selection 
}, context) => {
  console.log(`📦 Uploading chunk ${chunkIndex + 1}/${totalChunks} for upload ${uploadId}`);
  
  try {
    // Get or create storage entry for this upload
    let uploadData = chunkStorage.get(uploadId);
    if (!uploadData) {
      uploadData = { 
        chunks: new Array(totalChunks).fill(''), 
        totalChunks,
        selection 
      };
      chunkStorage.set(uploadId, uploadData);
    }
    
    // Store this chunk
    uploadData.chunks[chunkIndex] = chunkData;
    
    // Update selection if provided
    if (selection) {
      uploadData.selection = selection;
    }
    
    return { success: true, chunksReceived: chunkIndex + 1, totalChunks };
  } catch (error) {
    console.error('Error uploading chunk:', error);
    throw new HttpError(500, 'Failed to upload chunk');
  }
};

// Finalize the upload and trigger analysis
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
```

### Image Processing with Red Dotted Line

The system creates an image with the red dotted line overlay directly in the frontend before sending to the server:

```typescript
// Main analysis function
export const analyzeImageArea: AnalyzeImageArea = async (args) => {
  try {
    const { imageData, selection } = args;
    console.log('analyzeImageArea called with selection:', selection);
    console.log('Image data type:', typeof imageData);
    
    // Parse the selection coordinates
    const { x, y, width, height } = selection;
    console.log('Selection coordinates:', { x, y, width, height });
    
    // The frontend sends us the full quality image with red dotted marking
    const imageDataStr = imageData as string;
    console.log('Received full quality image with marking, length:', imageDataStr.length);
    
    // Call the AI analysis with the image containing the red dotted marking
    const result = await analyzeWithFalAI(imageDataStr, selection);
    return result;
  } catch (error) {
    console.error('Error in analyzeImageArea:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to analyze image: ${errorMessage}`);
  }
};
```

## Frontend Development

### Component Structure and State Management

The frontend component in `src/client/pages/imageAnalyzer/ImageAnalyzerPage.tsx` manages complex state:

```typescript
import React, { useState, useRef, useCallback } from 'react';
import { analyzeImageArea, uploadImage, uploadImageChunk, finalizeImageAnalysis } from 'wasp/client/operations';

interface SelectionArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const ImageAnalyzerPage = () => {
  // Core state management
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [selection, setSelection] = useState<SelectionArea | null>(null);
  const [displaySelection, setDisplaySelection] = useState<SelectionArea | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [analysis, setAnalysis] = useState<string>('');
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
  const [croppedImagePreview, setCroppedImagePreview] = useState<string | null>(null);
  
  // Chunked upload state
  const [uploadProgress, setUploadProgress] = useState<{ 
    current: number; 
    total: number 
  } | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [currentUploadId, setCurrentUploadId] = useState<string | null>(null);
  
  // References for DOM manipulation
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
```

### Image Upload and Compression

```typescript
// Image compression function to optimize upload size while maintaining quality
const compressImage = useCallback((file: File, maxWidth: number = 800, quality: number = 0.8): Promise<string> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const img = new Image();
    
    img.onload = () => {
      // Calculate new dimensions while maintaining aspect ratio
      const { width, height } = img;
      const ratio = Math.min(maxWidth / width, maxWidth / height);
      const newWidth = width * ratio;
      const newHeight = height * ratio;
      
      // Set canvas dimensions and draw compressed image
      canvas.width = newWidth;
      canvas.height = newHeight;
      ctx.drawImage(img, 0, 0, newWidth, newHeight);
      
      // Convert to base64 with specified quality
      const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
      resolve(compressedDataUrl);
    };
    
    img.src = URL.createObjectURL(file);
  });
}, []);

// Handle file upload
const handleImageUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0];
  if (!file) return;
  
  setIsUploading(true);
  try {
    // Compress the image for display but keep original quality for analysis
    const compressedImage = await compressImage(file, 800, 0.9);
    setUploadedImage(compressedImage);
    setSelection(null);
    setDisplaySelection(null);
    setAnalysis('');
    setCroppedImagePreview(null);
  } catch (error) {
    console.error('Error processing image:', error);
    alert('Failed to process image');
  } finally {
    setIsUploading(false);
  }
}, [compressImage]);
```

## Image Processing and Coordinate Systems

### Coordinate System Management

One of the most complex parts is managing coordinates between display and natural image coordinates:

```typescript
// Convert mouse coordinates to image coordinates
const getImageCoordinates = useCallback((event: React.MouseEvent) => {
  if (!imageRef.current) return null;
  
  const imageRect = imageRef.current.getBoundingClientRect();
  
  // Get coordinates relative to the image element itself
  const x = event.clientX - imageRect.left;
  const y = event.clientY - imageRect.top;
  
  // Make sure coordinates are within image bounds
  if (x < 0 || y < 0 || x > imageRef.current.width || y > imageRef.current.height) {
    return null;
  }
  
  // Convert to natural image coordinates for processing
  const scaleX = imageRef.current.naturalWidth / imageRef.current.width;
  const scaleY = imageRef.current.naturalHeight / imageRef.current.height;
  
  return {
    x: x * scaleX,      // Natural image coordinates for processing
    y: y * scaleY,      // Natural image coordinates for processing
    displayX: x,        // Display coordinates for UI overlay
    displayY: y         // Display coordinates for UI overlay
  };
}, []);
```

### Mouse Event Handling for Selection

The selection system uses mouse events to create rectangular selections:

```typescript
// Handle mouse down - start selection
const handleMouseDown = useCallback((event: React.MouseEvent) => {
  if (!uploadedImage || !imageRef.current) return;
  
  const coords = getImageCoordinates(event);
  if (coords) {
    setIsSelecting(true);
    setStartPoint({ x: coords.displayX, y: coords.displayY });
    setSelection(null);
    setDisplaySelection(null);
  }
}, [uploadedImage, getImageCoordinates]);

// Handle mouse move - update selection
const handleMouseMove = useCallback((event: React.MouseEvent) => {
  if (!isSelecting || !startPoint || !imageRef.current) return;
  
  const coords = getImageCoordinates(event);
  if (coords) {
    // Calculate selection rectangle dimensions
    const width = Math.abs(coords.displayX - startPoint.x);
    const height = Math.abs(coords.displayY - startPoint.y);
    const x = Math.min(coords.displayX, startPoint.x);
    const y = Math.min(coords.displayY, startPoint.y);
    
    // Store display coordinates for rendering the overlay
    setDisplaySelection({ x, y, width, height });
    
    // Convert to natural image coordinates for processing
    const scaleX = imageRef.current.naturalWidth / imageRef.current.width;
    const scaleY = imageRef.current.naturalHeight / imageRef.current.height;
    
    setSelection({
      x: x * scaleX,
      y: y * scaleY,
      width: width * scaleX,
      height: height * scaleY
    });
  }
}, [isSelecting, startPoint, getImageCoordinates]);

// Handle mouse up - end selection
const handleMouseUp = useCallback(() => {
  setIsSelecting(false);
  setStartPoint(null);
}, []);
```

## Chunked Upload Implementation

### Frontend Chunked Upload System

The frontend chunked upload system handles large files efficiently:

```typescript
// Upload image in chunks with progress tracking
const uploadImageInChunks = useCallback(async (
  imageData: string, 
  selection: SelectionArea
): Promise<string> => {
  const CHUNK_SIZE = 50000; // ~50KB per chunk
  const chunks: string[] = [];
  
  // Split image data into chunks
  for (let i = 0; i < imageData.length; i += CHUNK_SIZE) {
    chunks.push(imageData.slice(i, i + CHUNK_SIZE));
  }
  
  const uploadId = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const totalChunks = chunks.length;
  
  console.log(`📦 Starting chunked upload: ${totalChunks} chunks, ${imageData.length} total bytes`);
  
  setCurrentUploadId(uploadId);
  setUploadProgress({ current: 0, total: totalChunks });
  
  try {
    // Upload each chunk with pause/resume functionality
    for (let i = 0; i < chunks.length; i++) {
      // Check if upload is paused
      while (isPaused) {
        console.log('⏸️ Upload paused, waiting...');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      console.log(`📤 Uploading chunk ${i + 1}/${totalChunks}`);
      
      const result = await uploadImageChunk({
        uploadId,
        chunkIndex: i,
        totalChunks,
        chunkData: chunks[i],
        selection
      } as any);
      
      setUploadProgress({ current: i + 1, total: totalChunks });
      
      if (!result.success) {
        throw new Error(`Failed to upload chunk ${i + 1}`);
      }
      
      // Small delay to prevent overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('✅ All chunks uploaded, finalizing analysis...');
    
    // Finalize the analysis
    const analysisResult = await finalizeImageAnalysis({ uploadId } as any);
    
    if (analysisResult.success) {
      return analysisResult.analysis;
    } else {
      throw new Error('Failed to finalize analysis');
    }
    
  } catch (error) {
    console.error('Error in chunked upload:', error);
    throw error;
  } finally {
    setUploadProgress(null);
    setCurrentUploadId(null);
  }
}, [isPaused]);

// Pause/Resume/Cancel functions
const pauseUpload = useCallback(() => {
  setIsPaused(true);
}, []);

const resumeUpload = useCallback(() => {
  setIsPaused(false);
}, []);

const cancelUpload = useCallback(() => {
  setIsPaused(false);
  setUploadProgress(null);
  setCurrentUploadId(null);
}, []);
```

### Image Processing for Analysis

```typescript
// Main analysis function with image processing
const handleAnalyzeSelection = useCallback(async () => {
  if (!selection || !uploadedImage) return;
  
  setIsAnalyzing(true);
  setAnalysis('');
  
  try {
    // Create image element to work with
    const img = new Image();
    
    img.onload = async () => {
      try {
        // Create a canvas with the full image and red dotted overlay
        const fullCanvas = document.createElement('canvas');
        const fullCtx = fullCanvas.getContext('2d');
        
        if (!fullCtx) {
          throw new Error('Cannot get full canvas context');
        }
        
        // Set canvas to original image size
        fullCanvas.width = img.naturalWidth;
        fullCanvas.height = img.naturalHeight;
        
        // Draw the original image
        fullCtx.drawImage(img, 0, 0);
        
        // Draw red dotted outline around selected area
        fullCtx.strokeStyle = '#dc2626';
        fullCtx.lineWidth = 4;
        fullCtx.setLineDash([10, 5]);
        fullCtx.strokeRect(selection.x, selection.y, selection.width, selection.height);
        
        // Convert to base64
        const imageWithMarking = fullCanvas.toDataURL('image/png', 1.0);
        
        // Also create the cropped area separately for preview
        const cropCanvas = document.createElement('canvas');
        const cropCtx = cropCanvas.getContext('2d');
        
        if (!cropCtx) {
          throw new Error('Cannot get crop canvas context');
        }
        
        cropCanvas.width = selection.width;
        cropCanvas.height = selection.height;
        
        // Draw the selected area onto the canvas with full quality
        cropCtx.drawImage(
          img,
          selection.x, selection.y, selection.width, selection.height,
          0, 0, selection.width, selection.height
        );
        
        const croppedPreview = cropCanvas.toDataURL('image/png', 1.0);
        
        // Save the cropped image for preview
        setCroppedImagePreview(croppedPreview);
        
        console.log('Original image size:', img.naturalWidth, 'x', img.naturalHeight);
        console.log('Selected area:', selection);
        console.log('Full image with marking length:', imageWithMarking.length);
        console.log('Cropped preview length:', croppedPreview.length);
        
        // Use chunked upload for large images
        const result = await uploadImageInChunks(imageWithMarking, selection);
        
        setAnalysis(typeof result === 'string' ? result : 'Analysis completed');
        setIsAnalyzing(false);
      } catch (error) {
        console.error('Error processing image:', error);
        setIsAnalyzing(false);
      }
    };
    
    img.onerror = () => {
      console.error('Failed to load image');
      setIsAnalyzing(false);
    };
    
    img.src = uploadedImage;
    
  } catch (error) {
    console.error('Failed to analyze image area:', error);
    alert('Failed to analyze image area');
    setIsAnalyzing(false);
  }
}, [selection, uploadedImage, uploadImageInChunks]);
```

## Visual Selection Tool

### Overlay Styling and Positioning

```typescript
// Calculate overlay style for visual feedback
const getSelectionStyle = useCallback(() => {
  if (!displaySelection || !imageRef.current || !containerRef.current) return {};
  
  // Get the current positions
  const containerRect = containerRef.current.getBoundingClientRect();
  const imageRect = imageRef.current.getBoundingClientRect();
  
  // Calculate image position within container
  const imageLeft = imageRect.left - containerRect.left;
  const imageTop = imageRect.top - containerRect.top;
  
  return {
    position: 'absolute' as const,
    left: imageLeft + displaySelection.x,
    top: imageTop + displaySelection.y,
    width: displaySelection.width,
    height: displaySelection.height,
    border: '3px dashed #dc2626',
    backgroundColor: 'rgba(220, 38, 38, 0.1)',
    pointerEvents: 'none' as const,
    zIndex: 10,
  };
}, [displaySelection]);
```

### Complete JSX Structure

```typescript
return (
  <div className="min-h-screen bg-gray-50 py-8">
    <div className="max-w-4xl mx-auto px-4">
      <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
        Image Area Analyzer
      </h1>
      <p className="text-center text-gray-600 mb-8">
        Powered by fal.ai SA2VA Vision Model
      </p>

      {/* File Upload */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Upload an image to analyze
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
        <p className="text-xs text-gray-500 mt-1">
          Images will be automatically compressed to ensure fast uploads. Supported formats: JPG, PNG, GIF
        </p>
      </div>

      {/* Upload Progress */}
      {isUploading && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-blue-700 text-sm">
            📸 Compressing and uploading image...
          </p>
        </div>
      )}

      {/* Image Display and Selection */}
      {uploadedImage && (
        <div className="mb-6">
          <p className="text-sm text-gray-600 mb-4">
            Click and drag to select an area for analysis (marked with red dotted line)
          </p>
          <div
            ref={containerRef}
            className="relative inline-block border rounded-lg overflow-hidden cursor-crosshair"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <img
              ref={imageRef}
              src={uploadedImage}
              alt="Uploaded for analysis"
              className="max-w-full max-h-96 object-contain"
              draggable={false}
            />
            {displaySelection && <div style={getSelectionStyle()} />}
          </div>
        </div>
      )}

      {/* Upload Progress for Chunked Upload */}
      {uploadProgress && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <span className="text-blue-700 text-sm font-medium">
              Uploading chunks: {uploadProgress.current}/{uploadProgress.total}
            </span>
            <span className="text-blue-700 text-sm">
              {Math.round((uploadProgress.current / uploadProgress.total) * 100)}%
            </span>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${(uploadProgress.current / uploadProgress.total) * 100}%`
              }}
            />
          </div>
          <div className="mt-2 flex gap-2">
            {isPaused ? (
              <button
                onClick={resumeUpload}
                className="px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
              >
                ▶️ Resume
              </button>
            ) : (
              <button
                onClick={pauseUpload}
                className="px-3 py-1 text-xs bg-yellow-500 text-white rounded hover:bg-yellow-600"
              >
                ⏸️ Pause
              </button>
            )}
            <button
              onClick={cancelUpload}
              className="px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
            >
              ❌ Cancel
            </button>
          </div>
        </div>
      )}

      {/* Analyze Button */}
      {selection && !isAnalyzing && !uploadProgress && (
        <div className="mb-6">
          <button
            onClick={handleAnalyzeSelection}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            🔍 Analyze Selected Area
          </button>
        </div>
      )}

      {/* Analysis Loading */}
      {isAnalyzing && (
        <div className="mb-6 p-4 bg-yellow-50 rounded-lg">
          <p className="text-yellow-700 text-sm">
            🤖 AI is analyzing the selected area...
          </p>
        </div>
      )}

      {/* Cropped Image Preview */}
      {croppedImagePreview && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Selected Area Preview
          </h3>
          <img
            src={croppedImagePreview}
            alt="Cropped selection preview"
            className="border rounded-lg max-w-xs"
          />
        </div>
      )}

      {/* Analysis Results */}
      {analysis && (
        <div className="mb-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Analysis Results
            </h3>
            <p className="text-gray-700 whitespace-pre-wrap">{analysis}</p>
          </div>
        </div>
      )}
    </div>
  </div>
);
```

## AI Integration with fal.ai

### Setting up fal.ai Integration

1. **Get API Key**: Sign up at [fal.ai](https://fal.ai) and obtain your API key
2. **Install Client**: `npm install @fal-ai/serverless-client`
3. **Configure Environment**: Add `FAL_KEY=your_api_key` to `.env.server`

### Model Selection: SA2VA 8b

We use fal.ai's SA2VA (Segment Anything 2 Video Analyzer) model which excels at:
- Understanding spatial relationships in images
- Providing detailed textual descriptions
- Analyzing specific regions within larger images
- Contextual understanding of objects and scenes

### Prompt Engineering

Our analysis prompt covers nine key areas:

1. **Object Identification**: What's in the selected area
2. **Physical Description**: Visual characteristics and properties
3. **Contextual Relationship**: How it relates to the whole image
4. **Spatial Analysis**: Position and spatial relationships
5. **Functional Analysis**: Purpose and intended use
6. **Environmental Context**: Setting and context clues
7. **Notable Details**: Specific features, text, logos
8. **Emotional/Atmospheric Context**: Mood and atmosphere
9. **Technical Observations**: Photography and image quality aspects

## Troubleshooting Common Issues

### Coordinate Alignment Problems

**Problem**: Red selection overlay doesn't align with mouse cursor

**Solutions**:
1. Ensure `getBoundingClientRect()` calls are consistent
2. Check for CSS transforms that might affect positioning
3. Verify container has `position: relative`
4. Add `object-contain` handling for scaled images

```typescript
// Debug coordinate calculations
const debugCoordinates = (event: React.MouseEvent) => {
  const imageRect = imageRef.current?.getBoundingClientRect();
  const containerRect = containerRef.current?.getBoundingClientRect();
  
  console.log('Image rect:', imageRect);
  console.log('Container rect:', containerRect);
  console.log('Mouse coordinates:', { x: event.clientX, y: event.clientY });
};
```

### Chunked Upload Issues

**Problem**: Upload fails or stalls

**Solutions**:
1. Check chunk size (50KB recommended)
2. Implement proper error handling and retry logic
3. Verify server-side chunk storage
4. Add timeout handling

```typescript
// Enhanced error handling for chunks
const uploadChunkWithRetry = async (chunkData: any, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await uploadImageChunk(chunkData);
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
};
```

### AI Analysis Issues

**Problem**: fal.ai returns errors or unexpected responses

**Solutions**:
1. Verify API key is correct
2. Check image format and size
3. Ensure proper base64 encoding
4. Handle different response formats

```typescript
// Robust response parsing
const parseAIResponse = (response: any) => {
  if (typeof response === 'string') return response;
  if (response?.output) return response.output;
  if (response?.data?.output) return response.data.output;
  if (response?.choices?.[0]?.message?.content) return response.choices[0].message.content;
  
  throw new Error('Unable to parse AI response');
};
```

### Performance Issues

**Problem**: Large images cause browser lag or crashes

**Solutions**:
1. Implement proper image compression
2. Use web workers for heavy processing
3. Add loading states and progress indicators
4. Limit maximum image dimensions

```typescript
// Web worker for image processing
const processImageInWorker = (imageData: string) => {
  return new Promise((resolve, reject) => {
    const worker = new Worker('/image-processor-worker.js');
    worker.postMessage({ imageData });
    worker.onmessage = (e) => resolve(e.data);
    worker.onerror = (e) => reject(e);
  });
};
```

## Performance Optimization

### Image Compression Strategy

```typescript
// Multi-tier compression based on use case
const compressionLevels = {
  preview: { maxWidth: 800, quality: 0.7 },    // For UI display
  analysis: { maxWidth: 2048, quality: 0.9 },   // For AI processing
  storage: { maxWidth: 1200, quality: 0.8 }     // For long-term storage
};

const compressForPurpose = (file: File, purpose: keyof typeof compressionLevels) => {
  const config = compressionLevels[purpose];
  return compressImage(file, config.maxWidth, config.quality);
};
```

### Memory Management

```typescript
// Cleanup function to prevent memory leaks
const cleanup = useCallback(() => {
  // Clear canvas contexts
  if (canvasRef.current) {
    const ctx = canvasRef.current.getContext('2d');
    ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  }
  
  // Revoke object URLs
  if (objectUrlsRef.current.length > 0) {
    objectUrlsRef.current.forEach(url => URL.revokeObjectURL(url));
    objectUrlsRef.current = [];
  }
  
  // Clear large state objects
  setUploadedImage(null);
  setCroppedImagePreview(null);
}, []);

useEffect(() => {
  return cleanup; // Cleanup on unmount
}, [cleanup]);
```

### Caching Strategy

```typescript
// Cache processed images to avoid reprocessing
const imageCache = new Map<string, string>();

const getCachedOrProcess = async (imageData: string, processing: () => Promise<string>) => {
  const cacheKey = btoa(imageData.slice(0, 100)); // Use start of data as key
  
  if (imageCache.has(cacheKey)) {
    return imageCache.get(cacheKey)!;
  }
  
  const result = await processing();
  imageCache.set(cacheKey, result);
  
  // Prevent memory bloat
  if (imageCache.size > 10) {
    const firstKey = imageCache.keys().next().value;
    imageCache.delete(firstKey);
  }
  
  return result;
};
```

## Deployment Considerations

### Environment Setup

```bash
# Production environment variables
FAL_KEY=prod_fal_api_key
DATABASE_URL=postgresql://prod_db_url
NODE_ENV=production

# Optional: Redis for production chunk storage
REDIS_URL=redis://prod_redis_url
```

### Scaling Considerations

1. **Storage**: Replace in-memory chunk storage with Redis or database
2. **File Storage**: Use cloud storage (S3, Cloudinary) for images
3. **Rate Limiting**: Implement API rate limiting for fal.ai calls
4. **Monitoring**: Add logging and monitoring for upload failures

### Security Best Practices

```typescript
// Input validation
const validateImageData = (data: string) => {
  if (!data.startsWith('data:image/')) {
    throw new Error('Invalid image format');
  }
  
  const sizeInBytes = (data.length * 3) / 4; // Approximate base64 size
  if (sizeInBytes > 10 * 1024 * 1024) { // 10MB limit
    throw new Error('Image too large');
  }
};

// Sanitize user inputs
const sanitizeSelection = (selection: any) => {
  return {
    x: Math.max(0, Math.floor(Number(selection.x) || 0)),
    y: Math.max(0, Math.floor(Number(selection.y) || 0)),
    width: Math.max(1, Math.floor(Number(selection.width) || 1)),
    height: Math.max(1, Math.floor(Number(selection.height) || 1))
  };
};
```

### Docker Configuration

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

# Install dependencies for canvas
RUN apk add --no-cache \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    giflib-dev \
    librsvg-dev

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000 3001

CMD ["npm", "run", "start"]
```

## Advanced Features

### Real-time Collaboration

```typescript
// WebSocket integration for real-time selection sharing
const useRealtimeSelection = (roomId: string) => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  
  useEffect(() => {
    const ws = new WebSocket(`ws://localhost:3001/rooms/${roomId}`);
    
    ws.onmessage = (event) => {
      const { type, data } = JSON.parse(event.data);
      if (type === 'selection-update') {
        setDisplaySelection(data.selection);
      }
    };
    
    setSocket(ws);
    return () => ws.close();
  }, [roomId]);
  
  const broadcastSelection = useCallback((selection: SelectionArea) => {
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: 'selection-update',
        data: { selection }
      }));
    }
  }, [socket]);
  
  return { broadcastSelection };
};
```

### Advanced Analysis Options

```typescript
// Multiple analysis models
const analysisModels = {
  'detailed': 'fal-ai/sa2va/8b/image',
  'quick': 'fal-ai/fast-analyzer',
  'technical': 'fal-ai/technical-analyzer'
};

const analyzeWithModel = async (
  imageData: string, 
  selection: SelectionArea, 
  modelType: keyof typeof analysisModels
) => {
  const modelId = analysisModels[modelType];
  const prompt = getPromptForModel(modelType);
  
  return await fal.subscribe(modelId, {
    input: { image_url: imageData, prompt }
  });
};
```

### Batch Processing

```typescript
// Process multiple selections simultaneously
const analyzeBatch = async (selections: SelectionArea[]) => {
  const promises = selections.map(async (selection, index) => {
    const croppedImage = await cropImageArea(uploadedImage!, selection);
    const analysis = await analyzeWithFalAI(croppedImage, selection);
    return { index, selection, analysis };
  });
  
  return await Promise.all(promises);
};
```

## Conclusion

This tutorial covered building a comprehensive AI-powered image area analyzer with:

- **Wasp Framework**: For rapid full-stack development
- **React Frontend**: With complex state management and user interactions
- **fal.ai Integration**: For advanced AI-powered image analysis
- **Chunked Upload System**: For handling large files efficiently
- **Visual Selection Tools**: With precise coordinate management
- **Production Considerations**: For scalability and security

### Key Takeaways

1. **Coordinate Systems**: Carefully manage display vs. natural image coordinates
2. **Performance**: Implement chunked uploads and proper memory management
3. **User Experience**: Provide visual feedback and progress indicators
4. **AI Integration**: Use detailed prompts for better analysis results
5. **Error Handling**: Implement robust error handling throughout the pipeline

### Next Steps

- Add user accounts and image history
- Implement batch processing for multiple images
- Add export functionality for analysis results
- Integrate additional AI models for different analysis types
- Add collaborative features for team analysis

The complete source code demonstrates a production-ready image analysis tool that can be extended and customized for various use cases.
