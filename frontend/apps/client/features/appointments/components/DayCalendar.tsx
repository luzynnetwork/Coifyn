"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { listAppointments } from "../../../lib/api/appointments/list-appointments";
import { listCustomers } from "../../../lib/api/customers/list-customers";
import { listStylists } from "../../../lib/api/stylists/list-stylists";
import { useSelectedBranch } from "../../../hooks/use-selected-branch";
import { useTopicStream } from "../../../hooks/use-topic-stream";
import { BranchSelector } from "../../../shared/components/BranchSelector";
import { DateNav } from "../../../shared/components/DateNav";
import { PageHeader } from "../../../shared/components/PageHeader";
import { todayString } from "../../../shared/lib/dates";
import { BookDialog } from "./BookDialog";
import { StylistColumn } from "./StylistColumn";

/** The day's calendar: one column per stylist, live via `front-desk:<branchId>`. */
export function DayCalendar() {
  const queryClient = useQueryClient();
  const { branches, branchId, setBranchId } = useSelectedBranch();
  const [date, setDate] = useState(todayString);

  const stylists = useQuery({ queryKey: ["stylists"], queryFn: listStylists });
  const customers = useQuery({ queryKey: ["customers", ""], queryFn: () => listCustomers() });
  const appointments = useQuery({
    queryKey: ["appointments", branchId, date],
    queryFn: () => listAppointments(branchId, date),
    enabled: Boolean(branchId),
  });

  useTopicStream({
    topic: `front-desk:${branchId}`,
    enabled: Boolean(branchId),
    onEvent: () => queryClient.invalidateQueries({ queryKey: ["appointments"] }),
  });

  const columns = (stylists.data ?? []).filter((s) => s.branchId === branchId);
  const names = new Map((customers.data ?? []).map((c) => [c.id, c.name]));
  const visible = (appointments.data ?? []).filter((a) => a.status !== "cancelled");

  return (
    <main className="flex flex-col gap-6 p-6">
      <PageHeader title="Calendar">
        <BranchSelector branches={branches} selectedBranchId={branchId || null} onSelect={setBranchId} />
        <DateNav date={date} onChange={setDate} />
        {branchId ? <BookDialog branchId={branchId} date={date} stylists={stylists.data ?? []} /> : null}
      </PageHeader>
      <div className="flex gap-4 overflow-x-auto">
        {columns.map((s) => (
          <StylistColumn
            key={s.id}
            stylist={s}
            stylists={stylists.data ?? []}
            customerNames={names}
            appointments={visible.filter((a) => a.stylistId === s.id)}
          />
        ))}
      </div>
    </main>
  );
}
