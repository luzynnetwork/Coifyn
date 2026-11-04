"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getDashboard } from "@coifyn/api-client";
import { Badge, Button } from "@coifyn/ui";
import { useSelectedBranch } from "../../../hooks/use-selected-branch";
import { BranchSelector } from "../../../shared/components/BranchSelector";
import { PageHeader } from "../../../shared/components/PageHeader";
import { KpiCard } from "./KpiCard";
import { StylistUtilization } from "./StylistUtilization";

const RANGES = ["today", "week", "month"] as const;

export function Dashboard() {
  const { branches, branchId, setBranchId } = useSelectedBranch();
  const [range, setRange] = useState<(typeof RANGES)[number]>("today");

  const dashboard = useQuery({
    queryKey: ["dashboard", branchId, range],
    queryFn: () => getDashboard(branchId, range, true),
    enabled: Boolean(branchId),
    refetchInterval: 60_000,
  });
  const data = dashboard.data;

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 p-6">
      <PageHeader title="Dashboard">
        <BranchSelector branches={branches} selectedBranchId={branchId || null} onSelect={setBranchId} />
        {RANGES.map((r) => (
          <Button key={r} size="sm" variant={r === range ? "default" : "outline"} onClick={() => setRange(r)}>
            {r}
          </Button>
        ))}
      </PageHeader>

      {data ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {data.kpis.map((k) => (
              <KpiCard key={k.key} kpi={k} />
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <Badge variant={data.unresolvedDisruptions > 0 ? "destructive" : "secondary"}>
              {data.unresolvedDisruptions} unresolved disruption(s)
            </Badge>
            <span>Unbooked rostered time: {Math.round(data.lowCoverGapMinutes / 60)} h</span>
            <span className="text-[var(--color-muted-foreground)]">
              Refreshed {new Date(data.refreshedAt).toLocaleTimeString()}
            </span>
          </div>
          <StylistUtilization rows={data.stylists} />
        </>
      ) : null}
    </main>
  );
}
