"use client";

import type { StaffInviteView } from "@coifyn/api-client";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@coifyn/ui";
import { InviteRow } from "./InviteRow";

export interface InvitesTableProps {
  invites: StaffInviteView[];
}

export function InvitesTable({ invites }: InvitesTableProps) {
  const pending = invites.filter((invite) => invite.status === "pending");
  if (pending.length === 0) {
    return <p className="text-sm text-[var(--color-muted-foreground)]">No pending invites.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Email</TableHead>
          <TableHead>Expires</TableHead>
          <TableHead className="w-24" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {pending.map((invite) => (
          <InviteRow key={invite.id} invite={invite} />
        ))}
      </TableBody>
    </Table>
  );
}
