"use client";

import type { PermissionView, RoleView } from "@coifyn/api-client";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@coifyn/ui";
import { RoleRow } from "./RoleRow";

export interface RoleTableProps {
  roles: RoleView[];
  permissions: PermissionView[];
}

export function RoleTable({ roles, permissions }: RoleTableProps) {
  if (roles.length === 0) {
    return <p className="text-sm text-[var(--color-muted-foreground)]">No roles yet.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Grants</TableHead>
          <TableHead className="w-16" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {roles.map((role) => (
          <RoleRow key={role.id} role={role} permissions={permissions} />
        ))}
      </TableBody>
    </Table>
  );
}
