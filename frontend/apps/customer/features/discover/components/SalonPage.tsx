"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { getPublicSalon } from "@coifyn/api-client";
import { formatMoney } from "@coifyn/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@coifyn/ui";
import { StylistCard } from "./StylistCard";

/** Read-only salon page: services, stylists with live status and next open slot. */
export function SalonPage({ slug }: { slug: string }) {
  const salon = useQuery({
    queryKey: ["public-salon", slug],
    queryFn: () => getPublicSalon(slug),
    refetchInterval: 30_000,
  });

  if (salon.isError) {
    return <main className="p-6 text-sm">We couldn’t find that salon.</main>;
  }
  const data = salon.data;
  if (!data) return <main className="p-6 text-sm">Loading…</main>;

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">{data.salon.brandName}</h1>
        <div className="flex gap-3 text-sm">
          <Link className="underline" href={`/s/${slug}/book`}>
            Request a booking
          </Link>
          {data.branches.map((b) => (
            <Link key={b.id} className="underline" href={`/queue/${b.id}`}>
              Wait board{data.branches.length > 1 ? ` — ${b.name}` : ""}
            </Link>
          ))}
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2">
        {data.stylists.map((s) => (
          <StylistCard key={s.id} stylist={s} timeZone={data.salon.timezone} slug={slug} />
        ))}
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Services</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-sm">
          {data.services.map((s) => (
            <div key={s.id} className="flex justify-between">
              <span>
                {s.name} <span className="text-[var(--color-muted-foreground)]">· {s.baseDurationMin} min</span>
              </span>
              <span>{formatMoney(s.basePriceMinor)}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </main>
  );
}
