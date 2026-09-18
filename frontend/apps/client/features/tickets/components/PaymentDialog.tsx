"use client";

import { useState } from "react";
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
} from "@coifyn/ui";
import { createPayment } from "../../../lib/api/payments/create-payment";

export interface PaymentDialogProps {
  ticketId: string;
  totalMinor: number;
  onPaid: () => void;
}

export function PaymentDialog({ ticketId, totalMinor, onPaid }: PaymentDialogProps) {
  const [open, setOpen] = useState(false);
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [amount, setAmount] = useState(minorToDollars(totalMinor));

  const pay = useMutation({
    mutationFn: () =>
      createPayment({ ticketId, method, amountMinor: dollarsToMinor(amount) }),
    onSuccess: () => {
      onPaid();
      setOpen(false);
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Pay {formatMoney(totalMinor)}</Button>
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
