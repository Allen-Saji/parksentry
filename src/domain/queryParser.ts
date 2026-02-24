export type SearchIntent =
  | 'plate_lookup'
  | 'range_lookup'
  | 'inside_status'
  | 'aggregate'
  | 'unknown';

export interface ParsedQuery {
  intent: SearchIntent;
  plate?: string;
  direction?: 'entry' | 'exit' | 'any';
  from?: string;
  to?: string;
}

const plateRegex = /\b[A-Z]{2}\d{1,2}[A-Z]{1,3}\d{1,4}\b/i;

export function parseSearchQuery(input: string): ParsedQuery {
  const q = input.trim();
  const lower = q.toLowerCase();
  const plateMatch = q.match(plateRegex);
  const plate = plateMatch?.[0]?.toUpperCase();

  if (plate && (lower.includes('enter') || lower.includes('entry') || lower.includes('exit'))) {
    return {
      intent: 'plate_lookup',
      plate,
      direction: lower.includes('exit') ? 'exit' : lower.includes('enter') || lower.includes('entry') ? 'entry' : 'any'
    };
  }

  if (lower.includes('inside') || lower.includes('still in') || lower.includes('still inside')) {
    return {
      intent: 'inside_status',
      plate,
      direction: 'any'
    };
  }

  if (lower.includes('between')) {
    return {
      intent: 'range_lookup',
      direction: lower.includes('exit') ? 'exit' : lower.includes('enter') || lower.includes('entry') ? 'entry' : 'any'
    };
  }

  if (lower.includes('how many') || lower.includes('count')) {
    return {
      intent: 'aggregate',
      direction: lower.includes('exit') ? 'exit' : lower.includes('enter') || lower.includes('entry') ? 'entry' : 'any'
    };
  }

  return { intent: 'unknown' };
}
