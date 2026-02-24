import { EventRecord } from '../db/repositories/eventsRepo';
import { JobRecord } from '../db/repositories/jobsRepo';

export const mockEvents: EventRecord[] = [
  {
    id: 'evt_mock_1',
    plate_text: 'KA01AB1234',
    event_type: 'entry',
    event_time: '2026-02-24T12:10:00Z',
    confidence: 0.94,
    snapshot_url: null
  },
  {
    id: 'evt_mock_2',
    plate_text: 'KA01AB1234',
    event_type: 'exit',
    event_time: '2026-02-24T14:42:00Z',
    confidence: 0.91,
    snapshot_url: null
  }
];

export const mockJob: JobRecord = {
  id: 'job_mock',
  status: 'queued',
  progress: 0,
  stage: 'upload_received'
};
