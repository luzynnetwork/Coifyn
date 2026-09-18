import { Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { DatabaseService } from '../../persistence/database.service.js';
import { permissions } from '../../persistence/schema/index.js';
import { PERMISSION_CATALOG } from '../permission-catalog.js';

export type PermissionRow = typeof permissions.$inferSelect;

@Injectable()
export class PermissionsRepo {
  constructor(private readonly database: DatabaseService) {}

  list(): Promise<PermissionRow[]> {
    return this.database.db.query.permissions.findMany();
  }

  /** Idempotent upsert of the whole catalog — run on boot (bootstrap.ts). Uses
   *  the unsafe root because it runs before any request scope exists, and the
   *  permission table carries no RLS policy (it is a global catalog). */
  async syncCatalog(): Promise<void> {
    await this.database.unsafeRoot
      .insert(permissions)
      .values(
        PERMISSION_CATALOG.map((p) => ({
          key: p.key,
          resource: p.resource,
          action: p.action,
          description: p.description,
          scopable: p.scopable,
        })),
      )
      .onConflictDoUpdate({
        target: permissions.key,
        set: {
          resource: sql`excluded.resource`,
          action: sql`excluded.action`,
          description: sql`excluded.description`,
          scopable: sql`excluded.scopable`,
        },
      });
  }
}
