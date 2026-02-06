import db from '../config/database';

export async function getSpendingBreakdown(userId: string, month?: string) {
  const now = new Date();
  const startOfMonth = month
    ? new Date(`${month}-01`)
    : new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(
    startOfMonth.getFullYear(),
    startOfMonth.getMonth() + 1,
    0,
    23, 59, 59
  );

  const spending = await db('transactions')
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

  const totalSpent = spending.reduce((sum, s) => sum + parseFloat(s.total), 0);

  return {
    month: startOfMonth.toISOString().slice(0, 7),
    totalSpent: parseFloat(totalSpent.toFixed(2)),
    categories: spending.map((s) => ({
      category: s.category,
      total: parseFloat(parseFloat(s.total).toFixed(2)),
      count: s.count,
      percentage: totalSpent > 0
        ? parseFloat(((parseFloat(s.total) / totalSpent) * 100).toFixed(1))
        : 0,
    })),
  };
}

export async function getIncomeVsExpense(userId: string, months: number = 3) {
  const results = [];
  const now = new Date();

  for (let i = 0; i < months; i++) {
    const startOfMonth = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const endOfMonth = new Date(
      startOfMonth.getFullYear(),
      startOfMonth.getMonth() + 1,
      0,
      23, 59, 59
    );

    const income = await db('transactions')
      .join('accounts', 'transactions.account_id', 'accounts.id')
      .where('accounts.user_id', userId)
      .where('transactions.type', 'credit')
      .where('transactions.category', 'deposit')
      .whereBetween('transactions.created_at', [startOfMonth, endOfMonth])
      .sum('transactions.amount as total')
      .first();

    const expenses = await db('transactions')
      .join('accounts', 'transactions.account_id', 'accounts.id')
      .where('accounts.user_id', userId)
      .where('transactions.type', 'debit')
      .whereIn('transactions.category', ['purchase', 'withdrawal'])
      .whereBetween('transactions.created_at', [startOfMonth, endOfMonth])
      .sum('transactions.amount as total')
      .first();

    const incomeTotal = parseFloat(income?.total || '0');
    const expenseTotal = parseFloat(expenses?.total || '0');

    results.push({
      month: startOfMonth.toISOString().slice(0, 7),
      income: parseFloat(incomeTotal.toFixed(2)),
      expenses: parseFloat(expenseTotal.toFixed(2)),
      net: parseFloat((incomeTotal - expenseTotal).toFixed(2)),
    });
  }

  return results.reverse();
}

export async function getPrediction(userId: string) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const dayOfMonth = now.getDate();
  const daysRemaining = daysInMonth - dayOfMonth;

  // Get current month spending
  const spending = await db('transactions')
    .join('accounts', 'transactions.account_id', 'accounts.id')
    .where('accounts.user_id', userId)
    .where('transactions.type', 'debit')
    .whereIn('transactions.category', ['purchase', 'withdrawal'])
    .where('transactions.created_at', '>=', startOfMonth)
    .sum('transactions.amount as total')
    .first();

  const spentSoFar = parseFloat(spending?.total || '0');
  const dailyAvgSpend = dayOfMonth > 0 ? spentSoFar / dayOfMonth : 0;
  const predictedMonthlySpend = spentSoFar + dailyAvgSpend * daysRemaining;

  // Get current balance
  const accounts = await db('accounts')
    .where({ user_id: userId, account_type: 'checking' })
    .first();

  const currentBalance = parseFloat(accounts?.balance || '0');

  // Get expected income (based on deposit patterns)
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

  const lastMonthIncome = await db('transactions')
    .join('accounts', 'transactions.account_id', 'accounts.id')
    .where('accounts.user_id', userId)
    .where('transactions.type', 'credit')
    .where('transactions.category', 'deposit')
    .whereBetween('transactions.created_at', [lastMonthStart, lastMonthEnd])
    .sum('transactions.amount as total')
    .first();

  const expectedRemainingIncome = 0; // Simplified: don't predict future deposits

  const predictedEndOfMonthBalance =
    currentBalance - dailyAvgSpend * daysRemaining + expectedRemainingIncome;

  return {
    currentBalance: parseFloat(currentBalance.toFixed(2)),
    spentThisMonth: parseFloat(spentSoFar.toFixed(2)),
    dailyAverageSpend: parseFloat(dailyAvgSpend.toFixed(2)),
    predictedMonthlySpend: parseFloat(predictedMonthlySpend.toFixed(2)),
    predictedEndOfMonthBalance: parseFloat(predictedEndOfMonthBalance.toFixed(2)),
    daysRemaining,
    lastMonthIncome: parseFloat(lastMonthIncome?.total || '0'),
  };
}

export async function getTrends(userId: string, months: number = 6) {
  const results = [];
  const now = new Date();

  for (let i = 0; i < months; i++) {
    const startOfMonth = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const endOfMonth = new Date(
      startOfMonth.getFullYear(),
      startOfMonth.getMonth() + 1,
      0,
      23, 59, 59
    );

    const spending = await db('transactions')
      .join('accounts', 'transactions.account_id', 'accounts.id')
      .where('accounts.user_id', userId)
      .where('transactions.type', 'debit')
      .where('transactions.category', 'purchase')
      .whereBetween('transactions.created_at', [startOfMonth, endOfMonth])
      .whereNotNull('transactions.spending_category')
      .groupBy('transactions.spending_category')
      .select(
        'transactions.spending_category as category',
        db.raw('SUM(transactions.amount) as total')
      );

    const totalSpent = spending.reduce((sum, s) => sum + parseFloat(s.total), 0);

    results.push({
      month: startOfMonth.toISOString().slice(0, 7),
      totalSpent: parseFloat(totalSpent.toFixed(2)),
      categories: spending.reduce(
        (acc, s) => {
          acc[s.category] = parseFloat(parseFloat(s.total).toFixed(2));
          return acc;
        },
        {} as Record<string, number>
      ),
    });
  }

  return results.reverse();
}
