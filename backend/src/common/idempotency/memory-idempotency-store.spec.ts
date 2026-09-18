import { MemoryIdempotencyStore } from './memory-idempotency-store.js';

describe('MemoryIdempotencyStore', () => {
  it('begin claims a key once; a second begin fails', async () => {
    const store = new MemoryIdempotencyStore();
    expect(await store.begin('k')).toBe(true);
    expect(await store.begin('k')).toBe(false);
    expect(await store.get('k')).toEqual({ kind: 'pending' });
  });

  it('finish replaces the pending claim with the response', async () => {
    const store = new MemoryIdempotencyStore();
    await store.begin('k');
    await store.finish('k', 201, { id: 'abc' });
    expect(await store.get('k')).toEqual({
      kind: 'response',
      status: 201,
      body: { id: 'abc' },
    });
  });

  it('release drops the claim so begin can succeed again', async () => {
    const store = new MemoryIdempotencyStore();
    await store.begin('k');
    await store.release('k');
    expect(await store.get('k')).toBeNull();
    expect(await store.begin('k')).toBe(true);
  });

  it('returns null for an unknown key', async () => {
    expect(await new MemoryIdempotencyStore().get('nope')).toBeNull();
  });
});
