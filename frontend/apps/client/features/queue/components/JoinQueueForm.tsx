"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import { listServices } from "../../../lib/api/services/list-services";
import { joinQueue } from "../../../lib/api/queue/join-queue";
import { QueueServicePicker } from "./QueueServicePicker";

export interface JoinQueueFormProps {
  branchId: string;
}

export function JoinQueueForm({ branchId }: JoinQueueFormProps) {
  const queryClient = useQueryClient();
  const servicesQuery = useQuery({ queryKey: ["services"], queryFn: listServices });
  const [open, setOpen] = useState(false);
  const [walkInName, setWalkInName] = useState("");
  const [serviceIds, setServiceIds] = useState<string[]>([]);

  const join = useMutation({
    mutationFn: () => joinQueue({ branchId, walkInName, requestedServiceIds: serviceIds }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["queue", branchId] });
      setWalkInName("");
      setServiceIds([]);
      setOpen(false);
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Add walk-in</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a walk-in</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <Label htmlFor="walkInName">Name</Label>
          <Input
            id="walkInName"
            value={walkInName}
            onChange={(event) => setWalkInName(event.target.value)}
          />

          <Label>Services</Label>
          <QueueServicePicker
            services={servicesQuery.data ?? []}
            selected={serviceIds}
            onChange={setServiceIds}
          />
        </div>
        <DialogFooter>
          <Button
            disabled={!walkInName || serviceIds.length === 0 || join.isPending}
            onClick={() => join.mutate()}
          >
            Add to queue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
