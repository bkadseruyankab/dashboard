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

// GET /api/admin/pendapatan?tahunAnggaranId=xxx&search=yyy&page=1&limit=20
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
      db.pendapatan.findMany({
        where,
        orderBy: { kodeAkun: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.pendapatan.count({ where }),
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
    if (!(await checkAuth())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const body = await request.json()
    const { tahunAnggaranId, kodeAkun, namaAkun, kategori, anggaran, realisasi } = body

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

    const record = await db.pendapatan.create({
      data: { tahunAnggaranId, kodeAkun, namaAkun, kategori, anggaran, realisasi },
    })

    invalidateDashboardCache()
    return NextResponse.json(record, { status: 201 })
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

    const existing = await db.pendapatan.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Pendapatan record not found' },
        { status: 404 }
      )
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

    const record = await db.pendapatan.update({
      where: { id },
      data: updateData,
    })

    invalidateDashboardCache()
    return NextResponse.json(record)
  } catch (error) {
    console.error('PUT pendapatan error:', error)
    return NextResponse.json(
      { error: 'Failed to update pendapatan record' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/pendapatan?id=xxx — Delete pendapatan
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

    const existing = await db.pendapatan.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Pendapatan record not found' },
        { status: 404 }
      )
    }

    await db.pendapatan.delete({ where: { id } })

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
