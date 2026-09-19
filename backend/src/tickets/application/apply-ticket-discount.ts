import { BadRequestException, Injectable } from '@nestjs/common';
import type { AuthUser } from '../../auth/auth-user.js';
import { AuditWriter } from '../../audit/audit-writer.js';
import { EventBus } from '../../events/event-bus.js';
import { DatabaseService } from '../../persistence/database.service.js';
import { ResolveCurrentSalon } from '../../rbac/application/resolve-current-salon.js';
import { TicketDiscountsRepo } from '../data/ticket-discounts.repo.js';
import type { ApplyDiscountDto } from '../dto/ticket.dto.js';
import { RecomputeTicket } from './recompute-ticket.js';
import { RequireTicket } from './require-ticket.js';

/**
 * A sensitive action: needs `pos:discount` (a Front Desk role does not have it
 * by default), a written reason, and leaves an audit entry naming who approved
 * it. One discount per ticket — applying again replaces it.
 */
@Injectable()
export class ApplyTicketDiscount {
  constructor(
    private readonly database: DatabaseService,
    private readonly salon: ResolveCurrentSalon,
    private readonly requireTicket: RequireTicket,
    private readonly discounts: TicketDiscountsRepo,
    private readonly recompute: RecomputeTicket,
    private readonly events: EventBus,
    private readonly audit: AuditWriter,
  ) {}

  async execute(user: AuthUser, ticketId: string, dto: ApplyDiscountDto) {
    if (dto.type === 'percent' && dto.value > 10000) {
      throw new BadRequestException('A percent discount cannot exceed 100%.');
    }

    const salonId = await this.salon.execute(user);
    return this.database.withTenant(user.id, salonId, async () => {
      const ticket = await this.requireTicket.execute(
        user,
        salonId,
        ticketId,
        'pos:discount',
        { openOnly: true },
      );

      const discount = await this.discounts.replace({
        salonId,
        ticketId,
        type: dto.type,
        value: dto.value,
        reason: dto.reason,
        approvedBy: user.id,
      });
      const updated = await this.recompute.execute(salonId, ticket);

      await this.events.emit({
        aggregateType: 'ticket',
        aggregateId: ticketId,
        type: 'DiscountApplied',
        salonId,
        payload: { ticketId, discountMinor: updated.discountMinor },
      });
      await this.audit.write({
        salonId,
        actor: user,
        action: 'ticket.discount_applied',
        targetType: 'ticket',
        targetId: ticketId,
        reason: dto.reason,
        before: { discountMinor: ticket.discountMinor },
        after: {
          type: dto.type,
          value: dto.value,
          discountMinor: updated.discountMinor,
        },
      });
      return { ticket: updated, discount };
    });
  }
}
