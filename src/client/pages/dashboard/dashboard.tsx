// import { logout } from "wasp/client/auth";
// import { generateTextToImage, generateImageToImage } from "wasp/client/operations";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "wasp/client/router";

export const DashboardPage = () => {
    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4">
                <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
                    Micro Banana Dashboard
                </h1>
                
                <div className="grid gap-6 md:grid-cols-2">
                    <div className="bg-white rounded-lg shadow-lg p-6">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">
                            Image Analysis
                        </h2>
                        <p className="text-gray-600 mb-4">
                            Upload an image and select areas to get AI-powered analysis using fal.ai's Moondream2 vision model.
                        </p>
                        <Link
                            to="/analyzer"
                            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                        >
                            Start Analyzing Images
                        </Link>
                    </div>
                    
                    <div className="bg-white rounded-lg shadow-lg p-6">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">
                            Image Generation
                        </h2>
                        <p className="text-gray-600 mb-4">
                            Generate images using AI with text prompts or modify existing images.
                        </p>
                        <button 
                            className="inline-block bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                            disabled
                        >
                            Coming Soon
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
};