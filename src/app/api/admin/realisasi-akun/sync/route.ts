import { db } from '@/lib/db'
import { invalidateDashboardCache } from '@/lib/cache'
import { syncRealisasiAkun, syncAllRealisasiAkun } from '@/lib/sync-realisasi-akun'
import { syncRealisasiSkpd, syncAllRealisasiSkpd } from '@/lib/sync-realisasi-skpd'
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// POST /api/admin/realisasi-akun/sync?tahunAnggaranId=xxx
// Manually trigger synchronization of RealisasiAkun and RealisasiSkpd from Pendapatan/Belanja/Pembiayaan data
export async function POST(request: Request) {
  try {
    if (!(await getServerSession(authOptions))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const tahunAnggaranId = searchParams.get('tahunAnggaranId')

    // Also check body for tahunAnggaranId
    let bodyTahunAnggaranId: string | null = null
    try {
      const body = await request.json()
      bodyTahunAnggaranId = body?.tahunAnggaranId || null
    } catch {
      // No body or invalid JSON, ignore
    }

    const finalTahunAnggaranId = tahunAnggaranId || bodyTahunAnggaranId

    if (finalTahunAnggaranId) {
      // Verify tahunAnggaranId exists
      const ta = await db.tahunAnggaran.findUnique({ where: { id: finalTahunAnggaranId } })
      if (!ta) {
        return NextResponse.json(
          { error: 'Tahun anggaran not found' },
          { status: 400 }
        )
      }
      await Promise.all([
        syncRealisasiAkun(finalTahunAnggaranId),
        syncRealisasiSkpd(finalTahunAnggaranId),
      ])
    } else {
      // Sync all
      await Promise.all([
        syncAllRealisasiAkun(),
        syncAllRealisasiSkpd(),
      ])
    }

    invalidateDashboardCache()
    return NextResponse.json({ success: true, message: 'Realisasi Akun & SKPD berhasil disinkronkan' })
  } catch (error) {
    console.error('Sync realisasi error:', error)
    return NextResponse.json(
      { error: 'Failed to sync realisasi' },
      { status: 500 }
    )
  }
}
