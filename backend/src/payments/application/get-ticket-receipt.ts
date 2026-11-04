import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { AuthUser } from '../../auth/auth-user.js';
import { AuditWriter } from '../../audit/audit-writer.js';
import { EventBus } from '../../events/event-bus.js';
import { DatabaseService } from '../../persistence/database.service.js';
import { Authorize } from '../../rbac/application/authorize.js';
import { ResolveCurrentSalon } from '../../rbac/application/resolve-current-salon.js';
import { BranchesRepo } from '../../tenancy/data/branches.repo.js';
import { SalonsRepo } from '../../tenancy/data/salons.repo.js';
import { TicketDiscountsRepo } from '../../tickets/data/ticket-discounts.repo.js';
import { TicketLinesRepo } from '../../tickets/data/ticket-lines.repo.js';
import { TicketsRepo } from '../../tickets/data/tickets.repo.js';
import { PaymentsRepo } from '../data/payments.repo.js';
import { ReceiptsRepo } from '../data/receipts.repo.js';

/** The receipt for a paid ticket. Issued (numbered) the first time it is asked
 *  for; every later call returns the same one. */
@Injectable()
export class GetTicketReceipt {
  constructor(
    private readonly database: DatabaseService,
    private readonly salon: ResolveCurrentSalon,
    private readonly authorize: Authorize,
    private readonly salons: SalonsRepo,
    private readonly branches: BranchesRepo,
    private readonly tickets: TicketsRepo,
    private readonly lines: TicketLinesRepo,
    private readonly discounts: TicketDiscountsRepo,
    private readonly payments: PaymentsRepo,
    private readonly receipts: ReceiptsRepo,
    private readonly events: EventBus,
    private readonly audit: AuditWriter,
  ) {}

  async execute(user: AuthUser, ticketId: string) {
    const salonId = await this.salon.execute(user);
    return this.database.withTenant(user.id, salonId, async () => {
      const ticket = await this.tickets.findById(salonId, ticketId);
      if (!ticket) throw new NotFoundException('Ticket not found.');

      await this.authorize.check(user, 'payment:take', {
        salonId,
        branchId: ticket.branchId,
      });
      if (ticket.status !== 'paid') {
        throw new ConflictException('A receipt exists only for a paid ticket.');
      }

      let receipt = await this.receipts.findForTicket(salonId, ticketId);
      if (!receipt) {
        receipt = await this.receipts.issue(salonId, ticketId);
        await this.events.emit({
          aggregateType: 'ticket',
          aggregateId: ticketId,
          type: 'ReceiptGenerated',
          salonId,
          payload: { ticketId, number: receipt.number },
        });
        await this.audit.write({
          salonId,
          actor: user,
          action: 'receipt.issued',
          targetType: 'ticket',
          targetId: ticketId,
          after: { number: receipt.number },
        });
      }

      const [salon, branch, lines, discount, payments] = await Promise.all([
        this.salons.findById(salonId),
        this.branches.findById(salonId, ticket.branchId),
        this.lines.listForTicket(salonId, ticketId),
        this.discounts.findForTicket(salonId, ticketId),
        this.payments.list(salonId, { ticketId }),
      ]);

      return {
        receipt,
        salon: {
          brandName: salon?.brandName,
          currency: salon?.currency,
          timezone: salon?.timezone,
        },
        branch: { name: branch?.name },
        ticket,
        lines,
        discount: discount ?? null,
        payments: payments.filter((p) => p.status === 'completed'),
      };
    });
  }
}
