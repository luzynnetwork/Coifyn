import { EventEmitter } from 'node:events';
import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { and, asc, gt, or, eq } from 'drizzle-orm';
import { DatabaseService } from '../persistence/database.service.js';
import { domainEvents } from '../persistence/schema/index.js';

/** How often the cross-instance DB-poll fallback checks for new domain events. */
const POLL_INTERVAL_MS = 2_000;
/** How many rows the fallback reads per tick — a small ceiling, not a real
 *  pagination cursor; the in-process bus is the primary delivery path. */
const POLL_BATCH_SIZE = 100;

/**
 * In-process pub/sub for SSE subscribers, plus a coarse DB-poll fallback so an
 * event published on one instance still reaches a subscriber connected to
 * another. `publish()`/`subscribe()` are the primary, low-latency path within a
 * single process; the poll below exists only to cover the multi-instance case
 * and intentionally trades latency (up to POLL_INTERVAL_MS) and precision
 * (topic is derived from aggregateType/salonId, not the exact topic string a
 * subscriber asked for) for simplicity. It does NOT mark domain_event rows as
 * published — that stays the exclusive job of the outbox relay
 * (events/relay/outbox.repo.ts); this is a read-only, best-effort broadcast.
 */
@Injectable()
export class RealtimeBus implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RealtimeBus.name);
  private readonly emitter = new EventEmitter();
  private pollTimer?: NodeJS.Timeout;
  private cursor: { occurredAt: Date; id: string } | null = null;

  constructor(private readonly database: DatabaseService) {
    // Many concurrent SSE subscribers each add a listener; this is expected,
    // not a leak — silence EventEmitter's default max-listener warning.
    this.emitter.setMaxListeners(0);
  }

  publish(topic: string, payload: unknown): void {
    this.emitter.emit(topic, payload);
  }

  /** Returns an unsubscribe function. */
  subscribe(topic: string, handler: (payload: unknown) => void): () => void {
    this.emitter.on(topic, handler);
    return () => this.emitter.off(topic, handler);
  }

  onModuleInit(): void {
    // Start the cursor at "now" — the fallback only rebroadcasts events that
    // occur after this instance came up, mirroring what a live subscriber
    // would have seen anyway. The nil UUID sorts below every real uuidv7 id,
    // so the tie-break clause is a no-op until the first real row is seen —
    // an empty string is not valid input for a uuid column.
    this.cursor = { occurredAt: new Date(), id: '00000000-0000-0000-0000-000000000000' };
    this.pollTimer = setInterval(() => {
      this.pollOnce().catch((err) =>
        this.logger.error({ err }, 'realtime DB-poll fallback failed'),
      );
    }, POLL_INTERVAL_MS);
  }

  onModuleDestroy(): void {
    if (this.pollTimer) clearInterval(this.pollTimer);
  }

  /** Cross-salon read-only scan for events newer than the in-memory cursor.
   *  Runs under `withSystem` like the relay worker, since it deliberately
   *  reads across every salon rather than one tenant's slice. */
  private async pollOnce(): Promise<void> {
    if (!this.cursor) return;
    const { occurredAt, id } = this.cursor;

    const rows = await this.database.withSystem(() =>
      this.database.db
        .select()
        .from(domainEvents)
        .where(
          or(
            gt(domainEvents.occurredAt, occurredAt),
            and(eq(domainEvents.occurredAt, occurredAt), gt(domainEvents.id, id)),
          ),
        )
        .orderBy(asc(domainEvents.occurredAt), asc(domainEvents.id))
        .limit(POLL_BATCH_SIZE),
    );

    if (rows.length === 0) return;

    for (const row of rows) {
      const topic = row.salonId ? `salon:${row.salonId}` : row.aggregateType;
      this.publish(topic, {
        id: row.id,
        type: row.type,
        aggregateType: row.aggregateType,
        aggregateId: row.aggregateId,
        payload: row.payload,
        occurredAt: row.occurredAt,
      });
    }

    const last = rows[rows.length - 1];
    this.cursor = { occurredAt: last.occurredAt, id: last.id };
  }
}
