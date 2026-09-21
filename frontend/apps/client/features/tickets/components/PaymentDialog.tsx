"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import type { PaymentMethod } from "@coifyn/api-client";
import { formatMoney, minorToDollars, dollarsToMinor } from "@coifyn/shared";
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  toast,
} from "@coifyn/ui";
import { createPayment } from "../../../lib/api/payments/create-payment";
import { newIdempotencyKey } from "../../../lib/new-idempotency-key";

export interface PaymentDialogProps {
  ticketId: string;
  /** What is still owed on the ticket (total minus completed payments), integer minor units. */
  balanceDueMinor: number;
  /** Called after any payment that changed the ticket (recorded or settled). */
  onPaid: () => void;
}

export function PaymentDialog({ ticketId, balanceDueMinor, onPaid }: PaymentDialogProps) {
  const [open, setOpen] = useState(false);
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [amount, setAmount] = useState(minorToDollars(balanceDueMinor));
  // One key per attempt: reused if the request is retried, renewed once the
  // server has answered (a declined card is a stored 201 and would be replayed).
  const keyRef = useRef(newIdempotencyKey());

  useEffect(() => {
    if (open) setAmount(minorToDollars(balanceDueMinor));
  }, [open, balanceDueMinor]);

  const pay = useMutation({
    mutationFn: () =>
      createPayment(
        { ticketId, method, amountMinor: dollarsToMinor(amount) },
        { idempotencyKey: keyRef.current },
      ),
    onSuccess: (result) => {
      keyRef.current = newIdempotencyKey();
      // A declined card is HTTP 201 with settled:false and payment.status "failed".
      if (result.payment.status === "failed") {
        toast.error(result.payment.failureReason ?? "Card payment failed. Try again.");
        return;
      }
      onPaid();
      if (result.settled) {
        setOpen(false);
      } else {
        toast.success("Payment recorded. Balance still due.");
      }
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button disabled={balanceDueMinor <= 0}>Pay {formatMoney(balanceDueMinor)}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Take payment</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <Label htmlFor="paymentMethod">Method</Label>
          <Select value={method} onValueChange={(next) => setMethod(next as PaymentMethod)}>
            <SelectTrigger id="paymentMethod">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cash">Cash</SelectItem>
              <SelectItem value="card">Card</SelectItem>
            </SelectContent>
          </Select>

          <Label htmlFor="paymentAmount">Amount ($)</Label>
          <Input
            id="paymentAmount"
            type="number"
            step="0.01"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
          />
        </div>
        <DialogFooter>
          <Button disabled={!amount || pay.isPending} onClick={() => pay.mutate()}>
            Charge {method === "cash" ? "cash" : "card"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
