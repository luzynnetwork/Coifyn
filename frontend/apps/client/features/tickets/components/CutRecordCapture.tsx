"use client";

import { useState } from "react";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@coifyn/ui";
import { CutRecordForm } from "../../customers/components/CutRecordForm";

export interface CutRecordCaptureProps {
  customerId: string;
  ticketId: string;
}

/** After a paid ticket, prompts the serving stylist to record the cut so the next
 *  stylist — a stand-in included — can reproduce it. Skippable. */
export function CutRecordCapture({ customerId, ticketId }: CutRecordCaptureProps) {
  const [state, setState] = useState<"open" | "done" | "skipped">("open");
  if (state !== "open") return null;

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>Record this cut</CardTitle>
        <Button variant="ghost" size="sm" onClick={() => setState("skipped")}>
          Skip
        </Button>
      </CardHeader>
      <CardContent>
        <CutRecordForm customerId={customerId} ticketId={ticketId} onSaved={() => setState("done")} />
      </CardContent>
    </Card>
  );
}
