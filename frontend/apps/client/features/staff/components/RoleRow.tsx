"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { PermissionView, RoleView } from "@coifyn/api-client";
import { Badge, Button, TableCell, TableRow } from "@coifyn/ui";
import { deleteRole } from "../../../lib/api/roles/delete-role";
import { RoleForm } from "./RoleForm";

export interface RoleRowProps {
  role: RoleView;
  permissions: PermissionView[];
}

export function RoleRow({ role, permissions }: RoleRowProps) {
  const queryClient = useQueryClient();
  const remove = useMutation({
    mutationFn: () => deleteRole(role.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["roles"] }),
  });

  return (
    <TableRow>
      <TableCell>{role.name}</TableCell>
      <TableCell>
        <Badge variant={role.isStandard ? "secondary" : "default"}>
          {role.isStandard ? "Standard" : "Custom"}
        </Badge>
      </TableCell>
      <TableCell>{role.grants.length}</TableCell>
      <TableCell>
        {!role.isStandard ? (
          <div className="flex gap-1">
            <RoleForm mode="edit" role={role} permissions={permissions} />
            <Button
              variant="outline"
              size="sm"
              disabled={remove.isPending}
              onClick={() => remove.mutate()}
            >
              Delete
            </Button>
          </div>
        ) : null}
      </TableCell>
    </TableRow>
  );
}
