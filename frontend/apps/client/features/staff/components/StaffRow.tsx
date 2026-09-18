"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { RoleView, StaffMemberView } from "@coifyn/api-client";
import {
  Badge,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  TableCell,
  TableRow,
} from "@coifyn/ui";
import { assignRole } from "../../../lib/api/roles/assign-role";

export interface StaffRowProps {
  member: StaffMemberView;
  roles: RoleView[];
}

export function StaffRow({ member, roles }: StaffRowProps) {
  const queryClient = useQueryClient();
  const changeRole = useMutation({
    mutationFn: (roleId: string) => assignRole(member.userId, roleId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["staff"] }),
  });

  return (
    <TableRow>
      <TableCell>{member.displayName}</TableCell>
      <TableCell>{member.email}</TableCell>
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
      <TableCell>
        <Badge variant={member.isActive ? "default" : "secondary"}>
          {member.isActive ? "Active" : "Inactive"}
        </Badge>
      </TableCell>
    </TableRow>
  );
}
