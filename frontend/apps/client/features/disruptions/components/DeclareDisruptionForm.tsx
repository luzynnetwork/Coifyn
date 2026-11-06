"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { declareDisruption, type DisruptionKind, type StylistView } from "@coifyn/api-client";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  toast,
} from "@coifyn/ui";

const KINDS: { value: DisruptionKind; label: string }[] = [
  { value: "running_late", label: "Running late" },
  { value: "absent", label: "Absent today" },
  { value: "left_early", label: "Left early" },
];

export function DeclareDisruptionForm({ stylists }: { stylists: StylistView[] }) {
  const queryClient = useQueryClient();
  const [stylistId, setStylistId] = useState("");
  const [kind, setKind] = useState<DisruptionKind>("running_late");
  const [minutes, setMinutes] = useState("20");

  const declare = useMutation({
    mutationFn: () =>
      declareDisruption({
        stylistId,
        kind,
        ...(kind === "running_late" && { minutesLate: Number(minutes) }),
      }),
    onSuccess: () => {
      toast.success("Declared — notify the affected customers next");
      return queryClient.invalidateQueries({ queryKey: ["disruptions"] });
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Declare a disruption</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap items-end gap-3">
        <Select value={stylistId} onValueChange={setStylistId}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Stylist" /></SelectTrigger>
          <SelectContent>
            {stylists.map((s) => (
              <SelectItem key={s.id} value={s.id}>{s.displayName}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={kind} onValueChange={(v) => setKind(v as DisruptionKind)}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            {KINDS.map((k) => (
              <SelectItem key={k.value} value={k.value}>{k.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {kind === "running_late" ? (
          <Input
            type="number"
            min={1}
            max={480}
            className="w-24"
            value={minutes}
            onChange={(e) => setMinutes(e.target.value)}
            aria-label="Minutes late"
          />
        ) : null}
        <Button onClick={() => declare.mutate()} disabled={!stylistId || declare.isPending}>
          Declare
        </Button>
      </CardContent>
    </Card>
  );
}
