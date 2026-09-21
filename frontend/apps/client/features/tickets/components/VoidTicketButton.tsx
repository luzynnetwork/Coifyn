"use client";

import { useMutation } from "@tanstack/react-query";
import { Button } from "@coifyn/ui";
import { voidTicket } from "../../../lib/api/tickets/void-ticket";
import { ReasonDialog } from "../../../shared/components/ReasonDialog";

export interface VoidTicketButtonProps {
  ticketId: string;
  onVoided: () => void;
}

/** Voids an open ticket; the reason (min 3 chars) is mandatory and audited. */
export function VoidTicketButton({ ticketId, onVoided }: VoidTicketButtonProps) {
  const voidMutation = useMutation({
    mutationFn: (reason: string) => voidTicket(ticketId, { reason }),
    onSuccess: onVoided,
  });

  return (
    <ReasonDialog
      title="Void this ticket"
      description="A voided ticket cannot be paid or edited. Tell us why it is being voided."
      confirmLabel="Void ticket"
      isPending={voidMutation.isPending}
      onConfirm={(reason) => voidMutation.mutate(reason)}
      trigger={<Button variant="destructive">Void</Button>}
    />
  );
}
