"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { notifyDisruption, type DisruptionView, type StylistView } from "@coifyn/api-client";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, toast } from "@coifyn/ui";
import { AffectedList } from "./AffectedList";
import { OfferTracker } from "./OfferTracker";

export interface DisruptionCardProps {
  disruption: DisruptionView;
  stylists: StylistView[];
}

const KIND_LABEL = {
  running_late: "Running late",
  absent: "Absent",
  left_early: "Left early",
} as const;

export function DisruptionCard({ disruption, stylists }: DisruptionCardProps) {
  const queryClient = useQueryClient();
  const stylist = stylists.find((s) => s.id === disruption.stylistId);

  const notify = useMutation({
    mutationFn: () => notifyDisruption(disruption.id),
    onSuccess: (result) => {
      toast.success(`${result.notified} customer(s) notified`);
      return queryClient.invalidateQueries({ queryKey: ["disruptions"] });
    },
  });

  const offers = disruption.offers ?? [];
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>
          {stylist?.displayName ?? "Stylist"} — {KIND_LABEL[disruption.kind]}
          {disruption.minutesLate ? ` (${disruption.minutesLate} min)` : ""}
        </CardTitle>
        <div className="flex items-center gap-2">
          <Badge variant={disruption.status === "open" ? "default" : "secondary"}>
            {disruption.status}
          </Badge>
          {disruption.status === "open" ? (
            <Button size="sm" disabled={notify.isPending} onClick={() => notify.mutate()}>
              {disruption.notifiedAt ? "Notify new arrivals" : "Notify customers"}
            </Button>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {offers.length === 0 ? <AffectedList disruptionId={disruption.id} /> : null}
        {offers.length > 0 ? <OfferTracker offers={offers} stylists={stylists} /> : null}
      </CardContent>
    </Card>
  );
}
