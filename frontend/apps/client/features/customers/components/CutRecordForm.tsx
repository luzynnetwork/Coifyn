"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createCutRecord } from "@coifyn/api-client";
import { Button, Input, Label, Textarea, toast } from "@coifyn/ui";

export interface CutRecordFormProps {
  customerId: string;
  appointmentId?: string;
  ticketId?: string;
  /** Called after a successful save (the POS capture step closes its dialog). */
  onSaved?: () => void;
}

/** Records the cut — guards, fade, products and notes — so any stylist can reproduce it. */
export function CutRecordForm({ customerId, appointmentId, ticketId, onSaved }: CutRecordFormProps) {
  const queryClient = useQueryClient();
  const [sides, setSides] = useState("");
  const [back, setBack] = useState("");
  const [top, setTop] = useState("");
  const [fade, setFade] = useState("");
  const [products, setProducts] = useState("");
  const [notes, setNotes] = useState("");

  const save = useMutation({
    mutationFn: () => {
      const guards: Record<string, string | number> = {};
      if (sides) guards.sides = Number(sides) || sides;
      if (back) guards.back = Number(back) || back;
      if (top) guards.top = Number(top) || top;
      return createCutRecord({
        customerId,
        appointmentId,
        ticketId,
        clipperGuards: guards,
        fadeType: fade || undefined,
        productsUsed: products ? products.split(",").map((p) => p.trim()).filter(Boolean) : [],
        freeText: notes || undefined,
      });
    },
    onSuccess: () => {
      toast.success("Cut recorded");
      setSides(""); setBack(""); setTop(""); setFade(""); setProducts(""); setNotes("");
      void queryClient.invalidateQueries({ queryKey: ["cut-records", customerId] });
      void queryClient.invalidateQueries({ queryKey: ["timeline", customerId] });
      onSaved?.();
    },
  });

  return (
    <div className="grid gap-3 rounded-md border border-[var(--color-border)] p-3 md:grid-cols-3">
      <div className="flex flex-col gap-1">
        <Label htmlFor="gSides">Guard — sides</Label>
        <Input id="gSides" value={sides} onChange={(e) => setSides(e.target.value)} placeholder="1" />
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="gBack">Guard — back</Label>
        <Input id="gBack" value={back} onChange={(e) => setBack(e.target.value)} placeholder="1.5" />
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="gTop">Top</Label>
        <Input id="gTop" value={top} onChange={(e) => setTop(e.target.value)} placeholder="scissor" />
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="fade">Fade type</Label>
        <Input id="fade" value={fade} onChange={(e) => setFade(e.target.value)} placeholder="low fade" />
      </div>
      <div className="flex flex-col gap-1 md:col-span-2">
        <Label htmlFor="products">Products (comma-separated)</Label>
        <Input id="products" value={products} onChange={(e) => setProducts(e.target.value)} />
      </div>
      <div className="flex flex-col gap-1 md:col-span-3">
        <Label htmlFor="cutNotes">Notes</Label>
        <Textarea id="cutNotes" value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>
      <Button className="w-fit" disabled={save.isPending} onClick={() => save.mutate()}>
        Save cut record
      </Button>
    </div>
  );
}
