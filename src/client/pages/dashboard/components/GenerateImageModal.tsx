import React, { useState } from 'react';
import { generateImage } from '../services/gemini-service';
import { SparklesIcon } from './icons/SparklesIcon';
import { ArrowRightIcon } from './icons/ArrowRightIcon';

interface GenerateImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (result: { imageUrl: string; tempImageId: string }) => void;
}

export const GenerateImageModal: React.FC<GenerateImageModalProps> = ({ isOpen, onClose, onGenerate }) => {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await generateImage(prompt);
      onGenerate(result);
      setPrompt('');
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleClose = () => {
    if (isLoading) return;
    setPrompt('');
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" 
      onClick={handleClose}
      aria-modal="true"
      role="dialog"
    >
      <div 
        className="bg-white rounded-lg shadow-2xl w-full max-w-lg p-6 relative" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center mb-4">
            <SparklesIcon className="w-6 h-6 mr-3 text-black" />
            <h2 className="text-xl font-bold text-black">Generate New Image</h2>
        </div>
        <p className="text-neutral-600 mb-4 text-sm">Describe the image you want to create. This will replace your current canvas.</p>
        
        <div className="relative">
            <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => { if(e.key === 'Enter') handleGenerate() }}
                placeholder="e.g., A majestic cat astronaut riding a unicorn"
                className="w-full bg-neutral-100 text-black rounded-md px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-black border-transparent pr-12"
                disabled={isLoading}
                autoFocus
            />
        </div>
        
        {error && <p className="text-red-600 text-sm mt-3">{error}</p>}
        
        <div className="flex justify-end items-center mt-6 space-x-3">
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="px-4 py-2 border border-neutral-300 bg-white text-black text-sm font-semibold rounded-md hover:bg-neutral-100 active:bg-neutral-200 transition-colors duration-200 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleGenerate}
            disabled={!prompt.trim() || isLoading}
            className="px-5 py-2 bg-black text-white text-sm font-semibold rounded-md hover:bg-neutral-800 disabled:bg-neutral-200 disabled:text-neutral-500 disabled:cursor-not-allowed transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white focus:ring-black flex items-center"
          >
            {isLoading ? (
                <>
                 <div className="w-4 h-4 border-2 border-dashed rounded-full animate-spin border-white mr-2"></div>
                 Generating...
                </>
            ) : (
                <>
                Generate
                <ArrowRightIcon className="w-4 h-4 ml-2" />
                </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};