import { Injectable, NotFoundException } from '@nestjs/common';
import type { AuthUser } from '../../auth/auth-user.js';
import { AppointmentsRepo } from '../../appointments/data/appointments.repo.js';
import { Authorize } from '../../rbac/application/authorize.js';
import { TenantScope } from '../../rbac/application/tenant-scope.js';
import { CutRecordsRepo } from '../data/cut-records.repo.js';
import { CutRecordPresenter } from './cut-record-presenter.js';

/** The customer's most recent cut for whoever is about to serve them —
 *  including a stand-in, who holds `cutrecord:view` for the branch. */
@Injectable()
export class GetLastCut {
  constructor(
    private readonly scope: TenantScope,
    private readonly authorize: Authorize,
    private readonly appointments: AppointmentsRepo,
    private readonly records: CutRecordsRepo,
    private readonly presenter: CutRecordPresenter,
  ) {}

  execute(user: AuthUser, appointmentId: string) {
    return this.scope.run(user, async (salonId) => {
      const appt = await this.appointments.findById(salonId, appointmentId);
      if (!appt) throw new NotFoundException('Appointment not found.');
      await this.authorize.check(user, 'cutrecord:view', {
        salonId,
        branchId: appt.branchId,
      });
      if (!appt.customerId) return { lastCut: null };

      const latest = await this.records.latestForCustomer(salonId, appt.customerId);
      if (!latest) return { lastCut: null };
      const [lastCut] = await this.presenter.present(salonId, [latest]);
      return { lastCut };
    });
  }
}
