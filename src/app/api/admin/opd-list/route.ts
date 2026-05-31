import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET /api/admin/opd-list?tahunAnggaranId=xxx — Get OPDs for dropdown (simple list, no pagination)
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const tahunAnggaranId = searchParams.get('tahunAnggaranId')

    // Get the latest tahun anggaran if not specified
    let taId = tahunAnggaranId
    if (!taId) {
      const latestTa = await db.tahunAnggaran.findFirst({ where: {}, orderBy: { tahun: 'desc' } })
      taId = latestTa?.id ?? undefined
    }

    const opds = await db.opd.findMany({
      where: taId ? { tahunAnggaranId: taId } : {},
      select: {
        id: true,
        kodeOpd: true,
        namaOpd: true,
      },
      orderBy: { kodeOpd: 'asc' },
    })

    return NextResponse.json({ data: opds })
  } catch (error) {
    console.error('GET opd-list error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch OPD list' },
      { status: 500 }
    )
  }
}
