import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET /api/admin/realisasi-akun/log?tahunAnggaranId=xxx&jenis=Pendapatan&tanggalDari=2024-01-01&tanggalSampai=2024-12-31&page=1&limit=20
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const tahunAnggaranId = searchParams.get('tahunAnggaranId') ?? ''
    const jenis = searchParams.get('jenis') ?? ''
    const tanggalDari = searchParams.get('tanggalDari') ?? ''
    const tanggalSampai = searchParams.get('tanggalSampai') ?? ''
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
    const limit = Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10))

    // Build where clause
    const where: Record<string, unknown> = {}

    if (tahunAnggaranId) {
      where.realisasiAkun = { tahunAnggaranId }
    }

    if (jenis) {
      where.jenis = jenis
    }

    if (tanggalDari || tanggalSampai) {
      where.tanggalPerubahan = {}
      if (tanggalDari) {
        where.tanggalPerubahan.gte = new Date(tanggalDari)
      }
      if (tanggalSampai) {
        const endDate = new Date(tanggalSampai)
        endDate.setDate(endDate.getDate() + 1)
        where.tanggalPerubahan.lt = endDate
      }
    }

    const [data, total] = await Promise.all([
      db.realisasiAkunLog.findMany({
        where,
        orderBy: { tanggalPerubahan: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.realisasiAkunLog.count({ where }),
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
    console.error('GET realisasi-akun log error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch realisasi akun log' },
      { status: 500 }
    )
  }
}
