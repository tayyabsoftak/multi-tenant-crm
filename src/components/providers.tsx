"use client";

import { SessionProvider, signOut } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { useEffect } from "react";

import { Toaster } from "@/components/ui/sonner";

function GlobalFetchInterceptor({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const response = await originalFetch(...args);
      if (response.status === 401) {
        signOut({ callbackUrl: "/login" });
      }
      return response;
    };
    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <SessionProvider>
      <GlobalFetchInterceptor>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
          <Toaster richColors closeButton position="top-center" theme="system" />
        </ThemeProvider>
      </GlobalFetchInterceptor>
    </SessionProvider>
  );
}
