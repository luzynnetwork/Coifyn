import {
  assertImplemented,
  isNotificationType,
} from './notification-types.js';

describe('notification types registry', () => {
  it('accepts a registered, implemented type with a valid payload', () => {
    expect(
      assertImplemented('TestNotification', { message: 'hi' }),
    ).toEqual({ message: 'hi' });
  });

  it('throws on an unregistered type — fail loud, not silent', () => {
    expect(() => assertImplemented('MadeUpNotification', {})).toThrow(
      /Unregistered notification type/,
    );
  });

  it('throws on a registered but not-yet-implemented type', () => {
    expect(() => assertImplemented('BookingReminder', {})).toThrow(
      /not yet implemented/,
    );
  });

  it('throws when the payload does not match the schema', () => {
    expect(() =>
      assertImplemented('TestNotification', { message: 123 }),
    ).toThrow(/Invalid payload/);
  });

  it('isNotificationType narrows correctly', () => {
    expect(isNotificationType('TestNotification')).toBe(true);
    expect(isNotificationType('nope')).toBe(false);
  });
});
