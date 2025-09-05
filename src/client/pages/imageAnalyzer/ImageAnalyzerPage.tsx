import React, { useState, useRef, useCallback } from 'react';
import { analyzeImageArea, uploadImage } from 'wasp/client/operations';

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

  const handleAnalyzeSelection = useCallback(async () => {
    if (!selection || !uploadedImage || !imageRef.current) return;
    
    setIsAnalyzing(true);
    try {
      // Create a temporary canvas to load the original image at full resolution
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d')!;
      const tempImg = new Image();
      
      // Load the original image
      tempImg.onload = async () => {
        tempCanvas.width = tempImg.naturalWidth;
        tempCanvas.height = tempImg.naturalHeight;
        tempCtx.drawImage(tempImg, 0, 0);
        
        // Now crop using the original selection coordinates (no scaling needed)
        const cropCanvas = document.createElement('canvas');
        const cropCtx = cropCanvas.getContext('2d')!;
        
        cropCanvas.width = selection.width;
        cropCanvas.height = selection.height;
        
        // Crop from the full-resolution image using original coordinates
        cropCtx.drawImage(
          tempCanvas,
          selection.x, selection.y, selection.width, selection.height, // Source (natural coordinates)
          0, 0, selection.width, selection.height                      // Destination
        );
        
        const croppedImageDataUrl = cropCanvas.toDataURL('image/jpeg', 0.9);
        
        // Debug: log cropped image info
        console.log('🖼️ Cropped image size:', selection.width, 'x', selection.height);
        console.log('✂️ Cropped image data length:', croppedImageDataUrl.length);
        
        // Optional: Create a temporary link to download and verify the cropped image
        if (window.location.search.includes('debug=true')) {
          const link = document.createElement('a');
          link.href = croppedImageDataUrl;
          link.download = `cropped-${Date.now()}.jpg`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          console.log('📥 Downloaded cropped image for debugging');
        }
        
        // Upload the cropped image
        const base64Content = croppedImageDataUrl.split(',')[1];
        // Convert selected area to base64 directly from the original image
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx || !uploadedImage) {
          throw new Error('Cannot get canvas context or missing image');
        }
        
        // Create image element to work with
        const img = new Image();
        
        img.onload = async () => {
          try {
            // Use original image coordinates directly
            canvas.width = selection.width;
            canvas.height = selection.height;
            
            // Draw the selected area onto the canvas with full quality
            ctx.drawImage(
              img,
              selection.x, selection.y, selection.width, selection.height,
              0, 0, selection.width, selection.height
            );
            
            // Convert to high quality PNG
            const fullQualityImageData = canvas.toDataURL('image/png', 1.0);
            
            // Save the cropped image for preview
            setCroppedImagePreview(fullQualityImageData);
            
            console.log('Original image size:', img.width, 'x', img.height);
            console.log('Selected area:', selection);
            console.log('Cropped data length:', fullQualityImageData.length);
            
            // Now analyze with the full quality cropped image
            const result = await analyzeImageArea({
              imageData: fullQualityImageData,
              selection: selection
            });
            
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
      };
      
      tempImg.onerror = () => {
        console.error('Failed to load image for cropping');
        alert('Failed to process image for analysis');
        setIsAnalyzing(false);
      };
      
      // Load the original uploaded image
      tempImg.src = uploadedImage;
      
    } catch (error) {
      console.error('Analysis failed:', error);
      alert('Failed to analyze image area');
      setIsAnalyzing(false);
    }
  }, [selection, uploadedImage]);

  const getSelectionStyle = useCallback(() => {
    if (!displaySelection) return {};
    
    return {
      position: 'absolute' as const,
      left: displaySelection.x,
      top: displaySelection.y,
      width: displaySelection.width,
      height: displaySelection.height,
      border: '2px solid #3b82f6',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      pointerEvents: 'none' as const,
    };
  }, [displaySelection]);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          Image Area Analyzer
          <span className="block text-sm font-normal text-gray-500 mt-2">
            Powered by LM Studio MiniCPM-o-2_6 Vision Model
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
                Click and drag to select an area for analysis
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
                {isAnalyzing ? 'Analyzing with LM Studio...' : 'Analyze with Local AI Model'}
              </button>
              <p className="text-sm text-gray-500 mt-2">
                🔍 Both full image (context) and cropped area sent to MiniCPM-o-2_6
              </p>
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
