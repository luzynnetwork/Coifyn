import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { AuthUser } from '../../auth/auth-user.js';
import { AuditWriter } from '../../audit/audit-writer.js';
import { CustomersRepo } from '../../customers/data/customers.repo.js';
import { EventBus } from '../../events/event-bus.js';
import { DatabaseService } from '../../persistence/database.service.js';
import {
  PAYMENT_PROVIDER,
  type PaymentProvider,
} from '../../providers/payment-provider.js';
import { Authorize } from '../../rbac/application/authorize.js';
import { ResolveCurrentSalon } from '../../rbac/application/resolve-current-salon.js';
import { SalonsRepo } from '../../tenancy/data/salons.repo.js';
import { TicketsRepo } from '../../tickets/data/tickets.repo.js';
import { PaymentsRepo } from '../data/payments.repo.js';
import type { TakePaymentDto } from '../dto/payment.dto.js';

/**
 * Settles part or all of an open ticket. Everything that must agree happens in
 * ONE transaction behind a per-ticket lock: the payment row, the ticket turning
 * `paid` once completed payments cover the total, and the customer's visit
 * count and spend. A failed card attempt is recorded (status `failed`) and
 * leaves the ticket open.
 */
@Injectable()
export class TakePayment {
  constructor(
    private readonly database: DatabaseService,
    private readonly salon: ResolveCurrentSalon,
    private readonly authorize: Authorize,
    private readonly salons: SalonsRepo,
    private readonly tickets: TicketsRepo,
    private readonly payments: PaymentsRepo,
    private readonly customers: CustomersRepo,
    @Inject(PAYMENT_PROVIDER) private readonly provider: PaymentProvider,
    private readonly events: EventBus,
    private readonly audit: AuditWriter,
  ) {}

  async execute(user: AuthUser, dto: TakePaymentDto) {
    const salonId = await this.salon.execute(user);
    return this.database.withTenant(user.id, salonId, async () => {
      await this.payments.lockTicket(dto.ticketId);

      const ticket = await this.tickets.findById(salonId, dto.ticketId);
      if (!ticket) throw new NotFoundException('Ticket not found.');

      await this.authorize.check(user, 'payment:take', {
        salonId,
        branchId: ticket.branchId,
      });
      if (ticket.status !== 'open') {
        throw new ConflictException(`A ${ticket.status} ticket cannot take payment.`);
      }

      const alreadyPaid = await this.payments.sumCompleted(salonId, ticket.id);
      const due = ticket.totalMinor - alreadyPaid;
      if (dto.amountMinor > due) {
        throw new BadRequestException(
          `Amount exceeds the balance due (${due}).`,
        );
      }
      if (dto.amountMinor === 0 && ticket.totalMinor !== 0) {
        throw new BadRequestException('Amount must be greater than zero.');
      }

      let providerRef: string | null = null;
      let failure: string | null = null;
      if (dto.method === 'card' && dto.amountMinor > 0) {
        try {
          const currency = (await this.salons.findById(salonId))?.currency ?? 'USD';
          const intent = await this.provider.createPaymentIntent({
            amountCents: dto.amountMinor,
            currency,
            metadata: { ticketId: ticket.id, salonId },
          });
          const captured = await this.provider.capturePayment(intent.id);
          providerRef = intent.id;
          if (captured.status !== 'succeeded') {
            failure = `Card not captured (${captured.status}).`;
          }
        } catch (err) {
          failure = (err as Error).message || 'Card payment failed.';
        }
      }

      const payment = await this.payments.create({
        salonId,
        ticketId: ticket.id,
        branchId: ticket.branchId,
        registerSessionId: ticket.registerSessionId,
        method: dto.method,
        amountMinor: dto.amountMinor,
        status: failure ? 'failed' : 'completed',
        providerRef,
        failureReason: failure,
        takenBy: user.id,
      });

      if (failure) {
        await this.events.emit({
          aggregateType: 'payment',
          aggregateId: payment.id,
          type: 'PaymentFailed',
          salonId,
          payload: { paymentId: payment.id, ticketId: ticket.id },
        });
        await this.audit.write({
          salonId,
          actor: user,
          action: 'payment.failed',
          targetType: 'payment',
          targetId: payment.id,
          reason: failure,
          after: { method: dto.method, amountMinor: dto.amountMinor },
        });
        return { payment, ticket, settled: false };
      }

      let settledTicket = ticket;
      const settled = alreadyPaid + dto.amountMinor >= ticket.totalMinor;
      if (settled) {
        settledTicket =
          (await this.tickets.update(salonId, ticket.id, {
            status: 'paid',
            paidAt: new Date(),
          })) ?? ticket;

        if (ticket.customerId) {
          await this.customers.recordVisit(
            salonId,
            ticket.customerId,
            ticket.totalMinor,
          );
          await this.events.emit({
            aggregateType: 'customer',
            aggregateId: ticket.customerId,
            type: 'CustomerVisitRecorded',
            salonId,
            payload: {
              customerId: ticket.customerId,
              spendMinor: ticket.totalMinor,
            },
          });
        }
      }

      await this.events.emit({
        aggregateType: 'payment',
        aggregateId: payment.id,
        type: 'PaymentCompleted',
        salonId,
        payload: {
          paymentId: payment.id,
          ticketId: ticket.id,
          amountMinor: dto.amountMinor,
        },
      });
      await this.audit.write({
        salonId,
        actor: user,
        action: 'payment.completed',
        targetType: 'payment',
        targetId: payment.id,
        after: {
          method: dto.method,
          amountMinor: dto.amountMinor,
          ticketSettled: settled,
        },
      });
      return { payment, ticket: settledTicket, settled };
    });
  }
}
