import { Injectable, NotFoundException } from '@nestjs/common';
import type { AuthUser } from '../../auth/auth-user.js';
import { CustomersRepo } from '../../customers/data/customers.repo.js';
import { Authorize } from '../../rbac/application/authorize.js';
import { TenantScope } from '../../rbac/application/tenant-scope.js';
import { CutRecordsRepo } from '../data/cut-records.repo.js';
import { CutRecordPresenter } from './cut-record-presenter.js';

@Injectable()
export class ListCutRecords {
  constructor(
    private readonly scope: TenantScope,
    private readonly authorize: Authorize,
    private readonly customers: CustomersRepo,
    private readonly records: CutRecordsRepo,
    private readonly presenter: CutRecordPresenter,
  ) {}

  execute(user: AuthUser, customerId: string) {
    return this.scope.run(user, async (salonId) => {
      await this.authorize.check(user, 'cutrecord:view', { salonId });
      if (!(await this.customers.findById(salonId, customerId))) {
        throw new NotFoundException('Customer not found.');
      }
      return this.presenter.present(
        salonId,
        await this.records.listForCustomer(salonId, customerId),
      );
    });
  }
}
