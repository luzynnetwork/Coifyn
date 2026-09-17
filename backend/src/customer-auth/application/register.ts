import { randomInt } from 'node:crypto';
import { ConflictException, Injectable, Logger } from '@nestjs/common';
import { EventBus } from '../../events/event-bus.js';
import { DatabaseService } from '../../persistence/database.service.js';
import { CustomersRepo } from '../data/customers.repo.js';
import { CustomerVerificationsRepo } from '../data/customer-verifications.repo.js';
import { PasswordService } from '../../auth/lib/password.js';
import { RegisterCustomerDto } from '../dto/customer-auth.dto.js';
import { hashVerificationCode } from './verify.js';

/** Minutes an OTP code stays valid. */
const CODE_TTL_MS = 15 * 60 * 1000;

/**
 * Creates an unverified customer and issues a 6-digit OTP for account
 * verification (delivery lands with the notifications phase — logged for now,
 * mirroring auth/application/request-password-reset.ts). No session is issued
 * until the customer verifies (see application/verify.ts).
 */
@Injectable()
export class RegisterCustomer {
  private readonly logger = new Logger(RegisterCustomer.name);

  constructor(
    private readonly database: DatabaseService,
    private readonly customers: CustomersRepo,
    private readonly verifications: CustomerVerificationsRepo,
    private readonly passwords: PasswordService,
    private readonly events: EventBus,
  ) {}

  async execute(dto: RegisterCustomerDto): Promise<{ customerId: string }> {
    return this.database.withAnon(async () => {
      const email = dto.email ?? null;
      const phone = dto.phone ?? null;

      const existing = email
        ? await this.customers.findByEmail(email)
        : await this.customers.findByPhone(phone!);
      if (existing) {
        throw new ConflictException(
          'An account with that email or phone already exists.',
        );
      }

      const passwordHash = await this.passwords.hash(dto.password);
      const customer = await this.customers.create({
        email,
        phone,
        passwordHash,
        displayName: dto.displayName,
      });

      const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
      await this.verifications.create({
        customerId: customer.id,
        purpose: 'verify_account',
        codeHash: hashVerificationCode(code),
        expiresAt: new Date(Date.now() + CODE_TTL_MS),
      });

      await this.events.emit({
        aggregateType: 'customer',
        aggregateId: customer.id,
        type: 'CustomerRegistered',
        payload: { customerId: customer.id },
      });

      // TODO(notifications phase): send this by email/SMS instead of logging.
      this.logger.debug(
        `verification code for customer ${customer.id}: ${code}`,
      );

      return { customerId: customer.id };
    });
  }
}
