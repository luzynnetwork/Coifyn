"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { BranchView, StaffMemberView } from "@coifyn/api-client";
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
import { createStylist } from "../../../lib/api/stylists/create-stylist";

export interface AddStylistDialogProps {
  branches: BranchView[];
  staff: StaffMemberView[];
}

export function AddStylistDialog({ branches, staff }: AddStylistDialogProps) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [userId, setUserId] = useState("");
  const [branchId, setBranchId] = useState("");
  const [displayName, setDisplayName] = useState("");

  const create = useMutation({
    mutationFn: () => createStylist({ userId, branchId, displayName }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stylists"] });
      setUserId("");
      setBranchId("");
      setDisplayName("");
      setOpen(false);
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Add stylist</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a stylist</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <Label htmlFor="stylistStaff">Staff member</Label>
          <Select value={userId} onValueChange={setUserId}>
            <SelectTrigger id="stylistStaff">
              <SelectValue placeholder="Select a staff member" />
            </SelectTrigger>
            <SelectContent>
              {staff.map((member) => (
                <SelectItem key={member.userId} value={member.userId}>
                  {member.displayName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Label htmlFor="stylistName">Display name</Label>
          <Input
            id="stylistName"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
          />

          <Label htmlFor="stylistBranch">Home branch</Label>
          <Select value={branchId} onValueChange={setBranchId}>
            <SelectTrigger id="stylistBranch">
              <SelectValue placeholder="Select a branch" />
            </SelectTrigger>
            <SelectContent>
              {branches.map((branch) => (
                <SelectItem key={branch.id} value={branch.id}>
                  {branch.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button
            disabled={!userId || !branchId || !displayName || create.isPending}
            onClick={() => create.mutate()}
          >
            Add
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
