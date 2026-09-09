import { Injectable } from '@nestjs/common';
import { and, eq, inArray } from 'drizzle-orm';
import { uuidv7 } from 'uuidv7';
import { DatabaseService } from '../../persistence/database.service.js';
import { rolePermissions, roles } from '../../persistence/schema/index.js';
import type { GrantScope } from '../standard-roles.js';

export type RoleRow = typeof roles.$inferSelect;
export type RolePermissionRow = typeof rolePermissions.$inferSelect;

export interface RoleWithGrants extends RoleRow {
  grants: { permissionKey: string; scope: GrantScope }[];
}

@Injectable()
export class RolesRepo {
  constructor(private readonly database: DatabaseService) {}

  async listForSalon(salonId: string): Promise<RoleWithGrants[]> {
    const rows = await this.database.db.query.roles.findMany({
      where: eq(roles.salonId, salonId),
    });
    if (rows.length === 0) return [];
    const grants = await this.database.db.query.rolePermissions.findMany({
      where: inArray(
        rolePermissions.roleId,
        rows.map((r) => r.id),
      ),
    });
    return rows.map((role) => ({
      ...role,
      grants: grants
        .filter((g) => g.roleId === role.id)
        .map((g) => ({
          permissionKey: g.permissionKey,
          scope: g.scope as GrantScope,
        })),
    }));
  }

  async findById(
    salonId: string,
    roleId: string,
  ): Promise<RoleWithGrants | undefined> {
    const role = await this.database.db.query.roles.findFirst({
      where: and(eq(roles.id, roleId), eq(roles.salonId, salonId)),
    });
    if (!role) return undefined;
    const grants = await this.database.db.query.rolePermissions.findMany({
      where: eq(rolePermissions.roleId, roleId),
    });
    return {
      ...role,
      grants: grants.map((g) => ({
        permissionKey: g.permissionKey,
        scope: g.scope as GrantScope,
      })),
    };
  }

  async findByName(
    salonId: string,
    name: string,
  ): Promise<RoleRow | undefined> {
    return this.database.db.query.roles.findFirst({
      where: and(eq(roles.salonId, salonId), eq(roles.name, name)),
    });
  }

  async create(input: {
    salonId: string;
    name: string;
    isStandard: boolean;
    grants: { permissionKey: string; scope: GrantScope }[];
  }): Promise<string> {
    const roleId = uuidv7();
    await this.database.db.insert(roles).values({
      id: roleId,
      salonId: input.salonId,
      name: input.name,
      isStandard: input.isStandard,
    });
    await this.replaceGrants(input.salonId, roleId, input.grants);
    return roleId;
  }

  async rename(
    salonId: string,
    roleId: string,
    name: string,
  ): Promise<void> {
    await this.database.db
      .update(roles)
      .set({ name })
      .where(and(eq(roles.id, roleId), eq(roles.salonId, salonId)));
  }

  async replaceGrants(
    salonId: string,
    roleId: string,
    grants: { permissionKey: string; scope: GrantScope }[],
  ): Promise<void> {
    await this.database.db
      .delete(rolePermissions)
      .where(eq(rolePermissions.roleId, roleId));
    if (grants.length === 0) return;
    await this.database.db.insert(rolePermissions).values(
      grants.map((g) => ({
        id: uuidv7(),
        salonId,
        roleId,
        permissionKey: g.permissionKey,
        scope: g.scope,
      })),
    );
  }

  async delete(salonId: string, roleId: string): Promise<void> {
    await this.database.db
      .delete(rolePermissions)
      .where(eq(rolePermissions.roleId, roleId));
    await this.database.db
      .delete(roles)
      .where(and(eq(roles.id, roleId), eq(roles.salonId, salonId)));
  }
}
