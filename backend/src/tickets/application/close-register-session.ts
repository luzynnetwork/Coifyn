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
import { RegisterSessionsRepo } from '../data/register-sessions.repo.js';
import type { CloseRegisterSessionDto } from '../dto/register-session.dto.js';

/** Records the counted cash. Expected cash and variance are derived by the
 *  reports module from the session's cash payments, never stored here. */
@Injectable()
export class CloseRegisterSession {
  constructor(
    private readonly database: DatabaseService,
    private readonly salon: ResolveCurrentSalon,
    private readonly authorize: Authorize,
    private readonly sessions: RegisterSessionsRepo,
    private readonly audit: AuditWriter,
  ) {}

  async execute(user: AuthUser, id: string, dto: CloseRegisterSessionDto) {
    const salonId = await this.salon.execute(user);
    return this.database.withTenant(user.id, salonId, async () => {
      const session = await this.sessions.findById(salonId, id);
      if (!session) throw new NotFoundException('Register session not found.');

      await this.authorize.check(user, 'pos:operate', {
        salonId,
        branchId: session.branchId,
      });
      if (session.closedAt) {
        throw new ConflictException('This register is already closed.');
      }

      const closed = await this.sessions.close(salonId, id, dto.closingCountMinor);
      await this.audit.write({
        salonId,
        actor: user,
        action: 'register.closed',
        targetType: 'register_session',
        targetId: id,
        after: { closingCountMinor: dto.closingCountMinor },
      });
      return closed ?? session;
    });
  }
}
