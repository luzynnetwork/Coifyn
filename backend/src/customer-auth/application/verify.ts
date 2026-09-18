import { createHash } from 'node:crypto';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { EventBus } from '../../events/event-bus.js';
import { DatabaseService } from '../../persistence/database.service.js';
import { CustomersRepo } from '../data/customers.repo.js';
import { CustomerVerificationsRepo } from '../data/customer-verifications.repo.js';
import { VerifyCustomerDto } from '../dto/customer-auth.dto.js';
import {
  CustomerAuthTokens,
  CustomerSessionContext,
  IssueCustomerSession,
} from './issue-customer-session.js';

/**
 * Consumes the registration OTP and issues the customer's first session — a
 * customer cannot log in until verified (login.ts checks `verifiedAt`).
 */
@Injectable()
export class VerifyCustomer {
  constructor(
    private readonly database: DatabaseService,
    private readonly customers: CustomersRepo,
    private readonly verifications: CustomerVerificationsRepo,
    private readonly issueSession: IssueCustomerSession,
    private readonly events: EventBus,
  ) {}

  async execute(
    dto: VerifyCustomerDto,
    ctx: CustomerSessionContext,
  ): Promise<CustomerAuthTokens> {
    return this.database.withAnon(async () => {
      const customer =
        await this.customers.findByEmailOrPhone(dto.identifier);
      if (!customer) throw new UnauthorizedException('Invalid or expired code.');

      const verification = await this.verifications.findValid(
        customer.id,
        'verify_account',
        hashVerificationCode(dto.code),
      );
      if (!verification) {
        throw new UnauthorizedException('Invalid or expired code.');
      }

      await this.verifications.invalidateAllFor(customer.id, 'verify_account');
      await this.customers.markVerified(customer.id);

      await this.events.emit({
        aggregateType: 'customer',
        aggregateId: customer.id,
        type: 'CustomerVerified',
        payload: { customerId: customer.id },
      });

      return this.issueSession.forNewSession(customer, ctx);
    });
  }
}

export function hashVerificationCode(code: string): string {
  return createHash('sha256').update(code).digest('hex');
}
