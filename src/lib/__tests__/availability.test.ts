import { describe, expect, it } from 'vitest';
import { maxConcurrent, remainingCapacityForDay } from '../availability';

describe('availability', () => {
  it('calculates max concurrent bookings', () => {
    const bookings = [
      { startAt: '2026-02-10T02:00:00.000Z', endAt: '2026-02-10T05:00:00.000Z' },
      { startAt: '2026-02-10T03:00:00.000Z', endAt: '2026-02-10T04:00:00.000Z' }
    ];
    const max = maxConcurrent(bookings, '2026-02-10T01:00:00.000Z', '2026-02-10T06:00:00.000Z');
    expect(max).toBe(2);
  });

  it('calculates remaining capacity per day', () => {
    const bookings = [
      { startAt: '2026-02-10T02:00:00.000Z', endAt: '2026-02-10T05:00:00.000Z' }
    ];
    const remaining = remainingCapacityForDay(bookings, 2, '2026-02-10');
    expect(remaining).toBe(1);
  });
});
