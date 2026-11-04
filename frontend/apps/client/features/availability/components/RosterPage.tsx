"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@coifyn/ui";
import { BranchSelector } from "../../../shared/components/BranchSelector";
import { PageHeader } from "../../../shared/components/PageHeader";
import { useSelectedBranch } from "../../../hooks/use-selected-branch";
import { RosterGrid } from "./RosterGrid";
import { TemplateManager } from "./TemplateManager";
import { TimeOffQueue } from "./TimeOffQueue";

export function RosterPage() {
  const { branches, branchId, setBranchId } = useSelectedBranch();

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 p-6">
      <PageHeader title="Roster">
        <BranchSelector
          branches={branches}
          selectedBranchId={branchId || null}
          onSelect={setBranchId}
        />
      </PageHeader>

      {branchId ? (
        <Tabs defaultValue="week">
          <TabsList>
            <TabsTrigger value="week">Week</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="timeoff">Time off</TabsTrigger>
          </TabsList>
          <TabsContent value="week">
            <RosterGrid branchId={branchId} />
          </TabsContent>
          <TabsContent value="templates">
            <TemplateManager branchId={branchId} />
          </TabsContent>
          <TabsContent value="timeoff">
            <TimeOffQueue branchId={branchId} />
          </TabsContent>
        </Tabs>
      ) : null}
    </main>
  );
}
