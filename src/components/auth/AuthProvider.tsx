"use client";

import { SessionProvider } from "next-auth/react";
import type { ReactNode } from "react";

export default function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <SessionProvider
      refetchInterval={5 * 60} // Refetch session every 5 minutes
      refetchOnWindowFocus={false} // Don't refetch on window focus to avoid errors during dev
    >
      {children}
    </SessionProvider>
  );
}
