import { Injectable } from '@nestjs/common';
import { RolesRepo } from '../data/roles.repo.js';
import { OWNER_ROLE_NAME, STANDARD_ROLES } from '../standard-roles.js';

/**
 * Seeds a new salon with its four standard roles (Owner + the three in
 * standard-roles.ts). Called during salon-owner onboarding, inside the bootstrap
 * scope. Returns the Owner role id so onboarding can attach the founder to it.
 */
@Injectable()
export class ProvisionStandardRoles {
  constructor(private readonly roles: RolesRepo) {}

  async execute(salonId: string): Promise<{ ownerRoleId: string }> {
    const ownerRoleId = await this.roles.create({
      salonId,
      name: OWNER_ROLE_NAME,
      isStandard: true,
      grants: [], // Owner is implicit-everything; authorize() short-circuits.
    });

    for (const role of STANDARD_ROLES) {
      await this.roles.create({
        salonId,
        name: role.name,
        isStandard: true,
        grants: Object.entries(role.grants)
          .filter((entry): entry is [string, 'org' | 'branch'] =>
            entry[1] !== undefined,
          )
          .map(([permissionKey, scope]) => ({ permissionKey, scope })),
      });
    }

    return { ownerRoleId };
  }
}
