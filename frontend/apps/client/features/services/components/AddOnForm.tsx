"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { dollarsToMinor } from "@coifyn/shared";
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
import { createServiceAddOn } from "../../../lib/api/service-add-ons/create-service-add-on";

export function AddOnForm() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [duration, setDuration] = useState("");

  const create = useMutation({
    mutationFn: () =>
      createServiceAddOn({
        name,
        priceMinor: dollarsToMinor(price),
        durationMin: Number.parseInt(duration || "0", 10),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-add-ons"] });
      setName("");
      setPrice("");
      setDuration("");
      setOpen(false);
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">Add add-on</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New add-on</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <Label htmlFor="addOnName">Name</Label>
          <Input id="addOnName" value={name} onChange={(event) => setName(event.target.value)} />
          <Label htmlFor="addOnPrice">Price ($)</Label>
          <Input
            id="addOnPrice"
            type="number"
            step="0.01"
            value={price}
            onChange={(event) => setPrice(event.target.value)}
          />
          <Label htmlFor="addOnDuration">Duration (minutes)</Label>
          <Input
            id="addOnDuration"
            type="number"
            value={duration}
            onChange={(event) => setDuration(event.target.value)}
          />
        </div>
        <DialogFooter>
          <Button disabled={!name || create.isPending} onClick={() => create.mutate()}>
            Add
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
