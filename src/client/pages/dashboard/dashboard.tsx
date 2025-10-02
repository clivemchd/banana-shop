import "../../../index.css";
import Navbar from "../landing/navbar";
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { ImageAnalyzer, ImageAnalyzerHandles } from './components/ImageAnalyzer';
import { GenerateImageModal } from './components/GenerateImageModal';
import { SparklesIcon } from './components/icons/SparklesIcon';


export const DashboardPage = () => {
    const imageAnalyzerRef = useRef<ImageAnalyzerHandles>(null);
    const [error, setError] = useState<string | null>(null);
    const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
    const [isImageLoaded, setIsImageLoaded] = useState(false);

    const handleUploadNew = () => {
        imageAnalyzerRef.current?.resetAndUpload();
    };

    const handleGenerateNew = () => {
        setIsGenerateModalOpen(true);
    };

    const handleImageGenerated = async (result: { imageUrl: string; imageId: string }) => {
        try {
            // For GCS URLs, we can load them directly
            if (result.imageUrl.startsWith('http')) {
                // Pass URL directly to ImageAnalyzer with imageId
                imageAnalyzerRef.current?.loadImageUrl(result.imageUrl, result.imageId);
            } else {
                // Fallback for base64 (legacy support)
                const base64Image = result.imageUrl.replace('data:image/png;base64,', '');
                const blob = await (await fetch(`data:image/png;base64,${base64Image}`)).blob();
                const newFile = new File([blob], "generated-image.png", { type: 'image/png' });
                imageAnalyzerRef.current?.loadImageFile(newFile);
            }
        } catch (e) {
            setError("Failed to process the generated image.");
            console.error(e);
        }
    };

    if (error) {
        return (
            <div className="min-h-screen bg-white text-red-600 flex flex-col items-center justify-center p-4 text-center">
                <h2 className="text-2xl font-bold">Application Error</h2>
                <p className="mt-2 max-w-md">{error}</p>
                <p className="mt-4 text-sm text-neutral-500">Please refresh the page and try again.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-8">
                <div className="min-h-screen bg-white text-black flex flex-col h-screen antialiased">
                    <header className="w-full bg-white border-b border-neutral-200 px-4 sm:px-6 py-3 flex items-center justify-between flex-shrink-0 z-30">
                        {isImageLoaded && (
                            <div className="flex items-center space-x-2 sm:space-x-4">
                                <button
                                    onClick={handleGenerateNew}
                                    className="px-4 py-2 bg-black text-white text-sm font-semibold rounded-md hover:bg-neutral-800 active:bg-neutral-700 transition-colors duration-200 flex items-center"
                                >
                                    <SparklesIcon className="w-4 h-4 mr-2" />
                                    Generate New Image
                                </button>
                                <button
                                    onClick={handleUploadNew}
                                    className="px-4 py-2 border border-neutral-300 bg-white text-black text-sm font-semibold rounded-md hover:bg-neutral-100 active:bg-neutral-200 transition-colors duration-200"
                                >
                                    Upload New Image
                                </button>
                            </div>
                        )}
                    </header>
                    <main className="w-full flex-grow flex overflow-hidden">
                        <ImageAnalyzer ref={imageAnalyzerRef} onImageStateChange={setIsImageLoaded} />
                    </main>
                    <GenerateImageModal
                        isOpen={isGenerateModalOpen}
                        onClose={() => setIsGenerateModalOpen(false)}
                        onGenerate={handleImageGenerated}
                    />
                </div>
            </div>
        </div>
    )
};