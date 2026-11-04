"use client";

import { useMutation } from "@tanstack/react-query";
import type { TicketLineView } from "@coifyn/api-client";
import { formatMoney } from "@coifyn/shared";
import { Button } from "@coifyn/ui";
import { deleteTicketLine } from "../../../lib/api/tickets/delete-ticket-line";

export interface LineItemProps {
  ticketId: string;
  line: TicketLineView;
  onChanged: () => void;
}

export function LineItem({ ticketId, line, onChanged }: LineItemProps) {
  const remove = useMutation({
    mutationFn: () => deleteTicketLine(ticketId, line.id),
    onSuccess: onChanged,
  });

  return (
    <div className="flex items-center justify-between text-sm">
      <span>
        {line.description} × {line.qty}
      </span>
      <div className="flex items-center gap-3">
        <span>{formatMoney(line.lineTotalMinor)}</span>
        <Button variant="ghost" size="sm" disabled={remove.isPending} onClick={() => remove.mutate()}>
          Remove
        </Button>
      </div>
    </div>
  );
}
