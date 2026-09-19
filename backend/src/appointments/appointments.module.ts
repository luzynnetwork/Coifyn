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
  ],
  controllers: [AppointmentsController],
  providers: [
    AppointmentsRepo,
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
  ],
  exports: [AppointmentsRepo],
})
export class AppointmentsModule {}
