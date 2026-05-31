import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

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

/**
 * Checks if the current request is from an authenticated user with OPD role.
 * Returns the session and the OPD's kodeOpd if authorized, or an error response if not.
 */
export async function requireOpdAuth() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return {
      session: null,
      opdKode: null,
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const role = (session.user as { role?: string }).role;
  const opdId = (session.user as { opdId?: string }).opdId;

  if (role !== "opd" || !opdId) {
    return {
      session,
      opdKode: null,
      error: NextResponse.json(
        { error: "Access denied. OPD role required." },
        { status: 403 }
      ),
    };
  }

  // Get the OPD's kodeOpd from the database
  const opd = await db.opd.findUnique({ where: { id: opdId } });
  if (!opd) {
    return {
      session,
      opdKode: null,
      error: NextResponse.json({ error: "OPD not found" }, { status: 404 }),
    };
  }

  return { session, opdKode: opd.kodeOpd, error: null };
}
