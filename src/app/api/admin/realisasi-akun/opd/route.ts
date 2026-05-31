import { db } from '@/lib/db'
import { resolveOpdIdForTahunAnggaran } from '@/lib/opd-resolver'
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

/**
 * Extract the "kode induk" (parent code) from a full kodeAkun.
 */
function extractKodeInduk(kodeAkun: string): string {
  const parts = kodeAkun.split('.')
  if (parts.length <= 2) return kodeAkun
  return parts.slice(0, 2).join('.')
}

/**
 * GET /api/admin/realisasi-akun/opd?tahunAnggaranId=xxx&opdId=yyy
 * Computes RealisasiAkun for a specific OPD by aggregating their
 * Pendapatan, Belanja, and Pembiayaan records.
 */
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    const { searchParams } = new URL(request.url)
    const tahunAnggaranId = searchParams.get('tahunAnggaranId')
    const jenis = searchParams.get('jenis') ?? ''

    if (!tahunAnggaranId) {
      return NextResponse.json(
        { error: 'tahunAnggaranId query parameter is required' },
        { status: 400 }
      )
    }

    // Determine opdId: OPD users are restricted to their own data
    // CRITICAL: Resolve the correct OPD ID for the target tahun anggaran
    // because User.opdId may point to an OPD in a different year
    let opdId: string | null = null
    const userRole = (session?.user as { role?: string })?.role
    const userOpdId = (session?.user as { opdId?: string })?.opdId

    if (userRole === 'opd' && userOpdId) {
      // Resolve correct opdId for this tahun anggaran
      opdId = await resolveOpdIdForTahunAnggaran(userOpdId, tahunAnggaranId)
    } else {
      const queryOpdId = searchParams.get('opdId')
      if (queryOpdId) opdId = queryOpdId
    }

    if (!opdId) {
      return NextResponse.json(
        { error: 'opdId is required (or login as OPD user)' },
        { status: 400 }
      )
    }

    const jenisList = jenis ? [jenis] : ['Pendapatan', 'Belanja', 'Pembiayaan']
    const result: Array<{
      kodeAkun: string
      namaAkun: string
      jenis: string
      anggaran: number
      realisasi: number
      persentase: number
    }> = []

    for (const j of jenisList) {
      // Fetch source records for this OPD
      let sourceRecords: { kodeAkun: string; namaAkun: string; anggaran: number; realisasi: number }[] = []

      if (j === 'Pendapatan') {
        sourceRecords = await db.pendapatan.findMany({
          where: { tahunAnggaranId, opdId },
          select: { kodeAkun: true, namaAkun: true, anggaran: true, realisasi: true },
        })
      } else if (j === 'Belanja') {
        sourceRecords = await db.belanja.findMany({
          where: { tahunAnggaranId, opdId },
          select: { kodeAkun: true, namaAkun: true, anggaran: true, realisasi: true },
        })
      } else if (j === 'Pembiayaan') {
        sourceRecords = await db.pembiayaan.findMany({
          where: { tahunAnggaranId, opdId },
          select: { kodeAkun: true, namaAkun: true, anggaran: true, realisasi: true },
        })
      }

      // Group by kode induk and aggregate
      const grouped = new Map<string, { namaAkun: string; anggaran: number; realisasi: number }>()

      for (const record of sourceRecords) {
        const kodeInduk = extractKodeInduk(record.kodeAkun)
        const existing = grouped.get(kodeInduk)
        if (existing) {
          existing.anggaran += record.anggaran
          existing.realisasi += record.realisasi
        } else {
          grouped.set(kodeInduk, {
            namaAkun: record.namaAkun,
            anggaran: record.anggaran,
            realisasi: record.realisasi,
          })
        }
      }

      // Try to get namaAkun from Kategori table
      for (const [kodeInduk, data] of grouped) {
        const kategori = await db.kategori.findFirst({
          where: { jenis: j, kodeKategori: kodeInduk, aktif: true },
          select: { namaAkunDefault: true, namaKategori: true },
        })

        const namaAkun = kategori?.namaAkunDefault || kategori?.namaKategori || data.namaAkun
        const persentase = data.anggaran > 0
          ? Math.round((data.realisasi / data.anggaran) * 10000) / 100
          : 0

        result.push({
          kodeAkun: kodeInduk,
          namaAkun,
          jenis: j,
          anggaran: data.anggaran,
          realisasi: data.realisasi,
          persentase,
        })
      }
    }

    // Sort by jenis then kodeAkun
    result.sort((a, b) => {
      if (a.jenis !== b.jenis) return a.jenis.localeCompare(b.jenis)
      return a.kodeAkun.localeCompare(b.kodeAkun)
    })

    return NextResponse.json({ data: result })
  } catch (error) {
    console.error('GET realisasi-akun/opd error:', error)
    return NextResponse.json(
      { error: 'Failed to compute OPD realisasi akun' },
      { status: 500 }
    )
  }
}
