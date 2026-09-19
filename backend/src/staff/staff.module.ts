import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { RbacModule } from '../rbac/rbac.module.js';
import { StaffController } from './staff.controller.js';
import { StaffInvitesRepo } from './data/staff-invites.repo.js';
import { CreateStaffInvite } from './application/create-staff-invite.js';
import { ListStaffInvites } from './application/list-staff-invites.js';
import { RevokeStaffInvite } from './application/revoke-staff-invite.js';
import { GetStaffInviteByToken } from './application/get-staff-invite-by-token.js';
import { AcceptStaffInvite } from './application/accept-staff-invite.js';
import { UpdateStaff } from './application/update-staff.js';

/**
 * Phase 1 — staff invites and the salon roster. `ProvidersModule` is
 * `@Global()` so NOTIFICATION_PROVIDER is available without an explicit
 * import here.
 */
@Module({
  imports: [AuthModule, RbacModule],
  controllers: [StaffController],
  providers: [
    StaffInvitesRepo,
    CreateStaffInvite,
    ListStaffInvites,
    RevokeStaffInvite,
    GetStaffInviteByToken,
    AcceptStaffInvite,
    UpdateStaff,
  ],
})
export class StaffModule {}
