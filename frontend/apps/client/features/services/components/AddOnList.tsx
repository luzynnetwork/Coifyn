"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, Table, TableBody, TableHead, TableHeader, TableRow } from "@coifyn/ui";
import { listServiceAddOns } from "../../../lib/api/service-add-ons/list-service-add-ons";
import { AddOnRow } from "./AddOnRow";
import { AddOnForm } from "./AddOnForm";

export function AddOnList() {
  const addOnsQuery = useQuery({ queryKey: ["service-add-ons"], queryFn: listServiceAddOns });
  const addOns = addOnsQuery.data ?? [];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Add-ons</CardTitle>
        <AddOnForm />
      </CardHeader>
      <CardContent>
        {addOns.length === 0 ? (
          <p className="text-sm text-[var(--color-muted-foreground)]">No add-ons yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Duration</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {addOns.map((addOn) => (
                <AddOnRow key={addOn.id} addOn={addOn} />
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
