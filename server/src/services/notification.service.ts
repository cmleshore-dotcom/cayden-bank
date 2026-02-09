import db from '../config/database';

interface CreateNotification {
  userId: string;
  type: string;
  title: string;
  message: string;
  actionType?: string;
  actionTarget?: string;
  metadata?: Record<string, unknown>;
}

export async function createNotification(data: CreateNotification) {
  const [notification] = await db('notifications')
    .insert({
      user_id: data.userId,
      type: data.type,
      title: data.title,
      message: data.message,
      action_type: data.actionType || null,
      action_target: data.actionTarget || null,
      metadata: data.metadata ? JSON.stringify(data.metadata) : null,
    })
    .returning('*');

  return formatNotification(notification);
}

export async function getUserNotifications(
  userId: string,
  limit: number = 30,
  offset: number = 0
) {
  const notifications = await db('notifications')
    .where({ user_id: userId })
    .orderBy('created_at', 'desc')
    .limit(limit)
    .offset(offset);

  const countResult = await db('notifications')
    .where({ user_id: userId })
    .count('id as count')
    .first() as { count: string | number } | undefined;

  const unreadResult = await db('notifications')
    .where({ user_id: userId, read: false })
    .count('id as unread')
    .first() as { unread: string | number } | undefined;

  return {
    notifications: notifications.map(formatNotification),
    total: Number(countResult?.count || 0),
    unread: Number(unreadResult?.unread || 0),
  };
}

export async function markAsRead(userId: string, notificationId: string) {
  const notification = await db('notifications')
    .where({ id: notificationId, user_id: userId })
    .first();

  if (!notification) {
    throw new Error('Notification not found');
  }

  await db('notifications')
    .where({ id: notificationId })
    .update({ read: true });

  return { success: true };
}

export async function markAllAsRead(userId: string) {
  const updated = await db('notifications')
    .where({ user_id: userId, read: false })
    .update({ read: true });

  return { updated };
}

export async function getUnreadCount(userId: string) {
  const result = await db('notifications')
    .where({ user_id: userId, read: false })
    .count('id as count')
    .first() as { count: string | number } | undefined;

  return { unread: Number(result?.count || 0) };
}

export async function deleteNotification(userId: string, notificationId: string) {
  await db('notifications')
    .where({ id: notificationId, user_id: userId })
    .delete();

  return { success: true };
}

// Helper: Generate contextual notifications based on user activity
export async function generateActivityNotifications(userId: string) {
  // Check for recent deposits
  const recentDeposit = await db('transactions')
    .join('accounts', 'transactions.account_id', 'accounts.id')
    .where('accounts.user_id', userId)
    .where('transactions.type', 'credit')
    .where('transactions.category', 'deposit')
    .orderBy('transactions.created_at', 'desc')
    .first();

  if (recentDeposit) {
    const existingNotif = await db('notifications')
      .where({ user_id: userId, type: 'transaction' })
      .where('metadata', 'like', `%${recentDeposit.id}%`)
      .first();

    if (!existingNotif) {
      await createNotification({
        userId,
        type: 'transaction',
        title: 'Deposit Received',
        message: `You received $${parseFloat(recentDeposit.amount).toFixed(2)} - ${recentDeposit.description}`,
        actionType: 'navigate',
        actionTarget: 'home',
        metadata: { transactionId: recentDeposit.id, amount: parseFloat(recentDeposit.amount) },
      });
    }
  }

  // Check for advance repayment due
  const upcomingRepayment = await db('advances')
    .where({ user_id: userId, status: 'funded' })
    .whereRaw("repayment_date <= date('now', '+3 days')")
    .first();

  if (upcomingRepayment) {
    const existingNotif = await db('notifications')
      .where({ user_id: userId, type: 'advance' })
      .where('metadata', 'like', `%${upcomingRepayment.id}%`)
      .where('title', 'Repayment Due Soon')
      .first();

    if (!existingNotif) {
      await createNotification({
        userId,
        type: 'advance',
        title: 'Repayment Due Soon',
        message: `Your ExtraCash advance of $${parseFloat(upcomingRepayment.amount).toFixed(2)} is due soon.`,
        actionType: 'navigate',
        actionTarget: 'extracash',
        metadata: { advanceId: upcomingRepayment.id },
      });
    }
  }

  // Check for goal milestones
  const goals = await db('goals').where({ user_id: userId, status: 'active' });
  for (const goal of goals) {
    const progress = (parseFloat(goal.current_amount) / parseFloat(goal.target_amount)) * 100;
    const milestones = [25, 50, 75, 100];

    for (const milestone of milestones) {
      if (progress >= milestone) {
        const existingNotif = await db('notifications')
          .where({ user_id: userId, type: 'goal' })
          .where('metadata', 'like', `%"milestone":${milestone}%`)
          .where('metadata', 'like', `%${goal.id}%`)
          .first();

        if (!existingNotif) {
          await createNotification({
            userId,
            type: 'goal',
            title: milestone === 100 ? 'Goal Completed!' : `Goal ${milestone}% Reached!`,
            message: milestone === 100
              ? `Congratulations! You've completed your "${goal.name}" savings goal!`
              : `You're ${milestone}% of the way to your "${goal.name}" goal!`,
            actionType: 'navigate',
            actionTarget: 'goals',
            metadata: { goalId: goal.id, milestone },
          });
        }
      }
    }
  }

  // Low balance warning
  const accounts = await db('accounts').where({ user_id: userId });
  for (const account of accounts) {
    if (parseFloat(account.balance) < 100 && account.account_type === 'checking') {
      const today = new Date().toISOString().split('T')[0];
      const existingNotif = await db('notifications')
        .where({ user_id: userId, type: 'security' })
        .where('title', 'Low Balance Alert')
        .whereRaw("date(created_at) = ?", [today])
        .first();

      if (!existingNotif) {
        await createNotification({
          userId,
          type: 'security',
          title: 'Low Balance Alert',
          message: `Your checking account balance is $${parseFloat(account.balance).toFixed(2)}. Consider adding funds.`,
          actionType: 'navigate',
          actionTarget: 'home',
          metadata: { accountId: account.id, balance: parseFloat(account.balance) },
        });
      }
    }
  }
}

function formatNotification(n: any) {
  return {
    id: n.id,
    type: n.type,
    title: n.title,
    message: n.message,
    read: Boolean(n.read),
    actionType: n.action_type,
    actionTarget: n.action_target,
    metadata: typeof n.metadata === 'string' ? JSON.parse(n.metadata) : n.metadata,
    createdAt: n.created_at,
  };
}
