"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { listDisruptions } from "@coifyn/api-client";
import { listStylists } from "../../../lib/api/stylists/list-stylists";
import { useSelectedBranch } from "../../../hooks/use-selected-branch";
import { useTopicStream } from "../../../hooks/use-topic-stream";
import { BranchSelector } from "../../../shared/components/BranchSelector";
import { PageHeader } from "../../../shared/components/PageHeader";
import { DeclareDisruptionForm } from "./DeclareDisruptionForm";
import { DisruptionCard } from "./DisruptionCard";

/** Running-late and absence handling: declare, notify the affected, track answers. */
export function DisruptionPanel() {
  const queryClient = useQueryClient();
  const { branches, branchId, setBranchId } = useSelectedBranch();

  const stylists = useQuery({ queryKey: ["stylists"], queryFn: listStylists });
  const disruptions = useQuery({
    queryKey: ["disruptions", branchId],
    queryFn: () => listDisruptions(branchId),
    enabled: Boolean(branchId),
  });

  useTopicStream({
    topic: `disruptions:${branchId}`,
    enabled: Boolean(branchId),
    onEvent: () => queryClient.invalidateQueries({ queryKey: ["disruptions"] }),
  });

  const mine = (stylists.data ?? []).filter((s) => s.branchId === branchId);

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 p-6">
      <PageHeader title="Disruptions">
        <BranchSelector branches={branches} selectedBranchId={branchId || null} onSelect={setBranchId} />
      </PageHeader>
      <DeclareDisruptionForm stylists={mine} />
      <div className="flex flex-col gap-4">
        {(disruptions.data ?? []).map((d) => (
          <DisruptionCard key={d.id} disruption={d} stylists={stylists.data ?? []} />
        ))}
        {disruptions.data?.length === 0 ? (
          <p className="text-sm text-[var(--color-muted-foreground)]">Nothing disrupted. 🎉</p>
        ) : null}
      </div>
    </main>
  );
}
