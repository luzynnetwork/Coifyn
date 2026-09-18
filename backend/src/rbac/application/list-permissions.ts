import { Injectable } from '@nestjs/common';
import { PERMISSION_CATALOG } from '../permission-catalog.js';

export interface PermissionGroup {
  resource: string;
  permissions: {
    key: string;
    action: string;
    description: string;
    scopable: boolean;
  }[];
}

/** The catalog, grouped by resource — what the role editor renders. No DB read;
 *  the catalog is code. */
@Injectable()
export class ListPermissions {
  execute(): PermissionGroup[] {
    const groups = new Map<string, PermissionGroup>();
    for (const p of PERMISSION_CATALOG) {
      const group = groups.get(p.resource) ?? {
        resource: p.resource,
        permissions: [],
      };
      group.permissions.push({
        key: p.key,
        action: p.action,
        description: p.description,
        scopable: p.scopable,
      });
      groups.set(p.resource, group);
    }
    return [...groups.values()];
  }
}
