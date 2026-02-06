import db from '../config/database';
import { NotFoundError, BadRequestError } from '../utils/errors';
import { roundUpToNearestDollar } from '../utils/helpers';

interface TransactionFilters {
  accountId?: string;
  category?: string;
  spendingCategory?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export async function getTransactions(userId: string, filters: TransactionFilters) {
  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const offset = (page - 1) * limit;

  let query = db('transactions')
    .join('accounts', 'transactions.account_id', 'accounts.id')
    .where('accounts.user_id', userId)
    .select('transactions.*');

  if (filters.accountId) {
    query = query.where('transactions.account_id', filters.accountId);
  }
  if (filters.category) {
    query = query.where('transactions.category', filters.category);
  }
  if (filters.spendingCategory) {
    query = query.where('transactions.spending_category', filters.spendingCategory);
  }
  if (filters.startDate) {
    query = query.where('transactions.created_at', '>=', filters.startDate);
  }
  if (filters.endDate) {
    query = query.where('transactions.created_at', '<=', filters.endDate);
  }

  const [{ count }] = await query.clone().count('transactions.id as count');

  const transactions = await query
    .orderBy('transactions.created_at', 'desc')
    .limit(limit)
    .offset(offset);

  return {
    transactions: transactions.map((t) => ({
      id: t.id,
      accountId: t.account_id,
      type: t.type,
      category: t.category,
      amount: parseFloat(t.amount),
      description: t.description,
      merchantName: t.merchant_name,
      spendingCategory: t.spending_category,
      referenceId: t.reference_id,
      balanceAfter: parseFloat(t.balance_after),
      createdAt: t.created_at,
    })),
    pagination: {
      page,
      limit,
      total: parseInt(count as string, 10),
      totalPages: Math.ceil(parseInt(count as string, 10) / limit),
    },
  };
}

export async function getTransactionById(userId: string, transactionId: string) {
  const transaction = await db('transactions')
    .join('accounts', 'transactions.account_id', 'accounts.id')
    .where('accounts.user_id', userId)
    .where('transactions.id', transactionId)
    .select('transactions.*')
    .first();

  if (!transaction) {
    throw new NotFoundError('Transaction not found');
  }

  return {
    id: transaction.id,
    accountId: transaction.account_id,
    type: transaction.type,
    category: transaction.category,
    amount: parseFloat(transaction.amount),
    description: transaction.description,
    merchantName: transaction.merchant_name,
    spendingCategory: transaction.spending_category,
    referenceId: transaction.reference_id,
    balanceAfter: parseFloat(transaction.balance_after),
    createdAt: transaction.created_at,
  };
}

export async function getSpendingSummary(userId: string, month?: string) {
  const now = new Date();
  const startOfMonth = month
    ? new Date(`${month}-01`)
    : new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(startOfMonth.getFullYear(), startOfMonth.getMonth() + 1, 0, 23, 59, 59);

  const summary = await db('transactions')
    .join('accounts', 'transactions.account_id', 'accounts.id')
    .where('accounts.user_id', userId)
    .where('transactions.type', 'debit')
    .where('transactions.category', 'purchase')
    .whereBetween('transactions.created_at', [startOfMonth, endOfMonth])
    .whereNotNull('transactions.spending_category')
    .groupBy('transactions.spending_category')
    .select(
      'transactions.spending_category as category',
      db.raw('SUM(transactions.amount) as total'),
      db.raw('COUNT(transactions.id) as count')
    );

  const totalSpent = summary.reduce((sum, s) => sum + parseFloat(s.total), 0);

  return {
    month: startOfMonth.toISOString().slice(0, 7),
    totalSpent,
    categories: summary.map((s) => ({
      category: s.category,
      total: parseFloat(s.total),
      count: parseInt(s.count, 10),
      percentage: totalSpent > 0 ? parseFloat(((parseFloat(s.total) / totalSpent) * 100).toFixed(1)) : 0,
    })),
  };
}

export async function simulatePurchase(
  userId: string,
  accountId: string,
  amount: number,
  merchantName: string,
  spendingCategory: string,
  description?: string
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

    if (parseFloat(account.balance) < amount) {
      throw new BadRequestError('Insufficient funds');
    }

    const newBalance = parseFloat(account.balance) - amount;

    await trx('accounts').where({ id: accountId }).update({ balance: newBalance });

    const [transaction] = await trx('transactions')
      .insert({
        account_id: accountId,
        type: 'debit',
        category: 'purchase',
        amount,
        description: description || `Purchase at ${merchantName}`,
        merchant_name: merchantName,
        spending_category: spendingCategory,
        balance_after: newBalance,
      })
      .returning('*');

    // Handle round-up if enabled
    let roundUpTransaction = null;
    if (account.round_up_enabled) {
      const roundUpAmount = roundUpToNearestDollar(amount);
      if (roundUpAmount > 0 && roundUpAmount < 1) {
        const savingsAccount = await trx('accounts')
          .where({ user_id: userId, account_type: 'savings' })
          .first();

        if (savingsAccount && newBalance >= roundUpAmount) {
          const updatedCheckingBalance = newBalance - roundUpAmount;
          const updatedSavingsBalance = parseFloat(savingsAccount.balance) + roundUpAmount;

          await trx('accounts').where({ id: accountId }).update({ balance: updatedCheckingBalance });
          await trx('accounts').where({ id: savingsAccount.id }).update({ balance: updatedSavingsBalance });

          const [roundUp] = await trx('transactions')
            .insert({
              account_id: savingsAccount.id,
              type: 'credit',
              category: 'round_up',
              amount: roundUpAmount,
              description: `Round-up from ${merchantName}`,
              reference_id: transaction.id,
              balance_after: updatedSavingsBalance,
            })
            .returning('*');

          roundUpTransaction = {
            id: roundUp.id,
            amount: parseFloat(roundUp.amount),
            description: roundUp.description,
          };
        }
      }
    }

    return {
      transaction: {
        id: transaction.id,
        type: transaction.type,
        category: transaction.category,
        amount: parseFloat(transaction.amount),
        description: transaction.description,
        merchantName: transaction.merchant_name,
        spendingCategory: transaction.spending_category,
        balanceAfter: parseFloat(transaction.balance_after),
        createdAt: transaction.created_at,
      },
      roundUp: roundUpTransaction,
    };
  });
}
