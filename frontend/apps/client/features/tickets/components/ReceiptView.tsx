"use client";

import { useQuery } from "@tanstack/react-query";
import { formatMoney } from "@coifyn/shared";
import { Button, Card, CardContent, CardFooter, CardHeader, CardTitle, Separator } from "@coifyn/ui";
import { getTicketReceipt } from "../../../lib/api/payments/get-ticket-receipt";
import { RefundDialog } from "./RefundDialog";

export interface ReceiptViewProps {
  ticketId: string;
  onDone: () => void;
}

export function ReceiptView({ ticketId, onDone }: ReceiptViewProps) {
  const receiptQuery = useQuery({
    queryKey: ["ticket-receipt", ticketId],
    queryFn: () => getTicketReceipt(ticketId),
  });
  const data = receiptQuery.data;
  if (!data) return null;
  const { receipt, ticket } = data;

  return (
    <Card className="mx-auto max-w-sm font-mono">
      <CardHeader>
        <CardTitle>
          {data.salon.brandName ? `${data.salon.brandName} · ` : ""}Receipt #{receipt.number}
        </CardTitle>
        {data.branch.name ? (
          <p className="text-xs text-[var(--color-muted-foreground)]">{data.branch.name}</p>
        ) : null}
      </CardHeader>
      <CardContent className="flex flex-col gap-1 text-sm">
        {data.lines.map((line) => (
          <div key={line.id} className="flex justify-between">
            <span>
              {line.description} × {line.qty}
            </span>
            <span>{formatMoney(line.lineTotalMinor)}</span>
          </div>
        ))}
        <Separator className="my-2" />
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>{formatMoney(ticket.subtotalMinor)}</span>
        </div>
        <div className="flex justify-between">
          <span>Discount</span>
          <span>-{formatMoney(ticket.discountMinor)}</span>
        </div>
        <div className="flex justify-between">
          <span>Tax</span>
          <span>{formatMoney(ticket.taxMinor)}</span>
        </div>
        <div className="flex justify-between font-semibold">
          <span>Total</span>
          <span>{formatMoney(ticket.totalMinor)}</span>
        </div>
        <Separator className="my-2" />
        {data.payments.map((payment) => (
          <div key={payment.id} className="flex items-center justify-between">
            <span className="capitalize">
              {payment.method} {formatMoney(payment.amountMinor)}
            </span>
            <RefundDialog payment={payment} ticketId={ticketId} />
          </div>
        ))}
      </CardContent>
      <CardFooter>
        <Button className="w-full" onClick={onDone}>
          New ticket
        </Button>
      </CardFooter>
    </Card>
  );
}
