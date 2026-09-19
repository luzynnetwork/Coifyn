import { ConflictException, Injectable } from '@nestjs/common';
import type { AuthUser } from '../../auth/auth-user.js';
import { AuditWriter } from '../../audit/audit-writer.js';
import { EventBus } from '../../events/event-bus.js';
import { DatabaseService } from '../../persistence/database.service.js';
import { Authorize } from '../../rbac/application/authorize.js';
import { ResolveCurrentSalon } from '../../rbac/application/resolve-current-salon.js';
import { CustomersRepo } from '../data/customers.repo.js';
import type { CreateCustomerDto } from '../dto/customer.dto.js';

@Injectable()
export class CreateCustomer {
  constructor(
    private readonly database: DatabaseService,
    private readonly salon: ResolveCurrentSalon,
    private readonly authorize: Authorize,
    private readonly customers: CustomersRepo,
    private readonly events: EventBus,
    private readonly audit: AuditWriter,
  ) {}

  async execute(user: AuthUser, dto: CreateCustomerDto) {
    const salonId = await this.salon.execute(user);
    return this.database.withTenant(user.id, salonId, async () => {
      await this.authorize.check(user, 'customer:manage', { salonId });

      if (await this.customers.findByPhone(salonId, dto.phone)) {
        throw new ConflictException('A customer with this phone already exists.');
      }

      const customer = await this.customers.create({ salonId, ...dto });

      await this.events.emit({
        aggregateType: 'customer',
        aggregateId: customer.id,
        type: 'CustomerCreated',
        salonId,
        payload: { name: customer.name },
      });
      await this.audit.write({
        salonId,
        actor: user,
        action: 'customer.created',
        targetType: 'customer',
        targetId: customer.id,
        after: { name: customer.name },
      });
      return customer;
    });
  }
}
