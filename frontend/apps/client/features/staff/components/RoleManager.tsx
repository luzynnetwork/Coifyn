"use client";

import { useQuery } from "@tanstack/react-query";
import type { RoleView } from "@coifyn/api-client";
import { listPermissions } from "../../../lib/api/roles/list-permissions";
import { RoleTable } from "./RoleTable";
import { RoleForm } from "./RoleForm";

export interface RoleManagerProps {
  roles: RoleView[];
}

export function RoleManager({ roles }: RoleManagerProps) {
  const permissionsQuery = useQuery({ queryKey: ["permissions"], queryFn: listPermissions });
  const permissions = permissionsQuery.data ?? [];

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-[var(--color-muted-foreground)]">
          Custom roles
        </h2>
        <RoleForm mode="create" permissions={permissions} />
      </div>
      <RoleTable roles={roles} permissions={permissions} />
    </section>
  );
}
