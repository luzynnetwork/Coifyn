import {
  Inject,
  Injectable,
  Logger,
  type OnApplicationBootstrap,
  type OnModuleDestroy,
} from '@nestjs/common';
import { AppConfigService } from '../../config/config.service.js';
import { DatabaseService } from '../../persistence/database.service.js';
import {
  EVENT_PUBLISHER,
  type EventPublisher,
} from '../publisher/event-publisher.js';
import { OutboxRepo } from './outbox.repo.js';

const INTERVAL_MS = 1000;
const BATCH_SIZE = 200;

/**
 * Polls the outbox and forwards committed events. One transaction per tick:
 * SELECT ... FOR UPDATE SKIP LOCKED → publish → mark published → commit, so two
 * instances never forward the same row and a publish failure leaves the rows for
 * the next tick (at-least-once; consumers dedupe on event id).
 *
 * A poll is simple and enough at this scale; LISTEN/NOTIFY or Kafka Connect
 * replace it at the trigger. Disabled under NODE_ENV=test and when
 * EVENTS_RELAY=off.
 */
@Injectable()
export class RelayWorker implements OnApplicationBootstrap, OnModuleDestroy {
  private readonly logger = new Logger(RelayWorker.name);
  private timer?: NodeJS.Timeout;
  private ticking = false;

  constructor(
    private readonly database: DatabaseService,
    private readonly outbox: OutboxRepo,
    private readonly config: AppConfigService,
    @Inject(EVENT_PUBLISHER) private readonly publisher: EventPublisher,
  ) {}

  onApplicationBootstrap(): void {
    if (this.disabled()) {
      this.logger.log('outbox relay disabled');
      return;
    }
    this.timer = setInterval(() => void this.tick(), INTERVAL_MS);
    this.timer.unref();
    this.logger.log('outbox relay started');
  }

  onModuleDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  private disabled(): boolean {
    return (
      this.config.get('NODE_ENV') === 'test' ||
      process.env.EVENTS_RELAY === 'off'
    );
  }

  /** Exposed for a manual drain (tests, a one-off script). */
  async tick(): Promise<number> {
    if (this.ticking) return 0;
    this.ticking = true;
    try {
      return await this.database.withSystem(async () => {
        const batch = await this.outbox.fetchUnpublished(BATCH_SIZE);
        if (batch.length === 0) return 0;
        await this.publisher.publish(batch);
        await this.outbox.markPublished(batch.map((e) => e.id));
        return batch.length;
      });
    } catch (err) {
      this.logger.error('relay tick failed', err as Error);
      return 0;
    } finally {
      this.ticking = false;
    }
  }
}
