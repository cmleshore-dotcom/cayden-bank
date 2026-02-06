import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import db from '../config/database';
import { BadRequestError, UnauthorizedError } from '../utils/errors';
import { JWT_SECRET } from '../config/env';
import { logAction } from './audit.service';

const PIN_TOKEN_EXPIRES = 120; // 2 minutes in seconds

export async function hasPin(userId: string): Promise<boolean> {
  const user = await db('users').where({ id: userId }).select('pin_hash').first();
  return !!user?.pin_hash;
}

export async function setPin(
  userId: string,
  pin: string,
  password: string
): Promise<void> {
  // Validate PIN format
  if (!/^\d{4}$/.test(pin)) {
    throw new BadRequestError('PIN must be exactly 4 digits');
  }

  // Verify user's password before allowing PIN set
  const user = await db('users').where({ id: userId }).first();
  if (!user) {
    throw new BadRequestError('User not found');
  }

  const isValid = await bcrypt.compare(password, user.password_hash);
  if (!isValid) {
    throw new UnauthorizedError('Invalid password');
  }

  const isUpdate = !!user.pin_hash;
  const pinHash = await bcrypt.hash(pin, 10);
  await db('users').where({ id: userId }).update({ pin_hash: pinHash });

  await logAction(userId, isUpdate ? 'PIN_CHANGED' : 'PIN_SET');
}

export async function verifyPin(
  userId: string,
  pin: string
): Promise<{ verified: boolean; pinToken?: string }> {
  if (!/^\d{4}$/.test(pin)) {
    throw new BadRequestError('PIN must be exactly 4 digits');
  }

  const user = await db('users').where({ id: userId }).select('id', 'email', 'pin_hash').first();
  if (!user || !user.pin_hash) {
    throw new BadRequestError('PIN not set');
  }

  const isValid = await bcrypt.compare(pin, user.pin_hash);
  if (!isValid) {
    await logAction(userId, 'PIN_FAILED');
    throw new UnauthorizedError('Invalid PIN');
  }

  await logAction(userId, 'PIN_VERIFIED');

  // Issue short-lived PIN token for transaction verification
  const pinToken = jwt.sign(
    { userId: user.id, type: 'pin-verify' },
    JWT_SECRET,
    { expiresIn: PIN_TOKEN_EXPIRES }
  );

  return { verified: true, pinToken };
}

export async function removePin(
  userId: string,
  password: string
): Promise<void> {
  const user = await db('users').where({ id: userId }).first();
  if (!user) {
    throw new BadRequestError('User not found');
  }

  const isValid = await bcrypt.compare(password, user.password_hash);
  if (!isValid) {
    throw new UnauthorizedError('Invalid password');
  }

  await db('users').where({ id: userId }).update({ pin_hash: null });
}
