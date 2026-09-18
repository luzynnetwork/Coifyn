import type { AppConfigService } from '../../config/config.service.js';
import type { DatabaseService } from '../../persistence/database.service.js';
import type { EventPublisher, PublishableEvent } from '../publisher/event-publisher.js';
import type { OutboxRepo } from './outbox.repo.js';
import { RelayWorker } from './relay.worker.js';

function event(id: string): PublishableEvent {
  return {
    id,
    aggregateType: 'salon',
    aggregateId: 's1',
    type: 'SalonCreated',
    payload: {},
    salonId: 's1',
    correlationId: null,
    occurredAt: new Date(),
  };
}

describe('RelayWorker.tick', () => {
  const config = { get: () => 'development' } as unknown as AppConfigService;

  function build(batches: PublishableEvent[][]) {
    const published: PublishableEvent[][] = [];
    const marked: string[][] = [];
    let call = 0;

    const outbox = {
      fetchUnpublished: async () => batches[call++] ?? [],
      markPublished: async (ids: string[]) => {
        marked.push(ids);
      },
    } as unknown as OutboxRepo;

    const publisher: EventPublisher = {
      publish: async (events) => {
        published.push(events);
      },
    };

    const database = {
      withSystem: <T>(fn: () => Promise<T>) => fn(),
    } as unknown as DatabaseService;

    const worker = new RelayWorker(database, outbox, config, publisher);
    return { worker, published, marked };
  }

  it('publishes a batch and marks it published', async () => {
    const { worker, published, marked } = build([[event('a'), event('b')]]);
    const n = await worker.tick();
    expect(n).toBe(2);
    expect(published[0].map((e) => e.id)).toEqual(['a', 'b']);
    expect(marked[0]).toEqual(['a', 'b']);
  });

  it('does nothing when the outbox is empty', async () => {
    const { worker, published, marked } = build([[]]);
    expect(await worker.tick()).toBe(0);
    expect(published).toHaveLength(0);
    expect(marked).toHaveLength(0);
  });

  it('does not mark published when publish throws', async () => {
    const outbox = {
      fetchUnpublished: async () => [event('a')],
      markPublished: async () => {
        throw new Error('should not be called');
      },
    } as unknown as OutboxRepo;
    const publisher: EventPublisher = {
      publish: async () => {
        throw new Error('redis down');
      },
    };
    const database = {
      withSystem: <T>(fn: () => Promise<T>) => fn(),
    } as unknown as DatabaseService;
    const worker = new RelayWorker(database, outbox, config, publisher);
    expect(await worker.tick()).toBe(0); // swallowed, retried next tick
  });
});
