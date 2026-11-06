"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { reassignStylist, type AppointmentView, type StylistView } from "@coifyn/api-client";
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  toast,
} from "@coifyn/ui";

export interface StandInPickerProps {
  appointment: AppointmentView;
  stylists: StylistView[];
}

/** Hand a booking to another stylist; the customer's history still credits the one they chose. */
export function StandInPicker({ appointment, stylists }: StandInPickerProps) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [stylistId, setStylistId] = useState("");

  const options = stylists.filter(
    (s) => s.branchId === appointment.branchId && s.id !== appointment.stylistId,
  );

  const reassign = useMutation({
    mutationFn: () => reassignStylist(appointment.id, stylistId, "stand-in"),
    onSuccess: () => {
      toast.success("Stand-in assigned");
      setOpen(false);
      return queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          Stand-in
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Choose a stand-in</DialogTitle>
        </DialogHeader>
        <Select value={stylistId} onValueChange={setStylistId}>
          <SelectTrigger>
            <SelectValue placeholder="Pick a stylist" />
          </SelectTrigger>
          <SelectContent>
            {options.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.displayName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <DialogFooter>
          <Button onClick={() => reassign.mutate()} disabled={!stylistId || reassign.isPending}>
            Assign
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
