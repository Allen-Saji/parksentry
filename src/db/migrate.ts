import fs from 'node:fs/promises';
import path from 'node:path';
import { db } from './client';

async function run() {
  const migrationsDir = path.join(process.cwd(), 'db', 'migrations');
  const files = (await fs.readdir(migrationsDir)).filter((f) => f.endsWith('.sql')).sort();

  for (const file of files) {
    const sql = await fs.readFile(path.join(migrationsDir, file), 'utf8');
    await db.query(sql);
    console.log(`applied ${file}`);
  }

  await db.end();
}

run().catch(async (err) => {
  console.error(err);
  await db.end();
  process.exit(1);
});
