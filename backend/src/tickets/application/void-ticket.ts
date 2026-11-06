import { Injectable } from '@nestjs/common';
import type { AuthUser } from '../../auth/auth-user.js';
import { AuditWriter } from '../../audit/audit-writer.js';
import { EventBus } from '../../events/event-bus.js';
import { DatabaseService } from '../../persistence/database.service.js';
import { ResolveCurrentSalon } from '../../rbac/application/resolve-current-salon.js';
import { TicketsRepo } from '../data/tickets.repo.js';
import type { VoidTicketDto } from '../dto/ticket.dto.js';
import { RequireTicket } from './require-ticket.js';

/**
 * A sensitive action: needs `pos:void` and a written reason, and is audited.
 * Only an open (unpaid) ticket can be voided; a paid one is reversed with a
 * refund instead, so money that was taken is always accounted for.
 */
@Injectable()
export class VoidTicket {
  constructor(
    private readonly database: DatabaseService,
    private readonly salon: ResolveCurrentSalon,
    private readonly requireTicket: RequireTicket,
    private readonly tickets: TicketsRepo,
    private readonly events: EventBus,
    private readonly audit: AuditWriter,
  ) {}

  async execute(user: AuthUser, ticketId: string, dto: VoidTicketDto) {
    const salonId = await this.salon.execute(user);
    return this.database.withTenant(user.id, salonId, async () => {
      const ticket = await this.requireTicket.execute(
        user,
        salonId,
        ticketId,
        'pos:void',
        { openOnly: true },
      );

      const voided = await this.tickets.update(salonId, ticketId, {
        status: 'voided',
        voidReason: dto.reason,
        voidedBy: user.id,
        voidedAt: new Date(),
      });

      await this.events.emit({
        aggregateType: 'ticket',
        aggregateId: ticketId,
        type: 'TicketVoided',
        salonId,
        payload: { ticketId, totalMinor: ticket.totalMinor },
      });
      await this.audit.write({
        salonId,
        actor: user,
        action: 'ticket.voided',
        targetType: 'ticket',
        targetId: ticketId,
        reason: dto.reason,
        before: { status: ticket.status, totalMinor: ticket.totalMinor },
        after: { status: 'voided' },
      });
      return voided ?? ticket;
    });
  }
}
