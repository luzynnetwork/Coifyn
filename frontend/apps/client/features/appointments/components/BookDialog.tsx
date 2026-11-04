"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createAppointment, getSlots, type StylistView } from "@coifyn/api-client";
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  toast,
} from "@coifyn/ui";
import { listCustomers } from "../../../lib/api/customers/list-customers";
import { listServices } from "../../../lib/api/services/list-services";
import { formatTime } from "../../../shared/lib/dates";

export interface BookDialogProps {
  branchId: string;
  date: string;
  stylists: StylistView[];
}

/** Staff books a customer into an open slot for a specific stylist. */
export function BookDialog({ branchId, date, stylists }: BookDialogProps) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [stylistId, setStylistId] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [slotStart, setSlotStart] = useState("");

  const services = useQuery({ queryKey: ["services"], queryFn: listServices, enabled: open });
  const customers = useQuery({
    queryKey: ["customers", ""],
    queryFn: () => listCustomers(),
    enabled: open,
  });
  const slots = useQuery({
    queryKey: ["slots", stylistId, serviceId, date],
    queryFn: () => getSlots(stylistId, [serviceId], date),
    enabled: open && Boolean(stylistId && serviceId),
  });

  const book = useMutation({
    mutationFn: () => {
      const slot = slots.data?.find((s) => s.startAt === slotStart);
      if (!slot) throw new Error("Pick a slot");
      return createAppointment({
        branchId,
        stylistId,
        customerId: customerId || undefined,
        serviceIds: [serviceId],
        startAt: slot.startAt,
        endAt: slot.endAt,
      });
    },
    onSuccess: () => {
      toast.success("Booked");
      setOpen(false);
      setSlotStart("");
      return queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>New booking</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New booking — {date}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-2">
          <Label>Stylist</Label>
          <Select value={stylistId} onValueChange={(v) => { setStylistId(v); setSlotStart(""); }}>
            <SelectTrigger><SelectValue placeholder="Choose a stylist" /></SelectTrigger>
            <SelectContent>
              {stylists.filter((s) => s.branchId === branchId).map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.displayName}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Label>Service</Label>
          <Select value={serviceId} onValueChange={(v) => { setServiceId(v); setSlotStart(""); }}>
            <SelectTrigger><SelectValue placeholder="Choose a service" /></SelectTrigger>
            <SelectContent>
              {(services.data ?? []).filter((s) => s.isActive).map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Label>Open slot</Label>
          <Select value={slotStart} onValueChange={setSlotStart}>
            <SelectTrigger>
              <SelectValue placeholder={slots.data?.length === 0 ? "No open slots" : "Choose a slot"} />
            </SelectTrigger>
            <SelectContent>
              {(slots.data ?? []).map((s) => (
                <SelectItem key={s.startAt} value={s.startAt}>
                  {formatTime(s.startAt)}–{formatTime(s.endAt)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Label>Customer</Label>
          <Select value={customerId} onValueChange={setCustomerId}>
            <SelectTrigger><SelectValue placeholder="Choose a customer" /></SelectTrigger>
            <SelectContent>
              {(customers.data ?? []).map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name} · {c.phone}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button onClick={() => book.mutate()} disabled={!slotStart || book.isPending}>
            Book
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
