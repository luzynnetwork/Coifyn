import { Injectable } from '@nestjs/common';
import type { AuthUser } from '../../auth/auth-user.js';
import { Authorize } from '../../rbac/application/authorize.js';
import { TenantScope } from '../../rbac/application/tenant-scope.js';
import {
  BookingRequestsRepo,
  type BookingRequestStatus,
} from '../data/booking-requests.repo.js';

@Injectable()
export class ListBookingRequests {
  constructor(
    private readonly scope: TenantScope,
    private readonly authorize: Authorize,
    private readonly requests: BookingRequestsRepo,
  ) {}

  execute(user: AuthUser, branchId: string, status?: BookingRequestStatus) {
    return this.scope.run(user, async (salonId) => {
      await this.authorize.check(user, 'appointment:view', { salonId, branchId });
      return this.requests.list(salonId, branchId, status);
    });
  }
}
