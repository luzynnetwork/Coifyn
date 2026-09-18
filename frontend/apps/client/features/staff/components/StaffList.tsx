"use client";

import { useQuery } from "@tanstack/react-query";
import { listStaff } from "../../../lib/api/staff/list-staff";
import { listStaffInvites } from "../../../lib/api/staff/list-staff-invites";
import { listRoles } from "../../../lib/api/roles/list-roles";
import { listBranches } from "../../../lib/api/branches/list-branches";
import { StaffTable } from "./StaffTable";
import { InvitesTable } from "./InvitesTable";
import { InviteForm } from "./InviteForm";
import { RoleManager } from "./RoleManager";

export function StaffList() {
  const staffQuery = useQuery({ queryKey: ["staff"], queryFn: listStaff });
  const invitesQuery = useQuery({ queryKey: ["staff-invites"], queryFn: listStaffInvites });
  const rolesQuery = useQuery({ queryKey: ["roles"], queryFn: listRoles });
  const branchesQuery = useQuery({ queryKey: ["branches"], queryFn: listBranches });

  const roles = rolesQuery.data ?? [];
  const branches = branchesQuery.data ?? [];

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-8 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Team</h1>
        <InviteForm roles={roles} branches={branches} />
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-[var(--color-muted-foreground)]">Staff</h2>
        <StaffTable staff={staffQuery.data ?? []} roles={roles} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-[var(--color-muted-foreground)]">
          Pending invites
        </h2>
        <InvitesTable invites={invitesQuery.data ?? []} />
      </section>

      <RoleManager roles={roles} />
    </main>
  );
}
