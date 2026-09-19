import { Injectable, NotFoundException } from '@nestjs/common';
import type { AuthUser } from '../../auth/auth-user.js';
import { AuditWriter } from '../../audit/audit-writer.js';
import { DatabaseService } from '../../persistence/database.service.js';
import { ResolveCurrentSalon } from '../../rbac/application/resolve-current-salon.js';
import { TicketLinesRepo } from '../data/ticket-lines.repo.js';
import type { UpdateTicketLineDto } from '../dto/ticket.dto.js';
import { RecomputeTicket } from './recompute-ticket.js';
import { RequireTicket } from './require-ticket.js';

/** Changes a line's quantity. The unit price stays as captured when the line
 *  was added, so a later menu price change never rewrites an open ticket. */
@Injectable()
export class UpdateTicketLine {
  constructor(
    private readonly database: DatabaseService,
    private readonly salon: ResolveCurrentSalon,
    private readonly requireTicket: RequireTicket,
    private readonly lines: TicketLinesRepo,
    private readonly recompute: RecomputeTicket,
    private readonly audit: AuditWriter,
  ) {}

  async execute(
    user: AuthUser,
    ticketId: string,
    lineId: string,
    dto: UpdateTicketLineDto,
  ) {
    const salonId = await this.salon.execute(user);
    return this.database.withTenant(user.id, salonId, async () => {
      const ticket = await this.requireTicket.execute(
        user,
        salonId,
        ticketId,
        'pos:operate',
        { openOnly: true },
      );
      const line = await this.lines.findById(salonId, ticketId, lineId);
      if (!line) throw new NotFoundException('Line not found.');

      const updated = await this.lines.updateQty(
        salonId,
        lineId,
        dto.qty,
        line.unitPriceMinor,
      );
      const totals = await this.recompute.execute(salonId, ticket);

      await this.audit.write({
        salonId,
        actor: user,
        action: 'ticket.line_updated',
        targetType: 'ticket',
        targetId: ticketId,
        before: { qty: line.qty },
        after: { qty: dto.qty },
      });
      return { ticket: totals, line: updated ?? line };
    });
  }
}
