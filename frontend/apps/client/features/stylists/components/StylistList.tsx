"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { listStylists } from "../../../lib/api/stylists/list-stylists";
import { listBranches } from "../../../lib/api/branches/list-branches";
import { listStaff } from "../../../lib/api/staff/list-staff";
import { StylistCard } from "./StylistCard";
import { AddStylistDialog } from "./AddStylistDialog";
import { StylistDetailSheet } from "./StylistDetailSheet";

export function StylistList() {
  const stylistsQuery = useQuery({ queryKey: ["stylists"], queryFn: listStylists });
  const branchesQuery = useQuery({ queryKey: ["branches"], queryFn: listBranches });
  const staffQuery = useQuery({ queryKey: ["staff"], queryFn: listStaff });
  const [selectedStylistId, setSelectedStylistId] = useState<string | null>(null);

  const stylists = stylistsQuery.data ?? [];
  const selectedStylist = stylists.find((s) => s.id === selectedStylistId) ?? null;

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Stylists</h1>
        <AddStylistDialog branches={branchesQuery.data ?? []} staff={staffQuery.data ?? []} />
      </div>

      {stylists.length === 0 ? (
        <p className="text-sm text-[var(--color-muted-foreground)]">No stylists yet.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          {stylists.map((stylist) => (
            <StylistCard
              key={stylist.id}
              stylist={stylist}
              onOpen={() => setSelectedStylistId(stylist.id)}
            />
          ))}
        </div>
      )}

      <StylistDetailSheet
        stylist={selectedStylist}
        open={selectedStylist !== null}
        onOpenChange={(open) => !open && setSelectedStylistId(null)}
      />
    </main>
  );
}
