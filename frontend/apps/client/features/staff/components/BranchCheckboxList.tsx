"use client";

import type { BranchView } from "@coifyn/api-client";

export interface BranchCheckboxListProps {
  branches: BranchView[];
  selected: string[];
  onChange: (branchIds: string[]) => void;
}

export function BranchCheckboxList({ branches, selected, onChange }: BranchCheckboxListProps) {
  function toggle(branchId: string) {
    onChange(
      selected.includes(branchId)
        ? selected.filter((id) => id !== branchId)
        : [...selected, branchId],
    );
  }

  return (
    <div className="flex flex-col gap-1">
      {branches.map((branch) => (
        <label key={branch.id} className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={selected.includes(branch.id)}
            onChange={() => toggle(branch.id)}
          />
          {branch.name}
        </label>
      ))}
    </div>
  );
}
