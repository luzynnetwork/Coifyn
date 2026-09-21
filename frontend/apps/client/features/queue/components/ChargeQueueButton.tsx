"use client";

import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import type { QueueEntryView } from "@coifyn/api-client";
import { Button, toast } from "@coifyn/ui";
import { addTicketLine } from "../../../lib/api/tickets/add-ticket-line";
import { createTicket } from "../../../lib/api/tickets/create-ticket";
import { getCurrentRegisterSession } from "../../../lib/api/tickets/get-current-register-session";

export interface ChargeQueueButtonProps {
  entry: QueueEntryView;
}

/**
 * Turns a queue entry into a POS ticket (source "queue", sourceId = entry id),
 * pre-fills the services the customer asked for, then opens it in the POS.
 */
export function ChargeQueueButton({ entry }: ChargeQueueButtonProps) {
  const router = useRouter();

  const charge = useMutation({
    mutationFn: async () => {
      // A ticket takes its register session at creation; without an open
      // register its cash would never reconcile, so require one first.
      const session = await getCurrentRegisterSession(entry.branchId);
      if (!session) {
        throw new Error("Open the register in POS before charging.");
      }
      const ticket = await createTicket({
        branchId: entry.branchId,
        source: "queue",
        sourceId: entry.id,
      });
      for (const serviceId of entry.requestedServiceIds) {
        try {
          await addTicketLine(ticket.id, {
            kind: "service",
            refId: serviceId,
            stylistId: entry.assignedStylistId ?? undefined,
            qty: 1,
          });
        } catch {
          toast.warning("A requested service could not be added; add it in POS.");
        }
      }
      return ticket;
    },
    onSuccess: (ticket) => {
      const params = new URLSearchParams({ branchId: entry.branchId, ticketId: ticket.id });
      router.push(`/pos?${params.toString()}`);
    },
  });

  return (
    <Button size="sm" disabled={charge.isPending} onClick={() => charge.mutate()}>
      Charge
    </Button>
  );
}
