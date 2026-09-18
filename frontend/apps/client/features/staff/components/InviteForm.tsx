"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { BranchView, RoleView } from "@coifyn/api-client";
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@coifyn/ui";
import { createStaffInvite } from "../../../lib/api/staff/create-staff-invite";
import { BranchCheckboxList } from "./BranchCheckboxList";

export interface InviteFormProps {
  roles: RoleView[];
  branches: BranchView[];
}

export function InviteForm({ roles, branches }: InviteFormProps) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [roleId, setRoleId] = useState("");
  const [branchIds, setBranchIds] = useState<string[]>([]);

  const invite = useMutation({
    mutationFn: () => createStaffInvite({ email, roleId, branchIds }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff-invites"] });
      setEmail("");
      setRoleId("");
      setBranchIds([]);
      setOpen(false);
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Invite staff</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite a staff member</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <Label htmlFor="inviteEmail">Email</Label>
          <Input
            id="inviteEmail"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />

          <Label htmlFor="inviteRole">Role</Label>
          <Select value={roleId} onValueChange={setRoleId}>
            <SelectTrigger id="inviteRole">
              <SelectValue placeholder="Select a role" />
            </SelectTrigger>
            <SelectContent>
              {roles.map((role) => (
                <SelectItem key={role.id} value={role.id}>
                  {role.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Label>Branches</Label>
          <BranchCheckboxList branches={branches} selected={branchIds} onChange={setBranchIds} />
        </div>
        <DialogFooter>
          <Button
            disabled={!email || !roleId || branchIds.length === 0 || invite.isPending}
            onClick={() => invite.mutate()}
          >
            Send invite
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
