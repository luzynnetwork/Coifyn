"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  arriveAppointment,
  cancelAppointment,
  completeAppointment,
  noShowAppointment,
  startAppointment,
  type AppointmentView,
  type StylistView,
} from "@coifyn/api-client";
import { Badge, Button } from "@coifyn/ui";
import { formatTime } from "../../../shared/lib/dates";
import { LastCutDialog } from "./LastCutDialog";
import { RescheduleDialog } from "./RescheduleDialog";
import { StandInPicker } from "./StandInPicker";

export interface AppointmentCardProps {
  appointment: AppointmentView;
  customerName?: string | null;
  stylists: StylistView[];
}

const NEXT: Record<string, { label: string; run: (id: string) => Promise<unknown> }[]> = {
  booked: [
    { label: "Arrived", run: arriveAppointment },
    { label: "No-show", run: noShowAppointment },
    { label: "Cancel", run: cancelAppointment },
  ],
  arrived: [
    { label: "Start", run: startAppointment },
    { label: "Cancel", run: cancelAppointment },
  ],
  in_service: [{ label: "Complete", run: completeAppointment }],
};

export function AppointmentCard({ appointment, customerName, stylists }: AppointmentCardProps) {
  const queryClient = useQueryClient();
  const transition = useMutation({
    mutationFn: (run: (id: string) => Promise<unknown>) => run(appointment.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["appointments"] }),
  });

  const active = ["booked", "arrived"].includes(appointment.status);
  const stoodIn =
    appointment.originalStylistId && appointment.originalStylistId !== appointment.stylistId
      ? stylists.find((s) => s.id === appointment.originalStylistId)?.displayName
      : null;

  return (
    <div className="flex flex-col gap-2 rounded-md border border-[var(--color-border)] p-2 text-sm">
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium">
          {formatTime(appointment.startAt)}–{formatTime(appointment.endAt)}
        </span>
        <Badge variant="secondary">{appointment.status.replace("_", " ")}</Badge>
      </div>
      <p>{customerName ?? "Walk-in / no customer"}</p>
      {stoodIn ? (
        <p className="text-xs text-[var(--color-muted-foreground)]">Stand-in for {stoodIn}</p>
      ) : null}
      <div className="flex flex-wrap gap-1">
        {(NEXT[appointment.status] ?? []).map((action) => (
          <Button
            key={action.label}
            size="sm"
            variant="outline"
            disabled={transition.isPending}
            onClick={() => transition.mutate(action.run)}
          >
            {action.label}
          </Button>
        ))}
        {active ? <RescheduleDialog appointment={appointment} /> : null}
        {active ? <StandInPicker appointment={appointment} stylists={stylists} /> : null}
        {appointment.customerId ? <LastCutDialog appointmentId={appointment.id} /> : null}
      </div>
    </div>
  );
}
