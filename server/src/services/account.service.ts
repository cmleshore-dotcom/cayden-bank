import db from '../config/database';
import { generateAccountNumber } from '../utils/helpers';
import { BadRequestError, NotFoundError } from '../utils/errors';

export async function getUserAccounts(userId: string) {
  const accounts = await db('accounts').where({ user_id: userId });

  return accounts.map((a) => ({
    id: a.id,
    accountType: a.account_type,
    accountNumber: a.account_number,
    routingNumber: a.routing_number,
    balance: parseFloat(a.balance),
    status: a.status,
    roundUpEnabled: a.round_up_enabled,
    createdAt: a.created_at,
  }));
}

export async function getAccountById(userId: string, accountId: string) {
  const account = await db('accounts')
    .where({ id: accountId, user_id: userId })
    .first();

  if (!account) {
    throw new NotFoundError('Account not found');
  }

  return {
    id: account.id,
    accountType: account.account_type,
    accountNumber: account.account_number,
    routingNumber: account.routing_number,
    balance: parseFloat(account.balance),
    status: account.status,
    roundUpEnabled: account.round_up_enabled,
    createdAt: account.created_at,
  };
}

export async function createSavingsAccount(userId: string) {
  const existing = await db('accounts').where({
    user_id: userId,
    account_type: 'savings',
  });

  if (existing.length > 0) {
    throw new BadRequestError('You already have a savings account');
  }

  const [account] = await db('accounts')
    .insert({
      user_id: userId,
      account_type: 'savings',
      account_number: generateAccountNumber(),
      balance: 0,
    })
    .returning('*');

  return {
    id: account.id,
    accountType: account.account_type,
    accountNumber: account.account_number,
    routingNumber: account.routing_number,
    balance: parseFloat(account.balance),
    status: account.status,
    roundUpEnabled: account.round_up_enabled,
    createdAt: account.created_at,
  };
}

export async function deposit(
  userId: string,
  accountId: string,
  amount: number,
  description: string = 'Direct Deposit'
) {
  if (amount <= 0) {
    throw new BadRequestError('Amount must be positive');
  }

  return db.transaction(async (trx) => {
    const account = await trx('accounts')
      .where({ id: accountId, user_id: userId })
      .first();

    if (!account) {
      throw new NotFoundError('Account not found');
    }

    const newBalance = parseFloat(account.balance) + amount;

    await trx('accounts')
      .where({ id: accountId })
      .update({ balance: newBalance });

    const [transaction] = await trx('transactions')
      .insert({
        account_id: accountId,
        type: 'credit',
        category: 'deposit',
        amount,
        description,
        balance_after: newBalance,
      })
      .returning('*');

    return {
      transaction: {
        id: transaction.id,
        type: transaction.type,
        category: transaction.category,
        amount: parseFloat(transaction.amount),
        description: transaction.description,
        balanceAfter: parseFloat(transaction.balance_after),
        createdAt: transaction.created_at,
      },
      newBalance,
    };
  });
}

export async function transfer(
  userId: string,
  fromAccountId: string,
  toAccountId: string,
  amount: number,
  description: string = 'Transfer'
) {
  if (amount <= 0) {
    throw new BadRequestError('Amount must be positive');
  }

  return db.transaction(async (trx) => {
    const fromAccount = await trx('accounts')
      .where({ id: fromAccountId, user_id: userId })
      .first();

    if (!fromAccount) {
      throw new NotFoundError('Source account not found');
    }

    if (parseFloat(fromAccount.balance) < amount) {
      throw new BadRequestError('Insufficient funds');
    }

    // The destination account can belong to another user (P2P transfer)
    const toAccount = await trx('accounts')
      .where({ id: toAccountId })
      .first();

    if (!toAccount) {
      throw new NotFoundError('Destination account not found');
    }

    const fromNewBalance = parseFloat(fromAccount.balance) - amount;
    const toNewBalance = parseFloat(toAccount.balance) + amount;

    const referenceId = require('uuid').v4();

    await trx('accounts')
      .where({ id: fromAccountId })
      .update({ balance: fromNewBalance });

    await trx('accounts')
      .where({ id: toAccountId })
      .update({ balance: toNewBalance });

    await trx('transactions').insert([
      {
        account_id: fromAccountId,
        type: 'debit',
        category: 'transfer',
        amount,
        description: `Transfer to ${toAccount.account_number}`,
        reference_id: referenceId,
        balance_after: fromNewBalance,
      },
      {
        account_id: toAccountId,
        type: 'credit',
        category: 'transfer',
        amount,
        description: `Transfer from ${fromAccount.account_number}`,
        reference_id: referenceId,
        balance_after: toNewBalance,
      },
    ]);

    return {
      fromBalance: fromNewBalance,
      toBalance: toNewBalance,
      referenceId,
    };
  });
}

export async function toggleRoundUp(userId: string, accountId: string) {
  const account = await db('accounts')
    .where({ id: accountId, user_id: userId })
    .first();

  if (!account) {
    throw new NotFoundError('Account not found');
  }

  const newValue = !account.round_up_enabled;
  await db('accounts')
    .where({ id: accountId })
    .update({ round_up_enabled: newValue });

  return { roundUpEnabled: newValue };
}
