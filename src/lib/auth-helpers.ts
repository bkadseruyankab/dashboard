import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

/**
 * Checks if the current request is from an authenticated admin user.
 * Returns the session if authenticated, or a 401 response if not.
 */
export async function requireAuth() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return {
      session: null,
      error: NextResponse.json(
        { error: "Unauthorized", message: "Anda harus login untuk mengakses fitur ini" },
        { status: 401 }
      ),
    };
  }

  return { session, error: null };
}
