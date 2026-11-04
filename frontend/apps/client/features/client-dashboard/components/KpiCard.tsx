import type { Kpi } from "@coifyn/api-client";
import { formatMoney } from "@coifyn/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@coifyn/ui";

function show(kpi: Kpi, value: number | null): string {
  if (value === null) return "—";
  if (kpi.key.endsWith("Minor")) return formatMoney(value);
  if (kpi.key.endsWith("Rate") || kpi.key === "chairUtilization") return `${Math.round(value * 100)}%`;
  return String(value);
}

/** One KPI: the number, its comparison with the previous period, and — on hover —
 *  its definition, source and last refresh. */
export function KpiCard({ kpi }: { kpi: Kpi }) {
  const change = kpi.comparison?.changePct;
  return (
    <Card title={`${kpi.definition}\nSource: ${kpi.source}\nRefreshed: ${new Date(kpi.refreshedAt).toLocaleTimeString()}`}>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-[var(--color-muted-foreground)]">{kpi.label}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-1">
        <span className="text-2xl font-semibold">{show(kpi, kpi.value)}</span>
        {kpi.comparison ? (
          <span className="text-xs text-[var(--color-muted-foreground)]">
            vs {show(kpi, kpi.comparison.value)}
            {change !== null && change !== undefined ? ` (${change > 0 ? "+" : ""}${change.toFixed(0)}%)` : ""}
          </span>
        ) : null}
        <span className="text-xs text-[var(--color-muted-foreground)]">{kpi.definition}</span>
      </CardContent>
    </Card>
  );
}
