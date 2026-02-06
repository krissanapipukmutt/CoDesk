import { describe, expect, it } from 'vitest';
import { parseLocalDateTimeToUtc } from '../tz';

describe('tz helpers', () => {
  it('converts Bangkok time to UTC ISO', () => {
    const iso = parseLocalDateTimeToUtc('2026-02-10', '09:00');
    expect(iso).toBe('2026-02-10T02:00:00.000Z');
  });
});
