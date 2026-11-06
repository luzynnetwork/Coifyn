import { Injectable } from '@nestjs/common';
import { computeTotals } from '../domain/compute-totals.js';
import { TicketDiscountsRepo } from '../data/ticket-discounts.repo.js';
import { TicketLinesRepo } from '../data/ticket-lines.repo.js';
import { TicketsRepo, type TicketRow } from '../data/tickets.repo.js';

/** Recomputes a ticket's stored totals from its current lines, discount and the
 *  tax rate snapshotted on the ticket. Call after any line or discount change. */
@Injectable()
export class RecomputeTicket {
  constructor(
    private readonly tickets: TicketsRepo,
    private readonly lines: TicketLinesRepo,
    private readonly discounts: TicketDiscountsRepo,
  ) {}

  async execute(salonId: string, ticket: TicketRow): Promise<TicketRow> {
    const [lines, discount] = await Promise.all([
      this.lines.listForTicket(salonId, ticket.id),
      this.discounts.findForTicket(salonId, ticket.id),
    ]);

    const totals = computeTotals(
      lines.map((l) => l.lineTotalMinor),
      discount
        ? { type: discount.type as 'percent' | 'amount', value: discount.value }
        : null,
      { basisPoints: ticket.taxBasisPoints, inclusive: ticket.taxInclusive },
    );

    return (await this.tickets.update(salonId, ticket.id, totals)) ?? ticket;
  }
}
