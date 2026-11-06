import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { AuthUser } from '../../auth/auth-user.js';
import { AuditWriter } from '../../audit/audit-writer.js';
import { EventBus } from '../../events/event-bus.js';
import { DatabaseService } from '../../persistence/database.service.js';
import {
  PAYMENT_PROVIDER,
  type PaymentProvider,
} from '../../providers/payment-provider.js';
import { Authorize } from '../../rbac/application/authorize.js';
import { ResolveCurrentSalon } from '../../rbac/application/resolve-current-salon.js';
import { PaymentsRepo } from '../data/payments.repo.js';
import { RefundsRepo } from '../data/refunds.repo.js';
import type { RefundPaymentDto } from '../dto/payment.dto.js';

/**
 * A sensitive action: needs `payment:refund` and a written reason, and is
 * audited. A payment can be refunded in parts but never beyond what was taken.
 * The original payment row is left untouched; the refund is its own record.
 */
@Injectable()
export class RefundPayment {
  constructor(
    private readonly database: DatabaseService,
    private readonly salon: ResolveCurrentSalon,
    private readonly authorize: Authorize,
    private readonly payments: PaymentsRepo,
    private readonly refunds: RefundsRepo,
    @Inject(PAYMENT_PROVIDER) private readonly provider: PaymentProvider,
    private readonly events: EventBus,
    private readonly audit: AuditWriter,
  ) {}

  async execute(user: AuthUser, paymentId: string, dto: RefundPaymentDto) {
    const salonId = await this.salon.execute(user);
    return this.database.withTenant(user.id, salonId, async () => {
      const payment = await this.payments.findById(salonId, paymentId);
      if (!payment) throw new NotFoundException('Payment not found.');

      await this.authorize.check(user, 'payment:refund', {
        salonId,
        branchId: payment.branchId,
      });
      await this.payments.lockTicket(payment.ticketId);

      if (payment.status !== 'completed') {
        throw new ConflictException('Only a completed payment can be refunded.');
      }
      const refunded = await this.refunds.sumForPayment(salonId, paymentId);
      const refundable = payment.amountMinor - refunded;
      if (dto.amountMinor > refundable) {
        throw new BadRequestException(
          `Refund exceeds what is left to refund (${refundable}).`,
        );
      }

      let providerRef: string | null = null;
      if (payment.method === 'card' && payment.providerRef) {
        const result = await this.provider.refundPayment(
          payment.providerRef,
          dto.amountMinor,
        );
        providerRef = result.id;
      }

      const refund = await this.refunds.create({
        salonId,
        paymentId,
        ticketId: payment.ticketId,
        branchId: payment.branchId,
        amountMinor: dto.amountMinor,
        reason: dto.reason,
        providerRef,
        approvedBy: user.id,
      });

      await this.events.emit({
        aggregateType: 'payment',
        aggregateId: paymentId,
        type: 'RefundIssued',
        salonId,
        payload: {
          refundId: refund.id,
          paymentId,
          amountMinor: dto.amountMinor,
        },
      });
      await this.audit.write({
        salonId,
        actor: user,
        action: 'payment.refunded',
        targetType: 'payment',
        targetId: paymentId,
        reason: dto.reason,
        before: { refundedMinor: refunded },
        after: { refundedMinor: refunded + dto.amountMinor },
      });
      return refund;
    });
  }
}
