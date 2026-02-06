import { Knex } from 'knex';
import { getUuidDefault } from './helpers';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('goals', (table) => {
    table.uuid('id').primary().defaultTo(getUuidDefault(knex));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.uuid('account_id').references('id').inTable('accounts').onDelete('SET NULL');
    table.string('name', 100).notNullable();
    table.decimal('target_amount', 12, 2).notNullable();
    table.decimal('current_amount', 12, 2).notNullable().defaultTo(0);
    table.decimal('auto_fund_amount', 12, 2).defaultTo(0);
    table.boolean('auto_fund_enabled').defaultTo(false);
    table.date('target_date');
    table.string('status', 20).defaultTo('active');
    table.string('icon', 50).defaultTo('piggy-bank');
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('goals');
}
