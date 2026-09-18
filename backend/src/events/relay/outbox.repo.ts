import { Injectable } from '@nestjs/common';
import { asc, inArray, isNull } from 'drizzle-orm';
import { DatabaseService } from '../../persistence/database.service.js';
import { domainEvents } from '../../persistence/schema/index.js';
import type { PublishableEvent } from '../publisher/event-publisher.js';

@Injectable()
export class OutboxRepo {
  constructor(private readonly database: DatabaseService) {}

  /** Oldest unpublished events first. Runs under the system scope (cross-salon).
   *  `FOR UPDATE SKIP LOCKED` keeps two relay instances from grabbing the same
   *  rows. */
  async fetchUnpublished(limit: number): Promise<PublishableEvent[]> {
    const rows = await this.database.db
      .select()
      .from(domainEvents)
      .where(isNull(domainEvents.publishedAt))
      .orderBy(asc(domainEvents.occurredAt), asc(domainEvents.id))
      .limit(limit)
      .for('update', { skipLocked: true });

    return rows.map((r) => ({
      id: r.id,
      aggregateType: r.aggregateType,
      aggregateId: r.aggregateId,
      type: r.type,
      payload: r.payload,
      salonId: r.salonId,
      correlationId: r.correlationId,
      occurredAt: r.occurredAt,
    }));
  }

  async markPublished(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    await this.database.db
      .update(domainEvents)
      .set({ publishedAt: new Date() })
      .where(inArray(domainEvents.id, ids));
  }

  async countUnpublished(): Promise<number> {
    const rows = await this.database.db
      .select({ id: domainEvents.id })
      .from(domainEvents)
      .where(isNull(domainEvents.publishedAt));
    return rows.length;
  }
}
