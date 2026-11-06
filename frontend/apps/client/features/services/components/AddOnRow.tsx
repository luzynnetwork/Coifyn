"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ServiceAddOnView } from "@coifyn/api-client";
import { formatMoney } from "@coifyn/shared";
import { Badge, Button, TableCell, TableRow } from "@coifyn/ui";
import { updateServiceAddOn } from "../../../lib/api/service-add-ons/update-service-add-on";
import { EditAddOnDialog } from "./EditAddOnDialog";

export interface AddOnRowProps {
  addOn: ServiceAddOnView;
}

export function AddOnRow({ addOn }: AddOnRowProps) {
  const queryClient = useQueryClient();
  const toggleActive = useMutation({
    mutationFn: () => updateServiceAddOn(addOn.id, { isActive: !addOn.isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["service-add-ons"] }),
  });

  return (
    <TableRow>
      <TableCell>{addOn.name}</TableCell>
      <TableCell>{formatMoney(addOn.priceMinor)}</TableCell>
      <TableCell>{addOn.durationMin} min</TableCell>
      <TableCell>
        <Badge variant={addOn.isActive ? "default" : "secondary"}>
          {addOn.isActive ? "Active" : "Inactive"}
        </Badge>
      </TableCell>
      <TableCell>
        <div className="flex gap-1">
          <EditAddOnDialog addOn={addOn} />
          <Button
            variant="outline"
            size="sm"
            disabled={toggleActive.isPending}
            onClick={() => toggleActive.mutate()}
          >
            {addOn.isActive ? "Deactivate" : "Activate"}
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
