import { Module } from '@nestjs/common';
import { AppointmentsModule } from '../appointments/appointments.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { RbacModule } from '../rbac/rbac.module.js';
import { ServicesModule } from '../services/services.module.js';
import { StylistsModule } from '../stylists/stylists.module.js';
import { TenancyModule } from '../tenancy/tenancy.module.js';
import { AvailabilityController } from './availability.controller.js';
import { ShiftsRepo } from './data/shifts.repo.js';
import { ShiftTemplatesRepo } from './data/shift-templates.repo.js';
import { TimeOffRepo } from './data/time-off.repo.js';
import { SlotFinder } from './application/slot-finder.js';
import { TemplateApplier } from './application/template-applier.js';
import { ListRoster } from './application/list-roster.js';
import { CreateShift } from './application/create-shift.js';
import { UpdateShift } from './application/update-shift.js';
import { DeleteShift } from './application/delete-shift.js';
import { CreateShiftTemplate } from './application/create-shift-template.js';
import { ListShiftTemplates } from './application/list-shift-templates.js';
import { ApplyShiftTemplate } from './application/apply-shift-template.js';
import { ListTimeOff } from './application/list-time-off.js';
import { RequestTimeOff } from './application/request-time-off.js';
import { DecideTimeOff } from './application/decide-time-off.js';
import { GetSlots } from './application/get-slots.js';
import { GenerateRosters } from './application/generate-rosters.js';
import { RosterWorker } from './roster.worker.js';

/** Phase 2: stylist rosters (shifts, weekly templates, time off) and the
 *  derived open-slot calculation. SlotFinder is exported for the public
 *  booking endpoints. */
@Module({
  imports: [
    AuthModule,
    RbacModule,
    TenancyModule,
    StylistsModule,
    ServicesModule,
    AppointmentsModule,
  ],
  controllers: [AvailabilityController],
  providers: [
    ShiftsRepo,
    ShiftTemplatesRepo,
    TimeOffRepo,
    SlotFinder,
    TemplateApplier,
    ListRoster,
    CreateShift,
    UpdateShift,
    DeleteShift,
    CreateShiftTemplate,
    ListShiftTemplates,
    ApplyShiftTemplate,
    ListTimeOff,
    RequestTimeOff,
    DecideTimeOff,
    GetSlots,
    GenerateRosters,
    RosterWorker,
  ],
  exports: [SlotFinder, ShiftsRepo],
})
export class AvailabilityModule {}
