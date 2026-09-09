import { ConflictException, Injectable } from '@nestjs/common';
import { uuidv7 } from 'uuidv7';
import type { AuthUser } from '../../auth/auth-user.js';
import { AuditWriter } from '../../audit/audit-writer.js';
import { EventBus } from '../../events/event-bus.js';
import { DatabaseService } from '../../persistence/database.service.js';
import { BranchMembershipsRepo } from '../../rbac/data/branch-memberships.repo.js';
import { MembershipsRepo } from '../../rbac/data/memberships.repo.js';
import { ProvisionStandardRoles } from '../../rbac/application/provision-standard-roles.js';
import { BranchesRepo } from '../data/branches.repo.js';
import { SalonsRepo, slugify } from '../data/salons.repo.js';
import type { CreateSalonDto } from '../dto/onboarding.dto.js';

/**
 * Salon-owner onboarding. Turns an authenticated user into the Owner of a
 * brand-new salon with its first branch — salon, the four standard roles, the
 * Owner membership and the first branch all commit in one transaction, in the
 * bootstrap scope (the salon's first rows cannot authorize against a membership
 * that does not exist yet).
 */
@Injectable()
export class CreateSalon {
  constructor(
    private readonly database: DatabaseService,
    private readonly salons: SalonsRepo,
    private readonly branches: BranchesRepo,
    private readonly memberships: MembershipsRepo,
    private readonly branchMemberships: BranchMembershipsRepo,
    private readonly provisionRoles: ProvisionStandardRoles,
    private readonly events: EventBus,
    private readonly audit: AuditWriter,
  ) {}

  async execute(user: AuthUser, dto: CreateSalonDto) {
    // One salon per staff user in Phase 1.
    const existing = await this.database.withTenant(user.id, null, () =>
      this.memberships.listForUser(user.id),
    );
    if (existing.length > 0) {
      throw new ConflictException(
        'You already belong to a salon. Multiple salons per account are not supported yet.',
      );
    }

    const salonId = uuidv7();
    const slug = slugify(dto.salonName);
    const branchName = dto.firstBranchName?.trim() || dto.salonName;

    return this.database.withBootstrapSalon(user.id, salonId, async () => {
      const salon = await this.salons.create({
        id: salonId,
        slug,
        legalName: dto.legalName?.trim() || dto.salonName,
        brandName: dto.salonName,
        currency: (dto.currency || 'USD').toUpperCase(),
        timezone: dto.timezone || 'UTC',
      });

      const { ownerRoleId } = await this.provisionRoles.execute(salonId);
      await this.memberships.create({
        salonId,
        userId: user.id,
        roleId: ownerRoleId,
      });

      const branch = await this.branches.create({
        salonId,
        name: branchName,
      });
      await this.branchMemberships.add({
        salonId,
        userId: user.id,
        branchId: branch.id,
      });

      await this.events.emitMany([
        {
          aggregateType: 'salon',
          aggregateId: salonId,
          type: 'SalonCreated',
          salonId,
          payload: { slug, brandName: salon.brandName },
        },
        {
          aggregateType: 'branch',
          aggregateId: branch.id,
          type: 'BranchCreated',
          salonId,
          payload: { name: branch.name },
        },
      ]);
      await this.audit.write({
        salonId,
        actor: user,
        action: 'salon.created',
        targetType: 'salon',
        targetId: salonId,
        after: { slug, brandName: salon.brandName, firstBranchId: branch.id },
      });

      return {
        salon: publicSalon(salon),
        branch: { id: branch.id, name: branch.name },
      };
    });
  }
}

export function publicSalon(salon: {
  id: string;
  slug: string;
  brandName: string;
  legalName: string;
  currency: string;
  timezone: string;
  status: string;
}) {
  return {
    id: salon.id,
    slug: salon.slug,
    brandName: salon.brandName,
    legalName: salon.legalName,
    currency: salon.currency,
    timezone: salon.timezone,
    status: salon.status,
  };
}
