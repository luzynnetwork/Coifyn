import { describe, expect, it } from 'vitest';
import { isUniqueViolation } from './unique-violation.js';

describe('isUniqueViolation', () => {
  it('recognises the driver error itself', () => {
    expect(isUniqueViolation({ code: '23505' })).toBe(true);
  });

  it('finds it wrapped one or two levels down, as drizzle does', () => {
    expect(isUniqueViolation({ cause: { code: '23505' } })).toBe(true);
    expect(isUniqueViolation({ cause: { cause: { code: '23505' } } })).toBe(true);
  });

  it('ignores other database errors and non-errors', () => {
    expect(isUniqueViolation({ code: '23503' })).toBe(false); // foreign key
    expect(isUniqueViolation({ code: '42P01' })).toBe(false); // missing table
    expect(isUniqueViolation(new Error('boom'))).toBe(false);
    expect(isUniqueViolation(null)).toBe(false);
    expect(isUniqueViolation(undefined)).toBe(false);
    expect(isUniqueViolation('23505')).toBe(false);
  });

  it('does not loop forever on a self-referencing cause', () => {
    const loop: { cause?: unknown } = {};
    loop.cause = loop;
    expect(isUniqueViolation(loop)).toBe(false);
  });
});
