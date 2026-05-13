import { Suspense } from "react";

import { CustomersPageClient } from "@/components/customers/customers-page-client";
import { FullPageSpinner } from "@/components/common/LoadingSpinner";

export default function CustomersPage(): React.JSX.Element {
  return (
    <Suspense fallback={<FullPageSpinner />}>
      <CustomersPageClient />
    </Suspense>
  );
}
