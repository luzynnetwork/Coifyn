"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  ApiError,
  getPublicSalon,
  getPublicSlots,
  submitBookingRequest,
} from "@coifyn/api-client";
import { formatMoney } from "@coifyn/shared";
import { Button, Input, Label } from "@coifyn/ui";
import { SlotPicker } from "./SlotPicker";

const today = () => new Date().toLocaleDateString("en-CA");

/** Pick stylist → service → open slot → submit a request with just a name and phone.
 *  Staff confirm it in the console; nothing is booked until they do. */
export function BookingRequest({ slug, initialStylistId }: { slug: string; initialStylistId?: string }) {
  const salon = useQuery({ queryKey: ["public-salon", slug], queryFn: () => getPublicSalon(slug) });

  const [stylistId, setStylistId] = useState(initialStylistId ?? "");
  const [serviceId, setServiceId] = useState("");
  const [date, setDate] = useState(today);
  const [startAt, setStartAt] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const slots = useQuery({
    queryKey: ["public-slots", slug, stylistId, serviceId, date],
    queryFn: () => getPublicSlots(slug, stylistId, [serviceId], date),
    enabled: Boolean(stylistId && serviceId),
  });

  const submit = useMutation({
    mutationFn: () =>
      submitBookingRequest(slug, {
        stylistId,
        serviceIds: [serviceId],
        startAt,
        customerName: name,
        customerPhone: phone,
      }),
  });

  if (submit.isSuccess) {
    return (
      <main className="mx-auto max-w-lg p-6">
        <h1 className="text-xl font-semibold">Request sent</h1>
        <p className="mt-2 text-sm">
          The salon will confirm your slot shortly. We’ll message {phone} once it’s booked.
        </p>
      </main>
    );
  }

  const data = salon.data;
  const error =
    submit.error instanceof ApiError && submit.error.status === 409
      ? "That slot was just taken — please pick another."
      : submit.error
        ? "Something went wrong. Please try again."
        : null;

  return (
    <main className="mx-auto flex max-w-lg flex-col gap-4 p-6">
      <h1 className="text-xl font-semibold">Request a booking{data ? ` — ${data.salon.brandName}` : ""}</h1>

      <Label htmlFor="stylist">Stylist</Label>
      <select id="stylist" className="rounded border border-[var(--color-border)] bg-transparent p-2 text-sm"
        value={stylistId} onChange={(e) => { setStylistId(e.target.value); setStartAt(""); }}>
        <option value="">Choose…</option>
        {(data?.stylists ?? []).map((s) => (
          <option key={s.id} value={s.id}>{s.displayName}</option>
        ))}
      </select>

      <Label htmlFor="service">Service</Label>
      <select id="service" className="rounded border border-[var(--color-border)] bg-transparent p-2 text-sm"
        value={serviceId} onChange={(e) => { setServiceId(e.target.value); setStartAt(""); }}>
        <option value="">Choose…</option>
        {(data?.services ?? []).map((s) => (
          <option key={s.id} value={s.id}>
            {s.name} · {s.baseDurationMin} min · {formatMoney(s.basePriceMinor)}
          </option>
        ))}
      </select>

      <Label htmlFor="date">Day</Label>
      <Input id="date" type="date" min={today()} value={date} onChange={(e) => { setDate(e.target.value); setStartAt(""); }} />

      <SlotPicker
        slots={slots.data ?? []}
        loading={slots.isFetching}
        ready={Boolean(stylistId && serviceId)}
        timeZone={data?.salon.timezone}
        value={startAt}
        onChange={setStartAt}
      />

      <Label htmlFor="name">Your name</Label>
      <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
      <Label htmlFor="phone">Phone</Label>
      <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <Button
        disabled={!startAt || !name.trim() || phone.trim().length < 5 || submit.isPending}
        onClick={() => submit.mutate()}
      >
        Send request
      </Button>
    </main>
  );
}
