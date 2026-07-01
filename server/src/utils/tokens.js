import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

/**
 * Sign a short-lived access token for the given user.
 */
export function generateAccessToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '15m' });
}

/**
 * Sign a long-lived refresh token for the given user.
 */
export function generateRefreshToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
}

/**
 * Verify and decode an access token.
 */
export function verifyAccessToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

/**
 * Verify and decode a refresh token.
 */
export function verifyRefreshToken(token) {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
}

/**
 * Hash a token before storing in the database.
 */
export async function hashToken(token) {
  return bcrypt.hash(token, 10);
}

/**
 * Compare a plain token with its stored hash.
 */
export async function compareTokenHash(token, hash) {
  if (!hash) return false;
  return bcrypt.compare(token, hash);
}
