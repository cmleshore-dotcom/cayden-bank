import db from '../config/database';
import { BadRequestError, NotFoundError } from '../utils/errors';
import { evaluateEligibility } from './cashai.service';
import { hasVerifiedLinkedAccount } from './linkedAccount.service';
import { logAction } from './audit.service';

const EXPRESS_FEE_RATE = 0.05; // 5% fee for express delivery

export async function checkEligibility(userId: string) {
  return evaluateEligibility(userId);
}

export async function requestAdvance(
  userId: string,
  amount: number,
  deliverySpeed: 'standard' | 'express' = 'standard',
  tip: number = 0
) {
  // Require a verified linked bank account to borrow
  const hasLinkedBank = await hasVerifiedLinkedAccount(userId);
  if (!hasLinkedBank) {
    throw new BadRequestError(
      'You must link and verify a bank account before requesting an advance. Go to More → Bank Accounts to get started.'
    );
  }

  const eligibility = await evaluateEligibility(userId);

  if (!eligibility.eligible) {
    throw new BadRequestError(eligibility.message);
  }

  if (amount < 25 || amount > eligibility.maxAmount) {
    throw new BadRequestError(
      `Amount must be between $25 and $${eligibility.maxAmount}`
    );
  }

  const fee = deliverySpeed === 'express' ? parseFloat((amount * EXPRESS_FEE_RATE).toFixed(2)) : 0;

  // Set repayment date (14 days from now for standard, immediate for funded)
  const repaymentDate = new Date();
  repaymentDate.setDate(repaymentDate.getDate() + 14);

  return db.transaction(async (trx) => {
    const checkingAccount = await trx('accounts')
      .where({ user_id: userId, account_type: 'checking' })
      .first();

    if (!checkingAccount) {
      throw new NotFoundError('Checking account not found');
    }

    const [advance] = await trx('advances')
      .insert({
        user_id: userId,
        account_id: checkingAccount.id,
        amount,
        fee,
        tip,
        status: deliverySpeed === 'express' ? 'funded' : 'approved',
        delivery_speed: deliverySpeed,
        eligibility_score: eligibility.score,
        funded_at: deliverySpeed === 'express' ? new Date() : null,
        repayment_date: repaymentDate,
      })
      .returning('*');

    // If express, fund immediately
    if (deliverySpeed === 'express') {
      const newBalance = parseFloat(checkingAccount.balance) + amount;
      await trx('accounts')
        .where({ id: checkingAccount.id })
        .update({ balance: newBalance });

      await trx('transactions').insert({
        account_id: checkingAccount.id,
        type: 'credit',
        category: 'advance',
        amount,
        description: `ExtraCash Advance - Express`,
        reference_id: advance.id,
        balance_after: newBalance,
      });
    }

    await logAction(userId, 'ADVANCE_REQUESTED', { advanceId: advance.id, amount, deliverySpeed });

    return {
      id: advance.id,
      amount: parseFloat(advance.amount),
      fee: parseFloat(advance.fee),
      tip: parseFloat(advance.tip),
      status: advance.status,
      deliverySpeed: advance.delivery_speed,
      eligibilityScore: parseFloat(advance.eligibility_score),
      fundedAt: advance.funded_at,
      repaymentDate: advance.repayment_date,
      createdAt: advance.created_at,
    };
  });
}

export async function fundPendingAdvance(advanceId: string) {
  return db.transaction(async (trx) => {
    const advance = await trx('advances')
      .where({ id: advanceId, status: 'approved' })
      .first();

    if (!advance) {
      throw new NotFoundError('Approved advance not found');
    }

    const account = await trx('accounts')
      .where({ id: advance.account_id })
      .first();

    const newBalance = parseFloat(account.balance) + parseFloat(advance.amount);

    await trx('accounts')
      .where({ id: account.id })
      .update({ balance: newBalance });

    await trx('advances')
      .where({ id: advanceId })
      .update({ status: 'funded', funded_at: new Date() });

    await trx('transactions').insert({
      account_id: account.id,
      type: 'credit',
      category: 'advance',
      amount: advance.amount,
      description: 'ExtraCash Advance - Standard',
      reference_id: advance.id,
      balance_after: newBalance,
    });

    return { funded: true, newBalance };
  });
}

export async function getUserAdvances(userId: string) {
  const advances = await db('advances')
    .where({ user_id: userId })
    .orderBy('created_at', 'desc');

  return advances.map((a) => ({
    id: a.id,
    amount: parseFloat(a.amount),
    fee: parseFloat(a.fee),
    tip: parseFloat(a.tip),
    status: a.status,
    deliverySpeed: a.delivery_speed,
    eligibilityScore: parseFloat(a.eligibility_score),
    fundedAt: a.funded_at,
    repaymentDate: a.repayment_date,
    repaidAt: a.repaid_at,
    createdAt: a.created_at,
  }));
}

export async function getAdvanceById(userId: string, advanceId: string) {
  const advance = await db('advances')
    .where({ id: advanceId, user_id: userId })
    .first();

  if (!advance) {
    throw new NotFoundError('Advance not found');
  }

  return {
    id: advance.id,
    amount: parseFloat(advance.amount),
    fee: parseFloat(advance.fee),
    tip: parseFloat(advance.tip),
    status: advance.status,
    deliverySpeed: advance.delivery_speed,
    eligibilityScore: parseFloat(advance.eligibility_score),
    fundedAt: advance.funded_at,
    repaymentDate: advance.repayment_date,
    repaidAt: advance.repaid_at,
    createdAt: advance.created_at,
  };
}

export async function repayAdvance(userId: string, advanceId: string) {
  return db.transaction(async (trx) => {
    const advance = await trx('advances')
      .where({ id: advanceId, user_id: userId })
      .whereIn('status', ['funded', 'repayment_scheduled', 'overdue'])
      .first();

    if (!advance) {
      throw new NotFoundError('Active advance not found');
    }

    const account = await trx('accounts')
      .where({ id: advance.account_id })
      .first();

    const totalRepayment =
      parseFloat(advance.amount) +
      parseFloat(advance.fee) +
      parseFloat(advance.tip);

    if (parseFloat(account.balance) < totalRepayment) {
      throw new BadRequestError(
        `Insufficient funds. Need $${totalRepayment.toFixed(2)} to repay.`
      );
    }

    const newBalance = parseFloat(account.balance) - totalRepayment;

    await trx('accounts')
      .where({ id: account.id })
      .update({ balance: newBalance });

    await trx('advances')
      .where({ id: advanceId })
      .update({ status: 'repaid', repaid_at: new Date() });

    await trx('transactions').insert({
      account_id: account.id,
      type: 'debit',
      category: 'repayment',
      amount: totalRepayment,
      description: `ExtraCash Repayment`,
      reference_id: advance.id,
      balance_after: newBalance,
    });

    await logAction(userId, 'ADVANCE_REPAID', { advanceId, amount: totalRepayment });

    return {
      repaid: true,
      amountRepaid: totalRepayment,
      newBalance,
    };
  });
}
