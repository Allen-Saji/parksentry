import { env } from './env';

const rawKeys = process.env.API_KEYS ?? '';
export const API_KEYS = rawKeys
  .split(',')
  .map((k) => k.trim())
  .filter(Boolean);

export const AUTH_ENABLED = API_KEYS.length > 0 || env.NODE_ENV === 'production';
