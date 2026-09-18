"use client";

import { useQuery } from "@tanstack/react-query";
import { formatMoney } from "@coifyn/shared";
import { Button, Card, CardContent, CardFooter, CardHeader, CardTitle, Separator } from "@coifyn/ui";
import { getTicketReceipt } from "../../../lib/api/payments/get-ticket-receipt";

export interface ReceiptViewProps {
  ticketId: string;
  onDone: () => void;
}

export function ReceiptView({ ticketId, onDone }: ReceiptViewProps) {
  const receiptQuery = useQuery({
    queryKey: ["ticket-receipt", ticketId],
    queryFn: () => getTicketReceipt(ticketId),
  });
  const receipt = receiptQuery.data;
  if (!receipt) return null;

  return (
    <Card className="mx-auto max-w-sm font-mono">
      <CardHeader>
        <CardTitle>Receipt #{receipt.number}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-1 text-sm">
        {receipt.lines.map((line, index) => (
          <div key={index} className="flex justify-between">
            <span>
              {line.description} × {line.qty}
            </span>
            <span>{formatMoney(line.lineTotalMinor)}</span>
          </div>
        ))}
        <Separator className="my-2" />
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>{formatMoney(receipt.subtotalMinor)}</span>
        </div>
        <div className="flex justify-between">
          <span>Discount</span>
          <span>-{formatMoney(receipt.discountMinor)}</span>
        </div>
        <div className="flex justify-between">
          <span>Tax</span>
          <span>{formatMoney(receipt.taxMinor)}</span>
        </div>
        <div className="flex justify-between font-semibold">
          <span>Total</span>
          <span>{formatMoney(receipt.totalMinor)}</span>
        </div>
      </CardContent>
      <CardFooter>
        <Button className="w-full" onClick={onDone}>
          New ticket
        </Button>
      </CardFooter>
    </Card>
  );
}
