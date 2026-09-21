import { db } from './db.js';
import * as bcrypt from 'bcrypt';
import { config } from 'dotenv';

config();

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL ?? 'admin@example.com';
  const password = process.env.SEED_ADMIN_PASSWORD ?? 'admin123';

  const existing = await db.orm.public.User.where({ email }).first();
  if (existing) {
    console.log(`User ${email} already exists, skipping seed`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await db.orm.public.User.create({
    email,
    passwordHash,
  });

  console.log(`Seeded user: ${user.id} (${user.email})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.close();
  });