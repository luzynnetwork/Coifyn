"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { RegisterSessionView } from "@coifyn/api-client";
import { formatMoney, dollarsToMinor } from "@coifyn/shared";
import { Button, Card, CardContent, Input } from "@coifyn/ui";
import { openRegisterSession } from "../../../lib/api/tickets/open-register-session";
import { closeRegisterSession } from "../../../lib/api/tickets/close-register-session";

export interface RegisterSessionPanelProps {
  branchId: string;
  session: RegisterSessionView | null;
}

export function RegisterSessionPanel({ branchId, session }: RegisterSessionPanelProps) {
  const queryClient = useQueryClient();
  const [openingFloat, setOpeningFloat] = useState("");
  const [closingCount, setClosingCount] = useState("");

  const open = useMutation({
    mutationFn: () => openRegisterSession({ branchId, openingFloatMinor: dollarsToMinor(openingFloat) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["register-session", branchId] }),
  });

  const close = useMutation({
    mutationFn: () =>
      closeRegisterSession(session!.id, { closingCountMinor: dollarsToMinor(closingCount) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["register-session", branchId] }),
  });

  if (!session) {
    return (
      <Card>
        <CardContent className="flex items-center gap-3 pt-6">
          <Input
            type="number"
            step="0.01"
            placeholder="Opening float ($)"
            className="w-48"
            value={openingFloat}
            onChange={(event) => setOpeningFloat(event.target.value)}
          />
          <Button disabled={!openingFloat || open.isPending} onClick={() => open.mutate()}>
            Open register
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="flex items-center gap-3 pt-6">
        <span className="text-sm">
          Register open — opening float {formatMoney(session.openingFloatMinor)}
        </span>
        <Input
          type="number"
          step="0.01"
          placeholder="Closing count ($)"
          className="w-48"
          value={closingCount}
          onChange={(event) => setClosingCount(event.target.value)}
        />
        <Button
          variant="outline"
          disabled={!closingCount || close.isPending}
          onClick={() => close.mutate()}
        >
          Close register
        </Button>
      </CardContent>
    </Card>
  );
}
