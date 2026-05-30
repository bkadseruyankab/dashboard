import { db } from '@/lib/db'
import { invalidateDashboardCache } from '@/lib/cache'
import { NextResponse } from 'next/server'

// GET /api/admin/opd?tahunAnggaranId=xxx&search=yyy&page=1&limit=20
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
              { namaOpd: { contains: search } },
              { kodeOpd: { contains: search } },
              { kepalaOpd: { contains: search } },
            ],
          }
        : {}),
    }

    const [data, total] = await Promise.all([
      db.opd.findMany({
        where,
        orderBy: { kodeOpd: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.opd.count({ where }),
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
    console.error('GET opd error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch OPD records' },
      { status: 500 }
    )
  }
}

// POST /api/admin/opd — Create new OPD
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { tahunAnggaranId, kodeOpd, namaOpd, kepalaOpd, alamat, telepon, email } = body

    if (!tahunAnggaranId || !kodeOpd || !namaOpd) {
      return NextResponse.json(
        { error: 'tahunAnggaranId, kodeOpd, and namaOpd are required' },
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

    const record = await db.opd.create({
      data: {
        tahunAnggaranId,
        kodeOpd,
        namaOpd,
        kepalaOpd: kepalaOpd || null,
        alamat: alamat || null,
        telepon: telepon || null,
        email: email || null,
      },
    })

    invalidateDashboardCache()
    return NextResponse.json(record, { status: 201 })
  } catch (error) {
    console.error('POST opd error:', error)
    return NextResponse.json(
      { error: 'Failed to create OPD record' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/opd?id=xxx — Update OPD
export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'id query parameter is required' },
        { status: 400 }
      )
    }

    const existing = await db.opd.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'OPD record not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { kodeOpd, namaOpd, kepalaOpd, alamat, telepon, email } = body

    const updateData: {
      kodeOpd?: string
      namaOpd?: string
      kepalaOpd?: string | null
      alamat?: string | null
      telepon?: string | null
      email?: string | null
    } = {}

    if (kodeOpd !== undefined) updateData.kodeOpd = kodeOpd
    if (namaOpd !== undefined) updateData.namaOpd = namaOpd
    if (kepalaOpd !== undefined) updateData.kepalaOpd = kepalaOpd || null
    if (alamat !== undefined) updateData.alamat = alamat || null
    if (telepon !== undefined) updateData.telepon = telepon || null
    if (email !== undefined) updateData.email = email || null

    const record = await db.opd.update({
      where: { id },
      data: updateData,
    })

    invalidateDashboardCache()
    return NextResponse.json(record)
  } catch (error) {
    console.error('PUT opd error:', error)
    return NextResponse.json(
      { error: 'Failed to update OPD record' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/opd?id=xxx — Delete OPD
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'id query parameter is required' },
        { status: 400 }
      )
    }

    const existing = await db.opd.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'OPD record not found' },
        { status: 404 }
      )
    }

    await db.opd.delete({ where: { id } })

    invalidateDashboardCache()
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE opd error:', error)
    return NextResponse.json(
      { error: 'Failed to delete OPD record' },
      { status: 500 }
    )
  }
}
