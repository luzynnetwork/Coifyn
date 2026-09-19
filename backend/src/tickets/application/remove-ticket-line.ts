import { Injectable, NotFoundException } from '@nestjs/common';
import type { AuthUser } from '../../auth/auth-user.js';
import { AuditWriter } from '../../audit/audit-writer.js';
import { DatabaseService } from '../../persistence/database.service.js';
import { ResolveCurrentSalon } from '../../rbac/application/resolve-current-salon.js';
import { TicketLinesRepo } from '../data/ticket-lines.repo.js';
import { RecomputeTicket } from './recompute-ticket.js';
import { RequireTicket } from './require-ticket.js';

@Injectable()
export class RemoveTicketLine {
  constructor(
    private readonly database: DatabaseService,
    private readonly salon: ResolveCurrentSalon,
    private readonly requireTicket: RequireTicket,
    private readonly lines: TicketLinesRepo,
    private readonly recompute: RecomputeTicket,
    private readonly audit: AuditWriter,
  ) {}

  async execute(user: AuthUser, ticketId: string, lineId: string) {
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

      await this.lines.softDelete(salonId, lineId);
      const totals = await this.recompute.execute(salonId, ticket);

      await this.audit.write({
        salonId,
        actor: user,
        action: 'ticket.line_removed',
        targetType: 'ticket',
        targetId: ticketId,
        before: { description: line.description, lineTotalMinor: line.lineTotalMinor },
      });
      return totals;
    });
  }
}
