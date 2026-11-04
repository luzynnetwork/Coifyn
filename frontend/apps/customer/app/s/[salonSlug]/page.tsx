import { SalonPage } from "../../../features/discover/components/SalonPage";

export default async function Salon({ params }: { params: Promise<{ salonSlug: string }> }) {
  const { salonSlug } = await params;
  return <SalonPage slug={salonSlug} />;
}
