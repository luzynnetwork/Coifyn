"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ServiceCategoryView, ServiceView } from "@coifyn/api-client";
import { formatMoney } from "@coifyn/shared";
import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  TableCell,
  TableRow,
} from "@coifyn/ui";
import { setServiceActive } from "../../../lib/api/services/set-service-active";
import { ServiceForm } from "./ServiceForm";

export interface ServiceRowProps {
  service: ServiceView;
  categories: ServiceCategoryView[];
}

export function ServiceRow({ service, categories }: ServiceRowProps) {
  const queryClient = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  const categoryName = categories.find((c) => c.id === service.categoryId)?.name ?? "—";

  const toggleActive = useMutation({
    mutationFn: () => setServiceActive(service.id, !service.isActive),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["services"] }),
  });

  return (
    <TableRow>
      <TableCell>{service.name}</TableCell>
      <TableCell>{categoryName}</TableCell>
      <TableCell>{formatMoney(service.basePriceMinor)}</TableCell>
      <TableCell>{service.baseDurationMin} min</TableCell>
      <TableCell>
        <Badge variant={service.isActive ? "default" : "secondary"}>
          {service.isActive ? "Active" : "Inactive"}
        </Badge>
      </TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              ⋯
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => setEditOpen(true)}>Edit</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => toggleActive.mutate()}>
              {service.isActive ? "Deactivate" : "Activate"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <ServiceForm
          mode="edit"
          service={service}
          open={editOpen}
          onOpenChange={setEditOpen}
          categories={categories}
        />
      </TableCell>
    </TableRow>
  );
}
