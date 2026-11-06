"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getFrontDeskBoard, type FrontDeskStylist } from "@coifyn/api-client";
import { Badge, Card, CardContent, CardHeader, CardTitle } from "@coifyn/ui";
import { listStylists } from "../../../lib/api/stylists/list-stylists";
import { useSelectedBranch } from "../../../hooks/use-selected-branch";
import { useTopicStream } from "../../../hooks/use-topic-stream";
import { BranchSelector } from "../../../shared/components/BranchSelector";
import { DateNav } from "../../../shared/components/DateNav";
import { PageHeader } from "../../../shared/components/PageHeader";
import { formatTime, todayString } from "../../../shared/lib/dates";
import { BookingRequests } from "./BookingRequests";

const LANES: { key: "upcoming" | "arrived" | "inService" | "done"; label: string }[] = [
  { key: "upcoming", label: "Upcoming" },
  { key: "arrived", label: "Arrived" },
  { key: "inService", label: "In service" },
  { key: "done", label: "Done" },
];

function StylistRow({ stylist }: { stylist: FrontDeskStylist }) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>{stylist.displayName}</CardTitle>
        <Badge variant="secondary">{stylist.status.replace("_", " ")}</Badge>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-4">
        {LANES.map((lane) => (
          <div key={lane.key} className="flex flex-col gap-1">
            <h3 className="text-xs font-medium uppercase text-[var(--color-muted-foreground)]">
              {lane.label} ({stylist[lane.key].length})
            </h3>
            {stylist[lane.key].map((a) => (
              <div key={a.id} className="rounded border border-[var(--color-border)] p-1.5 text-xs">
                <span className="font-medium">{formatTime(a.startAt)}</span> · {a.customerName ?? "—"}
              </div>
            ))}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

/** Everyone in the branch at a glance: status, arrivals, in-service, done — plus pending requests. */
export function FrontDeskBoard() {
  const queryClient = useQueryClient();
  const { branches, branchId, setBranchId } = useSelectedBranch();
  const [date, setDate] = useState(todayString);

  const board = useQuery({
    queryKey: ["front-desk", branchId, date],
    queryFn: () => getFrontDeskBoard(branchId, date),
    enabled: Boolean(branchId),
  });
  const stylists = useQuery({ queryKey: ["stylists"], queryFn: listStylists });

  useTopicStream({
    topic: `front-desk:${branchId}`,
    enabled: Boolean(branchId),
    onEvent: () => {
      void queryClient.invalidateQueries({ queryKey: ["front-desk"] });
      void queryClient.invalidateQueries({ queryKey: ["booking-requests"] });
    },
  });
  useTopicStream({
    topic: `stylist-status:${branchId}`,
    enabled: Boolean(branchId),
    onEvent: () => queryClient.invalidateQueries({ queryKey: ["front-desk"] }),
  });

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 p-6">
      <PageHeader title="Front desk">
        <BranchSelector branches={branches} selectedBranchId={branchId || null} onSelect={setBranchId} />
        <DateNav date={date} onChange={setDate} />
      </PageHeader>
      {branchId ? <BookingRequests branchId={branchId} stylists={stylists.data ?? []} /> : null}
      <div className="flex flex-col gap-4">
        {(board.data?.stylists ?? []).map((s) => (
          <StylistRow key={s.id} stylist={s} />
        ))}
      </div>
    </main>
  );
}
