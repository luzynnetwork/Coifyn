import { randomInt } from 'node:crypto';
import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../../persistence/database.service.js';
import { CustomersRepo } from '../data/customers.repo.js';
import { CustomerVerificationsRepo } from '../data/customer-verifications.repo.js';
import { ForgotCustomerPasswordDto } from '../dto/customer-auth.dto.js';
import { hashVerificationCode } from './verify.js';

/** Minutes a reset code stays valid. */
const CODE_TTL_MS = 15 * 60 * 1000;

/**
 * Issues a single-use 6-digit reset code (mirrors
 * auth/application/request-password-reset.ts). Delivery is deferred to the
 * notifications phase — logged in non-production so the flow is testable. The
 * response is always a generic success so it never reveals whether an account
 * exists.
 */
@Injectable()
export class RequestCustomerPasswordReset {
  private readonly logger = new Logger(RequestCustomerPasswordReset.name);

  constructor(
    private readonly database: DatabaseService,
    private readonly customers: CustomersRepo,
    private readonly verifications: CustomerVerificationsRepo,
  ) {}

  async execute(dto: ForgotCustomerPasswordDto): Promise<void> {
    await this.database.withAnon(async () => {
      const customer = await this.customers.findByEmailOrPhone(dto.identifier);
      if (!customer || customer.status !== 'active') return;

      await this.verifications.invalidateAllFor(customer.id, 'password_reset');
      const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
      await this.verifications.create({
        customerId: customer.id,
        purpose: 'password_reset',
        codeHash: hashVerificationCode(code),
        expiresAt: new Date(Date.now() + CODE_TTL_MS),
      });

      // TODO(notifications phase): send this by email/SMS instead of logging.
      this.logger.debug(
        `password reset code for customer ${customer.id}: ${code}`,
      );
    });
  }
}
