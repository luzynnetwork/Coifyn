"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatMoney } from "@coifyn/shared";
import { Button, Card, CardContent, CardFooter, CardHeader, CardTitle, Separator } from "@coifyn/ui";
import { getTicket } from "../../../lib/api/tickets/get-ticket";
import { voidTicket } from "../../../lib/api/tickets/void-ticket";
import { LineItem } from "./LineItem";
import { ServicePicker } from "./ServicePicker";
import { DiscountDialog } from "./DiscountDialog";
import { PaymentDialog } from "./PaymentDialog";
import { ReceiptView } from "./ReceiptView";

export interface TicketPanelProps {
  ticketId: string;
  onVoided: () => void;
}

export function TicketPanel({ ticketId, onVoided }: TicketPanelProps) {
  const queryClient = useQueryClient();
  const ticketQuery = useQuery({
    queryKey: ["ticket", ticketId],
    queryFn: () => getTicket(ticketId),
  });
  const [voidReason, setVoidReason] = useState("");

  const voidMutation = useMutation({
    mutationFn: () => voidTicket(ticketId, { reason: voidReason || "Voided at register" }),
    onSuccess: onVoided,
  });

  const ticket = ticketQuery.data;
  if (!ticket) return null;

  if (ticket.status === "paid") {
    return <ReceiptView ticketId={ticketId} onDone={onVoided} />;
  }

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["ticket", ticketId] });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ticket</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {ticket.lines.map((line) => (
          <LineItem key={line.id} ticketId={ticketId} line={line} onChanged={invalidate} />
        ))}
        {ticket.lines.length === 0 ? (
          <p className="text-sm text-[var(--color-muted-foreground)]">No lines yet.</p>
        ) : null}

        <ServicePicker ticketId={ticketId} onAdded={invalidate} />

        <Separator className="my-2" />

        <div className="flex justify-between text-sm">
          <span>Subtotal</span>
          <span>{formatMoney(ticket.subtotalMinor)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Discount</span>
          <span>-{formatMoney(ticket.discountMinor)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Tax</span>
          <span>{formatMoney(ticket.taxMinor)}</span>
        </div>
        <div className="flex justify-between font-semibold">
          <span>Total</span>
          <span>{formatMoney(ticket.totalMinor)}</span>
        </div>
      </CardContent>
      <CardFooter className="flex flex-wrap gap-2">
        <DiscountDialog ticketId={ticketId} onApplied={invalidate} />
        <PaymentDialog ticketId={ticketId} totalMinor={ticket.totalMinor} onPaid={invalidate} />
        <Button
          variant="destructive"
          disabled={voidMutation.isPending}
          onClick={() => {
            setVoidReason("Voided at register");
            voidMutation.mutate();
          }}
        >
          Void
        </Button>
      </CardFooter>
    </Card>
  );
}
