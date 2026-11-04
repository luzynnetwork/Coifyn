"use client";

import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { BranchView, StaffMemberView } from "@coifyn/api-client";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@coifyn/ui";
import { updateStaff } from "../../../lib/api/staff/update-staff";
import { BranchCheckboxList } from "./BranchCheckboxList";

export interface StaffBranchesDialogProps {
  member: StaffMemberView;
  branches: BranchView[];
}

/** Edits which branches a staff member belongs to (PATCH /staff/:userId { branchIds }). */
export function StaffBranchesDialog({ member, branches }: StaffBranchesDialogProps) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>(member.branchIds);

  useEffect(() => {
    if (open) setSelected(member.branchIds);
  }, [open, member.branchIds]);

  const save = useMutation({
    mutationFn: () => updateStaff(member.userId, { branchIds: selected }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      setOpen(false);
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Branches
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Branches for {member.displayName ?? member.email}</DialogTitle>
          <DialogDescription>Choose where this person can work.</DialogDescription>
        </DialogHeader>
        <BranchCheckboxList branches={branches} selected={selected} onChange={setSelected} />
        <DialogFooter>
          <Button disabled={selected.length === 0 || save.isPending} onClick={() => save.mutate()}>
            Save branches
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
