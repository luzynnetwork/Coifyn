import { Injectable } from '@nestjs/common';
import { and, count, desc, eq, gte, lte, type SQL } from 'drizzle-orm';
import { DatabaseService } from '../../persistence/database.service.js';
import { auditEvents } from '../../persistence/schema/index.js';

export type AuditEventRow = typeof auditEvents.$inferSelect;

export interface AuditFilter {
  salonId: string;
  targetType?: string;
  targetId?: string;
  actorId?: string;
  action?: string;
  from?: Date;
  to?: Date;
}

@Injectable()
export class AuditRepo {
  constructor(private readonly database: DatabaseService) {}

  private where(filter: AuditFilter): SQL | undefined {
    const clauses: SQL[] = [eq(auditEvents.salonId, filter.salonId)];
    if (filter.targetType)
      clauses.push(eq(auditEvents.targetType, filter.targetType));
    if (filter.targetId) clauses.push(eq(auditEvents.targetId, filter.targetId));
    if (filter.actorId) clauses.push(eq(auditEvents.actorId, filter.actorId));
    if (filter.action) clauses.push(eq(auditEvents.action, filter.action));
    if (filter.from) clauses.push(gte(auditEvents.createdAt, filter.from));
    if (filter.to) clauses.push(lte(auditEvents.createdAt, filter.to));
    return and(...clauses);
  }

  list(
    filter: AuditFilter,
    limit: number,
    offset: number,
  ): Promise<AuditEventRow[]> {
    return this.database.db
      .select()
      .from(auditEvents)
      .where(this.where(filter))
      .orderBy(desc(auditEvents.createdAt), desc(auditEvents.id))
      .limit(limit)
      .offset(offset);
  }

  async count(filter: AuditFilter): Promise<number> {
    const [row] = await this.database.db
      .select({ n: count() })
      .from(auditEvents)
      .where(this.where(filter));
    return row?.n ?? 0;
  }
}
