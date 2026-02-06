import { describe, expect, it } from 'vitest';
import { mapErrorCodeToMessage, parseErrorCode } from '../errors';

describe('error mapping', () => {
  it('maps error codes', () => {
    expect(mapErrorCodeToMessage('OVER_CAPACITY')).toContain('เต็ม');
  });

  it('parses error code from message', () => {
    expect(parseErrorCode('OVER_CAPACITY')).toBe('OVER_CAPACITY');
  });
});
