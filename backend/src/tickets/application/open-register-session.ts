import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { AuthUser } from '../../auth/auth-user.js';
import { AuditWriter } from '../../audit/audit-writer.js';
import { DatabaseService } from '../../persistence/database.service.js';
import { Authorize } from '../../rbac/application/authorize.js';
import { ResolveCurrentSalon } from '../../rbac/application/resolve-current-salon.js';
import { BranchesRepo } from '../../tenancy/data/branches.repo.js';
import { RegisterSessionsRepo } from '../data/register-sessions.repo.js';
import type { OpenRegisterSessionDto } from '../dto/register-session.dto.js';

@Injectable()
export class OpenRegisterSession {
  constructor(
    private readonly database: DatabaseService,
    private readonly salon: ResolveCurrentSalon,
    private readonly authorize: Authorize,
    private readonly branches: BranchesRepo,
    private readonly sessions: RegisterSessionsRepo,
    private readonly audit: AuditWriter,
  ) {}

  async execute(user: AuthUser, dto: OpenRegisterSessionDto) {
    const salonId = await this.salon.execute(user);
    return this.database.withTenant(user.id, salonId, async () => {
      if (!(await this.branches.findById(salonId, dto.branchId))) {
        throw new NotFoundException('Branch not found.');
      }
      await this.authorize.check(user, 'pos:operate', {
        salonId,
        branchId: dto.branchId,
      });

      if (await this.sessions.findOpen(salonId, dto.branchId)) {
        throw new ConflictException('This branch already has an open register.');
      }

      const session = await this.sessions.open({
        salonId,
        branchId: dto.branchId,
        openedBy: user.id,
        openingFloatMinor: dto.openingFloatMinor,
      });
      await this.audit.write({
        salonId,
        actor: user,
        action: 'register.opened',
        targetType: 'register_session',
        targetId: session.id,
        after: { openingFloatMinor: dto.openingFloatMinor },
      });
      return session;
    });
  }
}
