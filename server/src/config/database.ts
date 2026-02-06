import knex from 'knex';
import path from 'path';

const isProduction = process.env.NODE_ENV === 'production';

let db: ReturnType<typeof knex>;

if (isProduction) {
  // PostgreSQL for production (Render)
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is required in production');
  }

  db = knex({
    client: 'pg',
    connection: {
      connectionString,
      ssl: { rejectUnauthorized: false },
    },
    pool: {
      min: 2,
      max: 10,
    },
  });
} else {
  // SQLite for local development
  db = knex({
    client: 'better-sqlite3',
    connection: {
      filename: path.join(__dirname, '..', '..', 'cayden_bank.sqlite'),
    },
    useNullAsDefault: true,
  });
}

export default db;
