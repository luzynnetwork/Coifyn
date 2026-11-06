"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { rescheduleAppointment, type AppointmentView } from "@coifyn/api-client";
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
import { toDateString } from "../../../shared/lib/dates";

const timeOf = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

export function RescheduleDialog({ appointment }: { appointment: AppointmentView }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(toDateString(new Date(appointment.startAt)));
  const [start, setStart] = useState(timeOf(appointment.startAt));
  const [reason, setReason] = useState("");

  const lengthMs = new Date(appointment.endAt).getTime() - new Date(appointment.startAt).getTime();

  const move = useMutation({
    mutationFn: () => {
      const startAt = new Date(`${date}T${start}:00`);
      return rescheduleAppointment(appointment.id, {
        startAt: startAt.toISOString(),
        endAt: new Date(startAt.getTime() + lengthMs).toISOString(),
        reason: reason || undefined,
      });
    },
    onSuccess: () => {
      toast.success("Appointment moved");
      setOpen(false);
      return queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          Reschedule
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reschedule</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <Label htmlFor="rsDate">Date</Label>
          <Input id="rsDate" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <Label htmlFor="rsTime">Start time</Label>
          <Input id="rsTime" type="time" value={start} onChange={(e) => setStart(e.target.value)} />
          <Label htmlFor="rsReason">Reason (optional)</Label>
          <Input id="rsReason" value={reason} onChange={(e) => setReason(e.target.value)} />
        </div>
        <DialogFooter>
          <Button onClick={() => move.mutate()} disabled={move.isPending}>
            Move appointment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
