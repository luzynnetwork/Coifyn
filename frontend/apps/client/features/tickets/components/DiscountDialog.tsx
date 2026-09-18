"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
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
  Textarea,
} from "@coifyn/ui";
import { applyTicketDiscount } from "../../../lib/api/tickets/apply-ticket-discount";

export interface DiscountDialogProps {
  ticketId: string;
  onApplied: () => void;
}

export function DiscountDialog({ ticketId, onApplied }: DiscountDialogProps) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"percent" | "amount">("percent");
  const [value, setValue] = useState("");
  const [reason, setReason] = useState("");

  const reasonMissing = reason.trim().length === 0;

  const apply = useMutation({
    mutationFn: () =>
      applyTicketDiscount(ticketId, { type, value: Number.parseFloat(value || "0"), reason }),
    onSuccess: () => {
      onApplied();
      setValue("");
      setReason("");
      setOpen(false);
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Discount</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Apply a discount</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <Label htmlFor="discountType">Type</Label>
          <Select value={type} onValueChange={(next) => setType(next as "percent" | "amount")}>
            <SelectTrigger id="discountType">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="percent">Percent</SelectItem>
              <SelectItem value="amount">Amount ($)</SelectItem>
            </SelectContent>
          </Select>

          <Label htmlFor="discountValue">Value</Label>
          <Input
            id="discountValue"
            type="number"
            step="0.01"
            value={value}
            onChange={(event) => setValue(event.target.value)}
          />

          <Label htmlFor="discountReason">
            Reason <span className="text-[var(--color-destructive)]">*</span>
          </Label>
          <Textarea
            id="discountReason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
          />
          {reasonMissing ? (
            <p className="text-xs text-[var(--color-destructive)]">
              A reason is required for every discount — it's recorded in the audit log.
            </p>
          ) : null}
        </div>
        <DialogFooter>
          <Button
            disabled={!value || reasonMissing || apply.isPending}
            onClick={() => apply.mutate()}
          >
            Apply
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
