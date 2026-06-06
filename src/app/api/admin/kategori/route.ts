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

// GET /api/admin/kategori?jenis=Pendapatan
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const jenis = searchParams.get('jenis') ?? ''
    const search = searchParams.get('search') ?? ''

    const where: {
      jenis?: string
      OR?: Array<{ namaKategori: { contains: string } } | { kodeKategori: { contains: string } }>
    } = {}

    if (jenis) {
      where.jenis = jenis
    }

    if (search) {
      where.OR = [
        { namaKategori: { contains: search } },
        { kodeKategori: { contains: search } },
      ]
    }

    const data = await db.kategori.findMany({
      where,
      orderBy: [{ jenis: 'asc' }, { urutan: 'asc' }, { namaKategori: 'asc' }],
    })

    return NextResponse.json({ data })
  } catch (error) {
    console.error('GET kategori error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch kategori records' },
      { status: 500 }
    )
  }
}

// POST /api/admin/kategori — Create new kategori
export async function POST(request: Request) {
  try {
    if (!(await checkAuth())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const body = await request.json()
    const { jenis, namaKategori, kodeKategori, urutan, aktif } = body

    if (!jenis || !namaKategori) {
      return NextResponse.json(
        { error: 'jenis and namaKategori are required' },
        { status: 400 }
      )
    }

    const validJenis = ['Pendapatan', 'Belanja', 'Pembiayaan', 'RealisasiAkun']
    if (!validJenis.includes(jenis)) {
      return NextResponse.json(
        { error: `jenis must be one of: ${validJenis.join(', ')}` },
        { status: 400 }
      )
    }

    // Check unique constraint
    const existing = await db.kategori.findFirst({
      where: { jenis, namaKategori },
    })
    if (existing) {
      return NextResponse.json(
        { error: `Kategori "${namaKategori}" sudah ada untuk jenis "${jenis}"` },
        { status: 400 }
      )
    }

    const record = await db.kategori.create({
      data: {
        jenis,
        namaKategori,
        kodeKategori: kodeKategori || null,
        urutan: urutan ?? 0,
        aktif: aktif !== undefined ? aktif : true,
      },
    })

    invalidateDashboardCache()
    return NextResponse.json(record, { status: 201 })
  } catch (error) {
    console.error('POST kategori error:', error)
    return NextResponse.json(
      { error: 'Failed to create kategori record' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/kategori?id=xxx — Update kategori
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

    const existing = await db.kategori.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Kategori record not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { jenis, namaKategori, kodeKategori, urutan, aktif } = body

    const updateData: {
      jenis?: string
      namaKategori?: string
      kodeKategori?: string | null
      urutan?: number
      aktif?: boolean
    } = {}

    if (jenis !== undefined) {
      const validJenis = ['Pendapatan', 'Belanja', 'Pembiayaan', 'RealisasiAkun']
      if (!validJenis.includes(jenis)) {
        return NextResponse.json(
          { error: `jenis must be one of: ${validJenis.join(', ')}` },
          { status: 400 }
        )
      }
      updateData.jenis = jenis
    }
    if (namaKategori !== undefined) updateData.namaKategori = namaKategori
    if (kodeKategori !== undefined) updateData.kodeKategori = kodeKategori || null
    if (urutan !== undefined) updateData.urutan = urutan
    if (aktif !== undefined) updateData.aktif = aktif

    // Check unique constraint if jenis or namaKategori is being changed
    if (updateData.jenis || updateData.namaKategori) {
      const checkJenis = updateData.jenis || existing.jenis
      const checkNama = updateData.namaKategori || existing.namaKategori
      const dup = await db.kategori.findFirst({
        where: { jenis: checkJenis, namaKategori: checkNama, id: { not: id } },
      })
      if (dup) {
        return NextResponse.json(
          { error: `Kategori "${checkNama}" sudah ada untuk jenis "${checkJenis}"` },
          { status: 400 }
        )
      }
    }

    const record = await db.kategori.update({
      where: { id },
      data: updateData,
    })

    invalidateDashboardCache()
    return NextResponse.json(record)
  } catch (error) {
    console.error('PUT kategori error:', error)
    return NextResponse.json(
      { error: 'Failed to update kategori record' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/kategori?id=xxx — Delete kategori
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

    const existing = await db.kategori.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Kategori record not found' },
        { status: 404 }
      )
    }

    await db.kategori.delete({ where: { id } })

    invalidateDashboardCache()
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE kategori error:', error)
    return NextResponse.json(
      { error: 'Failed to delete kategori record' },
      { status: 500 }
    )
  }
}
