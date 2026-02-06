import { Knex } from 'knex';

const SQLITE_UUID_RAW = "(lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6))))";

export function getUuidDefault(knex: Knex): Knex.Raw {
  const client = (knex.client as any).config?.client || '';
  if (client === 'better-sqlite3' || client === 'sqlite3') {
    return knex.raw(SQLITE_UUID_RAW);
  }
  return knex.raw('gen_random_uuid()');
}
