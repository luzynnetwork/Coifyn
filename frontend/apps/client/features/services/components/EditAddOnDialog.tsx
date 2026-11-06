"use client";

import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ServiceAddOnView } from "@coifyn/api-client";
import { dollarsToMinor, minorToDollars } from "@coifyn/shared";
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
} from "@coifyn/ui";
import { updateServiceAddOn } from "../../../lib/api/service-add-ons/update-service-add-on";

export interface EditAddOnDialogProps {
  addOn: ServiceAddOnView;
}

/** Edits an add-on's name, price and duration (PATCH /service-add-ons/:id). */
export function EditAddOnDialog({ addOn }: EditAddOnDialogProps) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(addOn.name);
  const [price, setPrice] = useState(minorToDollars(addOn.priceMinor));
  const [duration, setDuration] = useState(String(addOn.durationMin));

  useEffect(() => {
    if (!open) return;
    setName(addOn.name);
    setPrice(minorToDollars(addOn.priceMinor));
    setDuration(String(addOn.durationMin));
  }, [open, addOn]);

  const save = useMutation({
    mutationFn: () =>
      updateServiceAddOn(addOn.id, {
        name: name.trim(),
        priceMinor: dollarsToMinor(price),
        durationMin: Math.max(0, Number.parseInt(duration || "0", 10) || 0),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-add-ons"] });
      setOpen(false);
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit add-on</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <Label htmlFor="editAddOnName">Name</Label>
          <Input
            id="editAddOnName"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <Label htmlFor="editAddOnPrice">Price ($)</Label>
          <Input
            id="editAddOnPrice"
            type="number"
            step="0.01"
            min={0}
            value={price}
            onChange={(event) => setPrice(event.target.value)}
          />
          <Label htmlFor="editAddOnDuration">Duration (minutes)</Label>
          <Input
            id="editAddOnDuration"
            type="number"
            min={0}
            value={duration}
            onChange={(event) => setDuration(event.target.value)}
          />
        </div>
        <DialogFooter>
          <Button disabled={!name.trim() || save.isPending} onClick={() => save.mutate()}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
