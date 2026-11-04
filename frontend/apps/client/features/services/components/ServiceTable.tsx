"use client";

import type { ServiceCategoryView, ServiceView } from "@coifyn/api-client";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@coifyn/ui";
import { ServiceRow } from "./ServiceRow";

export interface ServiceTableProps {
  services: ServiceView[];
  categories: ServiceCategoryView[];
}

export function ServiceTable({ services, categories }: ServiceTableProps) {
  if (services.length === 0) {
    return <p className="text-sm text-[var(--color-muted-foreground)]">No services yet.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Price</TableHead>
          <TableHead>Duration</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="w-10" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {services.map((service) => (
          <ServiceRow key={service.id} service={service} categories={categories} />
        ))}
      </TableBody>
    </Table>
  );
}
