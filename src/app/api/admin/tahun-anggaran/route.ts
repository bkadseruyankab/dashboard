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

// GET /api/admin/tahun-anggaran — List all fiscal years ordered by tahun asc
export async function GET() {
  try {
    const data = await db.tahunAnggaran.findMany({
      orderBy: { tahun: 'asc' },
    })
    return NextResponse.json({ data })
  } catch (error) {
    console.error('GET tahun-anggaran error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch fiscal years' },
      { status: 500 }
    )
  }
}

// POST /api/admin/tahun-anggaran — Create new fiscal year
export async function POST(request: Request) {
  try {
    if (!(await checkAuth())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const body = await request.json()
    const { tahun, aktif } = body

    if (tahun === undefined || tahun === null || aktif === undefined || aktif === null) {
      return NextResponse.json(
        { error: 'tahun and aktif are required' },
        { status: 400 }
      )
    }

    if (typeof tahun !== 'number' || tahun < 2000 || tahun > 2100) {
      return NextResponse.json(
        { error: 'tahun must be a valid year between 2000 and 2100' },
        { status: 400 }
      )
    }

    if (typeof aktif !== 'boolean') {
      return NextResponse.json(
        { error: 'aktif must be a boolean' },
        { status: 400 }
      )
    }

    // If setting aktif=true, deactivate all others first
    if (aktif) {
      await db.tahunAnggaran.updateMany({
        where: { aktif: true },
        data: { aktif: false },
      })
    }

    const record = await db.tahunAnggaran.create({
      data: { tahun, aktif },
    })

    invalidateDashboardCache()
    return NextResponse.json(record, { status: 201 })
  } catch (error: unknown) {
    console.error('POST tahun-anggaran error:', error)
    if (error instanceof Error && error.message.includes('Unique')) {
      return NextResponse.json(
        { error: 'Tahun anggaran already exists' },
        { status: 409 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to create fiscal year' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/tahun-anggaran?id=xxx — Update fiscal year
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

    const existing = await db.tahunAnggaran.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Fiscal year not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { tahun, aktif } = body

    const updateData: { tahun?: number; aktif?: boolean } = {}
    if (tahun !== undefined) {
      if (typeof tahun !== 'number' || tahun < 2000 || tahun > 2100) {
        return NextResponse.json(
          { error: 'tahun must be a valid year between 2000 and 2100' },
          { status: 400 }
        )
      }
      updateData.tahun = tahun
    }
    if (aktif !== undefined) {
      if (typeof aktif !== 'boolean') {
        return NextResponse.json(
          { error: 'aktif must be a boolean' },
          { status: 400 }
        )
      }
      updateData.aktif = aktif
    }

    // If setting aktif=true, deactivate all others first
    if (aktif === true) {
      await db.tahunAnggaran.updateMany({
        where: { aktif: true, id: { not: id } },
        data: { aktif: false },
      })
    }

    const record = await db.tahunAnggaran.update({
      where: { id },
      data: updateData,
    })

    invalidateDashboardCache()
    return NextResponse.json(record)
  } catch (error: unknown) {
    console.error('PUT tahun-anggaran error:', error)
    if (error instanceof Error && error.message.includes('Unique')) {
      return NextResponse.json(
        { error: 'Tahun anggaran already exists' },
        { status: 409 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to update fiscal year' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/tahun-anggaran?id=xxx — Delete fiscal year and cascade all related data
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

    const existing = await db.tahunAnggaran.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Fiscal year not found' },
        { status: 404 }
      )
    }

    // Cascade delete all related records using a transaction
    await db.$transaction([
      db.pendapatan.deleteMany({ where: { tahunAnggaranId: id } }),
      db.belanja.deleteMany({ where: { tahunAnggaranId: id } }),
      db.pembiayaan.deleteMany({ where: { tahunAnggaranId: id } }),
      db.realisasiAkun.deleteMany({ where: { tahunAnggaranId: id } }),
      db.realisasiSkpd.deleteMany({ where: { tahunAnggaranId: id } }),
      db.tahunAnggaran.delete({ where: { id } }),
    ])

    invalidateDashboardCache()
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE tahun-anggaran error:', error)
    return NextResponse.json(
      { error: 'Failed to delete fiscal year' },
      { status: 500 }
    )
  }
}
