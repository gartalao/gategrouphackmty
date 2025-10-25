import crypto from 'crypto';

export function md5Hash(buffer: Buffer): string {
  return crypto.createHash('md5').update(buffer).digest('hex');
}

export function sha256Hash(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

