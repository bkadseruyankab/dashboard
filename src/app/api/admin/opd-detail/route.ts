import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

/**
 * GET /api/admin/opd-detail?kodeSkpd=1.01.01&tahun=2024
 * Fetches Pendapatan, Belanja, Pembiayaan data for a specific OPD/SKPD
 */
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const kodeSkpd = searchParams.get('kodeSkpd')
    const tahunParam = searchParams.get('tahun')

    if (!kodeSkpd || !tahunParam) {
      return NextResponse.json(
        { error: 'kodeSkpd and tahun are required' },
        { status: 400 }
      )
    }

    const tahun = parseInt(tahunParam, 10)
    if (isNaN(tahun)) {
      return NextResponse.json({ error: 'Invalid tahun parameter' }, { status: 400 })
    }

    // Get TahunAnggaran
    const tahunAnggaran = await db.tahunAnggaran.findUnique({
      where: { tahun },
    })
    if (!tahunAnggaran) {
      return NextResponse.json(
        { error: 'Tahun anggaran tidak ditemukan' },
        { status: 404 }
      )
    }

    // Find OPD by kodeOpd matching kodeSkpd
    const opd = await db.opd.findFirst({
      where: {
        kodeOpd: kodeSkpd,
        tahunAnggaranId: tahunAnggaran.id,
      },
    })

    if (!opd) {
      return NextResponse.json(
        { error: 'OPD tidak ditemukan' },
        { status: 404 }
      )
    }

    // Fetch all data for this OPD in parallel
    const [pendapatan, belanja, pembiayaan] = await Promise.all([
      db.pendapatan.findMany({
        where: { opdId: opd.id, tahunAnggaranId: tahunAnggaran.id },
        orderBy: { kodeAkun: 'asc' },
      }),
      db.belanja.findMany({
        where: { opdId: opd.id, tahunAnggaranId: tahunAnggaran.id },
        orderBy: { kodeAkun: 'asc' },
      }),
      db.pembiayaan.findMany({
        where: { opdId: opd.id, tahunAnggaranId: tahunAnggaran.id },
        orderBy: { kodeAkun: 'asc' },
      }),
    ])

    // Helper for safe percentage
    const safePct = (anggaran: number, realisasi: number) =>
      anggaran > 0 ? Math.round((realisasi / anggaran) * 10000) / 100 : 0

    // Calculate subtotals
    const pendapatanTotal = {
      anggaran: pendapatan.reduce((s, p) => s + p.anggaran, 0),
      realisasi: pendapatan.reduce((s, p) => s + p.realisasi, 0),
    }
    const belanjaTotal = {
      anggaran: belanja.reduce((s, b) => s + b.anggaran, 0),
      realisasi: belanja.reduce((s, b) => s + b.realisasi, 0),
    }
    const pembiayaanTotal = {
      anggaran: pembiayaan.reduce((s, p) => s + p.anggaran, 0),
      realisasi: pembiayaan.reduce((s, p) => s + p.realisasi, 0),
    }

    return NextResponse.json({
      opd: {
        id: opd.id,
        kodeOpd: opd.kodeOpd,
        namaOpd: opd.namaOpd,
        kepalaOpd: opd.kepalaOpd,
      },
      pendapatan: pendapatan.map((p) => ({
        id: p.id,
        kodeAkun: p.kodeAkun,
        namaAkun: p.namaAkun,
        kategori: p.kategori,
        anggaran: p.anggaran,
        realisasi: p.realisasi,
        persentase: safePct(p.anggaran, p.realisasi),
        tanggalUpdate: p.tanggalUpdate.toISOString(),
      })),
      belanja: belanja.map((b) => ({
        id: b.id,
        kodeAkun: b.kodeAkun,
        namaAkun: b.namaAkun,
        kategori: b.kategori,
        anggaran: b.anggaran,
        realisasi: b.realisasi,
        persentase: safePct(b.anggaran, b.realisasi),
        tanggalUpdate: b.tanggalUpdate.toISOString(),
      })),
      pembiayaan: pembiayaan.map((p) => ({
        id: p.id,
        kodeAkun: p.kodeAkun,
        namaAkun: p.namaAkun,
        kategori: p.kategori,
        anggaran: p.anggaran,
        realisasi: p.realisasi,
        persentase: safePct(p.anggaran, p.realisasi),
        tanggalUpdate: p.tanggalUpdate.toISOString(),
      })),
      ringkasan: {
        pendapatan: {
          ...pendapatanTotal,
          persentase: safePct(pendapatanTotal.anggaran, pendapatanTotal.realisasi),
          jumlah: pendapatan.length,
        },
        belanja: {
          ...belanjaTotal,
          persentase: safePct(belanjaTotal.anggaran, belanjaTotal.realisasi),
          jumlah: belanja.length,
        },
        pembiayaan: {
          ...pembiayaanTotal,
          persentase: safePct(pembiayaanTotal.anggaran, pembiayaanTotal.realisasi),
          jumlah: pembiayaan.length,
        },
        totalAnggaran: pendapatanTotal.anggaran + belanjaTotal.anggaran + pembiayaanTotal.anggaran,
        totalRealisasi: pendapatanTotal.realisasi + belanjaTotal.realisasi + pembiayaanTotal.realisasi,
      },
    })
  } catch (error) {
    console.error('GET opd-detail error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch OPD detail' },
      { status: 500 }
    )
  }
}
