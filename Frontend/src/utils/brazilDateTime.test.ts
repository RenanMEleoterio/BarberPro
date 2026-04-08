import { describe, expect, it } from 'vitest';
import { toBrazilDateInputValue, toBrazilDateLabel, toBrazilTimeValue } from './brazilDateTime';

describe('brazilDateTime', () => {
  it('converts UTC slot to Brazil date and time', () => {
    const value = '2026-04-09T11:30:00Z';

    expect(toBrazilDateInputValue(value)).toBe('2026-04-09');
    expect(toBrazilDateLabel(value)).toBe('09/04/2026');
    expect(toBrazilTimeValue(value)).toBe('08:30');
  });

  it('keeps day consistency for late UTC times', () => {
    const value = '2026-04-10T01:00:00Z';

    expect(toBrazilDateInputValue(value)).toBe('2026-04-09');
    expect(toBrazilTimeValue(value)).toBe('22:00');
  });
});
