import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { CustomersModule } from '../customers/customers.module.js';
import { RbacModule } from '../rbac/rbac.module.js';
import { TenancyModule } from '../tenancy/tenancy.module.js';
import { TicketsModule } from '../tickets/tickets.module.js';
import { PaymentsController } from './payments.controller.js';
import { PaymentsRepo } from './data/payments.repo.js';
import { RefundsRepo } from './data/refunds.repo.js';
import { ReceiptsRepo } from './data/receipts.repo.js';
import { TakePayment } from './application/take-payment.js';
import { RefundPayment } from './application/refund-payment.js';
import { ListPayments } from './application/list-payments.js';
import { GetPayment } from './application/get-payment.js';
import { GetTicketReceipt } from './application/get-ticket-receipt.js';

/** Phase 1: cash and one card terminal (via the PaymentProvider seam, which is
 *  global), refunds, and receipts. */
@Module({
  imports: [AuthModule, RbacModule, TenancyModule, TicketsModule, CustomersModule],
  controllers: [PaymentsController],
  providers: [
    PaymentsRepo,
    RefundsRepo,
    ReceiptsRepo,
    TakePayment,
    RefundPayment,
    ListPayments,
    GetPayment,
    GetTicketReceipt,
  ],
  exports: [PaymentsRepo, RefundsRepo],
})
export class PaymentsModule {}
