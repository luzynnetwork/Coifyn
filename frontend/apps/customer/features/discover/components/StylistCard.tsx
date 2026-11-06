import Link from "next/link";
import type { PublicStylist } from "@coifyn/api-client";
import { Badge, Card, CardContent, CardHeader, CardTitle } from "@coifyn/ui";

const STATUS_LABEL: Record<string, string> = {
  available: "Available now",
  working: "With a client",
  busy: "Busy",
  on_break: "On break",
  off_shift: "Off shift",
  on_leave: "Away",
};

export interface StylistCardProps {
  stylist: PublicStylist;
  timeZone: string;
  slug: string;
}

export function StylistCard({ stylist, timeZone, slug }: StylistCardProps) {
  const next = stylist.nextSlot
    ? new Date(stylist.nextSlot).toLocaleString([], {
        timeZone,
        weekday: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="text-base">{stylist.displayName}</CardTitle>
        <Badge variant={stylist.status === "available" ? "default" : "secondary"}>
          {STATUS_LABEL[stylist.status] ?? stylist.status}
        </Badge>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 text-sm">
        {stylist.bio ? <p>{stylist.bio}</p> : null}
        <p className="text-[var(--color-muted-foreground)]">
          {next ? `Next open slot: ${next}` : "No open slots this week"}
        </p>
        <Link className="underline" href={`/s/${slug}/book?stylist=${stylist.id}`}>
          Book {stylist.displayName}
        </Link>
      </CardContent>
    </Card>
  );
}
