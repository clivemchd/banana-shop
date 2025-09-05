import React, { useState, useRef, useCallback } from 'react';
import { analyzeImageArea, uploadImage, uploadImageChunk, finalizeImageAnalysis } from 'wasp/client/operations';

interface SelectionArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const ImageAnalyzerPage = () => {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [selection, setSelection] = useState<SelectionArea | null>(null);
  const [displaySelection, setDisplaySelection] = useState<SelectionArea | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [analysis, setAnalysis] = useState<string>('');
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
  const [croppedImagePreview, setCroppedImagePreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [currentUploadId, setCurrentUploadId] = useState<string | null>(null);
  
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const compressImage = useCallback((file: File, maxWidth: number = 800, quality: number = 0.8): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img;
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        // Set canvas size
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      };
      
      img.src = URL.createObjectURL(file);
    });
  }, []);

  const handleImageUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsUploading(true);
      try {
        // Compress the image before upload
        const compressedDataUrl = await compressImage(file, 800, 0.8);
        const base64Content = compressedDataUrl.split(',')[1]; // Remove data:image/xxx;base64, prefix
        
        const result = await uploadImage({
          imageData: base64Content,
          description: `Uploaded ${file.name}`
        });
        
        if (result.success) {
          setUploadedImage(result.imageUrl);
          setSelection(null);
          setAnalysis('');
        }
      } catch (error) {
        console.error('Upload failed:', error);
        alert('Failed to upload image. Please try a smaller image.');
      } finally {
        setIsUploading(false);
      }
    }
  }, [compressImage]);

  const getImageCoordinates = useCallback((event: React.MouseEvent) => {
    if (!imageRef.current || !containerRef.current) return null;
    
    const rect = imageRef.current.getBoundingClientRect();
    const containerRect = containerRef.current.getBoundingClientRect();
    
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Convert to image natural coordinates
    const scaleX = imageRef.current.naturalWidth / imageRef.current.width;
    const scaleY = imageRef.current.naturalHeight / imageRef.current.height;
    
    return {
      x: x * scaleX,
      y: y * scaleY,
      displayX: x,
      displayY: y
    };
  }, []);

  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    if (!uploadedImage) return;
    
    const coords = getImageCoordinates(event);
    if (coords) {
      setIsSelecting(true);
      setStartPoint({ x: coords.displayX, y: coords.displayY });
      setSelection(null);
      setDisplaySelection(null);
    }
  }, [uploadedImage, getImageCoordinates]);

  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    if (!isSelecting || !startPoint || !imageRef.current) return;
    
    const coords = getImageCoordinates(event);
    if (coords) {
      const width = Math.abs(coords.displayX - startPoint.x);
      const height = Math.abs(coords.displayY - startPoint.y);
      const x = Math.min(coords.displayX, startPoint.x);
      const y = Math.min(coords.displayY, startPoint.y);
      
      // Store display coordinates for rendering the overlay
      setDisplaySelection({
        x: x,
        y: y,
        width: width,
        height: height
      });
      
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

  const handleMouseUp = useCallback(() => {
    setIsSelecting(false);
    setStartPoint(null);
  }, []);

  const cropImageArea = useCallback((imageElement: HTMLImageElement, selection: SelectionArea): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      
      // Set canvas size to the selection area
      canvas.width = selection.width;
      canvas.height = selection.height;
      
      // Draw the cropped portion
      ctx.drawImage(
        imageElement,
        selection.x, selection.y, selection.width, selection.height, // Source rectangle
        0, 0, selection.width, selection.height                      // Destination rectangle
      );
      
      // Convert to base64
      const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.9);
      resolve(croppedDataUrl);
    });
  }, []);

  const uploadImageInChunks = useCallback(async (imageData: string, selection: SelectionArea): Promise<string> => {
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
      // Upload chunks with pause functionality
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
      console.error('❌ Chunked upload failed:', error);
      throw error;
    } finally {
      setCurrentUploadId(null);
      setUploadProgress(null);
    }
  }, [isPaused]);

  const pauseUpload = useCallback(() => {
    setIsPaused(true);
  }, []);

  const resumeUpload = useCallback(() => {
    setIsPaused(false);
  }, []);

  const cancelUpload = useCallback(() => {
    setIsPaused(false);
    setCurrentUploadId(null);
    setUploadProgress(null);
    setIsAnalyzing(false);
  }, []);

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

  const getSelectionStyle = useCallback(() => {
    if (!displaySelection) return {};
    
    return {
      position: 'absolute' as const,
      left: displaySelection.x,
      top: displaySelection.y,
      width: displaySelection.width,
      height: displaySelection.height,
      border: '3px dashed #dc2626',
      backgroundColor: 'rgba(220, 38, 38, 0.1)',
      pointerEvents: 'none' as const,
    };
  }, [displaySelection]);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          Image Area Analyzer
          <span className="block text-sm font-normal text-gray-500 mt-2">
            Powered by fal.ai SA2VA Vision Model
          </span>
        </h1>
        
        <div className="bg-white rounded-lg shadow-lg p-6">
          {/* Upload Section */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload an image to analyze
            </label>
            <div className="mb-2">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={isUploading}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
              />
            </div>
            <p className="text-xs text-gray-500">
              Images will be automatically compressed to ensure fast uploads. Supported formats: JPG, PNG, GIF
            </p>
            {isUploading && (
              <p className="text-sm text-blue-600 mt-2">
                📸 Compressing and uploading image...
              </p>
            )}
          </div>

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

          {/* Analysis Button */}
          {selection && (
            <div className="mb-6">
              <button
                onClick={handleAnalyzeSelection}
                disabled={isAnalyzing}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                {isAnalyzing ? 'Analyzing with fal.ai...' : 'Analyze with fal.ai SA2VA Model'}
              </button>
              <p className="text-sm text-gray-500 mt-2">
                🔍 Selected area analyzed with detailed fal.ai SA2VA vision model
              </p>
            </div>
          )}

          {/* Upload Progress */}
          {uploadProgress && (
            <div className="mb-6 bg-blue-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">
                Upload Progress
              </h3>
              <div className="w-full bg-blue-200 rounded-full h-2.5 mb-4">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
                  style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
                ></div>
              </div>
              <div className="flex justify-between items-center text-sm text-blue-700">
                <span>
                  Chunk {uploadProgress.current} of {uploadProgress.total}
                  {isPaused && ' (Paused)'}
                </span>
                <div className="space-x-2">
                  {!isPaused ? (
                    <button
                      onClick={pauseUpload}
                      className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded"
                    >
                      ⏸️ Pause
                    </button>
                  ) : (
                    <button
                      onClick={resumeUpload}
                      className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded"
                    >
                      ▶️ Resume
                    </button>
                  )}
                  <button
                    onClick={cancelUpload}
                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                  >
                    ❌ Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Cropped Image Preview */}
          {croppedImagePreview && (
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">
                Cropped Image Sent to AI
              </h3>
              <div className="flex justify-center">
                <img 
                  src={croppedImagePreview} 
                  alt="Cropped selection" 
                  className="max-w-full max-h-64 border border-blue-200 rounded"
                  style={{ imageRendering: 'pixelated' }}
                />
              </div>
              <p className="text-sm text-blue-600 mt-2 text-center">
                This is the exact image being analyzed by the AI
              </p>
            </div>
          )}

          {/* Analysis Results */}
          {analysis && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Analysis Results
              </h3>
              <p className="text-gray-700">{analysis}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
