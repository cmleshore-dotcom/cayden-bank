import { Knex } from 'knex';
import { getUuidDefault } from './helpers';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('accounts', (table) => {
    table.uuid('id').primary().defaultTo(getUuidDefault(knex));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('account_type', 20).notNullable();
    table.string('account_number', 12).unique().notNullable();
    table.string('routing_number', 9).notNullable().defaultTo('021000089');
    table.decimal('balance', 12, 2).notNullable().defaultTo(0);
    table.string('status', 20).defaultTo('active');
    table.boolean('round_up_enabled').defaultTo(false);
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('accounts');
}
