import { Injectable } from '@nestjs/common';
import type { AuthUser } from '../../auth/auth-user.js';
import { AuditWriter } from '../../audit/audit-writer.js';
import { Authorize } from '../../rbac/application/authorize.js';
import { TenantScope } from '../../rbac/application/tenant-scope.js';
import { LoyaltyRulesRepo } from '../data/loyalty-rules.repo.js';
import type { PutRulesDto } from '../dto/loyalty.dto.js';

@Injectable()
export class LoyaltyRules {
  constructor(
    private readonly scope: TenantScope,
    private readonly authorize: Authorize,
    private readonly rules: LoyaltyRulesRepo,
    private readonly audit: AuditWriter,
  ) {}

  get(user: AuthUser) {
    return this.scope.run(user, async (salonId) => {
      await this.authorize.check(user, 'loyalty:view', { salonId });
      return this.rules.effective(salonId);
    });
  }

  put(user: AuthUser, dto: PutRulesDto) {
    return this.scope.run(user, async (salonId) => {
      await this.authorize.check(user, 'loyalty:adjust', { salonId });
      const row = await this.rules.upsert(salonId, {
        pointsPerUnit: dto.pointsPerUnit,
        tiers: [...dto.tiers].sort((a, b) => a.minPoints - b.minPoints),
        expiryDays: dto.expiryDays ?? null,
      });
      await this.audit.write({
        salonId,
        actor: user,
        action: 'loyalty.rules_updated',
        targetType: 'loyalty_rule',
        targetId: row.id,
        after: dto,
      });
      return row;
    });
  }
}
