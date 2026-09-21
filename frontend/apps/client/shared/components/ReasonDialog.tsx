"use client";

import { useState, type ReactNode } from "react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Label,
  Textarea,
} from "@coifyn/ui";

/** Shortest reason the backend accepts for voids, discounts, refunds and cancellations. */
export const MIN_REASON_LENGTH = 3;

export interface ReasonDialogProps {
  /** The button that opens the dialog. */
  trigger: ReactNode;
  title: string;
  description?: string;
  confirmLabel: string;
  isPending?: boolean;
  /** Called with the trimmed reason (at least MIN_REASON_LENGTH chars). */
  onConfirm: (reason: string) => void;
}

/** Asks the user for a mandatory free-text reason before a destructive action. */
export function ReasonDialog({
  trigger,
  title,
  description,
  confirmLabel,
  isPending = false,
  onConfirm,
}: ReasonDialogProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const trimmed = reason.trim();
  const valid = trimmed.length >= MIN_REASON_LENGTH;

  function handleConfirm() {
    onConfirm(trimmed);
    setOpen(false);
    setReason("");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Label htmlFor="reasonInput">Reason</Label>
          <Textarea
            id="reasonInput"
            value={reason}
            placeholder={`At least ${MIN_REASON_LENGTH} characters`}
            onChange={(event) => setReason(event.target.value)}
          />
        </div>
        <DialogFooter>
          <Button disabled={!valid || isPending} onClick={handleConfirm}>
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
