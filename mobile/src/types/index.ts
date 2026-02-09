export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  kycStatus: 'pending' | 'verified' | 'rejected';
  dateOfBirth?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  createdAt: string;
}

export interface Account {
  id: string;
  accountType: 'checking' | 'savings';
  accountNumber: string;
  routingNumber: string;
  balance: number;
  status: 'active' | 'frozen' | 'closed';
  roundUpEnabled: boolean;
  createdAt: string;
}

export interface Transaction {
  id: string;
  accountId: string;
  type: 'credit' | 'debit';
  category: 'deposit' | 'withdrawal' | 'transfer' | 'advance' | 'repayment' | 'round_up' | 'purchase' | 'refund';
  amount: number;
  description: string;
  merchantName?: string;
  spendingCategory?: string;
  referenceId?: string;
  balanceAfter: number;
  createdAt: string;
}

export interface Advance {
  id: string;
  amount: number;
  fee: number;
  tip: number;
  status: 'pending' | 'approved' | 'funded' | 'repayment_scheduled' | 'repaid' | 'overdue';
  deliverySpeed: 'standard' | 'express';
  eligibilityScore: number;
  fundedAt: string | null;
  repaymentDate: string;
  repaidAt: string | null;
  createdAt: string;
}

export interface Eligibility {
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
  hasLinkedBank: boolean;
}

export interface LinkedAccount {
  id: string;
  bankName: string;
  accountHolderName: string;
  accountNumberLast4: string;
  routingNumber: string;
  accountType: 'checking' | 'savings';
  verificationStatus: 'pending' | 'verified' | 'failed';
  isPrimary: boolean;
  institutionId: string | null;
  createdAt: string;
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  autoFundAmount: number;
  autoFundEnabled: boolean;
  targetDate: string | null;
  status: 'active' | 'completed' | 'paused';
  icon: string;
  progress: number;
  createdAt: string;
}

export interface SideHustle {
  id: string;
  title: string;
  company: string;
  description: string;
  category: 'remote' | 'seasonal' | 'part_time' | 'gig' | 'freelance';
  payRange: string;
  location: string;
  url: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  suggestions?: string[];
  createdAt: string;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  actionType: string | null;
  actionTarget: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface Bill {
  id: string;
  accountId: string;
  name: string;
  category: 'subscription' | 'utility' | 'rent' | 'insurance' | 'loan' | 'other';
  amount: number;
  frequency: 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly';
  dueDay: number;
  autoPay: boolean;
  status: 'active' | 'paused' | 'cancelled';
  icon: string;
  nextDueDate: string | null;
  lastPaidDate: string | null;
  createdAt: string;
}

export interface BillSummary {
  totalBills: number;
  totalMonthlyEstimate: number;
  upcomingThisMonth: number;
  upcomingTotal: number;
  autoPayCount: number;
}

export interface SpendingCategory {
  category: string;
  total: number;
  count: number;
  percentage: number;
}

export interface BudgetPrediction {
  currentBalance: number;
  spentThisMonth: number;
  dailyAverageSpend: number;
  predictedMonthlySpend: number;
  predictedEndOfMonthBalance: number;
  daysRemaining: number;
  lastMonthIncome: number;
}

export interface IncomeExpense {
  month: string;
  income: number;
  expenses: number;
  net: number;
}

export interface ApiResponse<T> {
  status: 'success' | 'error';
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  transactions: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
