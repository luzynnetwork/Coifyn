"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  confirmBookingRequest,
  declineBookingRequest,
  listBookingRequests,
  type StylistView,
} from "@coifyn/api-client";
import { Button, Card, CardContent, CardHeader, CardTitle, toast } from "@coifyn/ui";
import { formatDay, formatTime, toDateString } from "../../../shared/lib/dates";

/** Booking requests from the public customer app, waiting for staff to confirm. */
export function BookingRequests({
  branchId,
  stylists,
}: {
  branchId: string;
  stylists: StylistView[];
}) {
  const queryClient = useQueryClient();
  const requests = useQuery({
    queryKey: ["booking-requests", branchId],
    queryFn: () => listBookingRequests(branchId, "requested"),
  });
  const refresh = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ["booking-requests"] }),
      queryClient.invalidateQueries({ queryKey: ["front-desk"] }),
    ]);

  const confirm = useMutation({
    mutationFn: (id: string) => confirmBookingRequest(id),
    onSuccess: () => {
      toast.success("Confirmed — the booking is on the calendar");
      return refresh();
    },
  });
  const decline = useMutation({
    mutationFn: (id: string) => declineBookingRequest(id),
    onSuccess: refresh,
  });

  const list = requests.data ?? [];
  return (
    <Card>
      <CardHeader>
        <CardTitle>Booking requests ({list.length})</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {list.map((r) => (
          <div key={r.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <div>
              <p className="font-medium">
                {r.customerName} · {r.customerPhone}
              </p>
              <p className="text-[var(--color-muted-foreground)]">
                {stylists.find((s) => s.id === r.stylistId)?.displayName ?? "Stylist"} ·{" "}
                {formatDay(toDateString(new Date(r.startAt)))} {formatTime(r.startAt)}
              </p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" disabled={confirm.isPending} onClick={() => confirm.mutate(r.id)}>
                Confirm
              </Button>
              <Button size="sm" variant="outline" disabled={decline.isPending} onClick={() => decline.mutate(r.id)}>
                Decline
              </Button>
            </div>
          </div>
        ))}
        {list.length === 0 ? (
          <p className="text-sm text-[var(--color-muted-foreground)]">No pending requests.</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
