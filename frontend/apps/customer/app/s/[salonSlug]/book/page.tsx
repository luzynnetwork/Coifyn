import { BookingRequest } from "../../../../features/booking/components/BookingRequest";

export default async function Book({
  params,
  searchParams,
}: {
  params: Promise<{ salonSlug: string }>;
  searchParams: Promise<{ stylist?: string }>;
}) {
  const { salonSlug } = await params;
  const { stylist } = await searchParams;
  return <BookingRequest slug={salonSlug} initialStylistId={stylist} />;
}
