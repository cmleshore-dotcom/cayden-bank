import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('notifications', (table) => {
    table.uuid('id').primary().defaultTo(knex.fn.uuid());
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('type').notNullable(); // transaction, advance, goal, security, promotion, bill
    table.string('title').notNullable();
    table.text('message').notNullable();
    table.boolean('read').defaultTo(false);
    table.string('action_type').nullable(); // navigate, link, none
    table.string('action_target').nullable(); // screen name or URL
    table.jsonb('metadata').nullable(); // extra data (amount, transactionId, etc.)
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  // Index for efficient user-specific queries
  await knex.schema.raw(
    'CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications(user_id, created_at DESC)'
  );
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('notifications');
}
