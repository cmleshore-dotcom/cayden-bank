import { Knex } from 'knex';
import { getUuidDefault } from './helpers';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('side_hustles', (table) => {
    table.uuid('id').primary().defaultTo(getUuidDefault(knex));
    table.string('title', 200).notNullable();
    table.string('company', 200).notNullable();
    table.text('description').notNullable();
    table.string('category', 20).notNullable();
    table.string('pay_range', 50);
    table.string('location', 200);
    table.string('url', 500);
    table.boolean('is_active').defaultTo(true);
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('side_hustles');
}
