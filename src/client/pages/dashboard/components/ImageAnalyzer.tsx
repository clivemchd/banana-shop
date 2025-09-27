import React, { useState, useRef, useImperativeHandle, forwardRef, useEffect, useCallback } from 'react';
import type { SelectionRectangle } from '../types';
import { editImageRegion, generateImage } from '../services/gemini-service';
import { UploadIcon } from './icons/UploadIcon';
import { ArrowRightIcon } from './icons/ArrowRightIcon';
import { UndoIcon } from './icons/UndoIcon';
import { RedoIcon } from './icons/RedoIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { ZoomInIcon } from './icons/ZoomInIcon';
import { ZoomOutIcon } from './icons/ZoomOutIcon';
import { ClearIcon } from './icons/ClearIcon';
import { GrabIcon } from './icons/GrabIcon';
import { SparklesIcon } from './icons/SparklesIcon';

// --- Color Utility Functions ---

const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
};

const getLuminance = (r: number, g: number, b: number): number => {
  const a = [r, g, b].map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
};

const getContrastRatio = (rgb1: { r: number; g: number; b: number }, rgb2: { r: number; g: number; b: number }): number => {
    const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
    const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);
    return (Math.max(lum1, lum2) + 0.05) / (Math.min(lum1, lum2) + 0.05);
}

const getDominantColors = (ctx: CanvasRenderingContext2D, rect: SelectionRectangle, imageWidth: number, imageHeight: number): { r: number; g: number; b: number }[] => {
    const padding = 30; // Analyze a slightly larger area
    const x = Math.max(0, rect.x - padding);
    const y = Math.max(0, rect.y - padding);
    const width = Math.min(imageWidth - x, rect.width + padding * 2);
    const height = Math.min(imageHeight - y, rect.height + padding * 2);

    if (width <= 0 || height <= 0) return [];
    
    const imageData = ctx.getImageData(x, y, width, height);
    const data = imageData.data;
    const colorCounts: { [key: number]: number } = {};

    for (let i = 0; i < data.length; i += 4) {
        // Quantize colors to reduce the number of unique colors (4 bits per channel)
        const r = data[i] >> 4;
        const g = data[i + 1] >> 4;
        const b = data[i + 2] >> 4;
        const key = (r << 8) | (g << 4) | b;
        colorCounts[key] = (colorCounts[key] || 0) + 1;
    }

    const sortedColors = Object.entries(colorCounts).sort(([, a], [, b]) => b - a);
    
    // Return the top 5 dominant colors, converted back to 8-bit
    return sortedColors.slice(0, 5).map(([key]) => {
        const numKey = Number(key);
        return {
            r: (numKey >> 8) << 4,
            g: ((numKey >> 4) & 0xF) << 4,
            b: (numKey & 0xF) << 4,
        };
    });
};

const getBestContrastColor = (dominantRgbs: { r: number; g: number; b: number }[]): { colorHex: string; colorName: string } => {
    const candidates: { [hex: string]: string } = {
        '#FF0000': 'red',
        '#00FF00': 'bright green',
        '#0000FF': 'blue',
        '#FFFF00': 'yellow',
        '#FF00FF': 'magenta',
        '#00FFFF': 'cyan',
        '#000000': 'black',
        '#FFFFFF': 'white',
    };

    // If no dominant colors, default to red
    if (dominantRgbs.length === 0) {
        return { colorHex: '#FF0000', colorName: 'red' };
    }

    let bestColorHex = '#FF0000';
    let maxMinContrast = -1;

    for (const hex in candidates) {
        const candidateRgb = hexToRgb(hex);
        if (!candidateRgb) continue;

        // Find the minimum contrast ratio for this candidate against all dominant colors
        const minContrast = Math.min(
            ...dominantRgbs.map(dominantRgb => getContrastRatio(candidateRgb, dominantRgb))
        );

        if (minContrast > maxMinContrast) {
            maxMinContrast = minContrast;
            bestColorHex = hex;
        }
    }

    return { colorHex: bestColorHex, colorName: candidates[bestColorHex] };
};

export interface ImageAnalyzerHandles {
  resetAndUpload: () => void;
  loadImageFile: (file: File) => void;
}

interface ImageAnalyzerProps {
  onImageStateChange?: (isLoaded: boolean) => void;
}

export const ImageAnalyzer = forwardRef<ImageAnalyzerHandles, ImageAnalyzerProps>((props, ref) => {
  const { onImageStateChange } = props;
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loadedImage, setLoadedImage] = useState<HTMLImageElement | null>(null);

  const [selection, setSelection] = useState<SelectionRectangle | null>(null);
  const [brushStrokes, setBrushStrokes] = useState<{ x: number; y: number }[][]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  
  const [userPrompt, setUserPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [history, setHistory] = useState<File[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  const [scale, setScale] = useState(0.5);
  const [userHasZoomed, setUserHasZoomed] = useState(false);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [panMode, setPanMode] = useState(false);
  
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });

  // State for start screen generation
  const [startScreenPrompt, setStartScreenPrompt] = useState('');
  const [isGeneratingOnStart, setIsGeneratingOnStart] = useState(false);

  // Debug view state
  const [isDebugViewVisible, setIsDebugViewVisible] = useState(false);
  const [debugImageUrl, setDebugImageUrl] = useState<string | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const promptInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentImageFile = history[historyIndex] ?? null;

  // Clean up object URLs to prevent memory leaks
  useEffect(() => {
    return () => {
      if (imageUrl && imageUrl.startsWith('blob:')) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [imageUrl]);

  // Keyboard shortcut for debug view: Cmd/Ctrl + D + G
  useEffect(() => {
    const pressedKeys = new Set<string>();

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      // Only track d and g.
      if (key === 'd' || key === 'g') {
        pressedKeys.add(key);
      }

      const hasModifier = e.metaKey || e.ctrlKey;
      
      if (hasModifier && (key === 'd' || key === 'g')) {
        e.preventDefault();
      }

      if (hasModifier && pressedKeys.has('d') && pressedKeys.has('g')) {
        setIsDebugViewVisible(prev => !prev);
        pressedKeys.clear();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      pressedKeys.delete(e.key.toLowerCase());
      if (e.key === 'Meta' || e.key === 'Control') {
        pressedKeys.clear();
      }
    };
    
    const reset = () => {
      pressedKeys.clear();
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', reset);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', reset);
    };
  }, []);

  const resetSelection = useCallback(() => {
    setSelection(null);
    setBrushStrokes([]);
    setUserPrompt('');
    setError(null);
    setIsDrawing(false);
  }, []);

  // Effect to load and display the image whenever the history state changes
  useEffect(() => {
    const file = history[historyIndex];
    if (file) {
      onImageStateChange?.(true);
      resetSelection();
      const newImageUrl = URL.createObjectURL(file);
      setImageUrl(newImageUrl);
      
      const img = new Image();
      img.onload = () => {
        setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight });
        setLoadedImage(img);
        // Pan and scale are managed separately to persist user settings
      };
      img.src = newImageUrl;
    } else {
      onImageStateChange?.(false);
      // Clear image when history is empty
      setImageUrl(null);
      setLoadedImage(null);
    }
  }, [history, historyIndex, resetSelection, onImageStateChange]);


  useImperativeHandle(ref, () => ({
    resetAndUpload: () => {
      setHistory([]);
      setHistoryIndex(-1);
      setDebugImageUrl(null);
      setIsDebugViewVisible(false);
      setUserHasZoomed(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
        fileInputRef.current.click();
      }
    },
    loadImageFile: (file: File) => {
      handleImageUpload(file);
    }
  }));

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  };
  
  const handleImageUpload = (file: File) => {
    if (!file.type.startsWith('image/')) {
        setError("Invalid file type. Please upload an image.");
        return;
    }
    setDebugImageUrl(null);
    setIsDebugViewVisible(false);
    setPanMode(false);
    
    if (!userHasZoomed) {
      setScale(0.5);
    }
    setPanOffset({ x: 0, y: 0 });
    
    setHistory([file]);
    setHistoryIndex(0);
  };

  const handlePlaceholderClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  // Canvas drawing logic
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear with white background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    if (!loadedImage) return;

    ctx.save();
    
    // Center view and apply pan/zoom
    ctx.translate(canvas.width / 2 + panOffset.x, canvas.height / 2 + panOffset.y);
    ctx.scale(scale, scale);
    ctx.translate(-loadedImage.naturalWidth / 2, -loadedImage.naturalHeight / 2);

    // Draw an "infinite" isometric grid pattern that fills the canvas view
    ctx.strokeStyle = 'rgba(220, 220, 220, 0.8)';
    ctx.lineWidth = 1 / scale;

    const canvasDiagonalInWorld = Math.sqrt(canvas.width ** 2 + canvas.height ** 2) / scale;
    const lineLength = canvasDiagonalInWorld * 1.5; 
    const viewCenterX = loadedImage.naturalWidth / 2 - panOffset.x / scale;
    const viewCenterY = loadedImage.naturalHeight / 2 - panOffset.y / scale;
    const spacing = 50;
    const numLines = Math.ceil(lineLength / spacing);

    ctx.save();
    ctx.translate(viewCenterX, viewCenterY);
    ctx.beginPath();
    const drawLineSet = () => {
      for (let i = -Math.ceil(numLines / 2); i <= Math.ceil(numLines / 2); i++) {
        ctx.moveTo(i * spacing, -lineLength / 2);
        ctx.lineTo(i * spacing, lineLength / 2);
      }
    };
    for (let i = 0; i < 3; i++) {
      ctx.save();
      ctx.rotate((i * Math.PI) / 3);
      drawLineSet();
      ctx.restore();
    }
    ctx.stroke();
    ctx.restore();


    // Draw image
    ctx.drawImage(loadedImage, 0, 0);

    // Draw brush strokes
    if (brushStrokes.length > 0) {
        ctx.strokeStyle = 'rgba(255, 50, 50, 0.7)';
        ctx.lineWidth = 5 / scale;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        brushStrokes.forEach(stroke => {
            if (stroke.length < 2) return;
            ctx.beginPath();
            ctx.moveTo(stroke[0].x, stroke[0].y);
            for (let i = 1; i < stroke.length; i++) {
                ctx.lineTo(stroke[i].x, stroke[i].y);
            }
            ctx.stroke();
        });
    }
    
    ctx.restore();
  }, [loadedImage, scale, panOffset, brushStrokes]);
  
  // Effect to handle canvas resizing and initial drawing
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        canvas.width = width;
        canvas.height = height;
        drawCanvas();
      }
    });
    observer.observe(container);
    drawCanvas();
    return () => observer.disconnect();
  }, [drawCanvas]);


  const getCoordsOnImage = (event: React.MouseEvent): { x: number; y: number } | null => {
    const canvas = canvasRef.current;
    if (!canvas || !loadedImage) return null;
    
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    const translatedX = mouseX - (canvas.width / 2 + panOffset.x);
    const translatedY = mouseY - (canvas.height / 2 + panOffset.y);
    const scaledX = translatedX / scale;
    const scaledY = translatedY / scale;
    const finalX = scaledX + loadedImage.naturalWidth / 2;
    const finalY = scaledY + loadedImage.naturalHeight / 2;

    return { x: finalX, y: finalY };
  };

  const handleMouseDown = (event: React.MouseEvent) => {
    if (isLoading || !loadedImage) return;
    if (event.button === 1) { 
        event.preventDefault();
        setIsPanning(true);
        setPanStart({ x: event.clientX - panOffset.x, y: event.clientY - panOffset.y });
        return;
    }
    if (event.button !== 0) return;
    if (panMode) {
        setIsPanning(true);
        setPanStart({ x: event.clientX - panOffset.x, y: event.clientY - panOffset.y });
        return;
    }
    event.preventDefault();
    const coords = getCoordsOnImage(event);
    if (coords) {
      setBrushStrokes([[coords]]);
      setSelection(null);
      setUserPrompt('');
      setError(null);
      setIsDrawing(true);
    }
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    if (isPanning) {
        setPanOffset({ x: event.clientX - panStart.x, y: event.clientY - panStart.y });
        return;
    }
    if (!isDrawing || !loadedImage) return;
    event.preventDefault();
    const coords = getCoordsOnImage(event);
    if (!coords) return;
    setBrushStrokes(prev => {
        const newStrokes = [...prev];
        const currentStroke = newStrokes[newStrokes.length - 1];
        if (currentStroke) {
            currentStroke.push(coords);
        }
        return newStrokes;
    });
  };

  const calculateBoundingBox = (strokes: { x: number; y: number }[][], imageWidth: number, imageHeight: number): SelectionRectangle | null => {
    const allPoints = strokes.flat();
    if (allPoints.length < 2) return null;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    allPoints.forEach(p => {
        minX = Math.min(minX, p.x);
        minY = Math.min(minY, p.y);
        maxX = Math.max(maxX, p.x);
        maxY = Math.max(maxY, p.y);
    });
    const padding = 20;
    minX = Math.max(0, minX - padding);
    minY = Math.max(0, minY - padding);
    maxX = Math.min(imageWidth, maxX + padding);
    maxY = Math.min(imageHeight, maxY + padding);
    const width = maxX - minX;
    const height = maxY - minY;
    if (width <= 0 || height <= 0) return null;
    return { x: minX, y: minY, width, height };
  }

  const handleMouseUp = () => {
    if (isPanning) setIsPanning(false);
    if (isDrawing) {
      setIsDrawing(false);
      if (loadedImage) {
        const bbox = calculateBoundingBox(brushStrokes, loadedImage.naturalWidth, loadedImage.naturalHeight);
        if (bbox && (bbox.width > 5 && bbox.height > 5)) {
            setSelection(bbox);
            setTimeout(() => promptInputRef.current?.focus(), 0);
        } else {
            setBrushStrokes([]);
        }
      }
    }
  };
  
  const handleUndo = () => {
    if (historyIndex > 0) setHistoryIndex(historyIndex - 1);
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) setHistoryIndex(historyIndex + 1);
  };

  const handleEditRequest = async () => {
    if (!currentImageFile || !selection || !userPrompt.trim() || !loadedImage) {
        setError("Please select a region and enter a prompt.");
        return;
    }

    setIsLoading(true);
    setError(null);
    
    const sx = selection.x;
    const sy = selection.y;
    const sWidth = Math.max(1, selection.width);
    const sHeight = Math.max(1, selection.height);

    const cropCanvas = document.createElement('canvas');
    cropCanvas.width = sWidth;
    cropCanvas.height = sHeight;
    const cropCtx = cropCanvas.getContext('2d');
     if (!cropCtx) {
        setError("Could not create canvas context for cropping.");
        setIsLoading(false);
        return;
    }
    cropCtx.drawImage(loadedImage, sx, sy, sWidth, sHeight, 0, 0, sWidth, sHeight);
    const croppedImageBase64 = cropCanvas.toDataURL(currentImageFile.type).split(',')[1];

    try {
        // --- STAGE 1: Initial Edit ---
        const editedCroppedImageBase64 = await editImageRegion(
            croppedImageBase64,
            currentImageFile.type,
            userPrompt
        );
        
        const compositionCanvas = document.createElement('canvas');
        const imgWidth = loadedImage.naturalWidth;
        const imgHeight = loadedImage.naturalHeight;
        compositionCanvas.width = imgWidth;
        compositionCanvas.height = imgHeight;
        const compositionCtx = compositionCanvas.getContext('2d');
        if (!compositionCtx) throw new Error("Could not create canvas context for composition.");
        
        // Draw original image and the edited patch on top
        compositionCtx.drawImage(loadedImage, 0, 0);
        const editedPatchImg = new Image();
        const loadPromise = new Promise<void>((resolve, reject) => { 
            editedPatchImg.onload = () => resolve();
            editedPatchImg.onerror = reject;
        });
        editedPatchImg.src = `data:${currentImageFile.type};base64,${editedCroppedImageBase64}`;
        await loadPromise;
        compositionCtx.drawImage(editedPatchImg, sx, sy, sWidth, sHeight);

        // --- STAGE 2: Prepare for Blending ---
        // Find dominant colors and choose a high-contrast border color for the AI
        const dominantColors = getDominantColors(compositionCtx, selection, imgWidth, imgHeight);
        const { colorHex, colorName } = getBestContrastColor(dominantColors);
        
        const lineWidth = Math.max(6, Math.round(imgWidth / 100));

        // Draw the contrast border for the AI
        compositionCtx.strokeStyle = colorHex;
        compositionCtx.lineWidth = lineWidth;
        compositionCtx.strokeRect(sx, sy, sWidth, sHeight);
        const imageForBlendingBase64 = compositionCanvas.toDataURL(currentImageFile.type).split(',')[1];

        // For the debug view, always show a red border
        compositionCtx.drawImage(loadedImage, 0, 0); // Redraw to remove previous border
        compositionCtx.drawImage(editedPatchImg, sx, sy, sWidth, sHeight);
        compositionCtx.strokeStyle = '#FF0000'; // Always red for debug
        compositionCtx.lineWidth = lineWidth;
        compositionCtx.strokeRect(sx, sy, sWidth, sHeight);
        setDebugImageUrl(compositionCanvas.toDataURL(currentImageFile.type));

        // Create a dynamic prompt for the AI
        const blendingPrompt = `Seamlessly blend the edges of the area marked by the thick ${colorName} line. You should only modify the pixels of the ${colorName} line itself to create a smooth transition. Do not alter the image content inside or outside the ${colorName} line, people will die if you do. The final image must not have a ${colorName} line.`;
        
        // --- STAGE 3: Final Blend ---
        const finalBlendedImageBase64 = await editImageRegion(
            imageForBlendingBase64,
            currentImageFile.type,
            blendingPrompt
        );

        // --- STAGE 4: Update History ---
        const finalImageUrl = `data:${currentImageFile.type};base64,${finalBlendedImageBase64}`;
        const newFileBlob = await (await fetch(finalImageUrl)).blob();
        const newFile = new File([newFileBlob], currentImageFile.name, {type: currentImageFile.type});
    
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(newFile);
        
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);

    } catch(err) {
        setError(err instanceof Error ? err.message : "An unknown error occurred during editing.");
    } finally {
        setIsLoading(false);
    }
  };
  
  const handleDownload = () => {
    if (!imageUrl || !currentImageFile) return;
    const link = document.createElement('a');
    link.href = imageUrl;
    const name = currentImageFile.name;
    const lastDotIndex = name.lastIndexOf('.');
    const baseName = lastDotIndex !== -1 ? name.substring(0, lastDotIndex) : name;
    const extension = lastDotIndex !== -1 ? name.substring(lastDotIndex + 1) : 'png';
    link.download = `${baseName}-edited.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const handleZoom = (newScale: number) => {
    setScale(newScale);
    setUserHasZoomed(true);
  };
  const handleZoomIn = () => handleZoom(Math.min(scale * 1.25, 8));
  const handleZoomOut = () => handleZoom(Math.max(scale / 1.25, 0.1));

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDraggingOver(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDraggingOver(false); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleImageUpload(file);
  };

  const handleStartScreenGenerate = async () => {
    if (!startScreenPrompt.trim()) return;
    setIsGeneratingOnStart(true);
    setError(null);
    try {
      const base64Image = await generateImage(startScreenPrompt);
      const blob = await (await fetch(`data:image/png;base64,${base64Image}`)).blob();
      const newFile = new File([blob], "generated-image.png", { type: 'image/png' });
      handleImageUpload(newFile);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'An unknown error occurred.');
    } finally {
      setIsGeneratingOnStart(false);
    }
  };

  const showPrompt = selection && selection.width > 5 && selection.height > 5 && !isDrawing;
  const promptBoxStyle: React.CSSProperties = {};
  if (showPrompt && selection && loadedImage && canvasRef.current && containerRef.current) {
    const canvas = canvasRef.current;
    const getScreenCoords = (imgX: number, imgY: number) => {
        const x1 = (imgX - loadedImage.naturalWidth / 2) * scale;
        const y1 = (imgY - loadedImage.naturalHeight / 2) * scale;
        return { 
            x: x1 + canvas.width / 2 + panOffset.x, 
            y: y1 + canvas.height / 2 + panOffset.y 
        };
    };
    const containerRect = containerRef.current.getBoundingClientRect();
    const canvasRect = canvas.getBoundingClientRect();
    const selectionBottomLeft = getScreenCoords(selection.x, selection.y + selection.height);
    const selectionTopLeft = getScreenCoords(selection.x, selection.y);
    const selectionWidthOnScreen = selection.width * scale;
    const left = selectionBottomLeft.x + (canvasRect.left - containerRect.left);
    let top = selectionBottomLeft.y + (canvasRect.top - containerRect.top) + 8;
    const width = Math.max(250, selectionWidthOnScreen);
    promptBoxStyle.position = 'absolute';
    promptBoxStyle.top = `${top}px`;
    promptBoxStyle.left = `${left}px`;
    promptBoxStyle.width = `${width}px`;
    if (left + width > containerRect.width) {
      promptBoxStyle.transform = `translateX(-${left + width - containerRect.width + 16}px)`;
    }
    if (top > containerRect.height - 80) {
      const topEdgeY = selectionTopLeft.y + (canvasRect.top - containerRect.top);
      promptBoxStyle.top = `${topEdgeY - 60}px`;
    }
  } else {
    promptBoxStyle.display = 'none';
  }

  const cursorClass = isPanning ? 'cursor-grabbing' : panMode ? 'cursor-grab' : 'cursor-crosshair';

  return (
    <div 
        ref={containerRef}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className="w-full h-full bg-white relative flex items-center justify-center select-none"
    >
       <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/png, image/jpeg, image/webp"
      />
      {!imageUrl ? (
         <div className="w-full max-w-2xl p-8 flex flex-col items-center justify-center text-center">
            <div 
              onClick={handlePlaceholderClick}
              className="w-full p-8 border-2 border-dashed border-neutral-300 rounded-lg flex flex-col items-center justify-center bg-white cursor-pointer hover:bg-neutral-50 transition-colors"
            >
              <UploadIcon className="w-12 h-12 text-neutral-400 mb-4" />
              <h3 className="text-xl font-semibold text-black">Upload an Image to Edit</h3>
              <p className="text-neutral-500 mt-1">or drag and drop a file</p>
            </div>
            
            <div className="my-6 flex items-center w-full">
              <div className="flex-grow border-t border-neutral-200"></div>
              <span className="flex-shrink mx-4 text-sm font-medium text-neutral-500">OR</span>
              <div className="flex-grow border-t border-neutral-200"></div>
            </div>

            <div className="w-full text-left">
               <h3 className="text-xl font-semibold text-black mb-3 flex items-center">
                 <SparklesIcon className="w-6 h-6 mr-2 text-black" />
                 Generate an Image with AI
               </h3>
               <div className="flex items-center space-x-2">
                 <input
                    type="text"
                    value={startScreenPrompt}
                    onChange={(e) => setStartScreenPrompt(e.target.value)}
                    onKeyDown={(e) => { if(e.key === 'Enter') handleStartScreenGenerate() }}
                    placeholder="A high-resolution photo of a raccoon programming..."
                    className="flex-grow bg-neutral-100 text-black rounded-md px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-black border-transparent"
                    disabled={isGeneratingOnStart}
                />
                <button
                    onClick={handleStartScreenGenerate}
                    disabled={!startScreenPrompt.trim() || isGeneratingOnStart}
                    className="flex-shrink-0 h-[50px] px-5 bg-black text-white text-sm font-semibold rounded-md hover:bg-neutral-800 disabled:bg-neutral-200 disabled:text-neutral-500 disabled:cursor-not-allowed transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white focus:ring-black flex items-center justify-center"
                >
                  {isGeneratingOnStart ? (
                    <div className="w-5 h-5 border-2 border-dashed rounded-full animate-spin border-white"></div>
                  ) : (
                    "Generate"
                  )}
                </button>
               </div>
            </div>
        </div>
      ) : (
        <>
        <canvas
            ref={canvasRef}
            className={cursorClass}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onDragStart={(e) => e.preventDefault()}
        />
        
        {isLoading && (
            <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-lg z-40">
                <div className="w-12 h-12 border-4 border-dashed rounded-full animate-spin border-black"></div>
            </div>
        )}
        
        <div 
            style={promptBoxStyle} 
            className="z-30 bg-white border border-neutral-300 rounded-lg shadow-2xl p-2 flex items-center space-x-2 transition-all duration-150 ease-out"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
        >
            <input
                ref={promptInputRef}
                type="text"
                value={userPrompt}
                onChange={(e) => setUserPrompt(e.target.value)}
                onKeyDown={(e) => { if(e.key === 'Enter') handleEditRequest() }}
                placeholder="Describe the edit for the highlighted area..."
                className="flex-grow bg-transparent text-black rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black border-transparent"
                disabled={isLoading}
            />
            <button
                onClick={handleEditRequest}
                disabled={!userPrompt.trim() || isLoading}
                className="flex-shrink-0 bg-black text-white rounded-md p-2 hover:bg-neutral-800 disabled:bg-neutral-200 disabled:text-neutral-500 disabled:cursor-not-allowed transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white focus:ring-black"
                aria-label="Submit edit request"
                title="Submit"
            >
                <ArrowRightIcon className="w-5 h-5" />
            </button>
        </div>
        
        <div className="absolute top-3 left-3 z-20 flex space-x-2">
            <button onClick={handleUndo} disabled={historyIndex <= 0 || isLoading} className="bg-white/80 border border-neutral-200 text-black rounded-md p-2 hover:bg-neutral-100 disabled:text-neutral-400 disabled:cursor-not-allowed transition-all" aria-label="Undo" title="Undo"><UndoIcon className="w-5 h-5" /></button>
            <button onClick={handleRedo} disabled={historyIndex >= history.length - 1 || isLoading} className="bg-white/80 border border-neutral-200 text-black rounded-md p-2 hover:bg-neutral-100 disabled:text-neutral-400 disabled:cursor-not-allowed transition-all" aria-label="Redo" title="Redo"><RedoIcon className="w-5 h-5" /></button>
            {brushStrokes.length > 0 && !isLoading && (
              <button onClick={resetSelection} className="bg-white/80 border border-neutral-200 text-black rounded-md p-2 hover:bg-neutral-100 transition-all" aria-label="Clear selection" title="Clear Selection"><ClearIcon className="w-5 h-5" /></button>
            )}
        </div>
        <div className="absolute top-3 right-3 z-20">
            <button onClick={handleDownload} disabled={isLoading} className="bg-white/80 border border-neutral-200 text-black rounded-md p-2 hover:bg-neutral-100 disabled:text-neutral-400 disabled:cursor-not-allowed transition-all" aria-label="Download image" title="Download Image"><DownloadIcon className="w-5 h-5" /></button>
        </div>

        <div className="absolute bottom-3 right-3 z-20 flex items-center space-x-1 bg-white/80 border border-neutral-200 p-1.5 rounded-lg text-xs font-mono">
            <button
                onClick={() => setPanMode(prev => !prev)}
                className={`p-1.5 rounded transition-colors ${panMode ? 'bg-neutral-200 hover:bg-neutral-300' : 'hover:bg-neutral-100'}`}
                aria-label="Pan tool"
                title="Pan Tool (or hold middle mouse)"
            >
                <GrabIcon className="w-4 h-4" />
            </button>
            <div className="w-px h-4 bg-neutral-300 mx-1"></div>
            <button onClick={handleZoomOut} className="p-1.5 rounded hover:bg-neutral-100 transition-colors" aria-label="Zoom out" title="Zoom Out"><ZoomOutIcon className="w-4 h-4" /></button>
            <span className="px-2 text-neutral-700 w-12 text-center">{Math.round(scale*100)}%</span>
            <button onClick={handleZoomIn} className="p-1.5 rounded hover:bg-neutral-100 transition-colors" aria-label="Zoom in" title="Zoom In"><ZoomInIcon className="w-4 h-4" /></button>
        </div>
        </>
      )}

      {isDraggingOver && (
        <div className="absolute inset-0 bg-black/20 backdrop-blur-sm rounded-lg flex items-center justify-center pointer-events-none z-50">
          <div className="p-8 border-4 border-dashed border-white rounded-xl text-center">
            <h3 className="text-2xl font-bold text-white">Drop Image to Upload</h3>
          </div>
        </div>
      )}

      {error && <div className="absolute bottom-3 left-3 z-20 bg-red-50 border border-red-300 text-red-700 text-sm px-4 py-2 rounded-lg shadow-lg"><p>{error}</p></div>}

      {isDebugViewVisible && debugImageUrl && (
        <div className="absolute bottom-4 left-4 z-50 bg-neutral-900/90 backdrop-blur-sm border border-neutral-700 rounded-lg shadow-2xl p-3 text-white max-w-xs w-full">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-mono text-sm font-bold">Debug: Pre-Blend Image</h4>
            <button onClick={() => setIsDebugViewVisible(false)} className="text-neutral-400 hover:text-white text-2xl leading-none flex items-center justify-center w-6 h-6" aria-label="Close debug view">&times;</button>
          </div>
          <img src={debugImageUrl} alt="Debug view of pre-blending image" className="w-full h-auto rounded-md border border-neutral-600" />
          <p className="text-xs text-neutral-400 mt-2 font-mono">This is the image with the red border sent for the final blending step.</p>
        </div>
      )}
    </div>
  );
});