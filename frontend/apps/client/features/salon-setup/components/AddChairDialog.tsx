"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Input,
} from "@coifyn/ui";
import { createChair } from "../../../lib/api/chairs/create-chair";

export interface AddChairDialogProps {
  branchId: string;
}

export function AddChairDialog({ branchId }: AddChairDialogProps) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState("");

  const create = useMutation({
    mutationFn: () => createChair(branchId, { label }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chairs", branchId] });
      setLabel("");
      setOpen(false);
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Add chair</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a chair</DialogTitle>
        </DialogHeader>
        <Input
          placeholder="Chair label, e.g. Chair 1"
          value={label}
          onChange={(event) => setLabel(event.target.value)}
        />
        <DialogFooter>
          <Button disabled={!label || create.isPending} onClick={() => create.mutate()}>
            Add
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
