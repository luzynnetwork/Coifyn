import { Injectable } from '@nestjs/common';
import type { AuthUser } from '../../auth/auth-user.js';
import { DatabaseService } from '../../persistence/database.service.js';
import { Authorize } from '../../rbac/application/authorize.js';
import { ResolveCurrentSalon } from '../../rbac/application/resolve-current-salon.js';
import { paginated, type Paginated } from '../../common/pagination.js';
import { AuditRepo, type AuditEventRow, type AuditFilter } from '../data/audit.repo.js';
import type { ListAuditQuery } from '../dto/list-audit.dto.js';

@Injectable()
export class ListAuditEvents {
  constructor(
    private readonly database: DatabaseService,
    private readonly salon: ResolveCurrentSalon,
    private readonly authorize: Authorize,
    private readonly audit: AuditRepo,
  ) {}

  async execute(
    user: AuthUser,
    query: ListAuditQuery,
  ): Promise<Paginated<AuditEventRow>> {
    const salonId = await this.salon.execute(user);
    return this.database.withTenant(user.id, salonId, async () => {
      await this.authorize.check(user, 'auditlog:view', { salonId });

      const filter: AuditFilter = {
        salonId,
        targetType: query.targetType,
        targetId: query.targetId,
        actorId: query.actorId,
        action: query.action,
        from: query.from ? new Date(query.from) : undefined,
        to: query.to ? new Date(query.to) : undefined,
      };
      const [items, total] = await Promise.all([
        this.audit.list(filter, query.limit, query.offset),
        this.audit.count(filter),
      ]);
      return paginated(items, total, query);
    });
  }
}
