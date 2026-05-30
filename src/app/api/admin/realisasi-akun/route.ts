import { db } from '@/lib/db'
import { invalidateDashboardCache } from '@/lib/cache'
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

async function checkAuth() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return null
  return session
}

// GET /api/admin/realisasi-akun?tahunAnggaranId=xxx&search=yyy&page=1&limit=20
export async function GET(request: Request) {
  try {
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

    const where = {
      tahunAnggaranId,
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
      db.realisasiAkun.findMany({
        where,
        orderBy: { kodeAkun: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.realisasiAkun.count({ where }),
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
    console.error('GET realisasi-akun error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch realisasi akun records' },
      { status: 500 }
    )
  }
}

// POST /api/admin/realisasi-akun — Create new realisasi akun
export async function POST(request: Request) {
  try {
    if (!(await checkAuth())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const body = await request.json()
    const { tahunAnggaranId, kodeAkun, namaAkun, jenis, anggaran, realisasi, persentase } = body

    if (!tahunAnggaranId || !kodeAkun || !namaAkun || !jenis) {
      return NextResponse.json(
        { error: 'tahunAnggaranId, kodeAkun, namaAkun, and jenis are required' },
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

    const record = await db.realisasiAkun.create({
      data: {
        tahunAnggaranId,
        kodeAkun,
        namaAkun,
        jenis,
        anggaran,
        realisasi,
        persentase: persentase ?? (anggaran > 0 ? Math.round((realisasi / anggaran) * 10000) / 100 : 0),
      },
    })

    invalidateDashboardCache()
    return NextResponse.json(record, { status: 201 })
  } catch (error) {
    console.error('POST realisasi-akun error:', error)
    return NextResponse.json(
      { error: 'Failed to create realisasi akun record' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/realisasi-akun?id=xxx — Update realisasi akun
export async function PUT(request: Request) {
  try {
    if (!(await checkAuth())) {
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

    const existing = await db.realisasiAkun.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Realisasi akun record not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { kodeAkun, namaAkun, jenis, anggaran, realisasi, persentase } = body

    const updateData: {
      kodeAkun?: string
      namaAkun?: string
      jenis?: string
      anggaran?: number
      realisasi?: number
      persentase?: number
    } = {}

    if (kodeAkun !== undefined) updateData.kodeAkun = kodeAkun
    if (namaAkun !== undefined) updateData.namaAkun = namaAkun
    if (jenis !== undefined) updateData.jenis = jenis
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
    if (persentase !== undefined) {
      if (typeof persentase !== 'number' || persentase < 0) {
        return NextResponse.json(
          { error: 'persentase must be a non-negative number' },
          { status: 400 }
        )
      }
      updateData.persentase = persentase
    }

    const record = await db.realisasiAkun.update({
      where: { id },
      data: updateData,
    })

    invalidateDashboardCache()
    return NextResponse.json(record)
  } catch (error) {
    console.error('PUT realisasi-akun error:', error)
    return NextResponse.json(
      { error: 'Failed to update realisasi akun record' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/realisasi-akun?id=xxx — Delete realisasi akun
export async function DELETE(request: Request) {
  try {
    if (!(await checkAuth())) {
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

    const existing = await db.realisasiAkun.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Realisasi akun record not found' },
        { status: 404 }
      )
    }

    await db.realisasiAkun.delete({ where: { id } })

    invalidateDashboardCache()
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE realisasi-akun error:', error)
    return NextResponse.json(
      { error: 'Failed to delete realisasi akun record' },
      { status: 500 }
    )
  }
}
