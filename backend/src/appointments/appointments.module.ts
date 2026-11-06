import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { CustomersModule } from '../customers/customers.module.js';
import { RbacModule } from '../rbac/rbac.module.js';
import { RealtimeModule } from '../realtime/realtime.module.js';
import { ServicesModule } from '../services/services.module.js';
import { StylistsModule } from '../stylists/stylists.module.js';
import { TenancyModule } from '../tenancy/tenancy.module.js';
import { AppointmentsController } from './appointments.controller.js';
import { AppointmentsRepo } from './data/appointments.repo.js';
import { BookingHoldsRepo } from './data/booking-holds.repo.js';
import { AppointmentConflictGuard } from './application/appointment-conflict-guard.js';
import { AppointmentTransitioner } from './application/appointment-transitioner.js';
import { ListAppointments } from './application/list-appointments.js';
import { GetAppointment } from './application/get-appointment.js';
import { CreateAppointment } from './application/create-appointment.js';
import { UpdateAppointment } from './application/update-appointment.js';
import { ArriveAppointment } from './application/arrive-appointment.js';
import { StartAppointment } from './application/start-appointment.js';
import { CompleteAppointment } from './application/complete-appointment.js';
import { MarkAppointmentNoShow } from './application/mark-appointment-no-show.js';
import { CancelAppointment } from './application/cancel-appointment.js';
import { AppointmentBooker } from './application/appointment-booker.js';
import { AppointmentReschedulesRepo } from './data/appointment-reschedules.repo.js';
import { HoldSlot } from './application/hold-slot.js';
import { ConfirmHold } from './application/confirm-hold.js';
import { RescheduleAppointment } from './application/reschedule-appointment.js';
import { ReassignStylist } from './application/reassign-stylist.js';
import { GetDaySheet } from './application/get-day-sheet.js';
import { GetFrontDeskBoard } from './application/get-front-desk-board.js';
import { SendAppointmentReminders } from './application/send-appointment-reminders.js';
import { ReminderWorker } from './reminder.worker.js';
import { NotificationsModule } from '../notifications/notifications.module.js';

/** Phase 1: staff-entered bookings with transactional double-booking prevention.
 *  The full calendar, holds and self-serve booking are Phase 2 and 4. */
@Module({
  imports: [
    AuthModule,
    RbacModule,
    RealtimeModule,
    TenancyModule,
    StylistsModule,
    ServicesModule,
    CustomersModule,
    NotificationsModule,
  ],
  controllers: [AppointmentsController],
  providers: [
    AppointmentsRepo,
    BookingHoldsRepo,
    AppointmentConflictGuard,
    AppointmentTransitioner,
    ListAppointments,
    GetAppointment,
    CreateAppointment,
    UpdateAppointment,
    ArriveAppointment,
    StartAppointment,
    CompleteAppointment,
    MarkAppointmentNoShow,
    CancelAppointment,
    AppointmentBooker,
    AppointmentReschedulesRepo,
    HoldSlot,
    ConfirmHold,
    RescheduleAppointment,
    ReassignStylist,
    GetDaySheet,
    GetFrontDeskBoard,
    SendAppointmentReminders,
    ReminderWorker,
  ],
  exports: [
    AppointmentsRepo,
    BookingHoldsRepo,
    AppointmentConflictGuard,
    AppointmentBooker,
    ReassignStylist,
    SendAppointmentReminders,
  ],
})
export class AppointmentsModule {}
