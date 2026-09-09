import { PasswordService } from './password.js';

describe('PasswordService', () => {
  const passwords = new PasswordService();

  it('verifies a correct password and rejects a wrong one', async () => {
    const hash = await passwords.hash('correct horse battery');
    expect(await passwords.verify(hash, 'correct horse battery')).toBe(true);
    expect(await passwords.verify(hash, 'wrong password')).toBe(false);
  });

  it('returns false rather than throwing on a malformed hash', async () => {
    expect(await passwords.verify('not-a-hash', 'x')).toBe(false);
  });

  it('produces a different hash each time (random salt)', async () => {
    const a = await passwords.hash('same');
    const b = await passwords.hash('same');
    expect(a).not.toEqual(b);
  });
});
