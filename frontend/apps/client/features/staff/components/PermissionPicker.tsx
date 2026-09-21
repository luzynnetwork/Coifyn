"use client";

import type { PermissionGroupView, PermissionView, RoleGrant } from "@coifyn/api-client";

export interface PermissionPickerProps {
  permissions: PermissionGroupView[];
  grants: RoleGrant[];
  onChange: (grants: RoleGrant[]) => void;
}

export function PermissionPicker({ permissions, grants, onChange }: PermissionPickerProps) {
  const grantedKeys = new Set(grants.map((grant) => grant.permissionKey));

  function toggle(permission: PermissionView) {
    if (grantedKeys.has(permission.key)) {
      onChange(grants.filter((grant) => grant.permissionKey !== permission.key));
    } else {
      onChange([...grants, { permissionKey: permission.key, scope: "org" }]);
    }
  }

  return (
    <div className="flex max-h-72 flex-col gap-3 overflow-y-auto rounded-md border border-[var(--color-border)] p-3">
      {permissions.map((group) => (
        <div key={group.resource} className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase text-[var(--color-muted-foreground)]">
            {group.resource}
          </span>
          {group.permissions.map((permission) => (
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
