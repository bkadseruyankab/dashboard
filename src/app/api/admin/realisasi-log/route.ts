import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

async function checkAuth() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return null
  return session
}

// GET /api/admin/realisasi-log?sumberType=Pendapatan&sumberId=xxx&tahunAnggaranId=yyy&page=1&limit=20
export async function GET(request: Request) {
  try {
    if (!(await checkAuth())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const sumberType = searchParams.get('sumberType') ?? undefined
    const sumberId = searchParams.get('sumberId') ?? undefined
    const tahunAnggaranId = searchParams.get('tahunAnggaranId') ?? undefined
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
    const limit = Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10))

    const where: Record<string, unknown> = {}
    if (sumberType) where.sumberType = sumberType
    if (sumberId) where.sumberId = sumberId
    if (tahunAnggaranId) where.tahunAnggaranId = tahunAnggaranId

    const [data, total] = await Promise.all([
      db.realisasiLog.findMany({
        where,
        orderBy: { tanggalPerubahan: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.realisasiLog.count({ where }),
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
    console.error('GET realisasi-log error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch realisasi log records' },
      { status: 500 }
    )
  }
}
