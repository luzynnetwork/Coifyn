"use client";

import { useQuery } from "@tanstack/react-query";
import { getPublicQueue } from "@coifyn/api-client";
import { Badge, Card, CardContent, CardHeader, CardTitle } from "@coifyn/ui";

/** Public wait board. Polls every 10 s — the push stream needs a staff login. */
export function LiveQueue({ branchId }: { branchId: string }) {
  const queue = useQuery({
    queryKey: ["public-queue", branchId],
    queryFn: () => getPublicQueue(branchId),
    refetchInterval: 10_000,
  });

  if (queue.isError) return <main className="p-6 text-sm">We couldn’t find that location.</main>;
  const data = queue.data;
  if (!data) return <main className="p-6 text-sm">Loading…</main>;

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-4 p-6">
      <h1 className="text-2xl font-semibold">{data.branchName} — wait times</h1>
      {data.lanes.map((lane) => (
        <Card key={lane.stylistId}>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-base">{lane.displayName}</CardTitle>
            <Badge variant={lane.busy ? "secondary" : "default"}>{lane.busy ? "With a client" : "Free"}</Badge>
          </CardHeader>
          <CardContent className="text-sm">
            {lane.waitingCount === 0
              ? "No one waiting"
              : `${lane.waitingCount} waiting · about ${lane.estimatedMinutes} min`}
          </CardContent>
        </Card>
      ))}
      <p className="text-xs text-[var(--color-muted-foreground)]">
        Updated {new Date(data.at).toLocaleTimeString()}
      </p>
    </main>
  );
}
