import { IPFS_CONFIG } from '../constants';

interface PinataResponse {
  IpfsHash: string;
  PinSize: number;
  Timestamp: string;
}

interface UploadOptions {
  name?: string;
  keyvalues?: Record<string, string>;
}

class PinataService {
  private jwt: string;
  private gateway: string;

  constructor() {
    this.jwt = IPFS_CONFIG.PINATA_JWT;
    this.gateway = IPFS_CONFIG.PINATA_GATEWAY;

    if (!this.jwt) {
      console.warn('PINATA_JWT not configured');
    }
  }

  /**
   * Upload a file to IPFS via Pinata
   */
  async uploadFile(file: File, options?: UploadOptions): Promise<string> {
    if (!this.jwt) {
      throw new Error('Pinata JWT not configured');
    }

    const formData = new FormData();
    formData.append('file', file);

    if (options?.name) {
      formData.append('pinataMetadata', JSON.stringify({
        name: options.name,
        keyvalues: options.keyvalues || {}
      }));
    }

    try {
      const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.jwt}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Pinata upload failed: ${response.statusText}`);
      }

      const result: PinataResponse = await response.json();
      return result.IpfsHash;
    } catch (error) {
      console.error('Error uploading to Pinata:', error);
      throw error;
    }
  }

  /**
   * Upload JSON data to IPFS via Pinata
   */
  async uploadJSON(data: any, options?: UploadOptions): Promise<string> {
    if (!this.jwt) {
      throw new Error('Pinata JWT not configured');
    }

    const payload = {
      pinataContent: data,
      pinataMetadata: {
        name: options?.name || 'ChainChat JSON',
        keyvalues: options?.keyvalues || {}
      }
    };

    try {
      const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.jwt}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Pinata JSON upload failed: ${response.statusText}`);
      }

      const result: PinataResponse = await response.json();
      return result.IpfsHash;
    } catch (error) {
      console.error('Error uploading JSON to Pinata:', error);
      throw error;
    }
  }

  /**
   * Get the gateway URL for an IPFS hash
   */
  getGatewayUrl(ipfsHash: string): string {
    return `${this.gateway}/ipfs/${ipfsHash}`;
  }

  /**
   * Compress an image file before upload
   */
  async compressImage(file: File, maxSizeMB: number = 1): Promise<File> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions
        const maxWidth = 800;
        const maxHeight = 800;
        let { width, height } = img;

        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx?.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              reject(new Error('Failed to compress image'));
            }
          },
          'image/jpeg',
          0.8
        );
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Validate file before upload
   */
  validateFile(file: File, maxSizeMB: number = 10): { valid: boolean; error?: string } {
    const maxSize = maxSizeMB * 1024 * 1024;

    if (file.size > maxSize) {
      return {
        valid: false,
        error: `File size exceeds ${maxSizeMB}MB limit`
      };
    }

    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'video/mp4',
      'video/webm',
      'application/pdf',
      'text/plain'
    ];

    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: 'File type not supported'
      };
    }

    return { valid: true };
  }
}

export const pinataService = new PinataService();
export default pinataService;