import type { DashboardView } from "@coifyn/api-client";
import { Badge, Card, CardContent, CardHeader, CardTitle } from "@coifyn/ui";

export function StylistUtilization({ rows }: { rows: DashboardView["stylists"] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Stylists</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {rows.map((s) => (
          <div key={s.id} className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              {s.displayName} <Badge variant="secondary">{s.status.replace("_", " ")}</Badge>
            </span>
            <span>
              {s.utilization === null ? "no shifts" : `${Math.round(s.utilization * 100)}% booked`} ·{" "}
              {Math.round(s.bookedMinutes / 60)}h / {Math.round(s.rosteredMinutes / 60)}h
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
