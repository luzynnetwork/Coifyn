"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { listQueue } from "../../../lib/api/queue/list-queue";
import { listBranches } from "../../../lib/api/branches/list-branches";
import { useQueueStream } from "../../../hooks/use-queue-stream";
import { BranchSelector } from "../../../shared/components/BranchSelector";
import { JoinQueueForm } from "./JoinQueueForm";
import { QueueColumn } from "./QueueColumn";

export function QueueBoard() {
  const queryClient = useQueryClient();
  const branchesQuery = useQuery({ queryKey: ["branches"], queryFn: listBranches });
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);

  const branches = branchesQuery.data ?? [];
  const branchId = selectedBranchId ?? branches[0]?.id ?? "";

  const queueQuery = useQuery({
    queryKey: ["queue", branchId],
    queryFn: () => listQueue(branchId),
    enabled: Boolean(branchId),
  });

  useQueueStream({
    branchId,
    enabled: Boolean(branchId),
    onEvent: () => queryClient.invalidateQueries({ queryKey: ["queue", branchId] }),
  });

  const entries = queueQuery.data ?? [];

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Walk-in queue</h1>
        <div className="flex items-center gap-3">
          <BranchSelector
            branches={branches}
            selectedBranchId={branchId || null}
            onSelect={setSelectedBranchId}
          />
          {branchId ? <JoinQueueForm branchId={branchId} /> : null}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <QueueColumn
          title="Waiting"
          entries={entries.filter((e) => e.status === "waiting")}
        />
        <QueueColumn
          title="Assigned"
          entries={entries.filter((e) => e.status === "assigned")}
        />
        <QueueColumn
          title="In service"
          entries={entries.filter((e) => e.status === "in_service")}
        />
      </div>
    </main>
  );
}
