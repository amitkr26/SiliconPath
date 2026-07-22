import { getDaysUntilDeadline, isExpired, formatDate } from '@/lib/utils';

describe('getDaysUntilDeadline', () => {
  it('returns positive number for future deadline', () => {
    const future = new Date();
    future.setDate(future.getDate() + 10);
    const days = getDaysUntilDeadline(future.toISOString());
    expect(days).toBeGreaterThan(0);
    expect(days).toBeLessThanOrEqual(11);
  });

  it('returns 1 for today (ceil of <1 day)', () => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const days = getDaysUntilDeadline(today.toISOString());
    expect(days).toBe(1);
  });

  it('returns negative number for past deadline', () => {
    const past = new Date('2020-01-01');
    const days = getDaysUntilDeadline(past.toISOString());
    expect(days).toBeLessThan(0);
  });
});

describe('isExpired', () => {
  it('returns true for past deadline', () => {
    expect(isExpired('2020-01-01')).toBe(true);
  });

  it('returns false for future deadline', () => {
    const future = new Date();
    future.setFullYear(future.getFullYear() + 1);
    expect(isExpired(future.toISOString())).toBe(false);
  });

  it('returns false for today', () => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    expect(isExpired(today.toISOString())).toBe(false);
  });
});

describe('formatDate', () => {
  it('formats a date string correctly', () => {
    const result = formatDate('2026-06-15');
    expect(result).toContain('Jun');
    expect(result).toContain('15');
    expect(result).toContain('2026');
  });
});
