import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { AuthUser } from '../../auth/auth-user.js';
import { AppointmentsRepo } from '../../appointments/data/appointments.repo.js';
import { AuditWriter } from '../../audit/audit-writer.js';
import { CustomersRepo } from '../../customers/data/customers.repo.js';
import { EventBus } from '../../events/event-bus.js';
import { DatabaseService } from '../../persistence/database.service.js';
import { QueueEntriesRepo } from '../../queue/data/queue-entries.repo.js';
import { Authorize } from '../../rbac/application/authorize.js';
import { ResolveCurrentSalon } from '../../rbac/application/resolve-current-salon.js';
import { TaxRatesRepo } from '../../salon-setup/data/tax-rates.repo.js';
import { BranchesRepo } from '../../tenancy/data/branches.repo.js';
import { RegisterSessionsRepo } from '../data/register-sessions.repo.js';
import { TicketsRepo } from '../data/tickets.repo.js';
import type { CreateTicketDto } from '../dto/ticket.dto.js';

@Injectable()
export class CreateTicket {
  constructor(
    private readonly database: DatabaseService,
    private readonly salon: ResolveCurrentSalon,
    private readonly authorize: Authorize,
    private readonly branches: BranchesRepo,
    private readonly customers: CustomersRepo,
    private readonly queue: QueueEntriesRepo,
    private readonly appointments: AppointmentsRepo,
    private readonly taxRates: TaxRatesRepo,
    private readonly sessions: RegisterSessionsRepo,
    private readonly tickets: TicketsRepo,
    private readonly events: EventBus,
    private readonly audit: AuditWriter,
  ) {}

  async execute(user: AuthUser, dto: CreateTicketDto) {
    if (dto.source !== 'walk_in' && !dto.sourceId) {
      throw new BadRequestException(`A ${dto.source} ticket needs a sourceId.`);
    }

    const salonId = await this.salon.execute(user);
    return this.database.withTenant(user.id, salonId, async () => {
      if (!(await this.branches.findById(salonId, dto.branchId))) {
        throw new NotFoundException('Branch not found.');
      }
      await this.authorize.check(user, 'pos:operate', {
        salonId,
        branchId: dto.branchId,
      });

      let customerId = dto.customerId ?? null;
      if (dto.source === 'queue' && dto.sourceId) {
        const entry = await this.queue.findById(salonId, dto.sourceId);
        if (!entry || entry.branchId !== dto.branchId) {
          throw new BadRequestException('Unknown queue entry for this branch.');
        }
        customerId ??= entry.customerId;
      }
      if (dto.source === 'appointment' && dto.sourceId) {
        const appt = await this.appointments.findById(salonId, dto.sourceId);
        if (!appt || appt.branchId !== dto.branchId) {
          throw new BadRequestException('Unknown appointment for this branch.');
        }
        customerId ??= appt.customerId;
      }
      if (customerId && !(await this.customers.findById(salonId, customerId))) {
        throw new BadRequestException('Unknown customer.');
      }

      const rates = await this.taxRates.listForSalon(salonId);
      const rate = rates.find((r) => r.isDefault && r.isActive);
      const session = await this.sessions.findOpen(salonId, dto.branchId);

      const ticket = await this.tickets.create({
        salonId,
        branchId: dto.branchId,
        registerSessionId: session?.id ?? null,
        source: dto.source,
        sourceId: dto.sourceId ?? null,
        customerId,
        taxBasisPoints: rate?.percentBasisPoints ?? 0,
        taxInclusive: rate?.inclusive ?? false,
      });

      await this.events.emit({
        aggregateType: 'ticket',
        aggregateId: ticket.id,
        type: 'TicketOpened',
        salonId,
        payload: { ticketId: ticket.id, branchId: ticket.branchId },
      });
      await this.audit.write({
        salonId,
        actor: user,
        action: 'ticket.opened',
        targetType: 'ticket',
        targetId: ticket.id,
        after: { source: dto.source, sourceId: dto.sourceId ?? null },
      });
      return ticket;
    });
  }
}
