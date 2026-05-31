import { db } from '@/lib/db'
import { getDashboardCache, setDashboardCache } from '@/lib/cache'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const tahunParam = searchParams.get('tahun')

    // Build cache key based on year parameter
    const cacheKey = `dashboard:${tahunParam ?? 'active'}`

    // Check shared cache
    const cached = getDashboardCache(cacheKey)
    if (cached) {
      return NextResponse.json(cached, {
        headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' },
      });
    }

    // Get all fiscal years
    const tahunList = await db.tahunAnggaran.findMany({
      orderBy: { tahun: 'asc' },
    })

    if (!tahunList.length) {
      return NextResponse.json(
        { error: 'No fiscal year data available' },
        { status: 404 }
      )
    }

    // Determine which year to use — default to the active year
    let targetTahun: number
    if (tahunParam) {
      const parsed = parseInt(tahunParam, 10)
      if (isNaN(parsed) || parsed < 2000 || parsed > 2100) {
        return NextResponse.json(
          { error: 'Invalid year parameter' },
          { status: 400 }
        )
      }
      targetTahun = parsed
    } else {
      // Use the active (aktif) year; fallback to the latest year if none is active
      const activeTa = tahunList.find((t) => t.aktif)
      if (activeTa) {
        targetTahun = activeTa.tahun
      } else {
        const sortedByTahun = [...tahunList].sort((a, b) => b.tahun - a.tahun)
        targetTahun = sortedByTahun[0].tahun
      }
    }

    // Get the TahunAnggaran record for the target year
    const tahunAnggaran = await db.tahunAnggaran.findUnique({
      where: { tahun: targetTahun },
    })

    if (!tahunAnggaran) {
      return NextResponse.json(
        { error: `Data for year ${targetTahun} not found` },
        { status: 404 }
      )
    }

    const taId = tahunAnggaran.id

    // Fetch all data for the target year in parallel
    const [pendapatan, belanja, pembiayaan, realisasiAkun, realisasiSkpd, opd] =
      await Promise.all([
        db.pendapatan.findMany({
          where: { tahunAnggaranId: taId },
          orderBy: { kodeAkun: 'asc' },
        }),
        db.belanja.findMany({
          where: { tahunAnggaranId: taId },
          orderBy: { kodeAkun: 'asc' },
        }),
        db.pembiayaan.findMany({
          where: { tahunAnggaranId: taId },
          orderBy: { kodeAkun: 'asc' },
        }),
        db.realisasiAkun.findMany({
          where: { tahunAnggaranId: taId },
          orderBy: { kodeAkun: 'asc' },
        }),
        db.realisasiSkpd.findMany({
          where: { tahunAnggaranId: taId },
          orderBy: { kodeSkpd: 'asc' },
        }),
        db.opd.findMany({
          where: { tahunAnggaranId: taId },
          orderBy: { kodeOpd: 'asc' },
        }),
      ])

    // Calculate summary with safe division
    const totalPendapatan = pendapatan.reduce((sum, p) => sum + p.anggaran, 0)
    const realisasiPendapatan = pendapatan.reduce((sum, p) => sum + p.realisasi, 0)
    const totalBelanja = belanja.reduce((sum, b) => sum + b.anggaran, 0)
    const realisasiBelanja = belanja.reduce((sum, b) => sum + b.realisasi, 0)
    const totalPembiayaan = pembiayaan.reduce((sum, p) => sum + p.anggaran, 0)
    // APBD total = Pendapatan (as the primary budget framework)
    const totalAnggaran = totalPendapatan
    const persentasePendapatan = totalPendapatan > 0
      ? Math.round((realisasiPendapatan / totalPendapatan) * 10000) / 100
      : 0
    const persentaseBelanja = totalBelanja > 0
      ? Math.round((realisasiBelanja / totalBelanja) * 10000) / 100
      : 0

    // Build trend data — fetch all years' data in a single batch
    const allPendapatan = await db.pendapatan.findMany({
      orderBy: { kodeAkun: 'asc' },
    })
    const allBelanja = await db.belanja.findMany({
      orderBy: { kodeAkun: 'asc' },
    })

    const trendApbd = tahunList.map((ta) => {
      const pList = allPendapatan.filter((p) => p.tahunAnggaranId === ta.id)
      const bList = allBelanja.filter((b) => b.tahunAnggaranId === ta.id)
      return {
        tahun: ta.tahun,
        pendapatan: pList.reduce((sum, p) => sum + p.anggaran, 0),
        belanja: bList.reduce((sum, b) => sum + b.anggaran, 0),
      }
    }).sort((a, b) => a.tahun - b.tahun)

    // Helper for safe percentage calculation
    const safePct = (anggaran: number, realisasi: number) =>
      anggaran > 0 ? Math.round((realisasi / anggaran) * 10000) / 100 : 0

    // Determine active year for frontend
    const activeTahunAnggaran = tahunList.find((t) => t.aktif)
    const activeTahun = activeTahunAnggaran ? activeTahunAnggaran.tahun : targetTahun

    const result = {
      tahun: targetTahun,
      activeTahun,
      tahunList: tahunList.map((t) => ({
        tahun: t.tahun,
        aktif: t.aktif,
      })),
      ringkasan: {
        totalAnggaran,
        totalPendapatan,
        totalBelanja,
        totalPembiayaan,
        realisasiPendapatan,
        realisasiBelanja,
        persentasePendapatan,
        persentaseBelanja,
      },
      pendapatan: pendapatan.map((p) => ({
        id: p.id,
        kodeAkun: p.kodeAkun,
        namaAkun: p.namaAkun,
        kategori: p.kategori,
        anggaran: p.anggaran,
        realisasi: p.realisasi,
        persentase: safePct(p.anggaran, p.realisasi),
        opdId: p.opdId,
      })),
      belanja: belanja.map((b) => ({
        id: b.id,
        kodeAkun: b.kodeAkun,
        namaAkun: b.namaAkun,
        kategori: b.kategori,
        anggaran: b.anggaran,
        realisasi: b.realisasi,
        persentase: safePct(b.anggaran, b.realisasi),
      })),
      pembiayaan: pembiayaan.map((p) => ({
        id: p.id,
        kodeAkun: p.kodeAkun,
        namaAkun: p.namaAkun,
        kategori: p.kategori,
        anggaran: p.anggaran,
        realisasi: p.realisasi,
        persentase: safePct(p.anggaran, p.realisasi),
      })),
      realisasiAkun: realisasiAkun.map((r) => ({
        id: r.id,
        kodeAkun: r.kodeAkun,
        namaAkun: r.namaAkun,
        jenis: r.jenis,
        anggaran: r.anggaran,
        realisasi: r.realisasi,
        persentase: safePct(r.anggaran, r.realisasi),
        autoSync: r.autoSync,
      })),
      realisasiSkpd: realisasiSkpd.map((r) => ({
        id: r.id,
        kodeSkpd: r.kodeSkpd,
        namaSkpd: r.namaSkpd,
        anggaran: r.anggaran,
        realisasi: r.realisasi,
        persentase: safePct(r.anggaran, r.realisasi),
        autoSync: r.autoSync,
      })),
      opd: opd.map((o) => ({
        id: o.id,
        kodeOpd: o.kodeOpd,
        namaOpd: o.namaOpd,
        kepalaOpd: o.kepalaOpd,
        alamat: o.alamat,
        telepon: o.telepon,
        email: o.email,
      })),
      trendApbd,
    }

    // Update shared cache
    setDashboardCache(cacheKey, result)

    return NextResponse.json(result, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' },
    })
  } catch (error) {
    console.error('Dashboard API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    )
  }
}
