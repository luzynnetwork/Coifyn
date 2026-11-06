"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getRoster } from "@coifyn/api-client";
import { listStylists } from "../../../lib/api/stylists/list-stylists";
import { DateNav } from "../../../shared/components/DateNav";
import { addDays, formatDay, startOfWeek, todayString, weekDays } from "../../../shared/lib/dates";
import { RosterCell } from "./RosterCell";

export function RosterGrid({ branchId }: { branchId: string }) {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(todayString()));
  const days = weekDays(weekStart);

  const stylists = useQuery({ queryKey: ["stylists"], queryFn: listStylists });
  const roster = useQuery({
    queryKey: ["roster", branchId, weekStart],
    queryFn: () => getRoster(branchId, weekStart, addDays(weekStart, 6)),
  });

  const rows = (stylists.data ?? []).filter((s) => s.branchId === branchId);
  const shifts = roster.data?.shifts ?? [];
  const timeOff = roster.data?.timeOff ?? [];

  return (
    <div className="flex flex-col gap-3">
      <DateNav date={weekStart} step={7} onChange={(d) => setWeekStart(startOfWeek(d))} />
      <div className="overflow-x-auto rounded-md border border-[var(--color-border)]">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)] text-left">
              <th className="p-2">Stylist</th>
              {days.map((d) => (
                <th key={d} className="p-2 font-medium">
                  {formatDay(d)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((stylist) => (
              <tr key={stylist.id} className="border-b border-[var(--color-border)] align-top">
                <td className="p-2 font-medium">{stylist.displayName}</td>
                {days.map((d) => (
                  <RosterCell
                    key={d}
                    date={d}
                    stylistId={stylist.id}
                    shifts={shifts.filter((s) => s.stylistId === stylist.id)}
                    timeOff={timeOff.filter((t) => t.stylistId === stylist.id)}
                    queryKey={["roster", branchId, weekStart]}
                  />
                ))}
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td className="p-3 text-[var(--color-muted-foreground)]" colSpan={8}>
                  No stylists in this branch yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
