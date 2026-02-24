INSERT INTO events (id, plate_text, event_type, event_time, confidence)
VALUES
  ('evt_1','KA01AB1234','entry','2026-02-24T12:10:00Z',0.94),
  ('evt_2','KA01AB1234','exit','2026-02-24T14:42:00Z',0.91)
ON CONFLICT (id) DO NOTHING;

INSERT INTO processing_jobs (id, status, progress, stage)
VALUES ('job_demo_1', 'completed', 100, 'done')
ON CONFLICT (id) DO NOTHING;
