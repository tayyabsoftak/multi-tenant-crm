import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { Header } from "@/components/dashboard/Header";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { authOptions } from "@/lib/auth";

export default async function DashboardLayout({ children }: { children: ReactNode }): Promise<React.JSX.Element> {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login?callbackUrl=/dashboard");
  }

  return (
    <ErrorBoundary>
      <div className="flex min-h-screen bg-background">
        <aside className="sticky top-0 h-screen w-64 shrink-0 border-r bg-card flex flex-col">
          <Sidebar className="flex h-full min-h-0 flex-col" />
        </aside>
        <div className="flex min-w-0 flex-1 flex-col">
          <Header />
          <div className="flex-1 overflow-auto p-4 md:p-6">{children}</div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
