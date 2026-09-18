"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { WeekdayHours } from "@coifyn/api-client";
import { Button } from "@coifyn/ui";
import { getBranchHours } from "../../../lib/api/branch-hours/get-branch-hours";
import { setBranchHours } from "../../../lib/api/branch-hours/set-branch-hours";
import { WeekdayHoursRow } from "./WeekdayHoursRow";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function emptyWeek(): WeekdayHours[] {
  return WEEKDAY_LABELS.map((_, weekday) => ({
    weekday,
    isClosed: weekday === 0,
    opensAt: "09:00",
    closesAt: "18:00",
    breaks: [],
  }));
}

export interface HoursTabProps {
  branchId: string;
}

export function HoursTab({ branchId }: HoursTabProps) {
  const queryClient = useQueryClient();
  const hoursQuery = useQuery({
    queryKey: ["branch-hours", branchId],
    queryFn: () => getBranchHours(branchId),
  });
  const [week, setWeek] = useState<WeekdayHours[]>(emptyWeek());

  useEffect(() => {
    if (hoursQuery.data?.week?.length) setWeek(hoursQuery.data.week);
  }, [hoursQuery.data]);

  const save = useMutation({
    mutationFn: () => setBranchHours(branchId, { week }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["branch-hours", branchId] }),
  });

  function updateDay(next: WeekdayHours) {
    setWeek((current) => current.map((day) => (day.weekday === next.weekday ? next : day)));
  }

  return (
    <div className="flex flex-col gap-3">
      {week.map((day) => (
        <WeekdayHoursRow
          key={day.weekday}
          label={WEEKDAY_LABELS[day.weekday] ?? String(day.weekday)}
          day={day}
          onChange={updateDay}
        />
      ))}
      <Button className="w-fit" disabled={save.isPending} onClick={() => save.mutate()}>
        Save hours
      </Button>
    </div>
  );
}
