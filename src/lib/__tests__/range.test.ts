import { describe, expect, it } from 'vitest';
import { expandLocalDateRange } from '../range';

describe('range helpers', () => {
  it('expands date range in Bangkok', () => {
    const days = expandLocalDateRange('2026-02-10T02:00:00.000Z', '2026-02-12T02:00:00.000Z');
    expect(days).toEqual(['2026-02-10', '2026-02-11']);
  });
});
