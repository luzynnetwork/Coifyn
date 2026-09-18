"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { StaffInviteView } from "@coifyn/api-client";
import { Button, TableCell, TableRow } from "@coifyn/ui";
import { revokeStaffInvite } from "../../../lib/api/staff/revoke-staff-invite";

export interface InviteRowProps {
  invite: StaffInviteView;
}

export function InviteRow({ invite }: InviteRowProps) {
  const queryClient = useQueryClient();
  const revoke = useMutation({
    mutationFn: () => revokeStaffInvite(invite.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["staff-invites"] }),
  });

  return (
    <TableRow>
      <TableCell>{invite.email}</TableCell>
      <TableCell>{new Date(invite.expiresAt).toLocaleDateString()}</TableCell>
      <TableCell>
        <Button variant="outline" size="sm" disabled={revoke.isPending} onClick={() => revoke.mutate()}>
          Revoke
        </Button>
      </TableCell>
    </TableRow>
  );
}
