import { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  await knex('accounts').insert([
    {
      id: 'acc-11111111-1111-1111-1111-111111111111',
      user_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      account_type: 'checking',
      account_number: '100000000001',
      routing_number: '021000089',
      balance: 2547.83,
      status: 'active',
    },
    {
      id: 'acc-22222222-2222-2222-2222-222222222222',
      user_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      account_type: 'savings',
      account_number: '100000000002',
      routing_number: '021000089',
      balance: 850.0,
      status: 'active',
      round_up_enabled: true,
    },
    {
      id: 'acc-33333333-3333-3333-3333-333333333333',
      user_id: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
      account_type: 'checking',
      account_number: '100000000003',
      routing_number: '021000089',
      balance: 1250.0,
      status: 'active',
    },
  ]);
}
