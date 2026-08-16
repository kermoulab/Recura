/**
 * AES-256-GCM encryption/decryption using Web Crypto API.
 *
 * SECURITY: replaces the old base64-only "simulation" with real authenticated
 * encryption. Legacy `enc_aes256_` values (which were just base64) are still
 * readable during migration, but new values use proper AES-GCM.
 *
 * Format: "aes256gcm:<base64(iv)>:<base64(ciphertext+tag)>"
 */

const AES_PREFIX = 'aes256gcm:';
const LEGACY_PREFIX = 'enc_aes256_';
const KEY_STORAGE = 'recura.encryption.key.v1';

// Singleton encryption key (persistent, so reloads keep decrypting old data)
let _aesKey: CryptoKey | null = null;

async function importKeyFromRaw(raw: Uint8Array): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    raw,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt'],
  );
}

async function getEncryptionKey(): Promise<CryptoKey> {
  if (_aesKey) return _aesKey;

  // 1. Fixed build-time key (VITE_ENCRYPTION_KEY) — stable across browsers/devices.
  const envKey =
    typeof import.meta !== 'undefined'
      ? (import.meta as any).env?.VITE_ENCRYPTION_KEY
      : undefined;
  if (envKey && typeof envKey === 'string' && envKey.length >= 32) {
    _aesKey = await importKeyFromRaw(new TextEncoder().encode(envKey.slice(0, 32)));
    return _aesKey;
  }

  // 2. Key persisted from a previous session (survives reloads).
  const stored = localStorage.getItem(KEY_STORAGE);
  if (stored) {
    try {
      _aesKey = await importKeyFromRaw(Uint8Array.from(atob(stored), (c) => c.charCodeAt(0)));
      return _aesKey;
    } catch {
      // stored key is corrupt — generate a fresh one below
    }
  }

  // 3. New random key, persisted for future sessions.
  const key = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt'],
  );
  try {
    const raw = new Uint8Array(await crypto.subtle.exportKey('raw', key));
    localStorage.setItem(KEY_STORAGE, btoa(String.fromCharCode(...raw)));
  } catch {
    // Storage unavailable — key stays ephemeral for this session only.
  }
  _aesKey = key;
  return _aesKey;
}

/** True when the value is still an encrypted blob (i.e. could not be decrypted). */
export function isEncryptedValue(value: string): boolean {
  return value.startsWith(AES_PREFIX) || value.startsWith(LEGACY_PREFIX);
}

export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return '••••@••••.com';
  const [local, domain] = email.split('@');
  if (local.length <= 2) {
    return `${local[0]}*@${domain}`;
  }
  return `${local.slice(0, 2)}${'*'.repeat(Math.max(3, local.length - 2))}@${domain}`;
}

/**
 * Decrypts a stored credential string.
 *  - `aes256gcm:...` — real AES-256-GCM (new format)
 *  - `enc_aes256_...` — legacy base64 (migration fallback)
 *  - anything else    — returned as-is (already plaintext)
 */
export async function simulateDecrypt(encryptedStr: string): Promise<string> {
  if (!encryptedStr) return '';

  // New format: real AES-256-GCM
  if (encryptedStr.startsWith(AES_PREFIX)) {
    try {
      const parts = encryptedStr.slice(AES_PREFIX.length).split(':');
      if (parts.length !== 2) return encryptedStr;
      const iv = Uint8Array.from(atob(parts[0]), (c) => c.charCodeAt(0));
      const ct = Uint8Array.from(atob(parts[1]), (c) => c.charCodeAt(0));
      const key = await getEncryptionKey();
      const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct);
      return new TextDecoder().decode(plain);
    } catch {
      return encryptedStr;
    }
  }

  // Legacy format: base64 encoded (NOT real encryption — migration only)
  if (encryptedStr.startsWith(LEGACY_PREFIX)) {
    try {
      return atob(encryptedStr.replace(LEGACY_PREFIX, ''));
    } catch {
      return encryptedStr;
    }
  }

  return encryptedStr;
}

/**
 * Encrypts a plaintext credential with AES-256-GCM.
 */
export async function simulateEncrypt(plainText: string): Promise<string> {
  if (!plainText) return '';
  try {
    const key = await getEncryptionKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const enc = new TextEncoder();
    const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(plainText));
    const ivB64 = btoa(String.fromCharCode(...iv));
    const ctB64 = btoa(String.fromCharCode(...new Uint8Array(ct)));
    return `${AES_PREFIX}${ivB64}:${ctB64}`;
  } catch {
    // If Web Crypto is unavailable, fall back to legacy format
    // (should only happen in very old browsers)
    try {
      return LEGACY_PREFIX + btoa(plainText);
    } catch {
      return plainText;
    }
  }
}

export function getCurrencyRate(currencySetting: string = 'USD ($)'): number {
  if (currencySetting.includes('EUR') || currencySetting.includes('€')) return 0.92;
  if (currencySetting.includes('MAD') || currencySetting.includes('DH')) return 10.0;
  if (currencySetting.includes('SAR')) return 3.75;
  if (currencySetting.includes('GBP') || currencySetting.includes('£')) return 0.79;
  if (currencySetting.includes('AED') || currencySetting.includes('د.إ')) return 3.67;
  if (currencySetting.includes('RUB') || currencySetting.includes('₽')) return 92.0;
  if (currencySetting.includes('INR') || currencySetting.includes('₹')) return 85.0;
  return 1.0; // USD (base) and any unknown setting
}

export function formatCurrency(amount: number, currencySetting: string = 'USD ($)'): string {
  if (typeof amount !== 'number' || isNaN(amount)) amount = 0;
  const rate = getCurrencyRate(currencySetting);
  let symbol = '$';
  let position: 'prefix' | 'suffix' = 'prefix';

  if (currencySetting.includes('EUR') || currencySetting.includes('€')) {
    symbol = '€';
    position = 'prefix';
  } else if (currencySetting.includes('MAD') || currencySetting.includes('DH')) {
    symbol = 'DH';
    position = 'suffix';
  } else if (currencySetting.includes('SAR')) {
    symbol = 'SAR';
    position = 'suffix';
  } else if (currencySetting.includes('GBP') || currencySetting.includes('£')) {
    symbol = '£';
    position = 'prefix';
  } else if (currencySetting.includes('AED') || currencySetting.includes('د.إ')) {
    symbol = 'د.إ';
    position = 'suffix';
  } else if (currencySetting.includes('RUB') || currencySetting.includes('₽')) {
    symbol = '₽';
    position = 'suffix';
  } else if (currencySetting.includes('INR') || currencySetting.includes('₹')) {
    symbol = '₹';
    position = 'prefix';
  } else if (currencySetting.includes('USD') || currencySetting.includes('$')) {
    symbol = '$';
    position = 'prefix';
  } else {
    const match = currencySetting.match(/\((.*?)\)/);
    if (match && match[1]) {
      symbol = match[1];
    } else {
      symbol = currencySetting.split(' ')[0] || '$';
    }
  }

  const convertedAmount = amount * rate;

  const formattedNum = convertedAmount.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  return position === 'suffix' ? `${formattedNum} ${symbol}` : `${symbol}${formattedNum}`;
}

export function calculateDaysRemaining(endDateStr: string): number {
  const endDate = new Date(endDateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  endDate.setHours(0, 0, 0, 0);
  
  const diffTime = endDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}
