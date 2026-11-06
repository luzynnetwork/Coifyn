import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { AuthUser } from '../../auth/auth-user.js';
import { Authorize } from '../../rbac/application/authorize.js';
import { TenantScope } from '../../rbac/application/tenant-scope.js';
import { StylistProfilesRepo } from '../../stylists/data/stylist-profiles.repo.js';
import { ShiftTemplatesRepo } from '../data/shift-templates.repo.js';
import type { CreateShiftTemplateDto } from '../dto/availability.dto.js';

@Injectable()
export class CreateShiftTemplate {
  constructor(
    private readonly scope: TenantScope,
    private readonly authorize: Authorize,
    private readonly stylists: StylistProfilesRepo,
    private readonly templates: ShiftTemplatesRepo,
  ) {}

  execute(user: AuthUser, dto: CreateShiftTemplateDto) {
    for (const p of dto.pattern) {
      if (p.start >= p.end) {
        throw new BadRequestException('Each pattern entry must end after it starts.');
      }
    }
    return this.scope.run(user, async (salonId) => {
      const stylist = await this.stylists.findById(salonId, dto.stylistId);
      if (!stylist) throw new NotFoundException('Stylist not found.');
      await this.authorize.check(user, 'roster:manage', {
        salonId,
        branchId: stylist.branchId,
      });
      return this.templates.create({
        salonId,
        stylistId: stylist.id,
        branchId: stylist.branchId,
        name: dto.name,
        chairId: dto.chairId,
        pattern: dto.pattern,
      });
    });
  }
}
