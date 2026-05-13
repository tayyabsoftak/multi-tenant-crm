import { Suspense } from "react";

import { CustomerList } from "@/components/customers/CustomerList";
import { FullPageSpinner } from "@/components/common/LoadingSpinner";

export default function CustomersPage(): React.JSX.Element {
  return (
    <Suspense fallback={<FullPageSpinner />}>
      <CustomerList />
    </Suspense>
  );
}
