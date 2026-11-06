"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { listBranches } from "../../../lib/api/branches/list-branches";
import { getCurrentRegisterSession } from "../../../lib/api/tickets/get-current-register-session";
import { BranchSelector } from "../../../shared/components/BranchSelector";
import { RegisterSessionPanel } from "./RegisterSessionPanel";
import { NewTicketButton } from "./NewTicketButton";
import { TicketPanel } from "./TicketPanel";

export function Register() {
  // The queue's "Charge" action deep-links here with ?branchId=&ticketId=.
  const params = useSearchParams();
  const branchesQuery = useQuery({ queryKey: ["branches"], queryFn: listBranches });
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(
    params.get("branchId"),
  );
  const [ticketId, setTicketId] = useState<string | null>(params.get("ticketId"));

  const branches = branchesQuery.data ?? [];
  const branchId = selectedBranchId ?? branches[0]?.id ?? "";

  const sessionQuery = useQuery({
    queryKey: ["register-session", branchId],
    queryFn: () => getCurrentRegisterSession(branchId),
    enabled: Boolean(branchId),
  });

  const session = sessionQuery.data ?? null;

  function selectBranch(next: string) {
    setSelectedBranchId(next);
    setTicketId(null);
  }

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Register</h1>
        <BranchSelector
          branches={branches}
          selectedBranchId={branchId || null}
          onSelect={selectBranch}
        />
      </div>

      {branchId ? <RegisterSessionPanel branchId={branchId} session={session} /> : null}

      {ticketId ? (
        <TicketPanel ticketId={ticketId} onVoided={() => setTicketId(null)} />
      ) : session ? (
        <NewTicketButton branchId={branchId} onCreated={setTicketId} />
      ) : null}
    </main>
  );
}
