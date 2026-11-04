"use client";

import { useQuery } from "@tanstack/react-query";
import { listChairs } from "../../../lib/api/chairs/list-chairs";
import { ChairList } from "./ChairList";
import { AddChairDialog } from "./AddChairDialog";

export interface ChairsTabProps {
  branchId: string;
}

export function ChairsTab({ branchId }: ChairsTabProps) {
  const chairsQuery = useQuery({
    queryKey: ["chairs", branchId],
    queryFn: () => listChairs(branchId),
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <AddChairDialog branchId={branchId} />
      </div>
      <ChairList branchId={branchId} chairs={chairsQuery.data ?? []} />
    </div>
  );
}
