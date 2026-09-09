import { Injectable } from '@nestjs/common';
import { uuidv7 } from 'uuidv7';
import type { AuthUser } from '../auth/auth-user.js';
import { DatabaseService } from '../persistence/database.service.js';
import { auditEvents } from '../persistence/schema/index.js';

export interface AuditInput {
  salonId: string | null;
  actor: AuthUser | { system: true } | { customerId: string };
  action: string;
  targetType?: string;
  targetId?: string;
  reason?: string;
  before?: unknown;
  after?: unknown;
  correlationId?: string;
  ip?: string;
}

/**
 * Writes an immutable audit row. Called by use cases for sensitive actions and
 * (later) by the AuditInterceptor for flagged routes. Runs on whatever scope the
 * caller already holds, so the write commits in the same transaction as the
 * state change it records.
 */
@Injectable()
export class AuditWriter {
  constructor(private readonly database: DatabaseService) {}

  async write(input: AuditInput): Promise<void> {
    const actor = resolveActor(input.actor);
    await this.database.db.insert(auditEvents).values({
      id: uuidv7(),
      salonId: input.salonId,
      actorType: actor.type,
      actorId: actor.id,
      action: input.action,
      targetType: input.targetType ?? null,
      targetId: input.targetId ?? null,
      reason: input.reason ?? null,
      before: input.before ?? null,
      after: input.after ?? null,
      correlationId: input.correlationId ?? null,
      ip: input.ip ?? null,
    });
  }
}

function resolveActor(
  actor: AuditInput['actor'],
): { type: string; id: string | null } {
  if ('system' in actor) return { type: 'system', id: null };
  if ('customerId' in actor) return { type: 'customer', id: actor.customerId };
  return { type: 'staff', id: actor.id };
}
