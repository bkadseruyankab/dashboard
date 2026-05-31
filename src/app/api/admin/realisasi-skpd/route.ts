import { db } from '@/lib/db'
import { invalidateDashboardCache } from '@/lib/cache'
import { syncRealisasiSkpd } from '@/lib/sync-realisasi-skpd'
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

// GET /api/admin/realisasi-skpd?tahunAnggaranId=xxx&search=yyy&page=1&limit=20
// Also supports ?action=sync&tahunAnggaranId=xxx for manual sync trigger
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    // Manual sync trigger
    if (action === 'sync') {
      if (!(await checkAuth())) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      const tahunAnggaranId = searchParams.get('tahunAnggaranId')
      if (!tahunAnggaranId) {
        return NextResponse.json(
          { error: 'tahunAnggaranId query parameter is required' },
          { status: 400 }
        )
      }
      await syncRealisasiSkpd(tahunAnggaranId)
      invalidateDashboardCache()
      return NextResponse.json({ success: true, message: 'Realisasi SKPD berhasil disinkronkan' })
    }

    const tahunAnggaranId = searchParams.get('tahunAnggaranId')
    const search = searchParams.get('search') ?? ''
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
    const limit = Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10))

    if (!tahunAnggaranId) {
      return NextResponse.json(
        { error: 'tahunAnggaranId query parameter is required' },
        { status: 400 }
      )
    }

    // Check for OPD role — if OPD, only show their own data
    const session = await checkAuth()
    let opdKodeFilter: string | null = null
    if (session) {
      const opdKode = await getUserOpdKode(session)
      if (opdKode) {
        opdKodeFilter = opdKode
      }
    }

    const where = {
      tahunAnggaranId,
      ...(opdKodeFilter ? { kodeSkpd: opdKodeFilter } : {}),
      ...(search
        ? {
            OR: [
              { namaSkpd: { contains: search } },
              { kodeSkpd: { contains: search } },
            ],
          }
        : {}),
    }

    const [data, total] = await Promise.all([
      db.realisasiSkpd.findMany({
        where,
        orderBy: { kodeSkpd: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.realisasiSkpd.count({ where }),
    ])

    return NextResponse.json({
      data: data.map((r) => ({
        ...r,
        autoSync: r.autoSync ? 'Auto' : 'Manual',
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('GET realisasi-skpd error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch realisasi SKPD records' },
      { status: 500 }
    )
  }
}

// POST /api/admin/realisasi-skpd — Create new realisasi SKPD (manual only)
export async function POST(request: Request) {
  try {
    const session = await checkAuth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const body = await request.json()
    const { tahunAnggaranId, kodeSkpd, namaSkpd, anggaran, realisasi, persentase } = body

    if (!tahunAnggaranId || !kodeSkpd || !namaSkpd) {
      return NextResponse.json(
        { error: 'tahunAnggaranId, kodeSkpd, and namaSkpd are required' },
        { status: 400 }
      )
    }

    if (typeof anggaran !== 'number' || anggaran < 0) {
      return NextResponse.json(
        { error: 'anggaran must be a non-negative number' },
        { status: 400 }
      )
    }

    if (typeof realisasi !== 'number' || realisasi < 0) {
      return NextResponse.json(
        { error: 'realisasi must be a non-negative number' },
        { status: 400 }
      )
    }

    if (persentase !== undefined && (typeof persentase !== 'number' || persentase < 0)) {
      return NextResponse.json(
        { error: 'persentase must be a non-negative number' },
        { status: 400 }
      )
    }

    const ta = await db.tahunAnggaran.findUnique({ where: { id: tahunAnggaranId } })
    if (!ta) {
      return NextResponse.json(
        { error: 'Tahun anggaran not found' },
        { status: 400 }
      )
    }

    const record = await db.realisasiSkpd.create({
      data: {
        tahunAnggaranId,
        kodeSkpd,
        namaSkpd,
        anggaran,
        realisasi,
        persentase: persentase ?? (anggaran > 0 ? Math.round((realisasi / anggaran) * 10000) / 100 : 0),
        autoSync: false, // Manual entries are always autoSync=false
      },
    })

    invalidateDashboardCache()
    return NextResponse.json(record, { status: 201 })
  } catch (error) {
    console.error('POST realisasi-skpd error:', error)
    return NextResponse.json(
      { error: 'Failed to create realisasi SKPD record' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/realisasi-skpd?id=xxx — Update realisasi SKPD (only manual entries)
export async function PUT(request: Request) {
  try {
    const session = await checkAuth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'id query parameter is required' },
        { status: 400 }
      )
    }

    const existing = await db.realisasiSkpd.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Realisasi SKPD record not found' },
        { status: 404 }
      )
    }

    // Block editing of auto-synced records
    if (existing.autoSync) {
      return NextResponse.json(
        { error: 'Data auto-sync tidak dapat diedit. Data ini dihitung otomatis dari Pendapatan, Belanja & Pembiayaan.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { kodeSkpd, namaSkpd, anggaran, realisasi, persentase } = body

    const updateData: {
      kodeSkpd?: string
      namaSkpd?: string
      anggaran?: number
      realisasi?: number
      persentase?: number
    } = {}

    if (kodeSkpd !== undefined) updateData.kodeSkpd = kodeSkpd
    if (namaSkpd !== undefined) updateData.namaSkpd = namaSkpd
    if (anggaran !== undefined) {
      if (typeof anggaran !== 'number' || anggaran < 0) {
        return NextResponse.json(
          { error: 'anggaran must be a non-negative number' },
          { status: 400 }
        )
      }
      updateData.anggaran = anggaran
    }
    if (realisasi !== undefined) {
      if (typeof realisasi !== 'number' || realisasi < 0) {
        return NextResponse.json(
          { error: 'realisasi must be a non-negative number' },
          { status: 400 }
        )
      }
      updateData.realisasi = realisasi
    }

    // Auto-recalculate persentase if anggaran or realisasi changed
    const finalAnggaran = updateData.anggaran ?? existing.anggaran
    const finalRealisasi = updateData.realisasi ?? existing.realisasi
    updateData.persentase = finalAnggaran > 0
      ? Math.round((finalRealisasi / finalAnggaran) * 10000) / 100
      : 0

    // Override with explicit persentase if provided
    if (persentase !== undefined && typeof persentase === 'number' && persentase >= 0) {
      updateData.persentase = persentase
    }

    const record = await db.realisasiSkpd.update({
      where: { id },
      data: updateData,
    })

    invalidateDashboardCache()
    return NextResponse.json(record)
  } catch (error) {
    console.error('PUT realisasi-skpd error:', error)
    return NextResponse.json(
      { error: 'Failed to update realisasi SKPD record' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/realisasi-skpd?id=xxx — Delete realisasi SKPD (only manual entries)
export async function DELETE(request: Request) {
  try {
    const session = await checkAuth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'id query parameter is required' },
        { status: 400 }
      )
    }

    const existing = await db.realisasiSkpd.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Realisasi SKPD record not found' },
        { status: 404 }
      )
    }

    // Block deleting of auto-synced records
    if (existing.autoSync) {
      return NextResponse.json(
        { error: 'Data auto-sync tidak dapat dihapus. Data ini dihitung otomatis dari Pendapatan, Belanja & Pembiayaan.' },
        { status: 403 }
      )
    }

    await db.realisasiSkpd.delete({ where: { id } })

    invalidateDashboardCache()
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE realisasi-skpd error:', error)
    return NextResponse.json(
      { error: 'Failed to delete realisasi SKPD record' },
      { status: 500 }
    )
  }
}
