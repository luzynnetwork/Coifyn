"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { BranchView, RoleView, StaffMemberView } from "@coifyn/api-client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  TableCell,
  TableRow,
} from "@coifyn/ui";
import { assignRole } from "../../../lib/api/roles/assign-role";
import { StaffBranchesDialog } from "./StaffBranchesDialog";
import { DeactivateStaffDialog } from "./DeactivateStaffDialog";

export interface StaffRowProps {
  member: StaffMemberView;
  roles: RoleView[];
  branches: BranchView[];
}

export function StaffRow({ member, roles, branches }: StaffRowProps) {
  const queryClient = useQueryClient();
  const changeRole = useMutation({
    mutationFn: (roleId: string) => assignRole(member.userId, roleId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["staff"] }),
  });

  const branchNames = member.branchIds
    .map((id) => branches.find((branch) => branch.id === id)?.name)
    .filter(Boolean)
    .join(", ");

  return (
    <TableRow>
      <TableCell>{member.displayName ?? "-"}</TableCell>
      <TableCell>{member.email ?? "-"}</TableCell>
      <TableCell>
        <Select value={member.roleId} onValueChange={(value) => changeRole.mutate(value)}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {roles.map((role) => (
              <SelectItem key={role.id} value={role.id}>
                {role.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell className="text-sm">{branchNames || "No branches"}</TableCell>
      <TableCell>
        <div className="flex gap-1">
          <StaffBranchesDialog member={member} branches={branches} />
          <DeactivateStaffDialog member={member} />
        </div>
      </TableCell>
    </TableRow>
  );
}
