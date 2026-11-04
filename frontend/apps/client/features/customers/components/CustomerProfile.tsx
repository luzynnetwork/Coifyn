"use client";

import { useQuery } from "@tanstack/react-query";
import { Badge, Tabs, TabsContent, TabsList, TabsTrigger } from "@coifyn/ui";
import { getTimeline } from "@coifyn/api-client";
import { PageHeader } from "../../../shared/components/PageHeader";
import { CutRecordList } from "./CutRecordList";
import { FormulaList } from "./FormulaList";
import { LoyaltyPanel } from "./LoyaltyPanel";
import { PreferencesForm } from "./PreferencesForm";
import { Timeline } from "./Timeline";

export function CustomerProfile({ customerId }: { customerId: string }) {
  const timeline = useQuery({
    queryKey: ["timeline", customerId],
    queryFn: () => getTimeline(customerId),
  });
  const data = timeline.data;

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 p-6">
      <PageHeader title={data?.customer.name ?? "Customer"}>
        {data ? <span className="text-sm">{data.customer.phone}</span> : null}
        {data?.tags.map((t) => (
          <Badge key={t} variant="secondary">
            {t}
          </Badge>
        ))}
      </PageHeader>
      <Tabs defaultValue="timeline">
        <TabsList>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="cuts">Cuts</TabsTrigger>
          <TabsTrigger value="formulas">Formulas</TabsTrigger>
          <TabsTrigger value="loyalty">Loyalty</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
        </TabsList>
        <TabsContent value="timeline">
          <Timeline customerId={customerId} items={data?.items ?? []} />
        </TabsContent>
        <TabsContent value="cuts">
          <CutRecordList customerId={customerId} />
        </TabsContent>
        <TabsContent value="formulas">
          <FormulaList customerId={customerId} />
        </TabsContent>
        <TabsContent value="loyalty">
          <LoyaltyPanel customerId={customerId} />
        </TabsContent>
        <TabsContent value="preferences">
          <PreferencesForm customerId={customerId} />
        </TabsContent>
      </Tabs>
    </main>
  );
}
