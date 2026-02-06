import { Knex } from 'knex';
import { getUuidDefault } from '../utils/helpers';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('linked_accounts', (table) => {
    table.uuid('id').primary().defaultTo(getUuidDefault(knex));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('bank_name', 100).notNullable();
    table.string('account_holder_name', 200).notNullable();
    table.string('account_number_last4', 4).notNullable();
    table.string('routing_number', 9).notNullable();
    table.string('account_type', 20).notNullable().defaultTo('checking'); // checking | savings
    table.string('verification_status', 20).notNullable().defaultTo('pending'); // pending | verified | failed
    table.boolean('is_primary').notNullable().defaultTo(false);
    table.string('institution_id', 100); // For future Plaid integration
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('linked_accounts');
}
