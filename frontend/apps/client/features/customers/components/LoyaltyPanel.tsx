"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adjustLoyalty, getLoyalty, getLoyaltyLedger } from "@coifyn/api-client";
import { Badge, Button, Card, CardContent, Input } from "@coifyn/ui";

export function LoyaltyPanel({ customerId }: { customerId: string }) {
  const queryClient = useQueryClient();
  const loyalty = useQuery({ queryKey: ["loyalty", customerId], queryFn: () => getLoyalty(customerId) });
  const ledger = useQuery({ queryKey: ["loyalty-ledger", customerId], queryFn: () => getLoyaltyLedger(customerId) });
  const [delta, setDelta] = useState("");
  const [reason, setReason] = useState("");

  const adjust = useMutation({
    mutationFn: () => adjustLoyalty(customerId, Number(delta), reason),
    onSuccess: () => {
      setDelta("");
      setReason("");
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: ["loyalty", customerId] }),
        queryClient.invalidateQueries({ queryKey: ["loyalty-ledger", customerId] }),
      ]);
    },
  });

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardContent className="flex items-center gap-4 pt-6">
          <span className="text-3xl font-semibold">{loyalty.data?.pointsBalance ?? 0}</span>
          <span>points</span>
          {loyalty.data?.tier ? <Badge>{loyalty.data.tier}</Badge> : null}
          <span className="text-sm text-[var(--color-muted-foreground)]">
            {loyalty.data?.rule.pointsPerUnit ?? 1} pt per currency unit spent
          </span>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Input className="w-28" type="number" placeholder="±points" value={delta} onChange={(e) => setDelta(e.target.value)} />
        <Input className="w-72" placeholder="Reason (required, audited)" value={reason} onChange={(e) => setReason(e.target.value)} />
        <Button
          variant="outline"
          disabled={!Number(delta) || reason.trim().length < 3 || adjust.isPending}
          onClick={() => adjust.mutate()}
        >
          Adjust
        </Button>
      </div>

      <ul className="flex flex-col gap-1 text-sm">
        {(ledger.data ?? []).map((l) => (
          <li key={l.id} className="flex justify-between rounded border border-[var(--color-border)] p-2">
            <span>
              {l.kind} · {l.source}
              {l.reason ? ` — ${l.reason}` : ""}
            </span>
            <span className={l.delta < 0 ? "text-red-600" : "text-green-700"}>
              {l.delta > 0 ? "+" : ""}
              {l.delta}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
