import { CustomerDetailClient } from "@/components/customers/customer-detail-client";

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<React.JSX.Element> {
  const { id } = await params;
  return <CustomerDetailClient id={id} />;
}
