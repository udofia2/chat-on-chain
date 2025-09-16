import { useState, useCallback } from 'react';
import { pinataService } from '../lib/ipfs/pinata';

interface UploadProgress {
  progress: number;
  status: 'idle' | 'uploading' | 'success' | 'error';
  error?: string;
}

interface UseIpfsReturn {
  uploadFile: (file: File, options?: { name?: string; compress?: boolean }) => Promise<string | null>;
  uploadJSON: (data: any, name?: string) => Promise<string | null>;
  getUrl: (hash: string) => string;
  validateFile: (file: File, maxSizeMB?: number) => { valid: boolean; error?: string };
  uploadProgress: UploadProgress;
  isUploading: boolean;
}

export const useIpfs = (): UseIpfsReturn => {
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({
    progress: 0,
    status: 'idle',
  });

  const isUploading = uploadProgress.status === 'uploading';

  /**
   * Upload file to IPFS
   */
  const uploadFile = useCallback(async (
    file: File, 
    options?: { name?: string; compress?: boolean }
  ): Promise<string | null> => {
    setUploadProgress({ progress: 0, status: 'uploading' });

    try {
      // Validate file first
      const validation = pinataService.validateFile(file);
      if (!validation.valid) {
        setUploadProgress({ 
          progress: 0, 
          status: 'error', 
          error: validation.error 
        });
        return null;
      }

      setUploadProgress({ progress: 10, status: 'uploading' });

      let fileToUpload = file;

      // Compress image if requested
      if (options?.compress && file.type.startsWith('image/')) {
        setUploadProgress({ progress: 20, status: 'uploading' });
        fileToUpload = await pinataService.compressImage(file);
        setUploadProgress({ progress: 40, status: 'uploading' });
      }

      // Upload to IPFS
      setUploadProgress({ progress: 60, status: 'uploading' });
      const hash = await pinataService.uploadFile(fileToUpload, {
        name: options?.name || file.name,
        keyvalues: {
          originalName: file.name,
          fileType: file.type,
          fileSize: file.size.toString(),
          uploadedAt: new Date().toISOString(),
        }
      });

      setUploadProgress({ progress: 100, status: 'success' });
      
      // Reset status after a delay
      setTimeout(() => {
        setUploadProgress({ progress: 0, status: 'idle' });
      }, 2000);

      return hash;
    } catch (error) {
      console.error('Error uploading file to IPFS:', error);
      setUploadProgress({ 
        progress: 0, 
        status: 'error', 
        error: error instanceof Error ? error.message : 'Upload failed'
      });
      return null;
    }
  }, []);

  /**
   * Upload JSON data to IPFS
   */
  const uploadJSON = useCallback(async (data: any, name?: string): Promise<string | null> => {
    setUploadProgress({ progress: 0, status: 'uploading' });

    try {
      setUploadProgress({ progress: 50, status: 'uploading' });
      
      const hash = await pinataService.uploadJSON(data, {
        name: name || 'ChainChat JSON Data',
        keyvalues: {
          dataType: 'json',
          uploadedAt: new Date().toISOString(),
        }
      });

      setUploadProgress({ progress: 100, status: 'success' });
      
      // Reset status after a delay
      setTimeout(() => {
        setUploadProgress({ progress: 0, status: 'idle' });
      }, 2000);

      return hash;
    } catch (error) {
      console.error('Error uploading JSON to IPFS:', error);
      setUploadProgress({ 
        progress: 0, 
        status: 'error', 
        error: error instanceof Error ? error.message : 'Upload failed'
      });
      return null;
    }
  }, []);

  /**
   * Get IPFS gateway URL for a hash
   */
  const getUrl = useCallback((hash: string): string => {
    return pinataService.getGatewayUrl(hash);
  }, []);

  /**
   * Validate file before upload
   */
  const validateFile = useCallback((file: File, maxSizeMB: number = 10) => {
    return pinataService.validateFile(file, maxSizeMB);
  }, []);

  return {
    uploadFile,
    uploadJSON,
    getUrl,
    validateFile,
    uploadProgress,
    isUploading,
  };
};