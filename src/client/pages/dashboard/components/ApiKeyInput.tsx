import React, { useState } from 'react';
import { KeyIcon } from './icons/KeyIcon';

interface ApiKeyInputProps {
  onKeySubmit: (key: string) => void;
  onCancel?: () => void;
}

export const ApiKeyInput: React.FC<ApiKeyInputProps> = ({ onKeySubmit, onCancel }) => {
  const [apiKey, setApiKey] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (apiKey.trim()) {
      onKeySubmit(apiKey.trim());
    }
  };

  return (
    <div className="w-full max-w-lg p-8 border border-neutral-800 rounded-lg flex flex-col items-center justify-center text-center bg-black/50 shadow-lg">
      <KeyIcon className="w-12 h-12 text-neutral-400 mb-4" />
      <h3 className="text-2xl font-bold text-white">Enter Your Gemini API Key</h3>
      <p className="text-neutral-400 mt-2 mb-6">
        To use this application, please provide your API key. It will be stored securely in your browser's local storage.
      </p>
      <form onSubmit={handleSubmit} className="w-full flex flex-col items-center">
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="Paste your API key here"
          className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-white transition-all"
          aria-label="Gemini API Key"
        />
        <button
          type="submit"
          disabled={!apiKey.trim()}
          className="mt-6 w-full px-6 py-2 bg-white text-black rounded-md font-semibold hover:bg-neutral-200 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-white disabled:bg-neutral-800 disabled:text-neutral-500 disabled:cursor-not-allowed"
        >
          Save and Continue
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="mt-4 text-sm font-medium text-neutral-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
        )}
      </form>
       <p className="text-xs text-neutral-500 mt-6">
        Don't have a key? Get one from{' '}
        <a
          href="https://aistudio.google.com/app/apikey"
          target="_blank"
          rel="noopener noreferrer"
          className="text-neutral-400 hover:underline"
        >
          Google AI Studio
        </a>.
      </p>
    </div>
  );
};