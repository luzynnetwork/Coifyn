"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { StylistServiceView, StylistView } from "@coifyn/api-client";
import { Button, Table, TableBody, TableHead, TableHeader, TableRow } from "@coifyn/ui";
import { listServices } from "../../../lib/api/services/list-services";
import { getStylistServices } from "../../../lib/api/stylists/get-stylist-services";
import { putStylistServices } from "../../../lib/api/stylists/put-stylist-services";
import { ServiceMatrixRow } from "./ServiceMatrixRow";

export interface StylistServiceMatrixProps {
  stylist: StylistView;
}

export function StylistServiceMatrix({ stylist }: StylistServiceMatrixProps) {
  const queryClient = useQueryClient();
  const servicesQuery = useQuery({ queryKey: ["services"], queryFn: listServices });
  const stylistServicesQuery = useQuery({
    queryKey: ["stylist-services", stylist.id],
    queryFn: () => getStylistServices(stylist.id),
  });

  const [rows, setRows] = useState<Map<string, StylistServiceView>>(new Map());

  useEffect(() => {
    const next = new Map<string, StylistServiceView>();
    for (const row of stylistServicesQuery.data ?? []) {
      next.set(row.serviceId, row);
    }
    setRows(next);
  }, [stylistServicesQuery.data]);

  function updateRow(serviceId: string, patch: Partial<StylistServiceView>) {
    setRows((current) => {
      const next = new Map(current);
      const existing = next.get(serviceId) ?? {
        stylistId: stylist.id,
        serviceId,
        canPerform: false,
        priceOverrideMinor: null,
        durationOverrideMin: null,
      };
      next.set(serviceId, { ...existing, ...patch });
      return next;
    });
  }

  const save = useMutation({
    mutationFn: () =>
      putStylistServices(stylist.id, {
        services: Array.from(rows.values()).map((row) => ({
          serviceId: row.serviceId,
          canPerform: row.canPerform,
          priceOverrideMinor: row.priceOverrideMinor ?? undefined,
          durationOverrideMin: row.durationOverrideMin ?? undefined,
        })),
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["stylist-services", stylist.id] }),
  });

  const services = servicesQuery.data ?? [];

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-medium text-[var(--color-muted-foreground)]">
        Services &amp; pricing
      </h3>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Service</TableHead>
            <TableHead>Can perform</TableHead>
            <TableHead>Price override</TableHead>
            <TableHead>Duration override</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {services.map((service) => (
            <ServiceMatrixRow
              key={service.id}
              service={service}
              row={rows.get(service.id) ?? null}
              onChange={(patch) => updateRow(service.id, patch)}
            />
          ))}
        </TableBody>
      </Table>
      <Button className="w-fit" disabled={save.isPending} onClick={() => save.mutate()}>
        Save services
      </Button>
    </div>
  );
}
