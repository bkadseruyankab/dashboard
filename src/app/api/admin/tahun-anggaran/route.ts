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

    if (tahun === undefined || tahun === null) {
      return NextResponse.json(
        { error: 'tahun is required' },
        { status: 400 }
      )
    }

    if (typeof tahun !== 'number' || tahun < 2000 || tahun > 2100) {
      return NextResponse.json(
        { error: 'tahun must be a valid year between 2000 and 2100' },
        { status: 400 }
      )
    }

    const isActive = aktif === true

    const record = await db.$transaction(async (tx) => {
      // If setting as active, deactivate all others first
      if (isActive) {
        await tx.tahunAnggaran.updateMany({
          where: { aktif: true },
          data: { aktif: false },
        })
      }

      // If no active year exists after deactivation and this is not set active,
      // force this one to be active (there must always be at least one active year)
      const activeCount = isActive ? 0 : await tx.tahunAnggaran.count({ where: { aktif: true } })

      return tx.tahunAnggaran.create({
        data: {
          tahun,
          aktif: isActive || activeCount === 0,
        },
      })
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

    const record = await db.$transaction(async (tx) => {
      if (aktif !== undefined) {
        if (typeof aktif !== 'boolean') {
          throw new Error('aktif must be a boolean')
        }

        if (aktif) {
          // Setting this year as active — deactivate all others first
          await tx.tahunAnggaran.updateMany({
            where: { aktif: true, id: { not: id } },
            data: { aktif: false },
          })
          updateData.aktif = true
        } else {
          // Trying to deactivate — check if this is the only active year
          const currentActive = await tx.tahunAnggaran.count({
            where: { aktif: true },
          })
          if (currentActive <= 1 && existing.aktif) {
            // Cannot deactivate the only active year
            // Find the latest other year and make it active instead
            const latestOther = await tx.tahunAnggaran.findFirst({
              where: { id: { not: id } },
              orderBy: { tahun: 'desc' },
            })
            if (latestOther) {
              await tx.tahunAnggaran.update({
                where: { id: latestOther.id },
                data: { aktif: true },
              })
              updateData.aktif = false
            }
            // If no other year exists, keep this one active
          } else {
            updateData.aktif = false
          }
        }
      }

      return tx.tahunAnggaran.update({
        where: { id },
        data: updateData,
      })
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

    await db.$transaction(async (tx) => {
      // Cascade delete all related records
      await tx.pendapatan.deleteMany({ where: { tahunAnggaranId: id } })
      await tx.belanja.deleteMany({ where: { tahunAnggaranId: id } })
      await tx.pembiayaan.deleteMany({ where: { tahunAnggaranId: id } })
      await tx.realisasiAkun.deleteMany({ where: { tahunAnggaranId: id } })
      await tx.realisasiSkpd.deleteMany({ where: { tahunAnggaranId: id } })
      await tx.opd.deleteMany({ where: { tahunAnggaranId: id } })

      // Delete the fiscal year
      await tx.tahunAnggaran.delete({ where: { id } })

      // If the deleted year was active, activate the latest remaining year
      if (existing.aktif) {
        const latestRemaining = await tx.tahunAnggaran.findFirst({
          orderBy: { tahun: 'desc' },
        })
        if (latestRemaining) {
          await tx.tahunAnggaran.update({
            where: { id: latestRemaining.id },
            data: { aktif: true },
          })
        }
      }
    })

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
