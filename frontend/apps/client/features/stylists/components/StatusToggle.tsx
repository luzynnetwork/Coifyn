"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { StylistStatus, StylistView } from "@coifyn/api-client";
import {
  Badge,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@coifyn/ui";
import { setStylistStatus } from "../../../lib/api/stylists/set-stylist-status";

const STATUSES: StylistStatus[] = [
  "available",
  "working",
  "busy",
  "on_break",
  "off_shift",
  "on_leave",
];

const STATUS_LABEL: Record<StylistStatus, string> = {
  available: "Available",
  working: "Working",
  busy: "Busy",
  on_break: "On break",
  off_shift: "Off shift",
  on_leave: "On leave",
};

export interface StatusToggleProps {
  stylist: StylistView;
}

export function StatusToggle({ stylist }: StatusToggleProps) {
  const queryClient = useQueryClient();
  const setStatus = useMutation({
    mutationFn: (status: StylistStatus) => setStylistStatus(stylist.id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["stylists"] }),
  });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Badge className="cursor-pointer">{STATUS_LABEL[stylist.status]}</Badge>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {STATUSES.map((status) => (
          <DropdownMenuItem key={status} onSelect={() => setStatus.mutate(status)}>
            {STATUS_LABEL[status]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
