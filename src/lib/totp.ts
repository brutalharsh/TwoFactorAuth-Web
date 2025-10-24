import jsotp from 'jsotp';

export interface TOTPConfig {
  secret: string;
  algorithm?: 'SHA1' | 'SHA256' | 'SHA512';
  digits?: 6 | 8;
  period?: number;
}

export function generateTOTP(config: TOTPConfig): string {
  const { secret, algorithm = 'SHA1', digits = 6, period = 30 } = config;
  
  try {
    const totp = new jsotp.TOTP(secret);
    totp.interval = period;
    
    const code = totp.now();
    
    // Ensure the code has the correct number of digits
    return code.toString().padStart(digits, '0').slice(-digits);
  } catch (error) {
    console.error('Error generating TOTP:', error);
    return '000000';
  }
}

export function getTimeRemaining(period: number = 30): number {
  const now = Math.floor(Date.now() / 1000);
  return period - (now % period);
}

export function getProgressPercentage(period: number = 30): number {
  const remaining = getTimeRemaining(period);
  return (remaining / period) * 100;
}

export function validateSecret(secret: string): boolean {
  // Base32 alphabet (no padding needed for validation)
  const base32Regex = /^[A-Z2-7]+=*$/;
  return base32Regex.test(secret.toUpperCase());
}

export function parseOTPAuthUri(uri: string): {
  issuer: string;
  account_name: string;
  secret: string;
  algorithm: 'SHA1' | 'SHA256' | 'SHA512';
  digits: 6 | 8;
  period: number;
} | null {
  try {
    const url = new URL(uri);
    
    if (url.protocol !== 'otpauth:') {
      return null;
    }
    
    if (url.host !== 'totp') {
      return null;
    }
    
    const pathParts = url.pathname.slice(1).split(':');
    const issuer = url.searchParams.get('issuer') || pathParts[0] || 'Unknown';
    const account_name = pathParts[1] || pathParts[0] || 'Unknown Account';
    const secret = url.searchParams.get('secret');
    
    if (!secret) {
      return null;
    }
    
    const algorithm = (url.searchParams.get('algorithm') || 'SHA1').toUpperCase() as 'SHA1' | 'SHA256' | 'SHA512';
    const digits = parseInt(url.searchParams.get('digits') || '6') as 6 | 8;
    const period = parseInt(url.searchParams.get('period') || '30');
    
    return {
      issuer,
      account_name,
      secret: secret.toUpperCase(),
      algorithm,
      digits,
      period,
    };
  } catch (error) {
    console.error('Error parsing OTP auth URI:', error);
    return null;
  }
}

export function generateOTPAuthUri(config: {
  issuer: string;
  account_name: string;
  secret: string;
  algorithm?: 'SHA1' | 'SHA256' | 'SHA512';
  digits?: 6 | 8;
  period?: number;
}): string {
  const { issuer, account_name, secret, algorithm = 'SHA1', digits = 6, period = 30 } = config;
  
  const params = new URLSearchParams({
    secret,
    issuer,
    algorithm,
    digits: digits.toString(),
    period: period.toString(),
  });
  
  return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(account_name)}?${params}`;
}

export function getProgressColor(percentage: number): string {
  if (percentage > 66) return 'hsl(var(--success))';
  if (percentage > 33) return 'hsl(var(--warning))';
  return 'hsl(var(--destructive))';
}
