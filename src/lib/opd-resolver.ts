import { db } from '@/lib/db'

/**
 * Resolve the correct OPD for a given user and target tahun anggaran.
 *
 * Problem: User.opdId is STATIC — it points to the OPD in the year the user was created.
 * When OPDs are generated for a new year, they get NEW IDs. So when an OPD user
 * works with data for tahun 2025, their session opdId (from 2024) doesn't match
 * any 2025 OPD.
 *
 * Solution: Look up the user's OPD by kodeOpd in the target tahun anggaran.
 *
 * @param userOpdId - The user's stored opdId (from session/JWT)
 * @param targetTahunAnggaranId - The tahun anggaran the user is working with
 * @returns The OPD ID for the target tahun anggaran, or null if not found
 */
export async function resolveOpdIdForTahunAnggaran(
  userOpdId: string | null | undefined,
  targetTahunAnggaranId: string
): Promise<string | null> {
  if (!userOpdId) return null

  // 1. Check if the user's opdId already belongs to the target tahun anggaran
  const directOpd = await db.opd.findUnique({
    where: { id: userOpdId },
    select: { id: true, tahunAnggaranId: true, kodeOpd: true },
  })

  if (!directOpd) return null

  // If the opdId already belongs to the target tahun anggaran, use it directly
  if (directOpd.tahunAnggaranId === targetTahunAnggaranId) {
    return directOpd.id
  }

  // 2. The opdId belongs to a different tahun anggaran — resolve by kodeOpd
  const resolvedOpd = await db.opd.findFirst({
    where: {
      kodeOpd: directOpd.kodeOpd,
      tahunAnggaranId: targetTahunAnggaranId,
    },
    select: { id: true },
  })

  return resolvedOpd?.id ?? null
}

/**
 * Get the kodeOpd for a user's linked OPD.
 * Useful for fallback filtering when the exact opdId doesn't match the target tahun anggaran.
 */
export async function getUserKodeOpd(
  userOpdId: string | null | undefined
): Promise<string | null> {
  if (!userOpdId) return null

  const opd = await db.opd.findUnique({
    where: { id: userOpdId },
    select: { kodeOpd: true },
  })

  return opd?.kodeOpd ?? null
}
