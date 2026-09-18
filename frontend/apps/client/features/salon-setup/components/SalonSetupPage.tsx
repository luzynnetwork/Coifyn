"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@coifyn/ui";
import { listBranches } from "../../../lib/api/branches/list-branches";
import { BranchSelector } from "./BranchSelector";
import { BranchInfoTab } from "./BranchInfoTab";
import { HoursTab } from "./HoursTab";
import { ChairsTab } from "./ChairsTab";
import { TaxTab } from "./TaxTab";

export function SalonSetupPage() {
  const branchesQuery = useQuery({ queryKey: ["branches"], queryFn: listBranches });
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);

  const branches = branchesQuery.data ?? [];
  const branchId = selectedBranchId ?? branches[0]?.id ?? null;

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Salon setup</h1>
        <BranchSelector
          branches={branches}
          selectedBranchId={branchId}
          onSelect={setSelectedBranchId}
        />
      </div>

      <Tabs defaultValue="branch">
        <TabsList>
          <TabsTrigger value="branch">Branch</TabsTrigger>
          <TabsTrigger value="hours">Hours</TabsTrigger>
          <TabsTrigger value="chairs">Chairs</TabsTrigger>
          <TabsTrigger value="tax">Tax</TabsTrigger>
        </TabsList>

        <TabsContent value="branch">
          {branchId ? <BranchInfoTab branchId={branchId} /> : null}
        </TabsContent>
        <TabsContent value="hours">
          {branchId ? <HoursTab branchId={branchId} /> : null}
        </TabsContent>
        <TabsContent value="chairs">
          {branchId ? <ChairsTab branchId={branchId} /> : null}
        </TabsContent>
        <TabsContent value="tax">
          <TaxTab />
        </TabsContent>
      </Tabs>
    </main>
  );
}
