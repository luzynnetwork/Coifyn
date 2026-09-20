"use client";

import type { BranchView, RoleView, StaffMemberView } from "@coifyn/api-client";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@coifyn/ui";
import { StaffRow } from "./StaffRow";

export interface StaffTableProps {
  staff: StaffMemberView[];
  roles: RoleView[];
  branches: BranchView[];
}

export function StaffTable({ staff, roles, branches }: StaffTableProps) {
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
          <TableHead>Branches</TableHead>
          <TableHead className="w-48" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {staff.map((member) => (
          <StaffRow key={member.userId} member={member} roles={roles} branches={branches} />
        ))}
      </TableBody>
    </Table>
  );
}
