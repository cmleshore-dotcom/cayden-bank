import db from '../config/database';

export interface EligibilityResult {
  eligible: boolean;
  score: number;
  maxAmount: number;
  factors: {
    incomeConsistency: number;
    averageBalance: number;
    spendingPatterns: number;
    accountAge: number;
    repaymentHistory: number;
  };
  message: string;
}

export async function evaluateEligibility(userId: string): Promise<EligibilityResult> {
  const checkingAccount = await db('accounts')
    .where({ user_id: userId, account_type: 'checking' })
    .first();

  if (!checkingAccount) {
    return {
      eligible: false,
      score: 0,
      maxAmount: 0,
      factors: {
        incomeConsistency: 0,
        averageBalance: 0,
        spendingPatterns: 0,
        accountAge: 0,
        repaymentHistory: 0,
      },
      message: 'No checking account found',
    };
  }

  // Check for outstanding advances
  const outstandingAdvance = await db('advances')
    .where({ user_id: userId })
    .whereIn('status', ['pending', 'approved', 'funded', 'repayment_scheduled'])
    .first();

  if (outstandingAdvance) {
    return {
      eligible: false,
      score: 0,
      maxAmount: 0,
      factors: {
        incomeConsistency: 0,
        averageBalance: 0,
        spendingPatterns: 0,
        accountAge: 0,
        repaymentHistory: 0,
      },
      message: 'You have an outstanding advance. Please repay it first.',
    };
  }

  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Factor 1: Income Consistency (30% weight)
  const deposits = await db('transactions')
    .where({ account_id: checkingAccount.id, category: 'deposit', type: 'credit' })
    .where('created_at', '>=', ninetyDaysAgo)
    .select('amount', 'created_at');

  let incomeScore = 0;
  if (deposits.length >= 6) {
    incomeScore = 100;
  } else if (deposits.length >= 3) {
    incomeScore = 70;
  } else if (deposits.length >= 1) {
    incomeScore = 30;
  }

  // Check deposit amount consistency
  if (deposits.length >= 2) {
    const amounts = deposits.map((d) => parseFloat(d.amount));
    const avg = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const variance =
      amounts.reduce((sum, a) => sum + Math.pow(a - avg, 2), 0) / amounts.length;
    const stdDev = Math.sqrt(variance);
    const cv = avg > 0 ? stdDev / avg : 1;

    // Lower coefficient of variation = more consistent
    if (cv < 0.1) incomeScore = Math.min(incomeScore + 10, 100);
    else if (cv > 0.5) incomeScore = Math.max(incomeScore - 20, 0);
  }

  // Factor 2: Average Balance (25% weight)
  const currentBalance = parseFloat(checkingAccount.balance);
  const monthlyDeposits = deposits
    .filter((d) => new Date(d.created_at) >= thirtyDaysAgo)
    .reduce((sum, d) => sum + parseFloat(d.amount), 0);

  let balanceScore = 0;
  if (monthlyDeposits > 0) {
    const balanceRatio = currentBalance / monthlyDeposits;
    if (balanceRatio >= 0.5) balanceScore = 100;
    else if (balanceRatio >= 0.25) balanceScore = 70;
    else if (balanceRatio >= 0.1) balanceScore = 40;
    else balanceScore = 15;
  } else if (currentBalance > 500) {
    balanceScore = 50;
  }

  // Factor 3: Spending Patterns (20% weight)
  const totalIncome = deposits.reduce((sum, d) => sum + parseFloat(d.amount), 0);
  const totalExpenses = await db('transactions')
    .where({ account_id: checkingAccount.id, type: 'debit' })
    .where('created_at', '>=', ninetyDaysAgo)
    .sum('amount as total')
    .first();

  const expenses = parseFloat((totalExpenses as any)?.total || '0');
  let spendingScore = 0;
  if (totalIncome > 0) {
    const savingsRate = (totalIncome - expenses) / totalIncome;
    if (savingsRate >= 0.2) spendingScore = 100;
    else if (savingsRate >= 0.1) spendingScore = 75;
    else if (savingsRate >= 0) spendingScore = 50;
    else spendingScore = 20;
  }

  // Factor 4: Account Age (10% weight)
  const accountCreated = new Date(checkingAccount.created_at);
  const accountAgeDays = Math.floor(
    (Date.now() - accountCreated.getTime()) / (1000 * 60 * 60 * 24)
  );

  let ageScore = 0;
  if (accountAgeDays >= 180) ageScore = 100;
  else if (accountAgeDays >= 90) ageScore = 75;
  else if (accountAgeDays >= 30) ageScore = 50;
  else ageScore = 20;

  // Factor 5: Repayment History (15% weight)
  const previousAdvances = await db('advances')
    .where({ user_id: userId })
    .whereIn('status', ['repaid', 'overdue']);

  let repaymentScore = 50; // Neutral if no history
  if (previousAdvances.length > 0) {
    const repaid = previousAdvances.filter((a) => a.status === 'repaid').length;
    const overdue = previousAdvances.filter((a) => a.status === 'overdue').length;
    repaymentScore = Math.round((repaid / (repaid + overdue)) * 100);
  }

  // Calculate weighted score
  const score = Math.round(
    incomeScore * 0.3 +
    balanceScore * 0.25 +
    spendingScore * 0.2 +
    ageScore * 0.1 +
    repaymentScore * 0.15
  );

  // Map score to max advance amount
  let maxAmount = 0;
  let message = '';

  if (score >= 86) {
    maxAmount = 500;
    message = 'Excellent! You qualify for the maximum advance.';
  } else if (score >= 71) {
    maxAmount = 400;
    message = 'Great standing! You qualify for up to $400.';
  } else if (score >= 51) {
    maxAmount = 250;
    message = 'Good standing. You qualify for up to $250.';
  } else if (score >= 31) {
    maxAmount = 100;
    message = 'You qualify for a starter advance of up to $100.';
  } else {
    message =
      'You are not yet eligible for an advance. Keep making regular deposits and maintaining a healthy balance.';
  }

  return {
    eligible: score >= 31,
    score,
    maxAmount,
    factors: {
      incomeConsistency: incomeScore,
      averageBalance: balanceScore,
      spendingPatterns: spendingScore,
      accountAge: ageScore,
      repaymentHistory: repaymentScore,
    },
    message,
  };
}
