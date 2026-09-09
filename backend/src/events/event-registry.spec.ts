import { assertRegistered, isEventType } from './event-registry.js';

describe('event registry', () => {
  it('accepts a registered type with a valid payload', () => {
    expect(
      assertRegistered('BranchCreated', { name: 'Gulberg' }),
    ).toEqual({ name: 'Gulberg' });
  });

  it('throws on an unregistered type — fail loud, not silent', () => {
    expect(() => assertRegistered('MadeUpEvent', {})).toThrow(
      /Unregistered domain event/,
    );
  });

  it('throws when the payload does not match the schema', () => {
    expect(() => assertRegistered('BranchCreated', { name: 123 })).toThrow(
      /Invalid payload/,
    );
  });

  it('isEventType narrows correctly', () => {
    expect(isEventType('SalonCreated')).toBe(true);
    expect(isEventType('nope')).toBe(false);
  });

  it('every tenancy event this codebase emits is registered', () => {
    for (const type of [
      'SalonCreated',
      'SalonUpdated',
      'BranchCreated',
      'BranchUpdated',
      'BranchDeleted',
      'ChairCreated',
      'ChairUpdated',
      'ChairRetired',
    ]) {
      expect(isEventType(type)).toBe(true);
    }
  });
});
