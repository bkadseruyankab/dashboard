import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const tahunParam = searchParams.get('tahun')

    // Get all fiscal years
    const tahunList = await db.tahunAnggaran.findMany({
      orderBy: { tahun: 'asc' },
    })

    // Determine which year to use
    let targetTahun: number
    if (tahunParam) {
      targetTahun = parseInt(tahunParam, 10)
    } else {
      const activeYear = tahunList.find((t) => t.aktif)
      targetTahun = activeYear ? activeYear.tahun : tahunList[tahunList.length - 1]?.tahun || 2024
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
    const [pendapatan, belanja, pembiayaan, realisasiAkun, realisasiSkpd] =
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
      ])

    // Calculate summary
    const totalPendapatan = pendapatan.reduce((sum, p) => sum + p.anggaran, 0)
    const realisasiPendapatan = pendapatan.reduce((sum, p) => sum + p.realisasi, 0)
    const totalBelanja = belanja.reduce((sum, b) => sum + b.anggaran, 0)
    const realisasiBelanja = belanja.reduce((sum, b) => sum + b.realisasi, 0)
    const totalPembiayaan = pembiayaan.reduce((sum, p) => sum + p.anggaran, 0)
    const totalAnggaran = totalPendapatan + totalPembiayaan
    const persentasePendapatan =
      totalPendapatan > 0
        ? Math.round((realisasiPendapatan / totalPendapatan) * 10000) / 100
        : 0
    const persentaseBelanja =
      totalBelanja > 0
        ? Math.round((realisasiBelanja / totalBelanja) * 10000) / 100
        : 0

    // Build trend data across all years
    const trendApbd: Array<{ tahun: number; pendapatan: number; belanja: number }> = []
    for (const ta of tahunList) {
      const [pList, bList] = await Promise.all([
        db.pendapatan.findMany({
          where: { tahunAnggaranId: ta.id },
        }),
        db.belanja.findMany({
          where: { tahunAnggaranId: ta.id },
        }),
      ])
      trendApbd.push({
        tahun: ta.tahun,
        pendapatan: pList.reduce((sum, p) => sum + p.anggaran, 0),
        belanja: bList.reduce((sum, b) => sum + b.anggaran, 0),
      })
    }

    // Sort trend by year
    trendApbd.sort((a, b) => a.tahun - b.tahun)

    const result = {
      tahun: targetTahun,
      tahunList: tahunList.map((t) => t.tahun),
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
        persentase:
          p.anggaran > 0
            ? Math.round((p.realisasi / p.anggaran) * 10000) / 100
            : 0,
      })),
      belanja: belanja.map((b) => ({
        id: b.id,
        kodeAkun: b.kodeAkun,
        namaAkun: b.namaAkun,
        kategori: b.kategori,
        anggaran: b.anggaran,
        realisasi: b.realisasi,
        persentase:
          b.anggaran > 0
            ? Math.round((b.realisasi / b.anggaran) * 10000) / 100
            : 0,
      })),
      pembiayaan: pembiayaan.map((p) => ({
        id: p.id,
        kodeAkun: p.kodeAkun,
        namaAkun: p.namaAkun,
        kategori: p.kategori,
        anggaran: p.anggaran,
        realisasi: p.realisasi,
        persentase:
          p.anggaran > 0
            ? Math.round((p.realisasi / p.anggaran) * 10000) / 100
            : 0,
      })),
      realisasiAkun: realisasiAkun.map((r) => ({
        id: r.id,
        kodeAkun: r.kodeAkun,
        namaAkun: r.namaAkun,
        jenis: r.jenis,
        anggaran: r.anggaran,
        realisasi: r.realisasi,
        persentase: r.persentase,
      })),
      realisasiSkpd: realisasiSkpd.map((r) => ({
        id: r.id,
        kodeSkpd: r.kodeSkpd,
        namaSkpd: r.namaSkpd,
        anggaran: r.anggaran,
        realisasi: r.realisasi,
        persentase: r.persentase,
      })),
      trendApbd,
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Dashboard API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    )
  }
}
