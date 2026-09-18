"use client";

import type { RoleView, StaffMemberView } from "@coifyn/api-client";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@coifyn/ui";
import { StaffRow } from "./StaffRow";

export interface StaffTableProps {
  staff: StaffMemberView[];
  roles: RoleView[];
}

export function StaffTable({ staff, roles }: StaffTableProps) {
  if (staff.length === 0) {
    return <p className="text-sm text-[var(--color-muted-foreground)]">No staff yet.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {staff.map((member) => (
          <StaffRow key={member.userId} member={member} roles={roles} />
        ))}
      </TableBody>
    </Table>
  );
}
