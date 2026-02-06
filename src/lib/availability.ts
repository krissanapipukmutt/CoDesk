import { DateTime } from 'luxon';
import { BANGKOK_TZ } from './tz';

export type BookingWindow = {
  startAt: string; // UTC ISO
  endAt: string; // UTC ISO
};

const toMillis = (iso: string) => DateTime.fromISO(iso, { zone: 'utc' }).toMillis();

export const maxConcurrent = (bookings: BookingWindow[], startIso: string, endIso: string) => {
  const windowStart = toMillis(startIso);
  const windowEnd = toMillis(endIso);
  const overlaps = bookings.filter((b) => {
    const s = toMillis(b.startAt);
    const e = toMillis(b.endAt);
    return s < windowEnd && e > windowStart;
  });
  const points = new Set<number>();
  overlaps.forEach((b) => points.add(toMillis(b.startAt)));
  points.add(windowStart);

  let max = 0;
  points.forEach((p) => {
    if (p < windowEnd) {
      const count = overlaps.filter((b) => toMillis(b.startAt) <= p && toMillis(b.endAt) > p).length;
      if (count > max) max = count;
    }
  });
  return max;
};

export const remainingCapacityForDay = (
  bookings: BookingWindow[],
  capacity: number,
  localDate: string
) => {
  const dayStart = DateTime.fromISO(localDate, { zone: BANGKOK_TZ }).startOf('day').toUTC().toISO()!;
  const dayEnd = DateTime.fromISO(localDate, { zone: BANGKOK_TZ }).endOf('day').toUTC().toISO()!;
  const max = maxConcurrent(bookings, dayStart, dayEnd);
  return Math.max(capacity - max, 0);
};

export const countSeatConflicts = (
  bookings: BookingWindow[],
  startIso: string,
  endIso: string
) => {
  return bookings.filter((b) => {
    const s = toMillis(b.startAt);
    const e = toMillis(b.endAt);
    return s < toMillis(endIso) && e > toMillis(startIso);
  }).length;
};
