import { Injectable } from '@nestjs/common';
import type { AuthUser } from '../../auth/auth-user.js';
import { DatabaseService } from '../../persistence/database.service.js';
import { ResolveCurrentSalon } from '../../rbac/application/resolve-current-salon.js';
import { TicketDiscountsRepo } from '../data/ticket-discounts.repo.js';
import { TicketLinesRepo } from '../data/ticket-lines.repo.js';
import { RequireTicket } from './require-ticket.js';

/** A ticket with its lines and discount. */
@Injectable()
export class GetTicket {
  constructor(
    private readonly database: DatabaseService,
    private readonly salon: ResolveCurrentSalon,
    private readonly requireTicket: RequireTicket,
    private readonly lines: TicketLinesRepo,
    private readonly discounts: TicketDiscountsRepo,
  ) {}

  async execute(user: AuthUser, id: string) {
    const salonId = await this.salon.execute(user);
    return this.database.withTenant(user.id, salonId, async () => {
      const ticket = await this.requireTicket.execute(
        user,
        salonId,
        id,
        'pos:operate',
        { openOnly: false },
      );
      const [lines, discount] = await Promise.all([
        this.lines.listForTicket(salonId, id),
        this.discounts.findForTicket(salonId, id),
      ]);
      return { ...ticket, lines, discount: discount ?? null };
    });
  }
}
