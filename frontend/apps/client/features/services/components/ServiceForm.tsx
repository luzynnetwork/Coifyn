"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ServiceCategoryView, ServiceView } from "@coifyn/api-client";
import { dollarsToMinor, minorToDollars } from "@coifyn/shared";
import {
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  Switch,
} from "@coifyn/ui";
import { createService } from "../../../lib/api/services/create-service";
import { updateService } from "../../../lib/api/services/update-service";
import { listTaxRates } from "../../../lib/api/tax-rates/list-tax-rates";

export type ServiceFormProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: ServiceCategoryView[];
} & ({ mode: "create"; service?: undefined } | { mode: "edit"; service: ServiceView });

export function ServiceForm({ mode, service, open, onOpenChange, categories }: ServiceFormProps) {
  const queryClient = useQueryClient();
  const taxRatesQuery = useQuery({ queryKey: ["tax-rates"], queryFn: listTaxRates });

  const [name, setName] = useState(service?.name ?? "");
  const [categoryId, setCategoryId] = useState(service?.categoryId ?? "");
  const [price, setPrice] = useState(service ? minorToDollars(service.basePriceMinor) : "");
  const [duration, setDuration] = useState(service ? String(service.baseDurationMin) : "");
  const [taxRateId, setTaxRateId] = useState(service?.taxRateId ?? "");
  const [isBookable, setIsBookable] = useState(service?.isBookable ?? true);

  useEffect(() => {
    if (!open) return;
    setName(service?.name ?? "");
    setCategoryId(service?.categoryId ?? categories[0]?.id ?? "");
    setPrice(service ? minorToDollars(service.basePriceMinor) : "");
    setDuration(service ? String(service.baseDurationMin) : "");
    setTaxRateId(service?.taxRateId ?? "");
    setIsBookable(service?.isBookable ?? true);
  }, [open, service, categories]);

  const save = useMutation({
    mutationFn: () => {
      const input = {
        categoryId,
        name,
        basePriceMinor: dollarsToMinor(price),
        baseDurationMin: Number.parseInt(duration || "0", 10),
        taxRateId: taxRateId || undefined,
        isBookable,
      };
      return mode === "edit" ? updateService(service.id, input) : createService(input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
      onOpenChange(false);
    },
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{mode === "edit" ? "Edit service" : "New service"}</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-3 px-4">
          <Label htmlFor="serviceName">Name</Label>
          <Input id="serviceName" value={name} onChange={(event) => setName(event.target.value)} />

          <Label htmlFor="serviceCategory">Category</Label>
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger id="serviceCategory">
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Label htmlFor="servicePrice">Price ($)</Label>
          <Input
            id="servicePrice"
            type="number"
            step="0.01"
            value={price}
            onChange={(event) => setPrice(event.target.value)}
          />

          <Label htmlFor="serviceDuration">Duration (minutes)</Label>
          <Input
            id="serviceDuration"
            type="number"
            value={duration}
            onChange={(event) => setDuration(event.target.value)}
          />

          <Label htmlFor="serviceTax">Tax rate</Label>
          <Select value={taxRateId || undefined} onValueChange={setTaxRateId}>
            <SelectTrigger id="serviceTax">
              <SelectValue placeholder="No tax" />
            </SelectTrigger>
            <SelectContent>
              {(taxRatesQuery.data ?? []).map((rate) => (
                <SelectItem key={rate.id} value={rate.id}>
                  {rate.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2">
            <Switch checked={isBookable} onCheckedChange={setIsBookable} />
            <span className="text-sm">Bookable</span>
          </div>
        </div>
        <SheetFooter>
          <Button
            disabled={!name || !categoryId || save.isPending}
            onClick={() => save.mutate()}
          >
            Save
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
