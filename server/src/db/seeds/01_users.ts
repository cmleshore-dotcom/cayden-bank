import { Knex } from 'knex';
import bcrypt from 'bcrypt';

export async function seed(knex: Knex): Promise<void> {
  // Clear all tables in dependency order
  await knex('audit_logs').del().catch(() => {});
  await knex('linked_accounts').del().catch(() => {});
  await knex('chat_messages').del();
  await knex('goals').del();
  await knex('advances').del();
  await knex('transactions').del();
  await knex('accounts').del();
  await knex('users').del();

  // Use strong password that meets policy: uppercase, lowercase, number, special char
  const passwordHash = await bcrypt.hash('Password123!', 10);

  await knex('users').insert([
    {
      id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      email: 'cayden@example.com',
      phone: '5551234567',
      password_hash: passwordHash,
      first_name: 'Cayden',
      last_name: 'Banks',
      date_of_birth: '1995-06-15',
      address: JSON.stringify({
        street: '123 Main St',
        city: 'New York',
        state: 'NY',
        zip: '10001',
      }),
      ssn_last_four: '1234',
      kyc_status: 'verified',
    },
    {
      id: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
      email: 'jane@example.com',
      phone: '5559876543',
      password_hash: passwordHash,
      first_name: 'Jane',
      last_name: 'Smith',
      date_of_birth: '1992-03-22',
      address: JSON.stringify({
        street: '456 Oak Ave',
        city: 'Los Angeles',
        state: 'CA',
        zip: '90001',
      }),
      ssn_last_four: '5678',
      kyc_status: 'verified',
    },
  ]);
}
