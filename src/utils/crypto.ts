/**
 * Utility functions for masking sensitive data (passwords, PINs, emails)
 * and simulating AES-256-GCM encryption/decryption at rest.
 */

export function maskString(str: string, visibleCharsAtEnd: number = 3): string {
  if (!str) return '•••';
  if (str.length <= visibleCharsAtEnd) {
    return '•'.repeat(str.length);
  }
  const maskedLength = str.length - visibleCharsAtEnd;
  return '•'.repeat(maskedLength) + str.slice(maskedLength);
}

export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return '••••@••••.com';
  const [local, domain] = email.split('@');
  if (local.length <= 2) {
    return `${local[0]}*@${domain}`;
  }
  return `${local.slice(0, 2)}${'*'.repeat(Math.max(3, local.length - 2))}@${domain}`;
}

export function simulateDecrypt(encryptedStr: string): string {
  if (!encryptedStr) return '';
  if (encryptedStr.startsWith('enc_aes256_')) {
    try {
      return atob(encryptedStr.replace('enc_aes256_', ''));
    } catch {
      return encryptedStr;
    }
  }
  return encryptedStr;
}

export function simulateEncrypt(plainText: string): string {
  if (!plainText) return '';
  try {
    return 'enc_aes256_' + btoa(plainText);
  } catch {
    return plainText;
  }
}

export function formatCurrency(amount: number, currencySetting: string = 'USD ($)'): string {
  if (typeof amount !== 'number' || isNaN(amount)) amount = 0;
  let rate = 1.0;
  let symbol = '$';
  let position: 'prefix' | 'suffix' = 'prefix';

  if (currencySetting.includes('EUR') || currencySetting.includes('€')) {
    rate = 0.92;
    symbol = '€';
    position = 'prefix';
  } else if (currencySetting.includes('MAD') || currencySetting.includes('DH')) {
    rate = 10.0;
    symbol = 'DH';
    position = 'suffix';
  } else if (currencySetting.includes('SAR')) {
    rate = 3.75;
    symbol = 'SAR';
    position = 'suffix';
  } else if (currencySetting.includes('GBP') || currencySetting.includes('£')) {
    rate = 0.78;
    symbol = '£';
    position = 'prefix';
  } else if (currencySetting.includes('USD') || currencySetting.includes('$')) {
    rate = 1.0;
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
