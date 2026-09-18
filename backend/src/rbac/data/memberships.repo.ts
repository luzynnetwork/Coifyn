import { Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { uuidv7 } from 'uuidv7';
import { DatabaseService } from '../../persistence/database.service.js';
import { memberships, roles } from '../../persistence/schema/index.js';

export type MembershipRow = typeof memberships.$inferSelect;

export interface MembershipWithRole extends MembershipRow {
  roleName: string;
  roleIsStandard: boolean;
}

@Injectable()
export class MembershipsRepo {
  constructor(private readonly database: DatabaseService) {}

  async findForUser(
    salonId: string,
    userId: string,
  ): Promise<MembershipWithRole | undefined> {
    const [row] = await this.database.db
      .select({
        membership: memberships,
        roleName: roles.name,
        roleIsStandard: roles.isStandard,
      })
      .from(memberships)
      .innerJoin(roles, eq(roles.id, memberships.roleId))
      .where(
        and(
          eq(memberships.salonId, salonId),
          eq(memberships.userId, userId),
        ),
      );
    if (!row) return undefined;
    return {
      ...row.membership,
      roleName: row.roleName,
      roleIsStandard: row.roleIsStandard,
    };
  }

  /** Every salon the user is a member of. Phase 1 staff have exactly one. */
  async listForUser(userId: string): Promise<MembershipWithRole[]> {
    const rows = await this.database.db
      .select({
        membership: memberships,
        roleName: roles.name,
        roleIsStandard: roles.isStandard,
      })
      .from(memberships)
      .innerJoin(roles, eq(roles.id, memberships.roleId))
      .where(eq(memberships.userId, userId));
    return rows.map((r) => ({
      ...r.membership,
      roleName: r.roleName,
      roleIsStandard: r.roleIsStandard,
    }));
  }

  async listForSalon(salonId: string): Promise<MembershipWithRole[]> {
    const rows = await this.database.db
      .select({
        membership: memberships,
        roleName: roles.name,
        roleIsStandard: roles.isStandard,
      })
      .from(memberships)
      .innerJoin(roles, eq(roles.id, memberships.roleId))
      .where(eq(memberships.salonId, salonId));
    return rows.map((r) => ({
      ...r.membership,
      roleName: r.roleName,
      roleIsStandard: r.roleIsStandard,
    }));
  }

  async countByRole(salonId: string, roleId: string): Promise<number> {
    const rows = await this.database.db
      .select({ id: memberships.id })
      .from(memberships)
      .where(
        and(
          eq(memberships.salonId, salonId),
          eq(memberships.roleId, roleId),
        ),
      );
    return rows.length;
  }

  async create(input: {
    salonId: string;
    userId: string;
    roleId: string;
  }): Promise<void> {
    await this.database.db
      .insert(memberships)
      .values({ id: uuidv7(), ...input });
  }

  async setRole(
    salonId: string,
    userId: string,
    roleId: string,
  ): Promise<void> {
    await this.database.db
      .update(memberships)
      .set({ roleId })
      .where(
        and(
          eq(memberships.salonId, salonId),
          eq(memberships.userId, userId),
        ),
      );
  }
}
