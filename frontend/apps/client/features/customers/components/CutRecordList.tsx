"use client";

import { useQuery } from "@tanstack/react-query";
import { listCutRecords } from "@coifyn/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@coifyn/ui";
import { CutRecordForm } from "./CutRecordForm";
import { PhotoGallery } from "./PhotoGallery";

export function CutRecordList({ customerId }: { customerId: string }) {
  const records = useQuery({
    queryKey: ["cut-records", customerId],
    queryFn: () => listCutRecords(customerId),
  });

  return (
    <div className="flex flex-col gap-4">
      <CutRecordForm customerId={customerId} />
      {(records.data ?? []).map((r) => (
        <Card key={r.id}>
          <CardHeader>
            <CardTitle className="text-base">
              {r.fadeType ?? "Cut"} · {new Date(r.createdAt).toLocaleDateString()}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm">
            <p>
              Guards:{" "}
              {Object.entries(r.clipperGuards)
                .map(([k, v]) => `${k} ${String(v)}`)
                .join(", ") || "—"}
            </p>
            {r.productsUsed.length > 0 ? <p>Products: {r.productsUsed.join(", ")}</p> : null}
            {r.freeText ? <p>{r.freeText}</p> : null}
            <PhotoGallery photos={r.photos ?? []} />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
