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
 * This is used to filter/create pendapatan records scoped to an OPD.
 */
async function getOpdIdForTahun(opdKode: string, tahunAnggaranId: string): Promise<string | null> {
  const opd = await db.opd.findFirst({
    where: { kodeOpd: opdKode, tahunAnggaranId },
  })
  return opd?.id ?? null
}

/**
 * Get the authenticated user's role and opdKode (if OPD role).
 */
async function getUserOpdInfo(session: NonNullable<Awaited<ReturnType<typeof checkAuth>>>) {
  const role = (session.user as { role?: string })?.role
  const opdId = (session.user as { opdId?: string | null })?.opdId

  let opdKode: string | null = null
  if (role === 'opd' && opdId) {
    const opd = await db.opd.findUnique({ where: { id: opdId } })
    opdKode = opd?.kodeOpd ?? null
  }

  return { role, opdKode }
}

// GET /api/admin/pendapatan?tahunAnggaranId=xxx&search=yyy&page=1&limit=20
export async function GET(request: Request) {
  try {
    const session = await checkAuth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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

    // Determine OPD filter
    const { role, opdKode } = await getUserOpdInfo(session)
    let opdIdFilter: string | null = null

    if (role === 'opd') {
      if (!opdKode) {
        return NextResponse.json(
          { error: 'OPD kode tidak ditemukan untuk user ini' },
          { status: 403 }
        )
      }
      opdIdFilter = await getOpdIdForTahun(opdKode, tahunAnggaranId)
      if (!opdIdFilter) {
        return NextResponse.json(
          { error: 'OPD tidak ditemukan untuk tahun anggaran ini' },
          { status: 403 }
        )
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
      db.pendapatan.findMany({
        where,
        orderBy: { kodeAkun: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.pendapatan.count({ where }),
    ])

    return NextResponse.json({
      data: data.map((r) => ({
        ...r,
        tanggalUpdate: r.tanggalUpdate.toISOString(),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('GET pendapatan error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch pendapatan records' },
      { status: 500 }
    )
  }
}

// POST /api/admin/pendapatan — Create new pendapatan
export async function POST(request: Request) {
  try {
    const session = await checkAuth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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

    // Verify tahunAnggaranId exists
    const ta = await db.tahunAnggaran.findUnique({ where: { id: tahunAnggaranId } })
    if (!ta) {
      return NextResponse.json(
        { error: 'Tahun anggaran not found' },
        { status: 400 }
      )
    }

    // Determine opdId based on role
    const { role, opdKode } = await getUserOpdInfo(session)
    let finalOpdId: string | null = null

    if (role === 'opd') {
      // OPD users: automatically set opdId based on their OPD
      if (!opdKode) {
        return NextResponse.json(
          { error: 'OPD kode tidak ditemukan untuk user ini' },
          { status: 403 }
        )
      }
      finalOpdId = await getOpdIdForTahun(opdKode, tahunAnggaranId)
      if (!finalOpdId) {
        return NextResponse.json(
          { error: 'OPD tidak ditemukan untuk tahun anggaran ini' },
          { status: 403 }
        )
      }
    } else {
      // Admin/superadmin: optionally use opdId from request body
      finalOpdId = bodyOpdId ?? null
    }

    const record = await db.pendapatan.create({
      data: {
        tahunAnggaranId,
        kodeAkun,
        namaAkun,
        kategori,
        anggaran,
        realisasi,
        opdId: finalOpdId,
      },
    })

    // Create initial history record
    const userName = (session.user as { name?: string })?.name || 'Unknown'
    await db.pendapatanHistory.create({
      data: {
        pendapatanId: record.id,
        realisasiLama: 0,
        realisasiBaru: realisasi,
        tanggalUpdate: new Date(),
        keterangan: 'Data baru ditambahkan',
        updatedBy: userName,
      },
    })

    // Auto-sync Realisasi Akun & SKPD
    await syncRealisasiAkun(tahunAnggaranId)
    await syncRealisasiSkpd(tahunAnggaranId)
    invalidateDashboardCache()
    return NextResponse.json({ ...record, tanggalUpdate: record.tanggalUpdate.toISOString() }, { status: 201 })
  } catch (error) {
    console.error('POST pendapatan error:', error)
    return NextResponse.json(
      { error: 'Failed to create pendapatan record' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/pendapatan?id=xxx — Update pendapatan
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

    const existing = await db.pendapatan.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Pendapatan record not found' },
        { status: 404 }
      )
    }

    // OPD role check: verify the record belongs to their OPD
    const { role, opdKode } = await getUserOpdInfo(session)
    if (role === 'opd') {
      if (!opdKode) {
        return NextResponse.json(
          { error: 'OPD kode tidak ditemukan untuk user ini' },
          { status: 403 }
        )
      }
      const userOpdId = await getOpdIdForTahun(opdKode, existing.tahunAnggaranId)
      if (!userOpdId || existing.opdId !== userOpdId) {
        return NextResponse.json(
          { error: 'Anda tidak memiliki akses untuk mengubah data OPD lain' },
          { status: 403 }
        )
      }
    }

    const body = await request.json()
    const { kodeAkun, namaAkun, kategori, anggaran, realisasi, opdId: bodyOpdId, keterangan } = body

    const updateData: {
      kodeAkun?: string
      namaAkun?: string
      kategori?: string
      anggaran?: number
      realisasi?: number
      opdId?: string | null
      tanggalUpdate?: Date
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

    // Only admin/superadmin can change opdId
    if (bodyOpdId !== undefined && role !== 'opd') {
      updateData.opdId = bodyOpdId
    }

    updateData.tanggalUpdate = new Date()

    const record = await db.pendapatan.update({
      where: { id },
      data: updateData,
    })

    // Record history if realisasi changed
    if (realisasi !== undefined && realisasi !== existing.realisasi) {
      const userName = (session.user as { name?: string })?.name || 'Unknown'
      await db.pendapatanHistory.create({
        data: {
          pendapatanId: id,
          realisasiLama: existing.realisasi,
          realisasiBaru: realisasi,
          tanggalUpdate: updateData.tanggalUpdate,
          keterangan: keterangan || 'Update realisasi',
          updatedBy: userName,
        },
      })
    }

    // Auto-sync Realisasi Akun & SKPD
    await syncRealisasiAkun(existing.tahunAnggaranId)
    await syncRealisasiSkpd(existing.tahunAnggaranId)
    invalidateDashboardCache()
    return NextResponse.json({ ...record, tanggalUpdate: record.tanggalUpdate.toISOString() })
  } catch (error) {
    console.error('PUT pendapatan error:', error)
    return NextResponse.json(
      { error: 'Failed to update pendapatan record' },
      { status: 500 }
    )
  }
}

// PATCH /api/admin/pendapatan?id=xxx — Update realisasi only
// Body: { realisasi: number, tanggalUpdate?: string, keterangan?: string }
export async function PATCH(request: Request) {
  try {
    const session = await checkAuth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'id query parameter is required' }, { status: 400 })
    }

    const existing = await db.pendapatan.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Pendapatan record not found' }, { status: 404 })
    }

    // OPD role check
    const { role, opdKode } = await getUserOpdInfo(session)
    if (role === 'opd' && opdKode) {
      const userOpdId = await getOpdIdForTahun(opdKode, existing.tahunAnggaranId)
      if (!userOpdId || existing.opdId !== userOpdId) {
        return NextResponse.json(
          { error: 'Anda tidak memiliki akses untuk mengubah data OPD lain' },
          { status: 403 }
        )
      }
    }

    const body = await request.json()
    const { realisasi, tanggalUpdate, keterangan } = body

    if (typeof realisasi !== 'number' || realisasi < 0) {
      return NextResponse.json({ error: 'realisasi must be a non-negative number' }, { status: 400 })
    }

    const parsedTanggalUpdate = tanggalUpdate ? new Date(tanggalUpdate) : new Date()

    const record = await db.pendapatan.update({
      where: { id },
      data: {
        realisasi,
        tanggalUpdate: parsedTanggalUpdate,
      },
    })

    // Record history
    const userName = (session.user as { name?: string })?.name || 'Unknown'
    await db.pendapatanHistory.create({
      data: {
        pendapatanId: id,
        realisasiLama: existing.realisasi,
        realisasiBaru: realisasi,
        tanggalUpdate: parsedTanggalUpdate,
        keterangan: keterangan || 'Update realisasi',
        updatedBy: userName,
      },
    })

    // Auto-sync Realisasi Akun & SKPD
    await syncRealisasiAkun(existing.tahunAnggaranId)
    await syncRealisasiSkpd(existing.tahunAnggaranId)
    invalidateDashboardCache()
    return NextResponse.json({ ...record, tanggalUpdate: record.tanggalUpdate.toISOString() })
  } catch (error) {
    console.error('PATCH pendapatan error:', error)
    return NextResponse.json({ error: 'Failed to update realisasi' }, { status: 500 })
  }
}

// DELETE /api/admin/pendapatan?id=xxx — Delete pendapatan
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

    const existing = await db.pendapatan.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Pendapatan record not found' },
        { status: 404 }
      )
    }

    // OPD role check: verify the record belongs to their OPD
    const { role, opdKode } = await getUserOpdInfo(session)
    if (role === 'opd') {
      if (!opdKode) {
        return NextResponse.json(
          { error: 'OPD kode tidak ditemukan untuk user ini' },
          { status: 403 }
        )
      }
      const userOpdId = await getOpdIdForTahun(opdKode, existing.tahunAnggaranId)
      if (!userOpdId || existing.opdId !== userOpdId) {
        return NextResponse.json(
          { error: 'Anda tidak memiliki akses untuk menghapus data OPD lain' },
          { status: 403 }
        )
      }
    }

    await db.pendapatan.delete({ where: { id } })

    // Auto-sync Realisasi Akun & SKPD
    await syncRealisasiAkun(existing.tahunAnggaranId)
    await syncRealisasiSkpd(existing.tahunAnggaranId)
    invalidateDashboardCache()
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE pendapatan error:', error)
    return NextResponse.json(
      { error: 'Failed to delete pendapatan record' },
      { status: 500 }
    )
  }
}
