import { useRef, useState } from "react";
import { useResumableUpload } from "../../hooks/useResumableUpload";

export const DashboardPage = () => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [image, setImage] = useState('');
  const { uploadState, uploadFile, pauseUpload, resumeUpload, resetUpload } = useResumableUpload();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Create local preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Start resumable upload
    try {
      await uploadFile(file, {
        metadata: {
          description: 'User uploaded image',
          category: 'dashboard',
        }
      });
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };

  const handlePauseResume = () => {
    if (uploadState.status === 'uploading') {
      pauseUpload();
    } else if (uploadState.status === 'paused' && fileInputRef.current?.files?.[0]) {
      resumeUpload(fileInputRef.current.files[0]);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">File Upload Dashboard</h1>
      
      <div className="space-y-4">
        {/* File Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept="image/*"
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />

        {/* Upload Progress */}
        {uploadState.status !== 'idle' && (
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Upload Status</span>
              <span className={`text-sm px-2 py-1 rounded ${
                uploadState.status === 'completed' ? 'bg-green-100 text-green-800' :
                uploadState.status === 'error' ? 'bg-red-100 text-red-800' :
                uploadState.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {uploadState.status.charAt(0).toUpperCase() + uploadState.status.slice(1)}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadState.progress.percentage}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
              <span>{uploadState.progress.percentage}% complete</span>
              <span>
                {Math.round(uploadState.progress.loaded / 1024)} KB / {Math.round(uploadState.progress.total / 1024)} KB
              </span>
            </div>

            {/* Control Buttons */}
            <div className="flex space-x-2">
              {(uploadState.status === 'uploading' || uploadState.status === 'paused') && (
                <button
                  onClick={handlePauseResume}
                  className={`px-4 py-2 rounded text-sm font-medium ${
                    uploadState.status === 'uploading' 
                      ? 'bg-yellow-500 text-white hover:bg-yellow-600' 
                      : 'bg-blue-500 text-white hover:bg-blue-600'
                  }`}
                >
                  {uploadState.status === 'uploading' ? 'Pause' : 'Resume'}
                </button>
              )}
              
              {uploadState.status !== 'completed' && (
                <button
                  onClick={resetUpload}
                  className="px-4 py-2 bg-gray-500 text-white rounded text-sm font-medium hover:bg-gray-600"
                >
                  Cancel
                </button>
              )}
            </div>

            {/* Error Message */}
            {uploadState.error && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                {uploadState.error}
              </div>
            )}
          </div>
        )}

        {/* Image Preview */}
        {image && (
          <div className="bg-white p-4 rounded-lg shadow border">
            <h3 className="text-lg font-medium mb-2">Image Preview</h3>
            <img 
              src={image} 
              alt="Uploaded preview" 
              className="max-w-full h-auto rounded border"
            />
          </div>
        )}
      </div>
    </div>
  );
};