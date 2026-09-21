"use client";

import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ServiceCategoryView } from "@coifyn/api-client";
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
import { updateServiceCategory } from "../../../lib/api/service-categories/update-service-category";

export interface EditCategoryDialogProps {
  category: ServiceCategoryView;
}

/** Renames / reorders a service category (PATCH /service-categories/:id). */
export function EditCategoryDialog({ category }: EditCategoryDialogProps) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(category.name);
  const [order, setOrder] = useState(String(category.order));

  useEffect(() => {
    if (!open) return;
    setName(category.name);
    setOrder(String(category.order));
  }, [open, category]);

  const save = useMutation({
    mutationFn: () =>
      updateServiceCategory(category.id, {
        name: name.trim(),
        order: Math.max(0, Number.parseInt(order || "0", 10) || 0),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-categories"] });
      setOpen(false);
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" aria-label={`Edit ${category.name}`}>
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit category</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <Label htmlFor="categoryName">Name</Label>
          <Input
            id="categoryName"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <Label htmlFor="categoryOrder">Order</Label>
          <Input
            id="categoryOrder"
            type="number"
            min={0}
            value={order}
            onChange={(event) => setOrder(event.target.value)}
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
