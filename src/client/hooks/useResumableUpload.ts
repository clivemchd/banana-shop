import { useState, useCallback } from 'react';
import { useAction } from 'wasp/client/operations';
import { createResumableUpload, getUploadStatus } from 'wasp/client/operations';

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface UploadState {
  status: 'idle' | 'uploading' | 'paused' | 'completed' | 'error';
  progress: UploadProgress;
  error?: string;
  uploadId?: string;
  resumeUrl?: string;
}

const CHUNK_SIZE = 256 * 1024; // 256KB chunks

export function useResumableUpload() {
  const [uploadState, setUploadState] = useState<UploadState>({
    status: 'idle',
    progress: { loaded: 0, total: 0, percentage: 0 },
  });

  const createUploadFn = useAction(createResumableUpload);
  const getStatusFn = useAction(getUploadStatus);

  const uploadFile = useCallback(async (
    file: File,
    options?: { metadata?: Record<string, string> }
  ) => {
    try {
      setUploadState(prev => ({ ...prev, status: 'uploading', error: undefined }));

      // Step 1: Get signed URL for upload
      const uploadInfo = await createUploadFn({
        fileName: file.name,
        contentType: file.type,
        metadata: options?.metadata,
        maxFileSize: file.size,
      }) as any; // Type assertion to handle unknown response

      setUploadState(prev => ({
        ...prev,
        uploadId: uploadInfo.uploadId,
        resumeUrl: uploadInfo.uploadUrl,
      }));

      // Step 2: Upload file directly to signed URL
      await uploadToSignedUrl(file, uploadInfo.uploadUrl);

    } catch (error) {
      console.error('Upload error:', error);
      setUploadState(prev => ({
        ...prev,
        status: 'error',
        error: error instanceof Error ? error.message : 'Upload failed',
      }));
    }
  }, [createUploadFn]);

  const uploadToSignedUrl = async (file: File, signedUrl: string) => {
    try {
      const response = await fetch(signedUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type,
        },
        body: file,
      });

      if (response.ok) {
        // Upload completed successfully
        setUploadState(prev => ({
          ...prev,
          status: 'completed',
          progress: {
            loaded: file.size,
            total: file.size,
            percentage: 100,
          },
        }));
      } else {
        throw new Error(`Upload failed with status: ${response.status} - ${response.statusText}`);
      }
    } catch (error) {
      throw new Error(`Upload failed: ${error}`);
    }
  };

  const resumeUpload = useCallback(async (file: File) => {
    if (!uploadState.resumeUrl) return;
    
    setUploadState(prev => ({ ...prev, status: 'uploading' }));
    await uploadToSignedUrl(file, uploadState.resumeUrl);
  }, [uploadState.resumeUrl]);

  const pauseUpload = useCallback(() => {
    setUploadState(prev => ({ ...prev, status: 'paused' }));
  }, []);

  const resetUpload = useCallback(() => {
    setUploadState({
      status: 'idle',
      progress: { loaded: 0, total: 0, percentage: 0 },
    });
  }, []);

  return {
    uploadState,
    uploadFile,
    pauseUpload,
    resumeUpload,
    resetUpload,
  };
}
