import { Injectable, NotFoundException } from '@nestjs/common';
import type { AuthUser } from '../../auth/auth-user.js';
import { DatabaseService } from '../../persistence/database.service.js';
import { Authorize } from '../../rbac/application/authorize.js';
import { ResolveCurrentSalon } from '../../rbac/application/resolve-current-salon.js';
import { PaymentsRepo } from '../data/payments.repo.js';
import { RefundsRepo } from '../data/refunds.repo.js';

@Injectable()
export class GetPayment {
  constructor(
    private readonly database: DatabaseService,
    private readonly salon: ResolveCurrentSalon,
    private readonly authorize: Authorize,
    private readonly payments: PaymentsRepo,
    private readonly refunds: RefundsRepo,
  ) {}

  async execute(user: AuthUser, id: string) {
    const salonId = await this.salon.execute(user);
    return this.database.withTenant(user.id, salonId, async () => {
      const payment = await this.payments.findById(salonId, id);
      if (!payment) throw new NotFoundException('Payment not found.');
      await this.authorize.check(user, 'payment:take', {
        salonId,
        branchId: payment.branchId,
      });
      const refundedMinor = await this.refunds.sumForPayment(salonId, id);
      return { ...payment, refundedMinor };
    });
  }
}
