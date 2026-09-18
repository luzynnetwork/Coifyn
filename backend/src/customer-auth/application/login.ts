import { Injectable, UnauthorizedException } from '@nestjs/common';
import { DatabaseService } from '../../persistence/database.service.js';
import { CustomersRepo } from '../data/customers.repo.js';
import { PasswordService } from '../../auth/lib/password.js';
import { LoginCustomerDto } from '../dto/customer-auth.dto.js';
import {
  CustomerAuthTokens,
  CustomerSessionContext,
  IssueCustomerSession,
} from './issue-customer-session.js';

/** No dedicated `CustomerLoggedIn` event is registered yet (only
 *  CustomerRegistered/CustomerVerified per the events-registry scope for this
 *  phase) — a login is not otherwise a domain event here. */
@Injectable()
export class LoginCustomer {
  constructor(
    private readonly database: DatabaseService,
    private readonly customers: CustomersRepo,
    private readonly passwords: PasswordService,
    private readonly issueSession: IssueCustomerSession,
  ) {}

  async execute(
    dto: LoginCustomerDto,
    ctx: CustomerSessionContext,
  ): Promise<CustomerAuthTokens> {
    return this.database.withAnon(async () => {
      const customer = await this.customers.findByEmailOrPhone(dto.identifier);

      // Same error and roughly the same work whether the customer exists or
      // not — the response must not reveal which (mirrors auth/application/login.ts).
      const hash =
        customer?.passwordHash ??
        '$argon2id$v=19$m=19456,t=2,p=1$c29tZXNhbHRzb21lc2FsdA$0000000000000000000000000000000000000000000';
      const ok = await this.passwords.verify(hash, dto.password);

      if (
        !customer ||
        !ok ||
        customer.status !== 'active' ||
        !customer.verifiedAt
      ) {
        throw new UnauthorizedException('Invalid credentials.');
      }

      if (this.passwords.needsRehash(customer.passwordHash)) {
        await this.customers.updatePasswordHash(
          customer.id,
          await this.passwords.hash(dto.password),
        );
      }

      return this.issueSession.forNewSession(customer, ctx);
    });
  }
}
