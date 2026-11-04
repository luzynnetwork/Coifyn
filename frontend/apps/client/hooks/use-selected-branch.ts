"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { listBranches } from "../lib/api/branches/list-branches";

/** The branches the user can see plus the one currently selected (first by default). */
export function useSelectedBranch() {
  const branchesQuery = useQuery({ queryKey: ["branches"], queryFn: listBranches });
  const [selected, setSelected] = useState<string | null>(null);
  const branches = branchesQuery.data ?? [];
  const branchId = selected ?? branches[0]?.id ?? "";
  return { branches, branchId, setBranchId: setSelected };
}
