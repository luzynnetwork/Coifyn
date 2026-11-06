import { Injectable, NotFoundException } from '@nestjs/common';
import type { AuthUser } from '../../auth/auth-user.js';
import { CustomersRepo } from '../../customers/data/customers.repo.js';
import { Authorize } from '../../rbac/application/authorize.js';
import { TenantScope } from '../../rbac/application/tenant-scope.js';
import { LoyaltyAccountsRepo } from '../data/loyalty-accounts.repo.js';
import { LoyaltyLedgerRepo } from '../data/loyalty-ledger.repo.js';
import { LoyaltyRulesRepo } from '../data/loyalty-rules.repo.js';

@Injectable()
export class GetLoyalty {
  constructor(
    private readonly scope: TenantScope,
    private readonly authorize: Authorize,
    private readonly customers: CustomersRepo,
    private readonly accounts: LoyaltyAccountsRepo,
    private readonly ledger: LoyaltyLedgerRepo,
    private readonly rules: LoyaltyRulesRepo,
  ) {}

  account(user: AuthUser, customerId: string) {
    return this.scope.run(user, async (salonId) => {
      await this.authorize.check(user, 'loyalty:view', { salonId });
      if (!(await this.customers.findById(salonId, customerId))) {
        throw new NotFoundException('Customer not found.');
      }
      const account = await this.accounts.find(salonId, customerId);
      return {
        customerId,
        pointsBalance: account?.pointsBalance ?? 0,
        tier: account?.tier ?? null,
        rule: await this.rules.effective(salonId),
      };
    });
  }

  ledgerFor(user: AuthUser, customerId: string) {
    return this.scope.run(user, async (salonId) => {
      await this.authorize.check(user, 'loyalty:view', { salonId });
      if (!(await this.customers.findById(salonId, customerId))) {
        throw new NotFoundException('Customer not found.');
      }
      return this.ledger.list(salonId, customerId);
    });
  }
}
