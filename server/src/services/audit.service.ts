import db from '../config/database';

export type AuditAction =
  | 'LOGIN'
  | 'LOGIN_FAILED'
  | 'REGISTER'
  | 'LOGOUT'
  | 'PASSWORD_CHANGED'
  | 'ADVANCE_REQUESTED'
  | 'ADVANCE_REPAID'
  | 'BANK_LINKED'
  | 'BANK_VERIFIED'
  | 'BANK_REMOVED'
  | 'TRANSFER'
  | 'DEPOSIT'
  | 'PIN_SET'
  | 'PIN_CHANGED'
  | 'PIN_VERIFIED'
  | 'PIN_FAILED'
  | 'ACCOUNT_LOCKED';

export async function logAction(
  userId: string | null,
  action: AuditAction,
  details?: Record<string, unknown>,
  ipAddress?: string
): Promise<void> {
  try {
    await db('audit_logs').insert({
      user_id: userId,
      action,
      details: details ? JSON.stringify(details) : null,
      ip_address: ipAddress || null,
    });
  } catch (err) {
    // Audit logging should never crash the application
    console.error('[AUDIT] Failed to log action:', action, err);
  }
}

export async function getAuditLogs(
  userId: string,
  limit = 50
): Promise<any[]> {
  return db('audit_logs')
    .where({ user_id: userId })
    .orderBy('created_at', 'desc')
    .limit(limit);
}
