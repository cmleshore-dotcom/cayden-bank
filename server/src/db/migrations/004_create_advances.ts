import { Knex } from 'knex';
import { getUuidDefault } from './helpers';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('advances', (table) => {
    table.uuid('id').primary().defaultTo(getUuidDefault(knex));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.uuid('account_id').notNullable().references('id').inTable('accounts').onDelete('CASCADE');
    table.decimal('amount', 12, 2).notNullable();
    table.decimal('fee', 12, 2).notNullable().defaultTo(0);
    table.decimal('tip', 12, 2).notNullable().defaultTo(0);
    table.string('status', 30).defaultTo('pending');
    table.string('delivery_speed', 20).defaultTo('standard');
    table.decimal('eligibility_score', 5, 2);
    table.timestamp('funded_at');
    table.date('repayment_date');
    table.timestamp('repaid_at');
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('advances');
}
