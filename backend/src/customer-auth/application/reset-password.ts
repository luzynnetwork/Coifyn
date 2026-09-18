import { Injectable, UnauthorizedException } from '@nestjs/common';
import { DatabaseService } from '../../persistence/database.service.js';
import { CustomerSessionsRepo } from '../data/customer-sessions.repo.js';
import { CustomerVerificationsRepo } from '../data/customer-verifications.repo.js';
import { CustomersRepo } from '../data/customers.repo.js';
import { PasswordService } from '../../auth/lib/password.js';
import { ResetCustomerPasswordDto } from '../dto/customer-auth.dto.js';
import { hashVerificationCode } from './verify.js';

/**
 * Verifies the code, sets the new password, consumes every outstanding reset
 * for the customer, and revokes all their sessions so a stolen code cannot
 * leave a live session behind (mirrors auth/application/reset-password.ts).
 */
@Injectable()
export class ResetCustomerPassword {
  constructor(
    private readonly database: DatabaseService,
    private readonly customers: CustomersRepo,
    private readonly verifications: CustomerVerificationsRepo,
    private readonly sessions: CustomerSessionsRepo,
    private readonly passwords: PasswordService,
  ) {}

  async execute(dto: ResetCustomerPasswordDto): Promise<void> {
    await this.database.withAnon(async () => {
      const customer = await this.customers.findByEmailOrPhone(dto.identifier);
      if (!customer) throw new UnauthorizedException('Invalid or expired code.');

      const verification = await this.verifications.findValid(
        customer.id,
        'password_reset',
        hashVerificationCode(dto.code),
      );
      if (!verification) {
        throw new UnauthorizedException('Invalid or expired code.');
      }

      await this.customers.updatePasswordHash(
        customer.id,
        await this.passwords.hash(dto.newPassword),
      );
      await this.verifications.invalidateAllFor(customer.id, 'password_reset');
      await this.sessions.revokeAllForCustomer(customer.id);
    });
  }
}
