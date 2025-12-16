// ============================================
// API Key Encryption Module
// Secure storage for exchange credentials
// ============================================

import { createCipheriv, createDecipheriv, randomBytes, scrypt } from 'crypto'
import { promisify } from 'util'

const scryptAsync = promisify(scrypt)

// ============================================
// Constants
// ============================================

const ALGORITHM = 'aes-256-gcm'
const KEY_LENGTH = 32 // 256 bits
const IV_LENGTH = 16
const AUTH_TAG_LENGTH = 16
const SALT_LENGTH = 32

// ============================================
// Types
// ============================================

export interface EncryptedData {
  ciphertext: string // Base64 encoded
  iv: string // Base64 encoded
  authTag: string // Base64 encoded
  salt: string // Base64 encoded
  version: number
}

export interface ExchangeCredentials {
  apiKey: string
  secretKey: string
  passphrase?: string
}

export interface EncryptedCredentials {
  exchangeId: string
  data: EncryptedData
  createdAt: string
  updatedAt: string
}

// ============================================
// Key Derivation
// ============================================

/**
 * Derive encryption key from password using scrypt
 * More secure than PBKDF2 for password-based key derivation
 */
async function deriveKey(password: string, salt: Buffer): Promise<Buffer> {
  const key = await scryptAsync(password, salt, KEY_LENGTH) as Buffer
  return key
}

// ============================================
// Encryption Functions
// ============================================

/**
 * Encrypt data with AES-256-GCM
 * @param plaintext - Data to encrypt
 * @param masterPassword - User's master password or encryption key
 * @returns Encrypted data object
 */
export async function encrypt(
  plaintext: string,
  masterPassword: string
): Promise<EncryptedData> {
  // Generate random salt and IV
  const salt = randomBytes(SALT_LENGTH)
  const iv = randomBytes(IV_LENGTH)

  // Derive key from password
  const key = await deriveKey(masterPassword, salt)

  // Create cipher
  const cipher = createCipheriv(ALGORITHM, key, iv)

  // Encrypt data
  let ciphertext = cipher.update(plaintext, 'utf8', 'base64')
  ciphertext += cipher.final('base64')

  // Get auth tag
  const authTag = cipher.getAuthTag()

  return {
    ciphertext,
    iv: iv.toString('base64'),
    authTag: authTag.toString('base64'),
    salt: salt.toString('base64'),
    version: 1,
  }
}

/**
 * Decrypt data with AES-256-GCM
 * @param encryptedData - Encrypted data object
 * @param masterPassword - User's master password or encryption key
 * @returns Decrypted plaintext
 */
export async function decrypt(
  encryptedData: EncryptedData,
  masterPassword: string
): Promise<string> {
  // Parse base64 values
  const salt = Buffer.from(encryptedData.salt, 'base64')
  const iv = Buffer.from(encryptedData.iv, 'base64')
  const authTag = Buffer.from(encryptedData.authTag, 'base64')

  // Derive key from password
  const key = await deriveKey(masterPassword, salt)

  // Create decipher
  const decipher = createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)

  // Decrypt data
  let plaintext = decipher.update(encryptedData.ciphertext, 'base64', 'utf8')
  plaintext += decipher.final('utf8')

  return plaintext
}

// ============================================
// Credentials Management
// ============================================

/**
 * Encrypt exchange credentials
 */
export async function encryptCredentials(
  credentials: ExchangeCredentials,
  masterPassword: string
): Promise<EncryptedData> {
  const plaintext = JSON.stringify(credentials)
  return encrypt(plaintext, masterPassword)
}

/**
 * Decrypt exchange credentials
 */
export async function decryptCredentials(
  encryptedData: EncryptedData,
  masterPassword: string
): Promise<ExchangeCredentials> {
  const plaintext = await decrypt(encryptedData, masterPassword)
  return JSON.parse(plaintext) as ExchangeCredentials
}

// ============================================
// Credential Store
// ============================================

/**
 * In-memory credential store with encryption
 * In production, this should be backed by secure storage (e.g., Supabase with RLS)
 */
export class CredentialStore {
  private encryptedCredentials: Map<string, EncryptedCredentials> = new Map()
  private decryptedCache: Map<string, ExchangeCredentials> = new Map()
  private masterPassword: string | null = null
  private cacheTimeout: number = 5 * 60 * 1000 // 5 minutes

  /**
   * Initialize store with master password
   */
  async initialize(masterPassword: string): Promise<void> {
    this.masterPassword = masterPassword
    this.decryptedCache.clear()
  }

  /**
   * Lock the store (clear master password and cache)
   */
  lock(): void {
    this.masterPassword = null
    this.decryptedCache.clear()
  }

  /**
   * Check if store is unlocked
   */
  isUnlocked(): boolean {
    return this.masterPassword !== null
  }

  /**
   * Store encrypted credentials
   */
  async store(
    exchangeId: string,
    credentials: ExchangeCredentials
  ): Promise<void> {
    if (!this.masterPassword) {
      throw new Error('Store is locked. Call initialize() first.')
    }

    const encryptedData = await encryptCredentials(credentials, this.masterPassword)
    const now = new Date().toISOString()

    this.encryptedCredentials.set(exchangeId, {
      exchangeId,
      data: encryptedData,
      createdAt: now,
      updatedAt: now,
    })

    // Cache decrypted credentials
    this.decryptedCache.set(exchangeId, credentials)

    // Auto-clear cache after timeout
    setTimeout(() => {
      this.decryptedCache.delete(exchangeId)
    }, this.cacheTimeout)
  }

  /**
   * Retrieve and decrypt credentials
   */
  async retrieve(exchangeId: string): Promise<ExchangeCredentials | null> {
    // Check cache first
    const cached = this.decryptedCache.get(exchangeId)
    if (cached) {
      return cached
    }

    if (!this.masterPassword) {
      throw new Error('Store is locked. Call initialize() first.')
    }

    const encrypted = this.encryptedCredentials.get(exchangeId)
    if (!encrypted) {
      return null
    }

    try {
      const credentials = await decryptCredentials(encrypted.data, this.masterPassword)

      // Cache decrypted credentials
      this.decryptedCache.set(exchangeId, credentials)
      setTimeout(() => {
        this.decryptedCache.delete(exchangeId)
      }, this.cacheTimeout)

      return credentials
    } catch (error) {
      console.error(`Failed to decrypt credentials for ${exchangeId}:`, error)
      return null
    }
  }

  /**
   * Remove credentials
   */
  remove(exchangeId: string): void {
    this.encryptedCredentials.delete(exchangeId)
    this.decryptedCache.delete(exchangeId)
  }

  /**
   * Check if credentials exist for exchange
   */
  has(exchangeId: string): boolean {
    return this.encryptedCredentials.has(exchangeId)
  }

  /**
   * Get all exchange IDs with stored credentials
   */
  getStoredExchanges(): string[] {
    return Array.from(this.encryptedCredentials.keys())
  }

  /**
   * Export encrypted credentials (for backup/storage)
   */
  exportEncrypted(): EncryptedCredentials[] {
    return Array.from(this.encryptedCredentials.values())
  }

  /**
   * Import encrypted credentials (from backup/storage)
   */
  importEncrypted(credentials: EncryptedCredentials[]): void {
    for (const cred of credentials) {
      this.encryptedCredentials.set(cred.exchangeId, cred)
    }
  }
}

// ============================================
// Singleton Instance
// ============================================

export const credentialStore = new CredentialStore()

// ============================================
// Utility Functions
// ============================================

/**
 * Generate a secure random password
 */
export function generateSecurePassword(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
  const bytes = randomBytes(length)
  let password = ''

  for (let i = 0; i < length; i++) {
    password += chars[bytes[i] % chars.length]
  }

  return password
}

/**
 * Mask API key for display (show first 4 and last 4 characters)
 */
export function maskApiKey(apiKey: string): string {
  if (apiKey.length <= 8) {
    return '********'
  }
  return `${apiKey.slice(0, 4)}${'*'.repeat(apiKey.length - 8)}${apiKey.slice(-4)}`
}

/**
 * Validate API key format
 */
export function isValidApiKeyFormat(apiKey: string): boolean {
  // Basic validation - at least 16 characters, alphanumeric
  return /^[A-Za-z0-9]{16,}$/.test(apiKey)
}

/**
 * Securely compare two strings (timing-safe)
 */
export function secureCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false
  }

  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }

  return result === 0
}
