"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getLastCut } from "@coifyn/api-client";
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@coifyn/ui";

/** Shows the serving stylist — a stand-in included — the customer's last cut and photos. */
export function LastCutDialog({ appointmentId }: { appointmentId: string }) {
  const [open, setOpen] = useState(false);
  const last = useQuery({
    queryKey: ["last-cut", appointmentId],
    queryFn: () => getLastCut(appointmentId),
    enabled: open,
  });
  const cut = last.data?.lastCut;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          Last cut
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Last cut</DialogTitle>
        </DialogHeader>
        {last.isLoading ? <p className="text-sm">Loading…</p> : null}
        {last.data && !cut ? (
          <p className="text-sm text-[var(--color-muted-foreground)]">No cut recorded yet.</p>
        ) : null}
        {cut ? (
          <div className="flex flex-col gap-2 text-sm">
            <p>
              <strong>Fade:</strong> {cut.fadeType ?? "—"}
            </p>
            <p>
              <strong>Guards:</strong>{" "}
              {Object.entries(cut.clipperGuards)
                .map(([k, v]) => `${k} ${String(v)}`)
                .join(", ") || "—"}
            </p>
            {cut.partingNotes ? <p>Parting: {cut.partingNotes}</p> : null}
            {cut.beardNotes ? <p>Beard: {cut.beardNotes}</p> : null}
            {cut.productsUsed.length > 0 ? <p>Products: {cut.productsUsed.join(", ")}</p> : null}
            {cut.freeText ? <p>{cut.freeText}</p> : null}
            <div className="flex flex-wrap gap-2">
              {(cut.photos ?? []).map((p) =>
                p.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={p.id} src={p.url} alt={`${p.angle} view`} className="h-24 w-24 rounded object-cover" />
                ) : null,
              )}
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
