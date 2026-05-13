import { CustomerDetailView } from "@/components/customers/CustomerDetailView";

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<React.JSX.Element> {
  const { id } = await params;
  return <CustomerDetailView id={id} />;
}
