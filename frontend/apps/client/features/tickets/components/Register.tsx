"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { listBranches } from "../../../lib/api/branches/list-branches";
import { getCurrentRegisterSession } from "../../../lib/api/tickets/get-current-register-session";
import { BranchSelector } from "../../../shared/components/BranchSelector";
import { RegisterSessionPanel } from "./RegisterSessionPanel";
import { NewTicketButton } from "./NewTicketButton";
import { TicketPanel } from "./TicketPanel";

export function Register() {
  const branchesQuery = useQuery({ queryKey: ["branches"], queryFn: listBranches });
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const [ticketId, setTicketId] = useState<string | null>(null);

  const branches = branchesQuery.data ?? [];
  const branchId = selectedBranchId ?? branches[0]?.id ?? "";

  const sessionQuery = useQuery({
    queryKey: ["register-session", branchId],
    queryFn: () => getCurrentRegisterSession(branchId),
    enabled: Boolean(branchId),
  });

  const session = sessionQuery.data ?? null;

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Register</h1>
        <BranchSelector
          branches={branches}
          selectedBranchId={branchId || null}
          onSelect={setSelectedBranchId}
        />
      </div>

      {branchId ? <RegisterSessionPanel branchId={branchId} session={session} /> : null}

      {session ? (
        ticketId ? (
          <TicketPanel ticketId={ticketId} onVoided={() => setTicketId(null)} />
        ) : (
          <NewTicketButton branchId={branchId} onCreated={setTicketId} />
        )
      ) : null}
    </main>
  );
}
