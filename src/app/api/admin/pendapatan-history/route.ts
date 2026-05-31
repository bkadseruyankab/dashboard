import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

async function checkAuth() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return null
  return session
}

async function getUserOpdKode(session: NonNullable<Awaited<ReturnType<typeof checkAuth>>>): Promise<string | null> {
  const role = (session.user as { role?: string })?.role
  const userOpdId = (session.user as { opdId?: string | null })?.opdId
  if (role !== 'opd' || !userOpdId) return null
  const opd = await db.opd.findUnique({ where: { id: userOpdId } })
  return opd?.kodeOpd ?? null
}

// GET /api/admin/pendapatan-history?pendapatanId=xxx&tahunAnggaranId=yyy
export async function GET(request: Request) {
  try {
    const session = await checkAuth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const pendapatanId = searchParams.get('pendapatanId')
    const tahunAnggaranId = searchParams.get('tahunAnggaranId')
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '50', 10)))

    if (pendapatanId) {
      // OPD users can only see their own records' history
      const opdKode = await getUserOpdKode(session)
      if (opdKode) {
        const record = await db.pendapatan.findUnique({ where: { id: pendapatanId } })
        if (!record) return NextResponse.json({ error: 'Not found' }, { status: 404 })
        const opd = await db.opd.findFirst({ where: { kodeOpd: opdKode, tahunAnggaranId: record.tahunAnggaranId } })
        if (record.opdId && opd && record.opdId !== opd.id) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }
      }

      const history = await db.pendapatanHistory.findMany({
        where: { pendapatanId },
        orderBy: { tanggalUpdate: 'desc' },
        take: limit,
      })
      return NextResponse.json({ data: history })
    }

    if (!tahunAnggaranId) {
      return NextResponse.json({ error: 'pendapatanId or tahunAnggaranId is required' }, { status: 400 })
    }

    // Get all Pendapatan IDs for this tahun anggaran (with OPD filter)
    let opdKodeFilter: string | null = null
    const opdKode = await getUserOpdKode(session)
    if (opdKode) opdKodeFilter = opdKode

    const records = await db.pendapatan.findMany({
      where: {
        tahunAnggaranId,
        ...(opdKodeFilter ? { opdId: { not: null } } : {}),
      },
      select: { id: true, opdId: true },
    })

    // If OPD, filter to only their records
    let filteredIds: string[]
    if (opdKodeFilter) {
      const opd = await db.opd.findFirst({ where: { kodeOpd: opdKodeFilter, tahunAnggaranId } })
      filteredIds = records.filter(r => r.opdId === opd?.id).map(r => r.id)
    } else {
      filteredIds = records.map(r => r.id)
    }

    if (filteredIds.length === 0) return NextResponse.json({ data: [] })

    const history = await db.pendapatanHistory.findMany({
      where: { pendapatanId: { in: filteredIds } },
      orderBy: { tanggalUpdate: 'desc' },
      take: limit,
    })

    return NextResponse.json({ data: history })
  } catch (error) {
    console.error('GET pendapatan-history error:', error)
    return NextResponse.json({ error: 'Failed to fetch pendapatan history' }, { status: 500 })
  }
}
