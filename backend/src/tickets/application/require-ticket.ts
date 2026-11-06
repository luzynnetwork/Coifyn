import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { AuthUser } from '../../auth/auth-user.js';
import { Authorize } from '../../rbac/application/authorize.js';
import { TicketsRepo, type TicketRow } from '../data/tickets.repo.js';

/**
 * Loads a ticket in the caller's salon and checks a branch-scoped permission
 * on it. Must run inside a withTenant() transaction. `openOnly` rejects tickets
 * that are already paid or voided (their lines and totals are frozen).
 */
@Injectable()
export class RequireTicket {
  constructor(
    private readonly tickets: TicketsRepo,
    private readonly authorize: Authorize,
  ) {}

  async execute(
    user: AuthUser,
    salonId: string,
    ticketId: string,
    permission: 'pos:operate' | 'pos:discount' | 'pos:void',
    opts: { openOnly: boolean },
  ): Promise<TicketRow> {
    const ticket = await this.tickets.findById(salonId, ticketId);
    if (!ticket) throw new NotFoundException('Ticket not found.');

    await this.authorize.check(user, permission, {
      salonId,
      branchId: ticket.branchId,
    });

    if (opts.openOnly && ticket.status !== 'open') {
      throw new ConflictException(`A ${ticket.status} ticket cannot be changed.`);
    }
    return ticket;
  }
}
