import { Knex } from 'knex';
import { getUuidDefault } from './helpers';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('users', (table) => {
    table.uuid('id').primary().defaultTo(getUuidDefault(knex));
    table.string('email', 255).unique().notNullable();
    table.string('phone', 20).unique();
    table.string('password_hash', 255).notNullable();
    table.string('first_name', 100).notNullable();
    table.string('last_name', 100).notNullable();
    table.date('date_of_birth');
    table.text('address').defaultTo('{}');
    table.string('ssn_last_four', 4);
    table.string('kyc_status', 20).defaultTo('pending');
    table.string('refresh_token', 500);
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('users');
}
