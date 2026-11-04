import { CustomerProfile } from "../../../features/customers/components/CustomerProfile";

export default async function CustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CustomerProfile customerId={id} />;
}
