import { v4 as uuidv4 } from 'uuid';

export function generateAccountNumber(): string {
  const digits = Math.floor(100000000000 + Math.random() * 900000000000);
  return digits.toString().slice(0, 12);
}

export function generateId(): string {
  return uuidv4();
}

export const ROUTING_NUMBER = '021000089';

export function roundUpToNearestDollar(amount: number): number {
  const rounded = Math.ceil(amount);
  return parseFloat((rounded - amount).toFixed(2));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}
