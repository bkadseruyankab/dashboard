import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

async function checkAuth() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return null
  return session
}

/**
 * Get the OPD kodeOpd for a given user's opdId.
 */
async function getUserOpdKode(session: NonNullable<Awaited<ReturnType<typeof checkAuth>>>): Promise<string | null> {
  const role = (session.user as { role?: string })?.role
  const userOpdId = (session.user as { opdId?: string | null })?.opdId
  if (role !== 'opd' || !userOpdId) return null
  const opd = await db.opd.findUnique({ where: { id: userOpdId } })
  return opd?.kodeOpd ?? null
}

// GET /api/admin/realisasi-skpd-history?realisasiSkpdId=xxx&tahunAnggaranId=yyy
export async function GET(request: Request) {
  try {
    const session = await checkAuth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const realisasiSkpdId = searchParams.get('realisasiSkpdId')
    const tahunAnggaranId = searchParams.get('tahunAnggaranId')
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '50', 10)))

    // If specific SKPD ID is given, get history for that record
    if (realisasiSkpdId) {
      // For OPD users, verify they own this record
      if (session) {
        const opdKode = await getUserOpdKode(session)
        if (opdKode) {
          const record = await db.realisasiSkpd.findUnique({ where: { id: realisasiSkpdId } })
          if (!record || record.kodeSkpd !== opdKode) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
          }
        }
      }

      const history = await db.realisasiSkpdHistory.findMany({
        where: { realisasiSkpdId },
        orderBy: { tanggalUpdate: 'desc' },
        take: limit,
      })

      return NextResponse.json({ data: history })
    }

    // Get all history for a tahun anggaran (with OPD filtering for OPD users)
    if (!tahunAnggaranId) {
      return NextResponse.json(
        { error: 'realisasiSkpdId or tahunAnggaranId is required' },
        { status: 400 }
      )
    }

    // OPD role filter
    let opdKodeFilter: string | null = null
    const opdKode = await getUserOpdKode(session)
    if (opdKode) {
      opdKodeFilter = opdKode
    }

    // Get all RealisasiSkpd IDs for this tahun anggaran (and OPD filter)
    const skpdRecords = await db.realisasiSkpd.findMany({
      where: {
        tahunAnggaranId,
        ...(opdKodeFilter ? { kodeSkpd: opdKodeFilter } : {}),
      },
      select: { id: true },
    })

    const skpdIds = skpdRecords.map((r) => r.id)

    if (skpdIds.length === 0) {
      return NextResponse.json({ data: [] })
    }

    const history = await db.realisasiSkpdHistory.findMany({
      where: {
        realisasiSkpdId: { in: skpdIds },
      },
      orderBy: { tanggalUpdate: 'desc' },
      take: limit,
    })

    return NextResponse.json({ data: history })
  } catch (error) {
    console.error('GET realisasi-skpd-history error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch realisasi SKPD history' },
      { status: 500 }
    )
  }
}
