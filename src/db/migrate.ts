import { db } from './client';

const statements = [
  `
  CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY,
    plate_text TEXT,
    event_type TEXT NOT NULL,
    event_time TIMESTAMPTZ NOT NULL,
    confidence NUMERIC,
    snapshot_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )
  `,
  `
  CREATE TABLE IF NOT EXISTS processing_jobs (
    id TEXT PRIMARY KEY,
    status TEXT NOT NULL,
    progress NUMERIC NOT NULL DEFAULT 0,
    stage TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )
  `,
  `
  CREATE TABLE IF NOT EXISTS cameras (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    location TEXT,
    line_config JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )
  `
];

async function run() {
  for (const sql of statements) {
    await db.query(sql);
  }

  await db.query(`
    INSERT INTO events (id, plate_text, event_type, event_time, confidence)
    VALUES
      ('evt_1','KA01AB1234','entry','2026-02-24T12:10:00Z',0.94),
      ('evt_2','KA01AB1234','exit','2026-02-24T14:42:00Z',0.91)
    ON CONFLICT (id) DO NOTHING
  `);

  await db.query(`
    INSERT INTO processing_jobs (id, status, progress, stage)
    VALUES ('job_demo_1', 'completed', 100, 'done')
    ON CONFLICT (id) DO NOTHING
  `);

  console.log('migrations applied');
  await db.end();
}

run().catch(async (err) => {
  console.error(err);
  await db.end();
  process.exit(1);
});
