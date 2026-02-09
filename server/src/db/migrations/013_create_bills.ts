import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('bills', (table) => {
    table.uuid('id').primary().defaultTo(knex.fn.uuid());
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.uuid('account_id').notNullable().references('id').inTable('accounts').onDelete('CASCADE');
    table.string('name').notNullable(); // e.g. "Netflix", "Rent", "Electric"
    table.string('category').notNullable(); // subscription, utility, rent, insurance, loan, other
    table.decimal('amount', 12, 2).notNullable();
    table.string('frequency').notNullable().defaultTo('monthly'); // weekly, biweekly, monthly, quarterly, yearly
    table.integer('due_day').notNullable(); // day of month (1-31)
    table.boolean('auto_pay').defaultTo(false);
    table.string('status').defaultTo('active'); // active, paused, cancelled
    table.string('icon').defaultTo('receipt-outline'); // Ionicons name
    table.date('next_due_date').nullable();
    table.date('last_paid_date').nullable();
    table.timestamps(true, true);
  });

  await knex.schema.createTable('bill_payments', (table) => {
    table.uuid('id').primary().defaultTo(knex.fn.uuid());
    table.uuid('bill_id').notNullable().references('id').inTable('bills').onDelete('CASCADE');
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.uuid('transaction_id').nullable().references('id').inTable('transactions').onDelete('SET NULL');
    table.decimal('amount', 12, 2).notNullable();
    table.string('status').defaultTo('completed'); // completed, pending, failed
    table.timestamp('paid_at').defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('bill_payments');
  await knex.schema.dropTableIfExists('bills');
}
