import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { AuthUser } from '../../auth/auth-user.js';
import { AuditWriter } from '../../audit/audit-writer.js';
import { DatabaseService } from '../../persistence/database.service.js';
import { Authorize } from '../../rbac/application/authorize.js';
import { ResolveCurrentSalon } from '../../rbac/application/resolve-current-salon.js';
import { CustomersRepo } from '../data/customers.repo.js';
import type { UpdateCustomerDto } from '../dto/customer.dto.js';

@Injectable()
export class UpdateCustomer {
  constructor(
    private readonly database: DatabaseService,
    private readonly salon: ResolveCurrentSalon,
    private readonly authorize: Authorize,
    private readonly customers: CustomersRepo,
    private readonly audit: AuditWriter,
  ) {}

  async execute(user: AuthUser, id: string, dto: UpdateCustomerDto) {
    const salonId = await this.salon.execute(user);
    return this.database.withTenant(user.id, salonId, async () => {
      await this.authorize.check(user, 'customer:manage', { salonId });

      const before = await this.customers.findById(salonId, id);
      if (!before) throw new NotFoundException('Customer not found.');

      if (dto.phone && dto.phone !== before.phone) {
        if (await this.customers.findByPhone(salonId, dto.phone)) {
          throw new ConflictException(
            'A customer with this phone already exists.',
          );
        }
      }

      const patch = {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.phone !== undefined && { phone: dto.phone }),
        ...(dto.email !== undefined && { email: dto.email }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
      };
      const updated = await this.customers.update(salonId, id, patch);

      await this.audit.write({
        salonId,
        actor: user,
        action: 'customer.updated',
        targetType: 'customer',
        targetId: id,
        before: { name: before.name, phone: before.phone },
        after: patch,
      });
      return updated ?? before;
    });
  }
}
