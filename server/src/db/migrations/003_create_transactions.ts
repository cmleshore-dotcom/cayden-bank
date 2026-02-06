import { Knex } from 'knex';
import { getUuidDefault } from './helpers';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('transactions', (table) => {
    table.uuid('id').primary().defaultTo(getUuidDefault(knex));
    table.uuid('account_id').notNullable().references('id').inTable('accounts').onDelete('CASCADE');
    table.string('type', 10).notNullable();
    table.string('category', 30).notNullable();
    table.decimal('amount', 12, 2).notNullable();
    table.string('description', 255);
    table.string('merchant_name', 255);
    table.string('spending_category', 20);
    table.uuid('reference_id');
    table.decimal('balance_after', 12, 2).notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('transactions');
}
