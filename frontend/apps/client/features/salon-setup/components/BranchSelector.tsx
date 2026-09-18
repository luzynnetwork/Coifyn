"use client";

import type { BranchView } from "@coifyn/api-client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@coifyn/ui";

export interface BranchSelectorProps {
  branches: BranchView[];
  selectedBranchId: string | null;
  onSelect: (branchId: string) => void;
}

export function BranchSelector({ branches, selectedBranchId, onSelect }: BranchSelectorProps) {
  if (branches.length <= 1) return null;

  return (
    <Select value={selectedBranchId ?? undefined} onValueChange={onSelect}>
      <SelectTrigger className="w-56">
        <SelectValue placeholder="Select a branch" />
      </SelectTrigger>
      <SelectContent>
        {branches.map((branch) => (
          <SelectItem key={branch.id} value={branch.id}>
            {branch.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
