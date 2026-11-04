"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  resolveOffer,
  type DisruptionOfferView,
  type OfferChoice,
  type StylistView,
} from "@coifyn/api-client";
import { Badge, Button } from "@coifyn/ui";

const LABEL: Record<OfferChoice, string> = {
  wait: "Will wait",
  next_slot: "Next slot",
  stand_in: "Use stand-in",
  cancel: "Cancel booking",
};

function OfferRow({ offer, stylists }: { offer: DisruptionOfferView; stylists: StylistView[] }) {
  const queryClient = useQueryClient();
  const [standInId, setStandInId] = useState("");
  const resolve = useMutation({
    mutationFn: (choice: OfferChoice) =>
      resolveOffer(offer.id, choice, choice === "stand_in" ? standInId : undefined),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["disruptions"] }),
  });

  const standIn = offer.options.find((o) => o.choice === "stand_in");
  const pending = offer.choice === "pending";

  return (
    <div className="flex flex-col gap-2 rounded border border-[var(--color-border)] p-2 text-sm">
      <div className="flex items-center justify-between">
        <span>Appointment {offer.appointmentId.slice(0, 8)}</span>
        {pending ? (
          <span className="flex items-center gap-2">
            {offer.escalatedAt ? <Badge variant="destructive">Escalated</Badge> : null}
            <Badge variant="secondary">Waiting for answer</Badge>
          </span>
        ) : (
          <Badge>{LABEL[offer.choice as OfferChoice]}</Badge>
        )}
      </div>
      {pending ? (
        <div className="flex flex-wrap items-center gap-2">
          {offer.options.map((o) =>
            o.choice === "stand_in" ? null : (
              <Button key={o.choice} size="sm" variant="outline" disabled={resolve.isPending} onClick={() => resolve.mutate(o.choice)}>
                {LABEL[o.choice]}
              </Button>
            ),
          )}
          {standIn ? (
            <span className="flex items-center gap-1">
              <select
                className="rounded border border-[var(--color-border)] bg-transparent px-1 py-1 text-sm"
                value={standInId}
                onChange={(e) => setStandInId(e.target.value)}
                aria-label="Stand-in"
              >
                <option value="">Stand-in…</option>
                {(standIn.stylistIds ?? []).map((id) => (
                  <option key={id} value={id}>
                    {stylists.find((s) => s.id === id)?.displayName ?? id}
                  </option>
                ))}
              </select>
              <Button size="sm" disabled={!standInId || resolve.isPending} onClick={() => resolve.mutate("stand_in")}>
                Apply
              </Button>
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function OfferTracker({
  offers,
  stylists,
}: {
  offers: DisruptionOfferView[];
  stylists: StylistView[];
}) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-medium">Customer answers ({offers.length})</h3>
      {offers.map((o) => (
        <OfferRow key={o.id} offer={o} stylists={stylists} />
      ))}
    </div>
  );
}
