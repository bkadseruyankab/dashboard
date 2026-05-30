"use client";

import { useSession, signOut } from "next-auth/react";

export function useAuth() {
  const { data: session, status } = useSession();

  const isAuthenticated = status === "authenticated";
  const isLoading = status === "loading";
  const user = session?.user
    ? {
        id: (session.user as { id?: string }).id,
        name: session.user.name,
        email: session.user.email,
        role: (session.user as { role?: string }).role,
      }
    : null;

  const logout = async () => {
    await signOut({ redirect: false });
  };

  return { session, status, isAuthenticated, isLoading, user, logout };
}
