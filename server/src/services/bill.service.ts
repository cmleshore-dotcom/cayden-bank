import db from '../config/database';
import { BadRequestError, NotFoundError } from '../utils/errors';
import { createNotification } from './notification.service';

interface CreateBill {
  userId: string;
  accountId: string;
  name: string;
  category: string;
  amount: number;
  frequency: string;
  dueDay: number;
  autoPay: boolean;
  icon?: string;
}

export async function getUserBills(userId: string) {
  const bills = await db('bills')
    .where({ user_id: userId })
    .orderBy('next_due_date', 'asc');

  return bills.map(formatBill);
}

export async function createBill(data: CreateBill) {
  // Validate account belongs to user
  const account = await db('accounts')
    .where({ id: data.accountId, user_id: data.userId })
    .first();

  if (!account) {
    throw new NotFoundError('Account not found');
  }

  if (data.dueDay < 1 || data.dueDay > 31) {
    throw new BadRequestError('Due day must be between 1 and 31');
  }

  // Calculate next due date
  const nextDueDate = calculateNextDueDate(data.dueDay, data.frequency);

  const [bill] = await db('bills')
    .insert({
      user_id: data.userId,
      account_id: data.accountId,
      name: data.name,
      category: data.category,
      amount: data.amount,
      frequency: data.frequency,
      due_day: data.dueDay,
      auto_pay: data.autoPay,
      icon: data.icon || getCategoryIcon(data.category),
      next_due_date: nextDueDate,
      status: 'active',
    })
    .returning('*');

  return formatBill(bill);
}

export async function updateBill(
  userId: string,
  billId: string,
  updates: Partial<{
    name: string;
    amount: number;
    frequency: string;
    dueDay: number;
    autoPay: boolean;
    status: string;
    icon: string;
    category: string;
  }>
) {
  const bill = await db('bills')
    .where({ id: billId, user_id: userId })
    .first();

  if (!bill) {
    throw new NotFoundError('Bill not found');
  }

  const updateData: Record<string, unknown> = {};
  if (updates.name !== undefined) updateData.name = updates.name;
  if (updates.amount !== undefined) updateData.amount = updates.amount;
  if (updates.frequency !== undefined) updateData.frequency = updates.frequency;
  if (updates.autoPay !== undefined) updateData.auto_pay = updates.autoPay;
  if (updates.status !== undefined) updateData.status = updates.status;
  if (updates.icon !== undefined) updateData.icon = updates.icon;
  if (updates.category !== undefined) updateData.category = updates.category;
  if (updates.dueDay !== undefined) {
    updateData.due_day = updates.dueDay;
    updateData.next_due_date = calculateNextDueDate(
      updates.dueDay,
      updates.frequency || bill.frequency
    );
  }

  await db('bills').where({ id: billId }).update(updateData);

  const updated = await db('bills').where({ id: billId }).first();
  return formatBill(updated);
}

export async function deleteBill(userId: string, billId: string) {
  const bill = await db('bills')
    .where({ id: billId, user_id: userId })
    .first();

  if (!bill) {
    throw new NotFoundError('Bill not found');
  }

  await db('bills').where({ id: billId }).delete();
  return { success: true };
}

export async function payBill(userId: string, billId: string) {
  return db.transaction(async (trx) => {
    const bill = await trx('bills')
      .where({ id: billId, user_id: userId })
      .first();

    if (!bill) {
      throw new NotFoundError('Bill not found');
    }

    const account = await trx('accounts')
      .where({ id: bill.account_id, user_id: userId })
      .first();

    if (!account) {
      throw new NotFoundError('Account not found');
    }

    if (parseFloat(account.balance) < parseFloat(bill.amount)) {
      throw new BadRequestError('Insufficient funds to pay this bill');
    }

    const amount = parseFloat(bill.amount);
    const newBalance = parseFloat(account.balance) - amount;

    // Deduct from account
    await trx('accounts')
      .where({ id: account.id })
      .update({ balance: newBalance });

    // Create transaction
    const [transaction] = await trx('transactions')
      .insert({
        account_id: account.id,
        type: 'debit',
        category: 'purchase',
        amount: amount,
        description: `Bill Payment - ${bill.name}`,
        merchant_name: bill.name,
        spending_category: 'bills',
        balance_after: newBalance,
      })
      .returning('*');

    // Create bill payment record
    const [payment] = await trx('bill_payments')
      .insert({
        bill_id: bill.id,
        user_id: userId,
        transaction_id: transaction.id,
        amount: amount,
        status: 'completed',
      })
      .returning('*');

    // Update bill dates
    const nextDueDate = calculateNextDueDate(bill.due_day, bill.frequency);
    await trx('bills')
      .where({ id: billId })
      .update({
        last_paid_date: new Date().toISOString().split('T')[0],
        next_due_date: nextDueDate,
      });

    // Create notification
    try {
      await createNotification({
        userId,
        type: 'bill',
        title: 'Bill Paid',
        message: `Your ${bill.name} payment of $${amount.toFixed(2)} has been processed.`,
        actionType: 'navigate',
        actionTarget: 'bills',
        metadata: { billId: bill.id, amount },
      });
    } catch {
      // Non-critical, don't fail the payment
    }

    return {
      payment: {
        id: payment.id,
        billId: payment.bill_id,
        amount: parseFloat(payment.amount),
        status: payment.status,
        paidAt: payment.paid_at,
      },
      newBalance,
      transactionId: transaction.id,
    };
  });
}

export async function getBillPaymentHistory(userId: string, billId?: string) {
  let query = db('bill_payments')
    .where({ 'bill_payments.user_id': userId })
    .join('bills', 'bill_payments.bill_id', 'bills.id')
    .orderBy('bill_payments.paid_at', 'desc')
    .limit(50)
    .select(
      'bill_payments.*',
      'bills.name as bill_name',
      'bills.category as bill_category'
    );

  if (billId) {
    query = query.where({ 'bill_payments.bill_id': billId });
  }

  const payments = await query;

  return payments.map((p) => ({
    id: p.id,
    billId: p.bill_id,
    billName: p.bill_name,
    billCategory: p.bill_category,
    amount: parseFloat(p.amount),
    status: p.status,
    paidAt: p.paid_at,
  }));
}

export async function getBillSummary(userId: string) {
  const bills = await db('bills')
    .where({ user_id: userId, status: 'active' });

  const totalMonthly = bills.reduce((sum, bill) => {
    const amount = parseFloat(bill.amount);
    switch (bill.frequency) {
      case 'weekly': return sum + (amount * 4.33);
      case 'biweekly': return sum + (amount * 2.17);
      case 'monthly': return sum + amount;
      case 'quarterly': return sum + (amount / 3);
      case 'yearly': return sum + (amount / 12);
      default: return sum + amount;
    }
  }, 0);

  const now = new Date();
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const upcomingBills = bills.filter((bill) => {
    if (!bill.next_due_date) return false;
    const dueDate = new Date(bill.next_due_date);
    return dueDate <= endOfMonth;
  });

  const upcomingTotal = upcomingBills.reduce(
    (sum, bill) => sum + parseFloat(bill.amount),
    0
  );

  return {
    totalBills: bills.length,
    totalMonthlyEstimate: Math.round(totalMonthly * 100) / 100,
    upcomingThisMonth: upcomingBills.length,
    upcomingTotal: Math.round(upcomingTotal * 100) / 100,
    autoPayCount: bills.filter((b) => b.auto_pay).length,
  };
}

function calculateNextDueDate(dueDay: number, frequency: string): string {
  const now = new Date();
  let nextDate = new Date(now.getFullYear(), now.getMonth(), dueDay);

  // If the due day has passed this month, move to next period
  if (nextDate <= now) {
    switch (frequency) {
      case 'weekly':
        nextDate.setDate(nextDate.getDate() + 7);
        break;
      case 'biweekly':
        nextDate.setDate(nextDate.getDate() + 14);
        break;
      case 'monthly':
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
      case 'quarterly':
        nextDate.setMonth(nextDate.getMonth() + 3);
        break;
      case 'yearly':
        nextDate.setFullYear(nextDate.getFullYear() + 1);
        break;
      default:
        nextDate.setMonth(nextDate.getMonth() + 1);
    }
  }

  return nextDate.toISOString().split('T')[0];
}

function getCategoryIcon(category: string): string {
  switch (category) {
    case 'subscription': return 'tv-outline';
    case 'utility': return 'flash-outline';
    case 'rent': return 'home-outline';
    case 'insurance': return 'shield-outline';
    case 'loan': return 'cash-outline';
    default: return 'receipt-outline';
  }
}

function formatBill(bill: any) {
  return {
    id: bill.id,
    accountId: bill.account_id,
    name: bill.name,
    category: bill.category,
    amount: parseFloat(bill.amount),
    frequency: bill.frequency,
    dueDay: bill.due_day,
    autoPay: Boolean(bill.auto_pay),
    status: bill.status,
    icon: bill.icon,
    nextDueDate: bill.next_due_date,
    lastPaidDate: bill.last_paid_date,
    createdAt: bill.created_at,
  };
}
