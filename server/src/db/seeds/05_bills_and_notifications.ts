import { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  // Check if tables exist first (migrations may not have run yet)
  const hasBills = await knex.schema.hasTable('bills');
  const hasNotifications = await knex.schema.hasTable('notifications');

  if (!hasBills && !hasNotifications) return;

  // Get Cayden's user and checking account
  const cayden = await knex('users').where({ email: 'cayden@example.com' }).first();
  if (!cayden) return;

  const checking = await knex('accounts')
    .where({ user_id: cayden.id, account_type: 'checking' })
    .first();
  if (!checking) return;

  // Seed bills
  if (hasBills) {
    const existingBills = await knex('bills').where({ user_id: cayden.id }).first();
    if (!existingBills) {
      const now = new Date();
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

      await knex('bills').insert([
        {
          user_id: cayden.id,
          account_id: checking.id,
          name: 'Netflix',
          category: 'subscription',
          amount: 15.99,
          frequency: 'monthly',
          due_day: 15,
          auto_pay: true,
          status: 'active',
          icon: 'tv-outline',
          next_due_date: new Date(now.getFullYear(), now.getMonth(), 15 > now.getDate() ? 15 : now.getMonth() + 1).toISOString().split('T')[0],
        },
        {
          user_id: cayden.id,
          account_id: checking.id,
          name: 'Electric Bill',
          category: 'utility',
          amount: 85.00,
          frequency: 'monthly',
          due_day: 22,
          auto_pay: false,
          status: 'active',
          icon: 'flash-outline',
          next_due_date: new Date(now.getFullYear(), now.getMonth(), 22 > now.getDate() ? 22 : now.getMonth() + 1).toISOString().split('T')[0],
        },
        {
          user_id: cayden.id,
          account_id: checking.id,
          name: 'Rent',
          category: 'rent',
          amount: 1200.00,
          frequency: 'monthly',
          due_day: 1,
          auto_pay: true,
          status: 'active',
          icon: 'home-outline',
          next_due_date: new Date(nextMonth.getFullYear(), nextMonth.getMonth(), 1).toISOString().split('T')[0],
        },
        {
          user_id: cayden.id,
          account_id: checking.id,
          name: 'Spotify',
          category: 'subscription',
          amount: 10.99,
          frequency: 'monthly',
          due_day: 8,
          auto_pay: true,
          status: 'active',
          icon: 'musical-notes-outline',
          next_due_date: new Date(now.getFullYear(), now.getMonth(), 8 > now.getDate() ? 8 : now.getMonth() + 1).toISOString().split('T')[0],
        },
        {
          user_id: cayden.id,
          account_id: checking.id,
          name: 'Car Insurance',
          category: 'insurance',
          amount: 145.00,
          frequency: 'monthly',
          due_day: 20,
          auto_pay: false,
          status: 'active',
          icon: 'car-outline',
          next_due_date: new Date(now.getFullYear(), now.getMonth(), 20 > now.getDate() ? 20 : now.getMonth() + 1).toISOString().split('T')[0],
        },
      ]);
    }
  }

  // Seed notifications
  if (hasNotifications) {
    const existingNotifs = await knex('notifications').where({ user_id: cayden.id }).first();
    if (!existingNotifs) {
      const daysAgo = (n: number) => {
        const d = new Date();
        d.setDate(d.getDate() - n);
        return d.toISOString();
      };

      await knex('notifications').insert([
        {
          user_id: cayden.id,
          type: 'transaction',
          title: 'Direct Deposit Received',
          message: 'You received $3,200.00 from Acme Corp',
          read: false,
          action_type: 'navigate',
          action_target: 'home',
          metadata: JSON.stringify({ amount: 3200 }),
          created_at: daysAgo(1),
        },
        {
          user_id: cayden.id,
          type: 'advance',
          title: 'ExtraCash Available',
          message: 'You qualify for up to $400 in ExtraCash advances!',
          read: false,
          action_type: 'navigate',
          action_target: 'extracash',
          metadata: JSON.stringify({ maxAmount: 400 }),
          created_at: daysAgo(2),
        },
        {
          user_id: cayden.id,
          type: 'security',
          title: 'New Login Detected',
          message: 'A new login was detected from Chrome on Mac.',
          read: true,
          action_type: 'navigate',
          action_target: 'security',
          created_at: daysAgo(3),
        },
        {
          user_id: cayden.id,
          type: 'goal',
          title: 'Great Progress!',
          message: 'Keep it up! Your savings goals are on track.',
          read: true,
          action_type: 'navigate',
          action_target: 'goals',
          created_at: daysAgo(5),
        },
        {
          user_id: cayden.id,
          type: 'bill',
          title: 'Bill Due Soon',
          message: 'Your Netflix subscription of $15.99 is due in 3 days.',
          read: false,
          action_type: 'navigate',
          action_target: 'billpay',
          metadata: JSON.stringify({ billName: 'Netflix', amount: 15.99 }),
          created_at: daysAgo(0),
        },
      ]);
    }
  }
}
