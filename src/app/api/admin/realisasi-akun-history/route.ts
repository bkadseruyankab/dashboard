import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

async function checkAuth() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return null
  return session
}

// GET /api/admin/realisasi-akun-history?realisasiAkunId=xxx&tahunAnggaranId=yyy
export async function GET(request: Request) {
  try {
    const session = await checkAuth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const realisasiAkunId = searchParams.get('realisasiAkunId')
    const tahunAnggaranId = searchParams.get('tahunAnggaranId')
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '50', 10)))

    // If specific Akun ID is given, get history for that record
    if (realisasiAkunId) {
      const history = await db.realisasiAkunHistory.findMany({
        where: { realisasiAkunId },
        orderBy: { tanggalUpdate: 'desc' },
        take: limit,
      })

      return NextResponse.json({ data: history })
    }

    // Get all history for a tahun anggaran
    if (!tahunAnggaranId) {
      return NextResponse.json(
        { error: 'realisasiAkunId or tahunAnggaranId is required' },
        { status: 400 }
      )
    }

    const akunRecords = await db.realisasiAkun.findMany({
      where: { tahunAnggaranId },
      select: { id: true },
    })

    const akunIds = akunRecords.map((r) => r.id)

    if (akunIds.length === 0) {
      return NextResponse.json({ data: [] })
    }

    const history = await db.realisasiAkunHistory.findMany({
      where: {
        realisasiAkunId: { in: akunIds },
      },
      orderBy: { tanggalUpdate: 'desc' },
      take: limit,
    })

    return NextResponse.json({ data: history })
  } catch (error) {
    console.error('GET realisasi-akun-history error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch realisasi akun history' },
      { status: 500 }
    )
  }
}
