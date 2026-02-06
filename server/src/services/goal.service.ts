import db from '../config/database';
import { BadRequestError, NotFoundError } from '../utils/errors';

export async function getUserGoals(userId: string) {
  const goals = await db('goals')
    .where({ user_id: userId })
    .orderBy('created_at', 'desc');

  return goals.map((g) => ({
    id: g.id,
    name: g.name,
    targetAmount: parseFloat(g.target_amount),
    currentAmount: parseFloat(g.current_amount),
    autoFundAmount: parseFloat(g.auto_fund_amount),
    autoFundEnabled: g.auto_fund_enabled,
    targetDate: g.target_date,
    status: g.status,
    icon: g.icon,
    progress: parseFloat(
      ((parseFloat(g.current_amount) / parseFloat(g.target_amount)) * 100).toFixed(1)
    ),
    createdAt: g.created_at,
  }));
}

export async function createGoal(
  userId: string,
  data: {
    name: string;
    targetAmount: number;
    targetDate?: string;
    autoFundAmount?: number;
    autoFundEnabled?: boolean;
    icon?: string;
  }
) {
  if (data.targetAmount <= 0) {
    throw new BadRequestError('Target amount must be positive');
  }

  // Check if user has a savings account, create one if not
  let savingsAccount = await db('accounts')
    .where({ user_id: userId, account_type: 'savings' })
    .first();

  if (!savingsAccount) {
    const { generateAccountNumber } = require('../utils/helpers');
    [savingsAccount] = await db('accounts')
      .insert({
        user_id: userId,
        account_type: 'savings',
        account_number: generateAccountNumber(),
        balance: 0,
      })
      .returning('*');
  }

  const [goal] = await db('goals')
    .insert({
      user_id: userId,
      account_id: savingsAccount.id,
      name: data.name,
      target_amount: data.targetAmount,
      target_date: data.targetDate,
      auto_fund_amount: data.autoFundAmount || 0,
      auto_fund_enabled: data.autoFundEnabled || false,
      icon: data.icon || 'piggy-bank',
    })
    .returning('*');

  return {
    id: goal.id,
    name: goal.name,
    targetAmount: parseFloat(goal.target_amount),
    currentAmount: parseFloat(goal.current_amount),
    autoFundAmount: parseFloat(goal.auto_fund_amount),
    autoFundEnabled: goal.auto_fund_enabled,
    targetDate: goal.target_date,
    status: goal.status,
    icon: goal.icon,
    progress: 0,
    createdAt: goal.created_at,
  };
}

export async function updateGoal(
  userId: string,
  goalId: string,
  updates: {
    name?: string;
    targetAmount?: number;
    targetDate?: string;
    autoFundAmount?: number;
    autoFundEnabled?: boolean;
    icon?: string;
    status?: string;
  }
) {
  const goal = await db('goals')
    .where({ id: goalId, user_id: userId })
    .first();

  if (!goal) {
    throw new NotFoundError('Goal not found');
  }

  const updateData: Record<string, unknown> = {};
  if (updates.name) updateData.name = updates.name;
  if (updates.targetAmount) updateData.target_amount = updates.targetAmount;
  if (updates.targetDate) updateData.target_date = updates.targetDate;
  if (updates.autoFundAmount !== undefined)
    updateData.auto_fund_amount = updates.autoFundAmount;
  if (updates.autoFundEnabled !== undefined)
    updateData.auto_fund_enabled = updates.autoFundEnabled;
  if (updates.icon) updateData.icon = updates.icon;
  if (updates.status) updateData.status = updates.status;

  const [updated] = await db('goals')
    .where({ id: goalId })
    .update(updateData)
    .returning('*');

  return {
    id: updated.id,
    name: updated.name,
    targetAmount: parseFloat(updated.target_amount),
    currentAmount: parseFloat(updated.current_amount),
    autoFundAmount: parseFloat(updated.auto_fund_amount),
    autoFundEnabled: updated.auto_fund_enabled,
    targetDate: updated.target_date,
    status: updated.status,
    icon: updated.icon,
    progress: parseFloat(
      ((parseFloat(updated.current_amount) / parseFloat(updated.target_amount)) * 100).toFixed(1)
    ),
    createdAt: updated.created_at,
  };
}

export async function deleteGoal(userId: string, goalId: string) {
  const goal = await db('goals')
    .where({ id: goalId, user_id: userId })
    .first();

  if (!goal) {
    throw new NotFoundError('Goal not found');
  }

  await db('goals').where({ id: goalId }).del();
  return { deleted: true };
}

export async function fundGoal(
  userId: string,
  goalId: string,
  amount: number
) {
  if (amount <= 0) {
    throw new BadRequestError('Amount must be positive');
  }

  return db.transaction(async (trx) => {
    const goal = await trx('goals')
      .where({ id: goalId, user_id: userId })
      .first();

    if (!goal) {
      throw new NotFoundError('Goal not found');
    }

    if (goal.status !== 'active') {
      throw new BadRequestError('Goal is not active');
    }

    const checkingAccount = await trx('accounts')
      .where({ user_id: userId, account_type: 'checking' })
      .first();

    if (!checkingAccount) {
      throw new NotFoundError('Checking account not found');
    }

    if (parseFloat(checkingAccount.balance) < amount) {
      throw new BadRequestError('Insufficient funds');
    }

    const savingsAccount = await trx('accounts')
      .where({ id: goal.account_id })
      .first();

    const newCheckingBalance = parseFloat(checkingAccount.balance) - amount;
    const newSavingsBalance = parseFloat(savingsAccount.balance) + amount;
    const newGoalAmount = parseFloat(goal.current_amount) + amount;

    await trx('accounts')
      .where({ id: checkingAccount.id })
      .update({ balance: newCheckingBalance });

    await trx('accounts')
      .where({ id: savingsAccount.id })
      .update({ balance: newSavingsBalance });

    const newStatus =
      newGoalAmount >= parseFloat(goal.target_amount) ? 'completed' : 'active';

    await trx('goals')
      .where({ id: goalId })
      .update({ current_amount: newGoalAmount, status: newStatus });

    const referenceId = require('uuid').v4();

    await trx('transactions').insert([
      {
        account_id: checkingAccount.id,
        type: 'debit',
        category: 'transfer',
        amount,
        description: `Goal Funding: ${goal.name}`,
        reference_id: referenceId,
        balance_after: newCheckingBalance,
      },
      {
        account_id: savingsAccount.id,
        type: 'credit',
        category: 'transfer',
        amount,
        description: `Goal Funding: ${goal.name}`,
        reference_id: referenceId,
        balance_after: newSavingsBalance,
      },
    ]);

    return {
      goalId,
      funded: amount,
      currentAmount: newGoalAmount,
      targetAmount: parseFloat(goal.target_amount),
      progress: parseFloat(
        ((newGoalAmount / parseFloat(goal.target_amount)) * 100).toFixed(1)
      ),
      status: newStatus,
    };
  });
}
