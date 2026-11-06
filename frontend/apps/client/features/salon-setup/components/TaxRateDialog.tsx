"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { TaxRateView } from "@coifyn/api-client";
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
  Switch,
} from "@coifyn/ui";
import { createTaxRate } from "../../../lib/api/tax-rates/create-tax-rate";
import { updateTaxRate } from "../../../lib/api/tax-rates/update-tax-rate";

export type TaxRateDialogProps =
  | { mode: "create"; taxRate?: undefined }
  | { mode: "edit"; taxRate: TaxRateView };

export function TaxRateDialog(props: TaxRateDialogProps) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(props.taxRate?.name ?? "");
  const [percent, setPercent] = useState(
    props.taxRate ? (props.taxRate.percentBasisPoints / 100).toString() : "",
  );
  const [inclusive, setInclusive] = useState(props.taxRate?.inclusive ?? false);
  const [isDefault, setIsDefault] = useState(props.taxRate?.isDefault ?? false);

  const percentBasisPoints = Math.round(Number.parseFloat(percent || "0") * 100);

  const save = useMutation({
    mutationFn: () =>
      props.mode === "edit"
        ? updateTaxRate(props.taxRate.id, { name, percentBasisPoints, inclusive, isDefault })
        : createTaxRate({ name, percentBasisPoints, inclusive, isDefault }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tax-rates"] });
      setOpen(false);
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={props.mode === "edit" ? "outline" : "default"} size="sm">
          {props.mode === "edit" ? "Edit" : "Add tax rate"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{props.mode === "edit" ? "Edit tax rate" : "New tax rate"}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <Label htmlFor="taxName">Name</Label>
          <Input id="taxName" value={name} onChange={(event) => setName(event.target.value)} />

          <Label htmlFor="taxPercent">Percent</Label>
          <Input
            id="taxPercent"
            type="number"
            step="0.01"
            value={percent}
            onChange={(event) => setPercent(event.target.value)}
          />

          <div className="flex items-center gap-2">
            <Switch checked={inclusive} onCheckedChange={setInclusive} />
            <span className="text-sm">Tax inclusive</span>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={isDefault} onCheckedChange={setIsDefault} />
            <span className="text-sm">Default rate</span>
          </div>
        </div>
        <DialogFooter>
          <Button disabled={!name || save.isPending} onClick={() => save.mutate()}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
