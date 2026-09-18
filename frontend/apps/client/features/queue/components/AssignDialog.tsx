"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { QueueEntryView } from "@coifyn/api-client";
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
} from "@coifyn/ui";
import { listStylists } from "../../../lib/api/stylists/list-stylists";
import { listChairs } from "../../../lib/api/chairs/list-chairs";
import { assignQueue } from "../../../lib/api/queue/assign-queue";

export interface AssignDialogProps {
  entry: QueueEntryView;
}

export function AssignDialog({ entry }: AssignDialogProps) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [stylistId, setStylistId] = useState("");
  const [chairId, setChairId] = useState("");

  const stylistsQuery = useQuery({ queryKey: ["stylists"], queryFn: listStylists });
  const chairsQuery = useQuery({
    queryKey: ["chairs", entry.branchId],
    queryFn: () => listChairs(entry.branchId),
  });

  const assign = useMutation({
    mutationFn: () => assignQueue(entry.id, { stylistId, chairId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["queue", entry.branchId] });
      setOpen(false);
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">Assign</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign {entry.walkInName ?? "customer"}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <Label htmlFor="assignStylist">Stylist</Label>
          <Select value={stylistId} onValueChange={setStylistId}>
            <SelectTrigger id="assignStylist">
              <SelectValue placeholder="Select a stylist" />
            </SelectTrigger>
            <SelectContent>
              {(stylistsQuery.data ?? []).map((stylist) => (
                <SelectItem key={stylist.id} value={stylist.id}>
                  {stylist.displayName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Label htmlFor="assignChair">Chair</Label>
          <Select value={chairId} onValueChange={setChairId}>
            <SelectTrigger id="assignChair">
              <SelectValue placeholder="Select a chair" />
            </SelectTrigger>
            <SelectContent>
              {(chairsQuery.data ?? [])
                .filter((chair) => chair.isActive)
                .map((chair) => (
                  <SelectItem key={chair.id} value={chair.id}>
                    {chair.label}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button
            disabled={!stylistId || !chairId || assign.isPending}
            onClick={() => assign.mutate()}
          >
            Assign
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
