"use client";

import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { PaymentView } from "@coifyn/api-client";
import { dollarsToMinor, formatMoney, minorToDollars } from "@coifyn/shared";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Input,
  Label,
  Textarea,
  toast,
} from "@coifyn/ui";
import { refundPayment } from "../../../lib/api/payments/refund-payment";
import { newIdempotencyKey } from "../../../lib/new-idempotency-key";
import { MIN_REASON_LENGTH } from "../../../shared/components/ReasonDialog";

export interface RefundDialogProps {
  payment: PaymentView;
  ticketId: string;
}

/**
 * Refunds (part of) a completed payment. Needs the payment:refund permission;
 * a 403 from the server surfaces as an error toast via the global mutation handler.
 */
export function RefundDialog({ payment, ticketId }: RefundDialogProps) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(minorToDollars(payment.amountMinor));
  const [reason, setReason] = useState("");
  const keyRef = useRef(newIdempotencyKey());

  const amountMinor = dollarsToMinor(amount);
  const amountInvalid = amountMinor < 1 || amountMinor > payment.amountMinor;
  const reasonInvalid = reason.trim().length < MIN_REASON_LENGTH;

  const refund = useMutation({
    mutationFn: () =>
      refundPayment(
        payment.id,
        { amountMinor, reason: reason.trim() },
        { idempotencyKey: keyRef.current },
      ),
    onSuccess: (result) => {
      keyRef.current = newIdempotencyKey();
      toast.success(`Refunded ${formatMoney(result.amountMinor)}`);
      queryClient.invalidateQueries({ queryKey: ["ticket-receipt", ticketId] });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      setReason("");
      setOpen(false);
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Refund
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Refund payment</DialogTitle>
          <DialogDescription>
            Up to {formatMoney(payment.amountMinor)} was taken by {payment.method}. Refunds
            are recorded separately and audited.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <Label htmlFor="refundAmount">Amount ($)</Label>
          <Input
            id="refundAmount"
            type="number"
            step="0.01"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
          />
          <Label htmlFor="refundReason">Reason</Label>
          <Textarea
            id="refundReason"
            value={reason}
            placeholder={`At least ${MIN_REASON_LENGTH} characters`}
            onChange={(event) => setReason(event.target.value)}
          />
        </div>
        <DialogFooter>
          <Button
            disabled={amountInvalid || reasonInvalid || refund.isPending}
            onClick={() => refund.mutate()}
          >
            Refund
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
