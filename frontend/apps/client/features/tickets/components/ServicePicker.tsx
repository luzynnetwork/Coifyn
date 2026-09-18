"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { formatMoney } from "@coifyn/shared";
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@coifyn/ui";
import { listServices } from "../../../lib/api/services/list-services";
import { addTicketLine } from "../../../lib/api/tickets/add-ticket-line";

export interface ServicePickerProps {
  ticketId: string;
  onAdded: () => void;
}

export function ServicePicker({ ticketId, onAdded }: ServicePickerProps) {
  const [open, setOpen] = useState(false);
  const servicesQuery = useQuery({ queryKey: ["services"], queryFn: listServices });

  const addLine = useMutation({
    mutationFn: (serviceId: string) =>
      addTicketLine(ticketId, { kind: "service", refId: serviceId, qty: 1 }),
    onSuccess: () => {
      onAdded();
      setOpen(false);
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-fit">
          Add service
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a service</DialogTitle>
        </DialogHeader>
        <div className="flex max-h-80 flex-col gap-1 overflow-y-auto">
          {(servicesQuery.data ?? [])
            .filter((service) => service.isActive)
            .map((service) => (
              <button
                key={service.id}
                type="button"
                className="flex items-center justify-between rounded-md p-2 text-left text-sm hover:bg-[var(--color-muted)]"
                disabled={addLine.isPending}
                onClick={() => addLine.mutate(service.id)}
              >
                <span>{service.name}</span>
                <span>{formatMoney(service.basePriceMinor)}</span>
              </button>
            ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
