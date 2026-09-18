"use client";

import type { PermissionView, RoleGrant } from "@coifyn/api-client";

export interface PermissionPickerProps {
  permissions: PermissionView[];
  grants: RoleGrant[];
  onChange: (grants: RoleGrant[]) => void;
}

export function PermissionPicker({ permissions, grants, onChange }: PermissionPickerProps) {
  const grantedKeys = new Set(grants.map((grant) => grant.permissionKey));
  const byResource = new Map<string, PermissionView[]>();
  for (const permission of permissions) {
    const list = byResource.get(permission.resource) ?? [];
    list.push(permission);
    byResource.set(permission.resource, list);
  }

  function toggle(permission: PermissionView) {
    if (grantedKeys.has(permission.key)) {
      onChange(grants.filter((grant) => grant.permissionKey !== permission.key));
    } else {
      onChange([...grants, { permissionKey: permission.key, scope: "org" }]);
    }
  }

  return (
    <div className="flex max-h-72 flex-col gap-3 overflow-y-auto rounded-md border border-[var(--color-border)] p-3">
      {Array.from(byResource.entries()).map(([resource, resourcePermissions]) => (
        <div key={resource} className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase text-[var(--color-muted-foreground)]">
            {resource}
          </span>
          {resourcePermissions.map((permission) => (
            <label key={permission.key} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={grantedKeys.has(permission.key)}
                onChange={() => toggle(permission)}
              />
              {permission.description}
            </label>
          ))}
        </div>
      ))}
    </div>
  );
}
