import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { AuthUser } from '../../auth/auth-user.js';
import { AuditWriter } from '../../audit/audit-writer.js';
import { CustomersRepo } from '../../customers/data/customers.repo.js';
import { EventBus } from '../../events/event-bus.js';
import { DatabaseService } from '../../persistence/database.service.js';
import { Authorize } from '../../rbac/application/authorize.js';
import { ResolveCurrentSalon } from '../../rbac/application/resolve-current-salon.js';
import { RealtimeBus } from '../../realtime/realtime-bus.js';
import { ServicesRepo } from '../../services/data/services.repo.js';
import { StylistProfilesRepo } from '../../stylists/data/stylist-profiles.repo.js';
import { BranchesRepo } from '../../tenancy/data/branches.repo.js';
import { QueueEntriesRepo } from '../data/queue-entries.repo.js';
import type { JoinQueueDto } from '../dto/queue.dto.js';

@Injectable()
export class JoinQueue {
  constructor(
    private readonly database: DatabaseService,
    private readonly salon: ResolveCurrentSalon,
    private readonly authorize: Authorize,
    private readonly branches: BranchesRepo,
    private readonly customers: CustomersRepo,
    private readonly stylists: StylistProfilesRepo,
    private readonly services: ServicesRepo,
    private readonly entries: QueueEntriesRepo,
    private readonly events: EventBus,
    private readonly audit: AuditWriter,
    private readonly realtime: RealtimeBus,
  ) {}

  async execute(user: AuthUser, dto: JoinQueueDto) {
    if (!dto.customerId && !dto.walkInName) {
      throw new BadRequestException('Provide a customerId or a walkInName.');
    }

    const salonId = await this.salon.execute(user);
    const entry = await this.database.withTenant(user.id, salonId, async () => {
      if (!(await this.branches.findById(salonId, dto.branchId))) {
        throw new NotFoundException('Branch not found.');
      }
      await this.authorize.check(user, 'queue:manage', {
        salonId,
        branchId: dto.branchId,
      });

      if (
        dto.customerId &&
        !(await this.customers.findById(salonId, dto.customerId))
      ) {
        throw new BadRequestException('Unknown customer.');
      }
      if (
        dto.requestedStylistId &&
        !(await this.stylists.findById(salonId, dto.requestedStylistId))
      ) {
        throw new BadRequestException('Unknown stylist.');
      }
      for (const serviceId of dto.requestedServiceIds) {
        if (!(await this.services.findById(salonId, serviceId))) {
          throw new BadRequestException(`Unknown service ${serviceId}.`);
        }
      }

      const created = await this.entries.create({
        salonId,
        branchId: dto.branchId,
        customerId: dto.customerId ?? null,
        walkInName: dto.walkInName ?? null,
        requestedStylistId: dto.requestedStylistId ?? null,
        requestedServiceIds: dto.requestedServiceIds,
      });

      await this.events.emit({
        aggregateType: 'queue_entry',
        aggregateId: created.id,
        type: 'QueueJoined',
        salonId,
        payload: { entryId: created.id, branchId: dto.branchId },
      });
      await this.audit.write({
        salonId,
        actor: user,
        action: 'queue.joined',
        targetType: 'queue_entry',
        targetId: created.id,
        after: { branchId: dto.branchId },
      });
      return created;
    });

    this.realtime.publish(`queue:${entry.branchId}`, {
      entryId: entry.id,
      status: entry.status,
    });
    return entry;
  }
}
