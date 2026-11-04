"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { decideTimeOff, listTimeOff } from "@coifyn/api-client";
import { Badge, Button, toast } from "@coifyn/ui";
import { listStylists } from "../../../lib/api/stylists/list-stylists";

export function TimeOffQueue({ branchId }: { branchId: string }) {
  const queryClient = useQueryClient();
  const requests = useQuery({
    queryKey: ["time-off", branchId],
    queryFn: () => listTimeOff(branchId),
  });
  const stylists = useQuery({ queryKey: ["stylists"], queryFn: listStylists });
  const names = new Map((stylists.data ?? []).map((s) => [s.id, s.displayName]));

  const decide = useMutation({
    mutationFn: (v: { id: string; decision: "approve" | "deny" }) => decideTimeOff(v.id, v.decision),
    onSuccess: (result) => {
      if (result.affectedAppointments.length > 0) {
        toast.warning(
          `${result.affectedAppointments.length} existing booking(s) fall in this time off — reschedule or reassign them.`,
        );
      }
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: ["time-off"] }),
        queryClient.invalidateQueries({ queryKey: ["roster"] }),
      ]);
    },
  });

  return (
    <div className="flex flex-col gap-2">
      {(requests.data ?? []).map((r) => (
        <div key={r.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-[var(--color-border)] p-3 text-sm">
          <div>
            <p className="font-medium">{names.get(r.stylistId) ?? "Stylist"}</p>
            <p className="text-[var(--color-muted-foreground)]">
              {new Date(r.fromAt).toLocaleString()} → {new Date(r.toAt).toLocaleString()}
              {r.reason ? ` · ${r.reason}` : ""}
            </p>
          </div>
          {r.status === "requested" ? (
            <div className="flex gap-2">
              <Button size="sm" onClick={() => decide.mutate({ id: r.id, decision: "approve" })}>
                Approve
              </Button>
              <Button size="sm" variant="outline" onClick={() => decide.mutate({ id: r.id, decision: "deny" })}>
                Deny
              </Button>
            </div>
          ) : (
            <Badge variant={r.status === "approved" ? "default" : "secondary"}>{r.status}</Badge>
          )}
        </div>
      ))}
      {requests.data?.length === 0 ? (
        <p className="text-sm text-[var(--color-muted-foreground)]">No time-off requests.</p>
      ) : null}
    </div>
  );
}
