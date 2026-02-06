import { DateTime } from 'luxon';
import { BANGKOK_TZ } from './tz';

export const expandLocalDateRange = (startIsoUtc: string, endIsoUtc: string) => {
  const start = DateTime.fromISO(startIsoUtc, { zone: 'utc' }).setZone(BANGKOK_TZ).startOf('day');
  const end = DateTime.fromISO(endIsoUtc, { zone: 'utc' }).setZone(BANGKOK_TZ).minus({ seconds: 1 }).startOf('day');
  const days: string[] = [];
  let cursor = start;
  while (cursor <= end) {
    days.push(cursor.toISODate()!);
    cursor = cursor.plus({ days: 1 });
  }
  return days;
};

export const overlaps = (aStart: string, aEnd: string, bStart: string, bEnd: string) => {
  return aStart < bEnd && bStart < aEnd;
};

export const segmentByDay = (startIsoUtc: string, endIsoUtc: string) => {
  const start = DateTime.fromISO(startIsoUtc, { zone: 'utc' }).setZone(BANGKOK_TZ);
  const end = DateTime.fromISO(endIsoUtc, { zone: 'utc' }).setZone(BANGKOK_TZ);
  const segments: { date: string; start: DateTime; end: DateTime }[] = [];
  let cursor = start.startOf('day');
  while (cursor < end) {
    const segStart = DateTime.max(start, cursor);
    const segEnd = DateTime.min(end, cursor.plus({ days: 1 }));
    if (segStart < segEnd) {
      segments.push({ date: cursor.toISODate()!, start: segStart, end: segEnd });
    }
    cursor = cursor.plus({ days: 1 });
  }
  return segments;
};
