"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@coifyn/ui";
import { listBranches } from "../../../lib/api/branches/list-branches";
import { getDayReport } from "../../../lib/api/reports/get-day-report";
import { BranchSelector } from "../../../shared/components/BranchSelector";
import { DayReportStats } from "./DayReportStats";
import { SalesByStylist } from "./SalesByStylist";
import { SalesByService } from "./SalesByService";

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function DayReport() {
  const branchesQuery = useQuery({ queryKey: ["branches"], queryFn: listBranches });
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const [date, setDate] = useState(today());

  const branches = branchesQuery.data ?? [];
  const branchId = selectedBranchId ?? branches[0]?.id ?? "";

  const dayReportQuery = useQuery({
    queryKey: ["day-report", branchId, date],
    queryFn: () => getDayReport(branchId, date),
    enabled: Boolean(branchId && date),
  });

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Day report</h1>
        <div className="flex items-center gap-3">
          <BranchSelector
            branches={branches}
            selectedBranchId={branchId || null}
            onSelect={setSelectedBranchId}
          />
          <Input
            type="date"
            className="w-40"
            value={date}
            onChange={(event) => setDate(event.target.value)}
          />
        </div>
      </div>

      {dayReportQuery.data ? <DayReportStats report={dayReportQuery.data} /> : null}

      <SalesByStylist date={date} />
      <SalesByService date={date} />
    </main>
  );
}
