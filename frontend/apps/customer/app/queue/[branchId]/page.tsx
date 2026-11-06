import { LiveQueue } from "../../../features/queue/components/LiveQueue";

export default async function QueuePage({ params }: { params: Promise<{ branchId: string }> }) {
  const { branchId } = await params;
  return <LiveQueue branchId={branchId} />;
}
