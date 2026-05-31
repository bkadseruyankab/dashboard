import { db } from '@/lib/db'
import { invalidateDashboardCache } from '@/lib/cache'
import { syncRealisasiAkun } from '@/lib/sync-realisasi-akun'
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
 * Get the OPD record id for a given tahunAnggaranId and user's kodeOpd.
 * This is used to filter/auto-assign opdId on belanja records.
 */
async function getOpdIdForTahun(opdKode: string, tahunAnggaranId: string): Promise<string | null> {
  const opd = await db.opd.findFirst({
    where: { kodeOpd: opdKode, tahunAnggaranId },
  })
  return opd?.id ?? null
}

/**
 * Extract user role and opdKode from the session.
 * Returns { role, opdKode } where opdKode is only set for OPD users.
 */
async function getUserRoleAndOpdKode(session: NonNullable<Awaited<ReturnType<typeof checkAuth>>>) {
  const role = (session.user as { role?: string })?.role
  const userOpdId = (session.user as { opdId?: string | null })?.opdId

  let opdKode: string | null = null
  if (role === 'opd' && userOpdId) {
    const opd = await db.opd.findUnique({ where: { id: userOpdId } })
    opdKode = opd?.kodeOpd ?? null
  }

  return { role, opdKode }
}

// GET /api/admin/belanja?tahunAnggaranId=xxx&search=yyy&page=1&limit=20
export async function GET(request: Request) {
  try {
    const session = await checkAuth()

    const { searchParams } = new URL(request.url)
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

    // Build OPD filter if user has OPD role
    let opdIdFilter: string | null = null
    if (session) {
      const { role, opdKode } = await getUserRoleAndOpdKode(session)
      if (role === 'opd' && opdKode) {
        opdIdFilter = await getOpdIdForTahun(opdKode, tahunAnggaranId)
      }
    }

    const where = {
      tahunAnggaranId,
      ...(opdIdFilter ? { opdId: opdIdFilter } : {}),
      ...(search
        ? {
            OR: [
              { namaAkun: { contains: search } },
              { kodeAkun: { contains: search } },
            ],
          }
        : {}),
    }

    const [data, total] = await Promise.all([
      db.belanja.findMany({
        where,
        orderBy: { kodeAkun: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.belanja.count({ where }),
    ])

    return NextResponse.json({
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('GET belanja error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch belanja records' },
      { status: 500 }
    )
  }
}

// POST /api/admin/belanja — Create new belanja
export async function POST(request: Request) {
  try {
    const session = await checkAuth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { role, opdKode } = await getUserRoleAndOpdKode(session)

    const body = await request.json()
    const { tahunAnggaranId, kodeAkun, namaAkun, kategori, anggaran, realisasi, opdId: bodyOpdId } = body

    if (!tahunAnggaranId || !kodeAkun || !namaAkun || !kategori) {
      return NextResponse.json(
        { error: 'tahunAnggaranId, kodeAkun, namaAkun, and kategori are required' },
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

    const ta = await db.tahunAnggaran.findUnique({ where: { id: tahunAnggaranId } })
    if (!ta) {
      return NextResponse.json(
        { error: 'Tahun anggaran not found' },
        { status: 400 }
      )
    }

    // Determine opdId based on role
    let recordOpdId: string | null = null
    if (role === 'opd' && opdKode) {
      // OPD users: automatically set opdId based on their OPD for the selected tahunAnggaran
      recordOpdId = await getOpdIdForTahun(opdKode, tahunAnggaranId)
      if (!recordOpdId) {
        return NextResponse.json(
          { error: 'OPD Anda tidak ditemukan pada tahun anggaran ini' },
          { status: 403 }
        )
      }
    } else {
      // Admin/superadmin: optionally use provided opdId
      recordOpdId = bodyOpdId ?? null
    }

    const record = await db.belanja.create({
      data: {
        tahunAnggaranId,
        kodeAkun,
        namaAkun,
        kategori,
        anggaran,
        realisasi,
        ...(recordOpdId ? { opdId: recordOpdId } : {}),
      },
    })

    // Auto-sync Realisasi Akun & SKPD
    await syncRealisasiAkun(tahunAnggaranId)
    await syncRealisasiSkpd(tahunAnggaranId)
    invalidateDashboardCache()
    return NextResponse.json(record, { status: 201 })
  } catch (error) {
    console.error('POST belanja error:', error)
    return NextResponse.json(
      { error: 'Failed to create belanja record' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/belanja?id=xxx — Update belanja
export async function PUT(request: Request) {
  try {
    const session = await checkAuth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { role, opdKode } = await getUserRoleAndOpdKode(session)

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'id query parameter is required' },
        { status: 400 }
      )
    }

    const existing = await db.belanja.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Belanja record not found' },
        { status: 404 }
      )
    }

    // OPD role check: verify the record belongs to their OPD
    if (role === 'opd' && opdKode) {
      const allowedOpdId = await getOpdIdForTahun(opdKode, existing.tahunAnggaranId)
      if (!allowedOpdId || existing.opdId !== allowedOpdId) {
        return NextResponse.json(
          { error: 'Anda tidak memiliki akses untuk mengubah data belanja OPD lain' },
          { status: 403 }
        )
      }
    }

    const body = await request.json()
    const { kodeAkun, namaAkun, kategori, anggaran, realisasi } = body

    const updateData: {
      kodeAkun?: string
      namaAkun?: string
      kategori?: string
      anggaran?: number
      realisasi?: number
    } = {}

    if (kodeAkun !== undefined) updateData.kodeAkun = kodeAkun
    if (namaAkun !== undefined) updateData.namaAkun = namaAkun
    if (kategori !== undefined) updateData.kategori = kategori
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

    const record = await db.belanja.update({
      where: { id },
      data: updateData,
    })

    // Auto-sync Realisasi Akun & SKPD
    await syncRealisasiAkun(existing.tahunAnggaranId)
    await syncRealisasiSkpd(existing.tahunAnggaranId)
    invalidateDashboardCache()
    return NextResponse.json(record)
  } catch (error) {
    console.error('PUT belanja error:', error)
    return NextResponse.json(
      { error: 'Failed to update belanja record' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/belanja?id=xxx — Delete belanja
export async function DELETE(request: Request) {
  try {
    const session = await checkAuth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { role, opdKode } = await getUserRoleAndOpdKode(session)

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'id query parameter is required' },
        { status: 400 }
      )
    }

    const existing = await db.belanja.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Belanja record not found' },
        { status: 404 }
      )
    }

    // OPD role check: verify the record belongs to their OPD
    if (role === 'opd' && opdKode) {
      const allowedOpdId = await getOpdIdForTahun(opdKode, existing.tahunAnggaranId)
      if (!allowedOpdId || existing.opdId !== allowedOpdId) {
        return NextResponse.json(
          { error: 'Anda tidak memiliki akses untuk menghapus data belanja OPD lain' },
          { status: 403 }
        )
      }
    }

    await db.belanja.delete({ where: { id } })

    // Auto-sync Realisasi Akun & SKPD
    await syncRealisasiAkun(existing.tahunAnggaranId)
    await syncRealisasiSkpd(existing.tahunAnggaranId)
    invalidateDashboardCache()
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE belanja error:', error)
    return NextResponse.json(
      { error: 'Failed to delete belanja record' },
      { status: 500 }
    )
  }
}
