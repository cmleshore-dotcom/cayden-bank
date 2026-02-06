/**
 * Centralized environment variable validation.
 * Throws at startup if required vars are missing — never falls back to insecure defaults.
 */

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. ` +
        `Set it in your .env file or system environment.`
    );
  }
  return value;
}

// JWT
export const JWT_SECRET = requireEnv('JWT_SECRET');
export const JWT_REFRESH_SECRET = requireEnv('JWT_REFRESH_SECRET');
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
export const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

// Encryption (loaded lazily — only required when encryption is actually used)
let _encryptionKey: string | null = null;
export function getEncryptionKey(): string {
  if (!_encryptionKey) {
    _encryptionKey = requireEnv('ENCRYPTION_KEY');
  }
  return _encryptionKey;
}

// Server
export const PORT = parseInt(process.env.PORT || '3000', 10);
export const NODE_ENV = process.env.NODE_ENV || 'development';
export const IS_DEV = NODE_ENV === 'development';

// Database (production only)
export function getDatabaseUrl(): string {
  if (NODE_ENV === 'production') {
    return requireEnv('DATABASE_URL');
  }
  return '';
}
