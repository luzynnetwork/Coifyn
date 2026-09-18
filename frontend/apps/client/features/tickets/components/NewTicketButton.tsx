"use client";

import { useMutation } from "@tanstack/react-query";
import { Button } from "@coifyn/ui";
import { createTicket } from "../../../lib/api/tickets/create-ticket";

export interface NewTicketButtonProps {
  branchId: string;
  onCreated: (ticketId: string) => void;
}

export function NewTicketButton({ branchId, onCreated }: NewTicketButtonProps) {
  const create = useMutation({
    mutationFn: () => createTicket({ branchId, source: "walk_in" }),
    onSuccess: (ticket) => onCreated(ticket.id),
  });

  return (
    <Button disabled={create.isPending} onClick={() => create.mutate()}>
      New ticket
    </Button>
  );
}
