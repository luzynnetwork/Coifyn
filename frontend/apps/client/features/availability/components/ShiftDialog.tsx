"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createShift } from "@coifyn/api-client";
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
  toast,
} from "@coifyn/ui";

export interface ShiftDialogProps {
  stylistId: string;
  date: string;
  queryKey: unknown[];
}

export function ShiftDialog({ stylistId, date, queryKey }: ShiftDialogProps) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("17:00");

  const create = useMutation({
    mutationFn: () =>
      createShift({
        stylistId,
        startAt: new Date(`${date}T${start}:00`).toISOString(),
        endAt: new Date(`${date}T${end}:00`).toISOString(),
      }),
    onSuccess: () => {
      toast.success("Shift added");
      setOpen(false);
      return queryClient.invalidateQueries({ queryKey });
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" aria-label="Add shift">
          +
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add shift — {date}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <Label htmlFor="shiftStart">Start</Label>
            <Input id="shiftStart" type="time" value={start} onChange={(e) => setStart(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="shiftEnd">End</Label>
            <Input id="shiftEnd" type="time" value={end} onChange={(e) => setEnd(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => create.mutate()} disabled={create.isPending || start >= end}>
            Add shift
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
