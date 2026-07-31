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
