import _sodium from 'libsodium-wrappers';

interface KeyPair {
  publicKey: Uint8Array;
  privateKey: Uint8Array;
}

interface EncryptedMessage {
  ciphertext: string;
  nonce: string;
  ephemeralPublicKey: string;
}

class EncryptionService {
  private sodium: any = null;
  private isReady = false;

  /**
   * Initialize libsodium
   */
  async init() {
    if (this.isReady) return;
    
    await _sodium.ready;
    this.sodium = _sodium;
    this.isReady = true;
  }

  /**
   * Generate a new key pair for the user
   */
  async generateKeyPair(): Promise<KeyPair> {
    await this.init();
    const keyPair = this.sodium.crypto_box_keypair();
    
    return {
      publicKey: keyPair.publicKey,
      privateKey: keyPair.privateKey,
    };
  }

  /**
   * Encrypt a message for a specific recipient
   */
  async encryptMessage(
    message: string,
    recipientPublicKey: Uint8Array,
    senderPrivateKey: Uint8Array
  ): Promise<EncryptedMessage> {
    await this.init();
    
    // Generate ephemeral key pair for this message
    const ephemeralKeyPair = this.sodium.crypto_box_keypair();
    
    // Generate random nonce
    const nonce = this.sodium.randombytes_buf(this.sodium.crypto_box_NONCEBYTES);
    
    // Encrypt the message
    const messageBytes = this.sodium.from_string(message);
    const ciphertext = this.sodium.crypto_box_easy(
      messageBytes,
      nonce,
      recipientPublicKey,
      senderPrivateKey
    );

    return {
      ciphertext: this.sodium.to_base64(ciphertext),
      nonce: this.sodium.to_base64(nonce),
      ephemeralPublicKey: this.sodium.to_base64(ephemeralKeyPair.publicKey),
    };
  }

  /**
   * Decrypt a message
   */
  async decryptMessage(
    encryptedMessage: EncryptedMessage,
    senderPublicKey: Uint8Array,
    recipientPrivateKey: Uint8Array
  ): Promise<string> {
    await this.init();
    
    try {
      const ciphertext = this.sodium.from_base64(encryptedMessage.ciphertext);
      const nonce = this.sodium.from_base64(encryptedMessage.nonce);
      
      const decrypted = this.sodium.crypto_box_open_easy(
        ciphertext,
        nonce,
        senderPublicKey,
        recipientPrivateKey
      );
      
      return this.sodium.to_string(decrypted);
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Failed to decrypt message');
    }
  }

  /**
   * Encrypt data for storage (using secret key encryption)
   */
  async encryptForStorage(data: string, key: Uint8Array): Promise<EncryptedMessage> {
    await this.init();
    
    const nonce = this.sodium.randombytes_buf(this.sodium.crypto_secretbox_NONCEBYTES);
    const dataBytes = this.sodium.from_string(data);
    const ciphertext = this.sodium.crypto_secretbox_easy(dataBytes, nonce, key);
    
    return {
      ciphertext: this.sodium.to_base64(ciphertext),
      nonce: this.sodium.to_base64(nonce),
      ephemeralPublicKey: '', // Not used for storage encryption
    };
  }

  /**
   * Decrypt data from storage
   */
  async decryptFromStorage(
    encryptedData: EncryptedMessage,
    key: Uint8Array
  ): Promise<string> {
    await this.init();
    
    try {
      const ciphertext = this.sodium.from_base64(encryptedData.ciphertext);
      const nonce = this.sodium.from_base64(encryptedData.nonce);
      
      const decrypted = this.sodium.crypto_secretbox_open_easy(ciphertext, nonce, key);
      return this.sodium.to_string(decrypted);
    } catch (error) {
      console.error('Storage decryption failed:', error);
      throw new Error('Failed to decrypt stored data');
    }
  }

  /**
   * Generate a symmetric key for storage encryption
   */
  async generateStorageKey(): Promise<Uint8Array> {
    await this.init();
    return this.sodium.crypto_secretbox_keygen();
  }

  /**
   * Derive key from password (for backup/recovery)
   */
  async deriveKeyFromPassword(
    password: string,
    salt: Uint8Array
  ): Promise<Uint8Array> {
    await this.init();
    
    const passwordBytes = this.sodium.from_string(password);
    return this.sodium.crypto_pwhash(
      this.sodium.crypto_secretbox_KEYBYTES,
      passwordBytes,
      salt,
      this.sodium.crypto_pwhash_OPSLIMIT_INTERACTIVE,
      this.sodium.crypto_pwhash_MEMLIMIT_INTERACTIVE,
      this.sodium.crypto_pwhash_ALG_DEFAULT
    );
  }

  /**
   * Generate random salt
   */
  async generateSalt(): Promise<Uint8Array> {
    await this.init();
    return this.sodium.randombytes_buf(this.sodium.crypto_pwhash_SALTBYTES);
  }

  /**
   * Convert Uint8Array to base64 string
   */
  arrayToBase64(array: Uint8Array): string {
    return this.sodium?.to_base64(array) || '';
  }

  /**
   * Convert base64 string to Uint8Array
   */
  base64ToArray(base64: string): Uint8Array {
    return this.sodium?.from_base64(base64) || new Uint8Array();
  }

  /**
   * Generate a secure random ID
   */
  async generateSecureId(): Promise<string> {
    await this.init();
    const randomBytes = this.sodium.randombytes_buf(16);
    return this.sodium.to_hex(randomBytes);
  }

  /**
   * Hash data using Blake2b
   */
  async hashData(data: string): Promise<string> {
    await this.init();
    const dataBytes = this.sodium.from_string(data);
    const hash = this.sodium.crypto_generichash(32, dataBytes);
    return this.sodium.to_hex(hash);
  }

  /**
   * Verify if the encryption service is ready
   */
  isEncryptionReady(): boolean {
    return this.isReady;
  }
}

// Create singleton instance
export const encryptionService = new EncryptionService();

// Key management utilities
export class KeyManager {
  private static readonly STORAGE_KEY = 'chainchat_keys';
  private static readonly BACKUP_KEY = 'chainchat_backup';

  /**
   * Store user keys in local storage (encrypted)
   */
  static async storeKeys(keyPair: KeyPair, password?: string): Promise<void> {
    const keys = {
      publicKey: encryptionService.arrayToBase64(keyPair.publicKey),
      privateKey: encryptionService.arrayToBase64(keyPair.privateKey),
      timestamp: Date.now(),
    };

    if (password) {
      // Encrypt keys with password
      const salt = await encryptionService.generateSalt();
      const derivedKey = await encryptionService.deriveKeyFromPassword(password, salt);
      const encryptedKeys = await encryptionService.encryptForStorage(
        JSON.stringify(keys),
        derivedKey
      );

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify({
        ...encryptedKeys,
        salt: encryptionService.arrayToBase64(salt),
        encrypted: true,
      }));
    } else {
      // Store keys unencrypted (not recommended for production)
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify({
        ...keys,
        encrypted: false,
      }));
    }
  }

  /**
   * Retrieve user keys from storage
   */
  static async getKeys(password?: string): Promise<KeyPair | null> {
    const storedData = localStorage.getItem(this.STORAGE_KEY);
    if (!storedData) return null;

    try {
      const data = JSON.parse(storedData);

      if (data.encrypted && password) {
        // Decrypt keys
        const salt = encryptionService.base64ToArray(data.salt);
        const derivedKey = await encryptionService.deriveKeyFromPassword(password, salt);
        const decryptedData = await encryptionService.decryptFromStorage(
          {
            ciphertext: data.ciphertext,
            nonce: data.nonce,
            ephemeralPublicKey: '',
          },
          derivedKey
        );
        const keys = JSON.parse(decryptedData);
        
        return {
          publicKey: encryptionService.base64ToArray(keys.publicKey),
          privateKey: encryptionService.base64ToArray(keys.privateKey),
        };
      } else if (!data.encrypted) {
        // Keys stored unencrypted
        return {
          publicKey: encryptionService.base64ToArray(data.publicKey),
          privateKey: encryptionService.base64ToArray(data.privateKey),
        };
      }

      return null;
    } catch (error) {
      console.error('Failed to retrieve keys:', error);
      return null;
    }
  }

  /**
   * Clear stored keys
   */
  static clearKeys(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.BACKUP_KEY);
  }

  /**
   * Check if keys exist in storage
   */
  static hasKeys(): boolean {
    return localStorage.getItem(this.STORAGE_KEY) !== null;
  }

  /**
   * Export keys for backup
   */
  static async exportKeys(password: string): Promise<string> {
    const keys = await this.getKeys();
    if (!keys) throw new Error('No keys found');

    const backup = {
      publicKey: encryptionService.arrayToBase64(keys.publicKey),
      privateKey: encryptionService.arrayToBase64(keys.privateKey),
      timestamp: Date.now(),
      version: '1.0',
    };

    const salt = await encryptionService.generateSalt();
    const derivedKey = await encryptionService.deriveKeyFromPassword(password, salt);
    const encrypted = await encryptionService.encryptForStorage(
      JSON.stringify(backup),
      derivedKey
    );

    return JSON.stringify({
      ...encrypted,
      salt: encryptionService.arrayToBase64(salt),
    });
  }

  /**
   * Import keys from backup
   */
  static async importKeys(backupData: string, password: string): Promise<boolean> {
    try {
      const data = JSON.parse(backupData);
      const salt = encryptionService.base64ToArray(data.salt);
      const derivedKey = await encryptionService.deriveKeyFromPassword(password, salt);
      
      const decryptedData = await encryptionService.decryptFromStorage(
        {
          ciphertext: data.ciphertext,
          nonce: data.nonce,
          ephemeralPublicKey: '',
        },
        derivedKey
      );
      
      const backup = JSON.parse(decryptedData);
      const keys: KeyPair = {
        publicKey: encryptionService.base64ToArray(backup.publicKey),
        privateKey: encryptionService.base64ToArray(backup.privateKey),
      };

      await this.storeKeys(keys, password);
      return true;
    } catch (error) {
      console.error('Failed to import keys:', error);
      return false;
    }
  }
}

export default encryptionService;