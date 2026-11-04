import { Module } from '@nestjs/common';
import { AppointmentsModule } from '../appointments/appointments.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { CustomersModule } from '../customers/customers.module.js';
import { QueueModule } from '../queue/queue.module.js';
import { RbacModule } from '../rbac/rbac.module.js';
import { SalonSetupModule } from '../salon-setup/salon-setup.module.js';
import { ServicesModule } from '../services/services.module.js';
import { StylistsModule } from '../stylists/stylists.module.js';
import { TenancyModule } from '../tenancy/tenancy.module.js';
import { TicketsController } from './tickets.controller.js';
import { RegisterSessionsRepo } from './data/register-sessions.repo.js';
import { TicketsRepo } from './data/tickets.repo.js';
import { TicketLinesRepo } from './data/ticket-lines.repo.js';
import { TicketDiscountsRepo } from './data/ticket-discounts.repo.js';
import { RequireTicket } from './application/require-ticket.js';
import { RecomputeTicket } from './application/recompute-ticket.js';
import { OpenRegisterSession } from './application/open-register-session.js';
import { CloseRegisterSession } from './application/close-register-session.js';
import { GetCurrentRegisterSession } from './application/get-current-register-session.js';
import { CreateTicket } from './application/create-ticket.js';
import { ListTickets } from './application/list-tickets.js';
import { GetTicket } from './application/get-ticket.js';
import { AddTicketLine } from './application/add-ticket-line.js';
import { UpdateTicketLine } from './application/update-ticket-line.js';
import { RemoveTicketLine } from './application/remove-ticket-line.js';
import { ApplyTicketDiscount } from './application/apply-ticket-discount.js';
import { VoidTicket } from './application/void-ticket.js';

/** Phase 1: the POS. Exports the repos and RecomputeTicket so payments and
 *  reports build on the same source of truth. */
@Module({
  imports: [
    AuthModule,
    RbacModule,
    TenancyModule,
    SalonSetupModule,
    ServicesModule,
    StylistsModule,
    CustomersModule,
    QueueModule,
    AppointmentsModule,
  ],
  controllers: [TicketsController],
  providers: [
    RegisterSessionsRepo,
    TicketsRepo,
    TicketLinesRepo,
    TicketDiscountsRepo,
    RequireTicket,
    RecomputeTicket,
    OpenRegisterSession,
    CloseRegisterSession,
    GetCurrentRegisterSession,
    CreateTicket,
    ListTickets,
    GetTicket,
    AddTicketLine,
    UpdateTicketLine,
    RemoveTicketLine,
    ApplyTicketDiscount,
    VoidTicket,
  ],
  exports: [
    TicketsRepo,
    TicketLinesRepo,
    TicketDiscountsRepo,
    RegisterSessionsRepo,
    RequireTicket,
  ],
})
export class TicketsModule {}
