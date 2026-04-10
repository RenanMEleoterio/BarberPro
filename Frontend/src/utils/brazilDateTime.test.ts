import { describe, expect, it } from 'vitest';
import {
  getBrazilDayOfWeek,
  isSameBrazilDate,
  toBrazilDateInputValue,
  toBrazilDateLabel,
  toBrazilTimeValue,
} from './brazilDateTime';

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

  it('treats date-only values as Brazil calendar dates', () => {
    const value = '2026-04-10';

    expect(toBrazilDateInputValue(value)).toBe('2026-04-10');
    expect(toBrazilDateLabel(value)).toBe('10/04/2026');
  });

  it('treats local date-time values without offset as Brazil local time', () => {
    const value = '2026-04-10T13:00:00';

    expect(toBrazilDateInputValue(value)).toBe('2026-04-10');
    expect(toBrazilTimeValue(value)).toBe('13:00');
  });

  it('keeps the selected Brazil hour after UTC persistence', () => {
    const storedUtcValue = '2026-04-10T16:00:00Z';

    expect(toBrazilDateInputValue(storedUtcValue)).toBe('2026-04-10');
    expect(toBrazilTimeValue(storedUtcValue)).toBe('13:00');
    expect(isSameBrazilDate(storedUtcValue, '2026-04-10')).toBe(true);
    expect(getBrazilDayOfWeek(storedUtcValue)).toBe(5);
  });
});
