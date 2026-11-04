import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { AuthUser } from '../../auth/auth-user.js';
import { AuditWriter } from '../../audit/audit-writer.js';
import { eachDate } from '../../common/day-bounds.js';
import { EventBus } from '../../events/event-bus.js';
import { Authorize } from '../../rbac/application/authorize.js';
import { TenantScope } from '../../rbac/application/tenant-scope.js';
import { SalonsRepo } from '../../tenancy/data/salons.repo.js';
import { ShiftTemplatesRepo } from '../data/shift-templates.repo.js';
import type { ApplyShiftTemplateDto } from '../dto/availability.dto.js';
import { TemplateApplier } from './template-applier.js';

const MAX_DAYS = 93;

@Injectable()
export class ApplyShiftTemplate {
  constructor(
    private readonly scope: TenantScope,
    private readonly authorize: Authorize,
    private readonly salons: SalonsRepo,
    private readonly templates: ShiftTemplatesRepo,
    private readonly applier: TemplateApplier,
    private readonly events: EventBus,
    private readonly audit: AuditWriter,
  ) {}

  execute(user: AuthUser, id: string, dto: ApplyShiftTemplateDto) {
    const days = eachDate(dto.from, dto.to).length;
    if (days < 1 || days > MAX_DAYS) {
      throw new BadRequestException(`Range must be 1–${MAX_DAYS} days.`);
    }
    return this.scope.run(user, async (salonId) => {
      const template = await this.templates.findById(salonId, id);
      if (!template) throw new NotFoundException('Template not found.');
      await this.authorize.check(user, 'roster:manage', {
        salonId,
        branchId: template.branchId,
      });

      const tz = (await this.salons.findById(salonId))?.timezone ?? 'UTC';
      const created = await this.applier.apply(salonId, template, dto.from, dto.to, tz);

      await this.events.emit({
        aggregateType: 'shift_template',
        aggregateId: id,
        type: 'ShiftTemplateApplied',
        salonId,
        payload: { templateId: id, created },
      });
      await this.audit.write({
        salonId,
        actor: user,
        action: 'shift_template.applied',
        targetType: 'shift_template',
        targetId: id,
        after: { from: dto.from, to: dto.to, created },
      });
      return { created };
    });
  }
}
