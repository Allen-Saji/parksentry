export interface ParkingEvent {
  id: string;
  plateText: string;
  eventType: 'entry' | 'exit';
  eventTime: string;
  confidence: number;
  snapshotUrl?: string;
}

const seed: ParkingEvent[] = [
  {
    id: 'evt_1',
    plateText: 'KA01AB1234',
    eventType: 'entry',
    eventTime: '2026-02-24T12:10:00Z',
    confidence: 0.94
  },
  {
    id: 'evt_2',
    plateText: 'KA01AB1234',
    eventType: 'exit',
    eventTime: '2026-02-24T14:42:00Z',
    confidence: 0.91
  }
];

export function searchEvents(plate?: string, direction: 'entry' | 'exit' | 'any' = 'any'): ParkingEvent[] {
  return seed.filter((e) => {
    const plateOk = plate ? e.plateText === plate : true;
    const dirOk = direction === 'any' ? true : e.eventType === direction;
    return plateOk && dirOk;
  });
}
