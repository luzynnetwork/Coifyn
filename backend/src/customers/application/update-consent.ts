import { BadRequestException, Injectable } from '@nestjs/common';
import type { AuthUser } from '../../auth/auth-user.js';
import { AuditWriter } from '../../audit/audit-writer.js';
import { EventBus } from '../../events/event-bus.js';
import { Authorize } from '../../rbac/application/authorize.js';
import { TenantScope } from '../../rbac/application/tenant-scope.js';
import { CommunicationConsentsRepo } from '../data/communication-consents.repo.js';
import { CustomersRepo } from '../data/customers.repo.js';
import type { UpdateConsentDto } from '../dto/customer-crm.dto.js';
import { requireCustomer } from './require-customer.js';

/** Records a customer's grant/revoke for one channel + purpose. Transactional
 *  notices are always sent, so only marketing consent is meaningful to change. */
@Injectable()
export class UpdateConsent {
  constructor(
    private readonly scope: TenantScope,
    private readonly authorize: Authorize,
    private readonly customers: CustomersRepo,
    private readonly consents: CommunicationConsentsRepo,
    private readonly events: EventBus,
    private readonly audit: AuditWriter,
  ) {}

  execute(user: AuthUser, customerId: string, dto: UpdateConsentDto) {
    return this.scope.run(user, async (salonId) => {
      await this.authorize.check(user, 'customer:manage', { salonId });
      await requireCustomer(this.customers, salonId, customerId);
      if (dto.purpose === 'transactional' && dto.status === 'revoked') {
        throw new BadRequestException(
          'Transactional notices cannot be switched off.',
        );
      }

      const row = await this.consents.set(
        salonId,
        customerId,
        dto.channel,
        dto.purpose,
        dto.status,
      );
      await this.events.emit({
        aggregateType: 'customer',
        aggregateId: customerId,
        type: 'CustomerConsentChanged',
        salonId,
        payload: { customerId, channel: dto.channel },
      });
      await this.audit.write({
        salonId,
        actor: user,
        action: 'customer.consent_changed',
        targetType: 'customer',
        targetId: customerId,
        after: dto,
      });
      return row;
    });
  }
}
