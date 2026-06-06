import { db } from '@/lib/db'
import { resolveOpdIdForTahunAnggaran } from '@/lib/opd-resolver'
import { NextResponse } from 'next/server'

/**
 * GET /api/admin/realisasi-skpd/detail?opdId=xxx&tahunAnggaranId=xxx
 *
 * Fetches complete OPD detail: all Pendapatan, Belanja, and Pembiayaan records
 * for a specific OPD within a specific tahun anggaran.
 *
 * Strategy:
 * 1. Try to find financial records linked directly by opdId
 * 2. If no records found with opdId, try matching by kodeAkun prefix with kodeOpd
 * 3. If still no records, fall back to RealisasiSkpd summary data
 *
 * Used by the public Realisasi SKPD report to show detailed breakdown
 * when clicking on an OPD row.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const opdId = searchParams.get('opdId')
    const kodeSkpd = searchParams.get('kodeSkpd')
    const tahunAnggaranId = searchParams.get('tahunAnggaranId')

    if (!tahunAnggaranId) {
      return NextResponse.json(
        { error: 'tahunAnggaranId query parameter is required' },
        { status: 400 }
      )
    }

    if (!opdId && !kodeSkpd) {
      return NextResponse.json(
        { error: 'opdId or kodeSkpd query parameter is required' },
        { status: 400 }
      )
    }

    // Resolve the correct opdId for the target tahun anggaran
    let resolvedOpdId = opdId
    if (opdId) {
      const resolved = await resolveOpdIdForTahunAnggaran(opdId, tahunAnggaranId)
      if (resolved) resolvedOpdId = resolved
    }

    // If we only have kodeSkpd, find the OPD by kodeOpd
    let targetOpdId = resolvedOpdId
    let opdInfo: { id: string; kodeOpd: string; namaOpd: string; kepalaOpd: string | null } | null = null

    if (targetOpdId) {
      opdInfo = await db.opd.findUnique({
        where: { id: targetOpdId },
        select: { id: true, kodeOpd: true, namaOpd: true, kepalaOpd: true },
      })
    }

    if (!opdInfo && kodeSkpd) {
      opdInfo = await db.opd.findFirst({
        where: { kodeOpd: kodeSkpd, tahunAnggaranId },
        select: { id: true, kodeOpd: true, namaOpd: true, kepalaOpd: true },
      })
    }

    if (!opdInfo) {
      return NextResponse.json(
        { error: 'OPD tidak ditemukan untuk tahun anggaran ini' },
        { status: 404 }
      )
    }

    targetOpdId = opdInfo.id
    const kodeOpd = opdInfo.kodeOpd

    // Helper
    const safePct = (anggaran: number, realisasi: number) =>
      anggaran > 0 ? Math.round((realisasi / anggaran) * 10000) / 100 : 0

    // ===== Strategy 1: Find financial records linked by opdId =====
    let [pendapatan, belanja, pembiayaan] = await Promise.all([
      db.pendapatan.findMany({
        where: { tahunAnggaranId, opdId: targetOpdId },
        orderBy: { kodeAkun: 'asc' },
      }),
      db.belanja.findMany({
        where: { tahunAnggaranId, opdId: targetOpdId },
        orderBy: { kodeAkun: 'asc' },
      }),
      db.pembiayaan.findMany({
        where: { tahunAnggaranId, opdId: targetOpdId },
        orderBy: { kodeAkun: 'asc' },
      }),
    ])

    let dataMatchMode = 'opdId' // Track how data was matched

    // ===== Strategy 2: If no records found with opdId, try matching by kodeAkun prefix =====
    // In Indonesian government accounting, kodeAkun often starts with segments that
    // identify the OPD/SKPD. The kodeOpd (e.g., "1.01") maps to the beginning of kodeAkun.
    // For example: kodeOpd "1.01" → kodeAkun starting with "1.01" or "1.1"
    if (pendapatan.length === 0 && belanja.length === 0 && pembiayaan.length === 0) {
      dataMatchMode = 'fallback' // Default to fallback unless kodeAkun matching succeeds
      // Try multiple kodeAkun prefix patterns derived from kodeOpd
      // kodeOpd like "1.01", "1.02", "2.01", etc.
      const kodePrefixes = [
        kodeOpd,                  // exact: "1.01"
        kodeOpd.replace(/^0+/, ''), // without leading zero: "1.1"
        kodeOpd.split('.')[0],     // just the first segment: "1"
      ]

      // Only use multi-character prefixes to avoid matching too broadly (e.g., "1" matches everything)
      const safePrefixes = kodePrefixes.filter(p => p.length >= 2)

      if (safePrefixes.length > 0) {
        const orConditions = safePrefixes.map(prefix => ({
          kodeAkun: { startsWith: prefix }
        }))

        const kodeFilter = { OR: orConditions }

        const [pendByKode, belByKode, pembByKode] = await Promise.all([
          db.pendapatan.findMany({
            where: { tahunAnggaranId, ...kodeFilter },
            orderBy: { kodeAkun: 'asc' },
          }),
          db.belanja.findMany({
            where: { tahunAnggaranId, ...kodeFilter },
            orderBy: { kodeAkun: 'asc' },
          }),
          db.pembiayaan.findMany({
            where: { tahunAnggaranId, ...kodeFilter },
            orderBy: { kodeAkun: 'asc' },
          }),
        ])

        // Only use kodeAkun matching if it returned reasonable results
        // (not more than ~30% of all records in that category, to avoid false matches)
        const totalPend = await db.pendapatan.count({ where: { tahunAnggaranId } })
        const totalBel = await db.belanja.count({ where: { tahunAnggaranId } })
        const totalPemb = await db.pembiayaan.count({ where: { tahunAnggaranId } })

        const pendOk = pendByKode.length > 0 && (totalPend === 0 || pendByKode.length / totalPend <= 0.3)
        const belOk = belByKode.length > 0 && (totalBel === 0 || belByKode.length / totalBel <= 0.3)
        const pembOk = pembByKode.length > 0 && (totalPemb === 0 || pembByKode.length / totalPemb <= 0.3)

        if (pendOk || belOk || pembOk) {
          pendapatan = pendOk ? pendByKode : []
          belanja = belOk ? belByKode : []
          pembiayaan = pembOk ? pembByKode : []
          dataMatchMode = 'kodeAkun'
        }
      }
    }

    // ===== Strategy 3: Get RealisasiSkpd summary as fallback context =====
    const realisasiSkpd = await db.realisasiSkpd.findFirst({
      where: {
        tahunAnggaranId,
        OR: [
          { opdId: targetOpdId },
          { kodeSkpd: kodeOpd },
        ],
      },
    })

    const hasDetailedData = pendapatan.length > 0 || belanja.length > 0 || pembiayaan.length > 0

    // Calculate totals from financial records
    const totalPendapatan = pendapatan.reduce((s, p) => s + p.anggaran, 0)
    const realisasiPendapatan = pendapatan.reduce((s, p) => s + p.realisasi, 0)
    const totalBelanja = belanja.reduce((s, b) => s + b.anggaran, 0)
    const realisasiBelanja = belanja.reduce((s, b) => s + b.realisasi, 0)
    const totalPembiayaan = pembiayaan.reduce((s, p) => s + p.anggaran, 0)
    const realisasiPembiayaan = pembiayaan.reduce((s, p) => s + p.realisasi, 0)

    // Use RealisasiSkpd data as fallback for summary if no detailed data
    const summaryTotalAnggaran = hasDetailedData
      ? totalPendapatan + totalBelanja + totalPembiayaan
      : (realisasiSkpd?.anggaran || 0)
    const summaryTotalRealisasi = hasDetailedData
      ? realisasiPendapatan + realisasiBelanja + realisasiPembiayaan
      : (realisasiSkpd?.realisasi || 0)

    // Group items by kategori
    function groupByKategori<T extends { kategori: string | null; anggaran: number; realisasi: number; id: string; kodeAkun: string; namaAkun: string }>(items: T[]) {
      const map = new Map<string, { kategori: string; items: T[]; totalAnggaran: number; totalRealisasi: number }>()
      for (const item of items) {
        const kat = item.kategori || 'Lainnya'
        if (!map.has(kat)) {
          map.set(kat, { kategori: kat, items: [], totalAnggaran: 0, totalRealisasi: 0 })
        }
        const group = map.get(kat)!
        group.items.push(item)
        group.totalAnggaran += item.anggaran
        group.totalRealisasi += item.realisasi
      }
      return Array.from(map.values()).map((g) => ({
        kategori: g.kategori,
        totalAnggaran: g.totalAnggaran,
        totalRealisasi: g.totalRealisasi,
        persentase: safePct(g.totalAnggaran, g.totalRealisasi),
        items: g.items.map((item) => ({
          id: item.id,
          kodeAkun: item.kodeAkun,
          namaAkun: item.namaAkun,
          kategori: item.kategori,
          anggaran: item.anggaran,
          realisasi: item.realisasi,
          persentase: safePct(item.anggaran, item.realisasi),
        })),
      }))
    }

    return NextResponse.json({
      opd: opdInfo,
      tahunAnggaranId,
      dataMatchMode,
      realisasiSkpd: realisasiSkpd ? {
        id: realisasiSkpd.id,
        kodeSkpd: realisasiSkpd.kodeSkpd,
        namaSkpd: realisasiSkpd.namaSkpd,
        anggaran: realisasiSkpd.anggaran,
        realisasi: realisasiSkpd.realisasi,
        persentase: realisasiSkpd.persentase,
        tanggalUpdate: realisasiSkpd.tanggalUpdate,
      } : null,
      summary: {
        totalAnggaran: summaryTotalAnggaran,
        totalRealisasi: summaryTotalRealisasi,
        persentase: safePct(summaryTotalAnggaran, summaryTotalRealisasi),
        pendapatan: {
          totalAnggaran: hasDetailedData ? totalPendapatan : (realisasiSkpd?.anggaran || 0),
          totalRealisasi: hasDetailedData ? realisasiPendapatan : (realisasiSkpd?.realisasi || 0),
          persentase: hasDetailedData
            ? safePct(totalPendapatan, realisasiPendapatan)
            : safePct(realisasiSkpd?.anggaran || 0, realisasiSkpd?.realisasi || 0),
          count: pendapatan.length,
        },
        belanja: {
          totalAnggaran: totalBelanja,
          totalRealisasi: realisasiBelanja,
          persentase: safePct(totalBelanja, realisasiBelanja),
          count: belanja.length,
        },
        pembiayaan: {
          totalAnggaran: totalPembiayaan,
          totalRealisasi: realisasiPembiayaan,
          persentase: safePct(totalPembiayaan, realisasiPembiayaan),
          count: pembiayaan.length,
        },
      },
      pendapatan: { groups: groupByKategori(pendapatan) },
      belanja: { groups: groupByKategori(belanja) },
      pembiayaan: { groups: groupByKategori(pembiayaan) },
    })
  } catch (error) {
    console.error('GET realisasi-skpd/detail error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch OPD detail data' },
      { status: 500 }
    )
  }
}
