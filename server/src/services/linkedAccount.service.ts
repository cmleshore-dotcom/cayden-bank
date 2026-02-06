import db from '../config/database';
import { BadRequestError, NotFoundError, ConflictError } from '../utils/errors';
import { logAction } from './audit.service';
import { encrypt, decrypt, isEncrypted } from '../utils/encryption';

export interface LinkedAccountInput {
  bankName: string;
  accountHolderName: string;
  accountNumberLast4: string;
  routingNumber: string;
  accountType: 'checking' | 'savings';
}

export interface LinkedAccountResponse {
  id: string;
  bankName: string;
  accountHolderName: string;
  accountNumberLast4: string;
  routingNumber: string;
  accountType: string;
  verificationStatus: string;
  isPrimary: boolean;
  institutionId: string | null;
  createdAt: string;
}

function decryptField(value: string): string {
  try {
    if (isEncrypted(value)) {
      return decrypt(value);
    }
  } catch {
    // If decryption fails, return raw value (legacy unencrypted data)
  }
  return value;
}

function formatAccount(row: any): LinkedAccountResponse {
  return {
    id: row.id,
    bankName: row.bank_name,
    accountHolderName: decryptField(row.account_holder_name),
    accountNumberLast4: row.account_number_last4,
    routingNumber: decryptField(row.routing_number),
    accountType: row.account_type,
    verificationStatus: row.verification_status,
    isPrimary: !!row.is_primary,
    institutionId: row.institution_id,
    createdAt: row.created_at,
  };
}

export async function linkAccount(
  userId: string,
  input: LinkedAccountInput
): Promise<LinkedAccountResponse> {
  // Validate routing number format (9 digits)
  if (!/^\d{9}$/.test(input.routingNumber)) {
    throw new BadRequestError('Routing number must be exactly 9 digits');
  }

  // Validate last 4 digits
  if (!/^\d{4}$/.test(input.accountNumberLast4)) {
    throw new BadRequestError('Account number last 4 must be exactly 4 digits');
  }

  // Check for duplicate linked account (by last4 + bank name since routing is encrypted)
  const existingAccounts = await db('linked_accounts')
    .where({
      user_id: userId,
      account_number_last4: input.accountNumberLast4,
      bank_name: input.bankName,
    });

  // For each matching account, decrypt and compare routing number
  for (const existing of existingAccounts) {
    const existingRouting = decryptField(existing.routing_number);
    if (existingRouting === input.routingNumber) {
      throw new ConflictError('This bank account is already linked');
    }
  }

  // Check if user has any existing linked accounts
  const existingCount = await db('linked_accounts')
    .where({ user_id: userId })
    .count('id as count')
    .first();

  const isFirst = !existingCount || (existingCount as any).count === 0;

  // Encrypt sensitive fields before storing
  const encryptedHolderName = encrypt(input.accountHolderName);
  const encryptedRoutingNumber = encrypt(input.routingNumber);

  const [account] = await db('linked_accounts')
    .insert({
      user_id: userId,
      bank_name: input.bankName,
      account_holder_name: encryptedHolderName,
      account_number_last4: input.accountNumberLast4,
      routing_number: encryptedRoutingNumber,
      account_type: input.accountType,
      verification_status: 'pending',
      is_primary: isFirst, // First linked account is automatically primary
    })
    .returning('*');

  await logAction(userId, 'BANK_LINKED', { bankName: input.bankName, accountType: input.accountType });
  return formatAccount(account);
}

export async function getUserLinkedAccounts(
  userId: string
): Promise<LinkedAccountResponse[]> {
  const accounts = await db('linked_accounts')
    .where({ user_id: userId })
    .orderBy('created_at', 'desc');

  return accounts.map(formatAccount);
}

export async function getLinkedAccountById(
  userId: string,
  accountId: string
): Promise<LinkedAccountResponse> {
  const account = await db('linked_accounts')
    .where({ id: accountId, user_id: userId })
    .first();

  if (!account) {
    throw new NotFoundError('Linked account not found');
  }

  return formatAccount(account);
}

export async function verifyLinkedAccount(
  userId: string,
  accountId: string
): Promise<LinkedAccountResponse> {
  const account = await db('linked_accounts')
    .where({ id: accountId, user_id: userId })
    .first();

  if (!account) {
    throw new NotFoundError('Linked account not found');
  }

  if (account.verification_status === 'verified') {
    throw new BadRequestError('Account is already verified');
  }

  // In a real app, this would verify micro-deposits or use Plaid.
  // For the demo, we simulate instant verification.
  await db('linked_accounts')
    .where({ id: accountId })
    .update({ verification_status: 'verified' });

  await logAction(userId, 'BANK_VERIFIED', { accountId, bankName: account.bank_name });

  return formatAccount({
    ...account,
    verification_status: 'verified',
  });
}

export async function setPrimaryAccount(
  userId: string,
  accountId: string
): Promise<LinkedAccountResponse> {
  const account = await db('linked_accounts')
    .where({ id: accountId, user_id: userId, verification_status: 'verified' })
    .first();

  if (!account) {
    throw new NotFoundError('Verified linked account not found');
  }

  // Unset all other primary accounts for this user
  await db('linked_accounts')
    .where({ user_id: userId })
    .update({ is_primary: false });

  // Set the new primary
  await db('linked_accounts')
    .where({ id: accountId })
    .update({ is_primary: true });

  return formatAccount({
    ...account,
    is_primary: true,
  });
}

export async function unlinkAccount(
  userId: string,
  accountId: string
): Promise<{ deleted: boolean }> {
  const account = await db('linked_accounts')
    .where({ id: accountId, user_id: userId })
    .first();

  if (!account) {
    throw new NotFoundError('Linked account not found');
  }

  await db('linked_accounts').where({ id: accountId }).delete();
  await logAction(userId, 'BANK_REMOVED', { accountId, bankName: account.bank_name });

  // If this was the primary account, set the next one as primary
  if (account.is_primary) {
    const nextAccount = await db('linked_accounts')
      .where({ user_id: userId })
      .orderBy('created_at', 'asc')
      .first();

    if (nextAccount) {
      await db('linked_accounts')
        .where({ id: nextAccount.id })
        .update({ is_primary: true });
    }
  }

  return { deleted: true };
}

export async function getUserPrimaryLinkedAccount(
  userId: string
): Promise<LinkedAccountResponse | null> {
  const account = await db('linked_accounts')
    .where({
      user_id: userId,
      is_primary: true,
      verification_status: 'verified',
    })
    .first();

  if (!account) return null;
  return formatAccount(account);
}

export async function hasVerifiedLinkedAccount(
  userId: string
): Promise<boolean> {
  const account = await db('linked_accounts')
    .where({
      user_id: userId,
      verification_status: 'verified',
    })
    .first();

  return !!account;
}
