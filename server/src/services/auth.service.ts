import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import db from '../config/database';
import { generateAccountNumber } from '../utils/helpers';
import {
  BadRequestError,
  ConflictError,
  UnauthorizedError,
} from '../utils/errors';
import { JWT_SECRET, JWT_REFRESH_SECRET } from '../config/env';
import { logAction } from './audit.service';

interface RegisterInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  dateOfBirth?: string;
}

interface LoginInput {
  email: string;
  password: string;
}

function generateTokens(userId: string, email: string) {
  const accessToken = jwt.sign({ userId, email }, JWT_SECRET, {
    expiresIn: 900, // 15 minutes
  });

  const refreshToken = jwt.sign({ userId, email }, JWT_REFRESH_SECRET, {
    expiresIn: 604800, // 7 days
  });

  return { accessToken, refreshToken };
}

export async function register(input: RegisterInput) {
  const { email, password, firstName, lastName, phone, dateOfBirth } = input;

  const existing = await db('users').where({ email }).first();
  if (existing) {
    throw new ConflictError('Email already registered');
  }

  if (phone) {
    const phoneExists = await db('users').where({ phone }).first();
    if (phoneExists) {
      throw new ConflictError('Phone number already registered');
    }
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const result = await db.transaction(async (trx) => {
    const [user] = await trx('users')
      .insert({
        email,
        password_hash: passwordHash,
        first_name: firstName,
        last_name: lastName,
        phone,
        date_of_birth: dateOfBirth,
        kyc_status: 'verified',
      })
      .returning('*');

    // Auto-create checking account
    const [account] = await trx('accounts')
      .insert({
        user_id: user.id,
        account_type: 'checking',
        account_number: generateAccountNumber(),
        balance: 0,
      })
      .returning('*');

    const tokens = generateTokens(user.id, user.email);

    await trx('users')
      .where({ id: user.id })
      .update({ refresh_token: tokens.refreshToken });

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        phone: user.phone,
        kycStatus: user.kyc_status,
      },
      account: {
        id: account.id,
        accountType: account.account_type,
        accountNumber: account.account_number,
        routingNumber: account.routing_number,
        balance: parseFloat(account.balance),
      },
      ...tokens,
    };
  });

  await logAction(result.user.id, 'REGISTER', { email });
  return result;
}

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

export async function login(input: LoginInput) {
  const { email, password } = input;

  const user = await db('users').where({ email }).first();
  if (!user) {
    throw new UnauthorizedError('Invalid email or password');
  }

  // Check if account is locked
  if (user.locked_until && new Date(user.locked_until) > new Date()) {
    const remainingMs = new Date(user.locked_until).getTime() - Date.now();
    const remainingMin = Math.ceil(remainingMs / 60000);
    throw new UnauthorizedError(
      `Account is locked due to too many failed attempts. Try again in ${remainingMin} minute${remainingMin !== 1 ? 's' : ''}.`
    );
  }

  const isValid = await bcrypt.compare(password, user.password_hash);
  if (!isValid) {
    const attempts = (user.failed_login_attempts || 0) + 1;
    const updateData: Record<string, unknown> = { failed_login_attempts: attempts };

    if (attempts >= MAX_LOGIN_ATTEMPTS) {
      updateData.locked_until = new Date(Date.now() + LOCKOUT_DURATION_MS).toISOString();
    }

    await db('users').where({ id: user.id }).update(updateData);

    if (attempts >= MAX_LOGIN_ATTEMPTS) {
      await logAction(user.id, 'ACCOUNT_LOCKED', { email, attempts });
      throw new UnauthorizedError(
        'Too many failed login attempts. Your account has been locked for 15 minutes.'
      );
    }

    await logAction(user.id, 'LOGIN_FAILED', { email, attempts });
    throw new UnauthorizedError('Invalid email or password');
  }

  // Successful login — reset lockout counters
  await db('users').where({ id: user.id }).update({
    failed_login_attempts: 0,
    locked_until: null,
  });

  const tokens = generateTokens(user.id, user.email);

  await db('users')
    .where({ id: user.id })
    .update({ refresh_token: tokens.refreshToken });

  await logAction(user.id, 'LOGIN', { email });

  return {
    user: {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      phone: user.phone,
      kycStatus: user.kyc_status,
    },
    ...tokens,
  };
}

export async function refreshAccessToken(refreshToken: string) {
  try {
    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as {
      userId: string;
      email: string;
    };

    const user = await db('users').where({ id: decoded.userId }).first();
    if (!user || user.refresh_token !== refreshToken) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    const tokens = generateTokens(user.id, user.email);

    await db('users')
      .where({ id: user.id })
      .update({ refresh_token: tokens.refreshToken });

    return tokens;
  } catch {
    throw new UnauthorizedError('Invalid or expired refresh token');
  }
}

export async function logout(userId: string) {
  await db('users').where({ id: userId }).update({ refresh_token: null });
  await logAction(userId, 'LOGOUT');
}

export async function getProfile(userId: string) {
  const user = await db('users').where({ id: userId }).first();
  if (!user) {
    throw new BadRequestError('User not found');
  }

  return {
    id: user.id,
    email: user.email,
    firstName: user.first_name,
    lastName: user.last_name,
    phone: user.phone,
    dateOfBirth: user.date_of_birth,
    address: user.address,
    kycStatus: user.kyc_status,
    createdAt: user.created_at,
  };
}

export async function updateProfile(
  userId: string,
  updates: { firstName?: string; lastName?: string; phone?: string; address?: object }
) {
  const updateData: Record<string, unknown> = {};
  if (updates.firstName) updateData.first_name = updates.firstName;
  if (updates.lastName) updateData.last_name = updates.lastName;
  if (updates.phone) updateData.phone = updates.phone;
  if (updates.address) updateData.address = JSON.stringify(updates.address);

  await db('users').where({ id: userId }).update(updateData);

  return getProfile(userId);
}

export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string
) {
  const user = await db('users').where({ id: userId }).first();
  if (!user) {
    throw new BadRequestError('User not found');
  }

  const isValid = await bcrypt.compare(currentPassword, user.password_hash);
  if (!isValid) {
    throw new UnauthorizedError('Current password is incorrect');
  }

  const newHash = await bcrypt.hash(newPassword, 10);
  await db('users').where({ id: userId }).update({ password_hash: newHash });

  // Invalidate refresh token to force re-login on other devices
  await db('users').where({ id: userId }).update({ refresh_token: null });
  await logAction(userId, 'PASSWORD_CHANGED');
}
