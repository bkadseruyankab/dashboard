import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

type RiskLevel = 'Rendah' | 'Sedang' | 'Tinggi'

type RiskFinding = {
  id: string
  kategori: string // e.g., "Anggaran Besar Realisasi Rendah"
  judul: string
  deskripsi: string
  risiko: RiskLevel
  skorRisiko: number // 0-100
  rekomendasi: string
  opdNama?: string // OPD name for easy identification by Kepala Daerah
  detail: {
    kodeAkun?: string
    namaAkun?: string
    namaSkpd?: string
    kodeSkpd?: string
    opdNama?: string // OPD name in detail
    jenis: string // "Pendapatan" | "Belanja" | "Pembiayaan" | "SKPD"
    anggaran: number
    realisasi: number
    persentase: number
    selisih: number
  }
}

type AnalisisRisikoResult = {
  tahun: number
  tanggalAnalisis: string
  ringkasanRisiko: {
    tinggi: number
    sedang: number
    rendah: number
    totalTemuan: number
    skorKeseluruhan: number // 0-100 composite score
    levelKeseluruhan: RiskLevel
  }
  temuan: RiskFinding[]
  opdList: { id: string; kodeOpd: string; namaOpd: string }[] // Available OPDs for filtering
  indikator: {
    label: string
    nilai: number | string
    satuan: string
    risiko: RiskLevel
  }[]
}

function getRiskLevel(skore: number): RiskLevel {
  if (skore >= 70) return 'Tinggi'
  if (skore >= 40) return 'Sedang'
  return 'Rendah'
}

function safePct(num: number, den: number): number {
  if (!den || !isFinite(den)) return 0
  const r = (num / den) * 100
  return isFinite(r) ? Math.round(r * 100) / 100 : 0
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const tahunParam = searchParams.get('tahun')

    // Get fiscal year
    const tahunList = await db.tahunAnggaran.findMany({ orderBy: { tahun: 'asc' } })
    if (!tahunList.length) {
      return NextResponse.json({ error: 'No fiscal year data' }, { status: 404 })
    }

    let targetTahun: number
    if (tahunParam) {
      targetTahun = parseInt(tahunParam, 10)
      if (isNaN(targetTahun)) targetTahun = tahunList.find(t => t.aktif)?.tahun || tahunList[tahunList.length - 1].tahun
    } else {
      const activeTa = tahunList.find(t => t.aktif)
      targetTahun = activeTa ? activeTa.tahun : tahunList[tahunList.length - 1].tahun
    }

    const tahunAnggaran = await db.tahunAnggaran.findUnique({ where: { tahun: targetTahun } })
    if (!tahunAnggaran) {
      return NextResponse.json({ error: `Year ${targetTahun} not found` }, { status: 404 })
    }

    const taId = tahunAnggaran.id

    // Fetch all data in parallel
    const [pendapatan, belanja, pembiayaan, realisasiAkun, realisasiSkpd, belanjaHistory, opdList] =
      await Promise.all([
        db.pendapatan.findMany({ where: { tahunAnggaranId: taId }, orderBy: { kodeAkun: 'asc' } }),
        db.belanja.findMany({ where: { tahunAnggaranId: taId }, orderBy: { kodeAkun: 'asc' } }),
        db.pembiayaan.findMany({ where: { tahunAnggaranId: taId }, orderBy: { kodeAkun: 'asc' } }),
        db.realisasiAkun.findMany({ where: { tahunAnggaranId: taId }, orderBy: { kodeAkun: 'asc' } }),
        db.realisasiSkpd.findMany({ where: { tahunAnggaranId: taId }, orderBy: { kodeSkpd: 'asc' } }),
        db.belanjaHistory.findMany({
          where: {
            belanja: { tahunAnggaranId: taId },
          },
          orderBy: { tanggalUpdate: 'desc' },
          take: 500,
        }),
        db.opd.findMany({ where: { tahunAnggaranId: taId }, orderBy: { kodeOpd: 'asc' } }),
      ])

    // Build OPD lookup: opdId -> namaOpd
    const opdLookup = new Map<string, string>()
    for (const opd of opdList) {
      opdLookup.set(opd.id, opd.namaOpd)
    }

    // Build SKPD name to OPD name lookup
    const skpdToOpd = new Map<string, string>()
    for (const skpd of realisasiSkpd) {
      // Try to match by kodeSkpd with kodeOpd
      const matchedOpd = opdList.find(o => o.kodeOpd === skpd.kodeSkpd)
      if (matchedOpd) {
        skpdToOpd.set(skpd.namaSkpd, matchedOpd.namaOpd)
      } else {
        skpdToOpd.set(skpd.namaSkpd, skpd.namaSkpd) // fallback: use SKPD name as OPD name
      }
    }

    const temuan: RiskFinding[] = []
    let findingCounter = 0

    // Helper to resolve OPD name from various sources
    function getOpdNama(opdId: string | null | undefined, namaSkpd?: string): string | undefined {
      if (opdId && opdLookup.has(opdId)) return opdLookup.get(opdId)!
      if (namaSkpd && skpdToOpd.has(namaSkpd)) return skpdToOpd.get(namaSkpd)!
      if (namaSkpd) return namaSkpd // fallback
      return undefined
    }

    // ========== ANALYSIS 1: Anggaran Besar dengan Realisasi Rendah ==========
    // Threshold: anggaran > 100 juta AND persentase < 50%

    // From Belanja
    for (const b of belanja) {
      const pct = safePct(b.realisasi, b.anggaran)
      if (b.anggaran >= 100_000_000 && pct < 50) {
        let skor = 0
        if (pct < 10) skor = 90
        else if (pct < 25) skor = 75
        else if (pct < 40) skor = 60
        else skor = 45

        // Boost score for very large budgets
        if (b.anggaran >= 1_000_000_000) skor = Math.min(skor + 10, 100)
        if (b.anggaran >= 10_000_000_000) skor = Math.min(skor + 10, 100)

        const opdNama1b = getOpdNama(b.opdId)
        temuan.push({
          id: `f-${++findingCounter}`,
          kategori: 'Anggaran Besar, Realisasi Rendah',
          judul: `${b.namaAkun} — Realisasi ${pct.toFixed(1)}%`,
          deskripsi: `Anggaran belanja ${b.namaAkun} sebesar Rp ${(b.anggaran / 1_000_000_000).toFixed(1)} M namun realisasi hanya ${pct.toFixed(1)}% (Rp ${(b.realisasi / 1_000_000_000).toFixed(1)} M). Selisih Rp ${((b.anggaran - b.realisasi) / 1_000_000_000).toFixed(1)} M belum terserap.`,
          risiko: getRiskLevel(skor),
          skorRisiko: skor,
          opdNama: opdNama1b,
          rekomendasi: skor >= 70
            ? 'Evaluasi segera kelayakan anggaran. Pertimbangkan realokasi atau reviu kontrak. Laporkan ke PPK untuk tindak lanjut.'
            : 'Pantau progress realisasi bulanan. Identifikasi hambatan dan percepat pencairan.',
          detail: {
            kodeAkun: b.kodeAkun,
            namaAkun: b.namaAkun,
            opdNama: opdNama1b,
            jenis: 'Belanja',
            anggaran: b.anggaran,
            realisasi: b.realisasi,
            persentase: pct,
            selisih: b.anggaran - b.realisasi,
          },
        })
      }
    }

    // From Pendapatan
    for (const p of pendapatan) {
      const pct = safePct(p.realisasi, p.anggaran)
      if (p.anggaran >= 100_000_000 && pct < 50) {
        let skor = 0
        if (pct < 10) skor = 85
        else if (pct < 25) skor = 70
        else if (pct < 40) skor = 55
        else skor = 40

        if (p.anggaran >= 1_000_000_000) skor = Math.min(skor + 10, 100)

        const opdNama1p = getOpdNama(p.opdId)
        temuan.push({
          id: `f-${++findingCounter}`,
          kategori: 'Anggaran Besar, Realisasi Rendah',
          judul: `${p.namaAkun} — Realisasi ${pct.toFixed(1)}%`,
          deskripsi: `Target pendapatan ${p.namaAkun} sebesar Rp ${(p.anggaran / 1_000_000_000).toFixed(1)} M namun realisasi hanya ${pct.toFixed(1)}% (Rp ${(p.realisasi / 1_000_000_000).toFixed(1)} M). Potensi kekurangan pendapatan Rp ${((p.anggaran - p.realisasi) / 1_000_000_000).toFixed(1)} M.`,
          risiko: getRiskLevel(skor),
          skorRisiko: skor,
          opdNama: opdNama1p,
          rekomendasi: skor >= 70
            ? 'Review target pendapatan. Identifikasi sumber kekurangan. Koordinasi dengan OPD terkait untuk optimasi penerimaan.'
            : 'Percepat penagihan dan optimalisasi penerimaan. Evaluasi kendala dan upaya peningkatan.',
          detail: {
            kodeAkun: p.kodeAkun,
            namaAkun: p.namaAkun,
            opdNama: opdNama1p,
            jenis: 'Pendapatan',
            anggaran: p.anggaran,
            realisasi: p.realisasi,
            persentase: pct,
            selisih: p.anggaran - p.realisasi,
          },
        })
      }
    }

    // ========== ANALYSIS 2: Kegiatan Tidak Bergerak (Zero/Near-Zero Realization) ==========
    // Criteria: anggaran > 0 but realisasi = 0

    for (const b of belanja) {
      if (b.anggaran > 0 && b.realisasi === 0) {
        let skor = 0
        if (b.anggaran >= 1_000_000_000) skor = 90
        else if (b.anggaran >= 500_000_000) skor = 75
        else if (b.anggaran >= 100_000_000) skor = 60
        else skor = 45

        const opdNama2b = getOpdNama(b.opdId)
        temuan.push({
          id: `f-${++findingCounter}`,
          kategori: 'Kegiatan Tidak Bergerak',
          judul: `${b.namaAkun} — Nihil`,
          deskripsi: `Belanja ${b.namaAkun} memiliki anggaran Rp ${(b.anggaran / 1_000_000).toFixed(0)} Jt namun REALISASI NIHIL. Tidak ada aktivitas pencairan sama sekali.`,
          risiko: getRiskLevel(skor),
          skorRisiko: skor,
          opdNama: opdNama2b,
          rekomendasi: skor >= 70
            ? 'Segera konfirmasi status kegiatan ke OPD pengampu. Pertimbangkan pemotongan/pengalihan anggaran jika kegiatan tidak dilaksanakan.'
            : 'Verifikasi status pelaksanaan. Pastikan tidak ada keterlambatan proses kontrak.',
          detail: {
            kodeAkun: b.kodeAkun,
            namaAkun: b.namaAkun,
            opdNama: opdNama2b,
            jenis: 'Belanja',
            anggaran: b.anggaran,
            realisasi: b.realisasi,
            persentase: 0,
            selisih: b.anggaran,
          },
        })
      }
    }

    for (const p of pendapatan) {
      if (p.anggaran > 0 && p.realisasi === 0) {
        let skor = 0
        if (p.anggaran >= 1_000_000_000) skor = 85
        else if (p.anggaran >= 500_000_000) skor = 70
        else if (p.anggaran >= 100_000_000) skor = 55
        else skor = 40

        const opdNama2p = getOpdNama(p.opdId)
        temuan.push({
          id: `f-${++findingCounter}`,
          kategori: 'Kegiatan Tidak Bergerak',
          judul: `${p.namaAkun} — Nihil`,
          deskripsi: `Pendapatan ${p.namaAkun} memiliki target Rp ${(p.anggaran / 1_000_000).toFixed(0)} Jt namun REALISASI NIHIL. Belum ada penerimaan apapun.`,
          risiko: getRiskLevel(skor),
          skorRisiko: skor,
          opdNama: opdNama2p,
          rekomendasi: 'Verifikasi sumber pendapatan. Pastikan mekanisme penerimaan sudah berjalan.',
          detail: {
            kodeAkun: p.kodeAkun,
            namaAkun: p.namaAkun,
            opdNama: opdNama2p,
            jenis: 'Pendapatan',
            anggaran: p.anggaran,
            realisasi: p.realisasi,
            persentase: 0,
            selisih: p.anggaran,
          },
        })
      }
    }

    // ========== ANALYSIS 3: Potensi Penumpukan Belanja Akhir Tahun ==========
    // Analyze based on: current progress vs elapsed time in fiscal year
    // If we're past Q2 and realization is still very low, there's a risk of year-end surge

    const now = new Date()
    const yearStart = new Date(targetTahun, 0, 1) // Jan 1
    const yearEnd = new Date(targetTahun, 11, 31) // Dec 31
    const totalYearMs = yearEnd.getTime() - yearStart.getTime()
    const elapsedMs = now.getTime() - yearStart.getTime()
    const elapsedPct = Math.max(0, Math.min(100, (elapsedMs / totalYearMs) * 100))

    const totalAnggaranBelanja = belanja.reduce((s, b) => s + b.anggaran, 0)
    const totalRealisasiBelanja = belanja.reduce((s, b) => s + b.realisasi, 0)
    const realisasiBelanjaPct = safePct(totalRealisasiBelanja, totalAnggaranBelanja)

    // Gap between elapsed time and realization
    const gapTimeVsRealisasi = elapsedPct - realisasiBelanjaPct

    if (gapTimeVsRealisasi > 20 && elapsedPct > 50) {
      // Significant lag - high risk of year-end surge
      const skor = gapTimeVsRealisasi > 40 ? 90 : gapTimeVsRealisasi > 30 ? 75 : 60

      temuan.push({
        id: `f-${++findingCounter}`,
        kategori: 'Potensi Penumpukan Belanja Akhir Tahun',
        judul: `Keterlambatan Serapan Belanja — Gap ${gapTimeVsRealisasi.toFixed(0)}%`,
        deskripsi: `Waktu tahun berjalan ${elapsedPct.toFixed(0)}% namun realisasi belanja hanya ${realisasiBelanjaPct.toFixed(1)}%. Terdapat gap ${gapTimeVsRealisasi.toFixed(0)}% yang berpotensi menyebabkan penumpukan pencairan di akhir tahun. Total sisa belanja Rp ${((totalAnggaranBelanja - totalRealisasiBelanja) / 1_000_000_000).toFixed(1)} M harus diserap dalam sisa ${(100 - elapsedPct).toFixed(0)}% waktu.`,
        risiko: getRiskLevel(skor),
        skorRisiko: skor,
        rekomendasi: skor >= 70
          ? 'Percepat proses pengadaan dan pencairan. Review hambatan serapan tiap OPD. Prioritaskan belanja modal yang membutuhkan waktu lama. Waspadai potensi pelanggaran karena pencairan terburu-buru.'
          : 'Monitor realisasi bulanan per OPD. Identifikasi program yang terlambat dan percepat.',
        detail: {
          jenis: 'Belanja',
          namaAkun: 'Total Belanja Daerah',
          anggaran: totalAnggaranBelanja,
          realisasi: totalRealisasiBelanja,
          persentase: realisasiBelanjaPct,
          selisih: totalAnggaranBelanja - totalRealisasiBelanja,
        },
      })
    }

    // Per-SKPD year-end surge analysis
    for (const skpd of realisasiSkpd) {
      const skpdPct = safePct(skpd.realisasi, skpd.anggaran)
      const skpdGap = elapsedPct - skpdPct
      if (skpdGap > 25 && elapsedPct > 50 && skpd.anggaran > 500_000_000) {
        const skor = skpdGap > 40 ? 80 : skpdGap > 30 ? 65 : 50
        const opdNama3s = getOpdNama(undefined, skpd.namaSkpd)

        temuan.push({
          id: `f-${++findingCounter}`,
          kategori: 'Potensi Penumpukan Belanja Akhir Tahun',
          judul: `${skpd.namaSkpd} — Gap ${skpdGap.toFixed(0)}%`,
          deskripsi: `OPD ${skpd.namaSkpd} memiliki gap serapan ${skpdGap.toFixed(0)}% (waktu ${elapsedPct.toFixed(0)}% vs realisasi ${skpdPct.toFixed(1)}%). Sisa anggaran Rp ${((skpd.anggaran - skpd.realisasi) / 1_000_000_000).toFixed(1)} M berisiko ditumpuk di akhir tahun.`,
          risiko: getRiskLevel(skor),
          skorRisiko: skor,
          opdNama: opdNama3s,
          rekomendasi: 'Panggil OPD untuk review progress. Percepat proses kontrak dan pencairan. Monitor mingguan.',
          detail: {
            jenis: 'SKPD',
            namaSkpd: skpd.namaSkpd,
            kodeSkpd: skpd.kodeSkpd,
            opdNama: opdNama3s,
            anggaran: skpd.anggaran,
            realisasi: skpd.realisasi,
            persentase: skpdPct,
            selisih: skpd.anggaran - skpd.realisasi,
          },
        })
      }
    }

    // Also check from history: recent large updates may indicate year-end surge
    const recentHistory = belanjaHistory.filter(h => {
      const date = new Date(h.tanggalUpdate)
      return date.getFullYear() === targetTahun && date.getMonth() >= 9 // October onwards
    })
    if (recentHistory.length > 0 && elapsedPct > 75) {
      const totalRecentUpdates = recentHistory.reduce((s, h) => s + Math.abs(h.realisasiBaru - h.realisasiLama), 0)
      if (totalRecentUpdates > totalAnggaranBelanja * 0.15) {
        temuan.push({
          id: `f-${++findingCounter}`,
          kategori: 'Potensi Penumpukan Belanja Akhir Tahun',
          judul: `Lonjakan Update Realisasi Q4 — ${recentHistory.length} transaksi`,
          deskripsi: `Terdapat ${recentHistory.length} pembaruan realisasi belanja di kuartal 4 dengan total Rp ${(totalRecentUpdates / 1_000_000_000).toFixed(1)} M. Ini mengindikasikan penumpukan pencairan akhir tahun.`,
          risiko: 'Tinggi',
          skorRisiko: 80,
          rekomendasi: 'Audit ketat semua pencairan Q4. Verifikasi kelengkapan dokumen pendukung. Waspadai potensi temuan BPK.',
          detail: {
            jenis: 'Belanja',
            namaAkun: 'Update Q4',
            anggaran: totalAnggaranBelanja,
            realisasi: totalRecentUpdates,
            persentase: safePct(totalRecentUpdates, totalAnggaranBelanja),
            selisih: totalAnggaranBelanja - totalRecentUpdates,
          },
        })
      }
    }

    // ========== ANALYSIS 4: Belanja Tidak Wajar (Over-realization / Abnormal) ==========
    // Criteria: realisasi > anggaran (over-budget)

    for (const b of belanja) {
      if (b.anggaran > 0 && b.realisasi > b.anggaran) {
        const overPct = safePct(b.realisasi - b.anggaran, b.anggaran)
        let skor = 0
        if (overPct > 50) skor = 95
        else if (overPct > 25) skor = 80
        else if (overPct > 10) skor = 65
        else skor = 50

        const opdNama4b = getOpdNama(b.opdId)
        temuan.push({
          id: `f-${++findingCounter}`,
          kategori: 'Belanja Tidak Wajar',
          judul: `${b.namaAkun} — Lebih ${overPct.toFixed(1)}% dari Anggaran`,
          deskripsi: `Realisasi ${b.namaAkun} melebihi anggaran sebesar ${overPct.toFixed(1)}%. Anggaran Rp ${(b.anggaran / 1_000_000).toFixed(0)} Jt, realisasi Rp ${(b.realisasi / 1_000_000).toFixed(0)} Jt (kelebihan Rp ${((b.realisasi - b.anggaran) / 1_000_000).toFixed(0)} Jt).`,
          risiko: getRiskLevel(skor),
          skorRisiko: skor,
          opdNama: opdNama4b,
          rekomendasi: skor >= 70
            ? 'SEGERA hentikan pencairan yang melebihi pagu. Audit penyebab over-budget. Laporkan ke Inspektorat untuk pemeriksaan. Siapkan dokumen justifikasi jika ada perubahan anggaran yang sah.'
            : 'Verifikasi apakah ada perubahan anggaran (DPA). Pastikan pencairan sesuai dengan pagu yang berlaku.',
          detail: {
            kodeAkun: b.kodeAkun,
            namaAkun: b.namaAkun,
            opdNama: opdNama4b,
            jenis: 'Belanja',
            anggaran: b.anggaran,
            realisasi: b.realisasi,
            persentase: safePct(b.realisasi, b.anggaran),
            selisih: b.realisasi - b.anggaran,
          },
        })
      }
    }

    // Also check for pendapatan over-target (less critical but still worth noting)
    for (const p of pendapatan) {
      if (p.anggaran > 0 && p.realisasi > p.anggaran * 1.2) {
        const overPct = safePct(p.realisasi - p.anggaran, p.anggaran)
        const opdNama4p = getOpdNama(p.opdId)
        temuan.push({
          id: `f-${++findingCounter}`,
          kategori: 'Belanja Tidak Wajar',
          judul: `${p.namaAkun} — Pendapatan Melebihi Target ${overPct.toFixed(1)}%`,
          deskripsi: `Realisasi pendapatan ${p.namaAkun} melebihi target anggaran sebesar ${overPct.toFixed(1)}%. Perlu diverifikasi kebenaran penerimaan.`,
          risiko: 'Sedang',
          skorRisiko: 45,
          opdNama: opdNama4p,
          rekomendasi: 'Verifikasi sumber penerimaan. Pastikan tidak ada penerimaan yang tidak sah. Update target anggaran jika memang ada peningkatan yang legitimate.',
          detail: {
            kodeAkun: p.kodeAkun,
            namaAkun: p.namaAkun,
            opdNama: opdNama4p,
            jenis: 'Pendapatan',
            anggaran: p.anggaran,
            realisasi: p.realisasi,
            persentase: safePct(p.realisasi, p.anggaran),
            selisih: p.realisasi - p.anggaran,
          },
        })
      }
    }

    // ========== ANALYSIS 5: Potensi Temuan BPK ==========
    // Composite analysis: combine multiple risk factors

    // 5a. SKPD with very low realization but significant budget - potential idle funds
    for (const skpd of realisasiSkpd) {
      const skpdPct = safePct(skpd.realisasi, skpd.anggaran)
      if (skpd.anggaran >= 1_000_000_000 && skpdPct < 25 && elapsedPct > 60) {
        const skor = skpdPct < 10 ? 90 : skpdPct < 15 ? 80 : 65
        const opdNama5a = getOpdNama(undefined, skpd.namaSkpd)

        temuan.push({
          id: `f-${++findingCounter}`,
          kategori: 'Potensi Temuan BPK',
          judul: `${skpd.namaSkpd} — Dana Menganggur`,
          deskripsi: `OPD ${skpd.namaSkpd} memiliki anggaran Rp ${(skpd.anggaran / 1_000_000_000).toFixed(1)} M namun realisasi hanya ${skpdPct.toFixed(1)}%. Dana menganggur Rp ${((skpd.anggaran - skpd.realisasi) / 1_000_000_000).toFixed(1)} M berpotensi menjadi temuan BPK atas ketidakhematan.`,
          risiko: getRiskLevel(skor),
          skorRisiko: skor,
          opdNama: opdNama5a,
          rekomendasi: skor >= 70
            ? 'Segera evaluasi program kerja OPD. Pertimbangkan realokasi dana ke program yang lebih produktif. Dokumentasikan alasan keterlambatan untuk antisipasi temuan BPK.'
            : 'Percepat pelaksanaan program. Buat timeline catch-up plan.',
          detail: {
            jenis: 'SKPD',
            namaSkpd: skpd.namaSkpd,
            kodeSkpd: skpd.kodeSkpd,
            opdNama: opdNama5a,
            anggaran: skpd.anggaran,
            realisasi: skpd.realisasi,
            persentase: skpdPct,
            selisih: skpd.anggaran - skpd.realisasi,
          },
        })
      }
    }

    // 5b. Over-budget items - potential audit findings
    const overBudgetBelanja = belanja.filter(b => b.anggaran > 0 && b.realisasi > b.anggaran)
    if (overBudgetBelanja.length > 0) {
      const totalOver = overBudgetBelanja.reduce((s, b) => s + (b.realisasi - b.anggaran), 0)
      const skor = overBudgetBelanja.length >= 5 ? 85 : overBudgetBelanja.length >= 3 ? 70 : 55

      temuan.push({
        id: `f-${++findingCounter}`,
        kategori: 'Potensi Temuan BPK',
        judul: `${overBudgetBelanja.length} Rekening Belanja Melebihi Pagu`,
        deskripsi: `Terdapat ${overBudgetBelanja.length} rekening belanja yang realisasinya melebihi anggaran (total kelebihan Rp ${(totalOver / 1_000_000_000).toFixed(1)} M). Ini merupakan potensi temuan BPK atas pelanggaran pagu anggaran.`,
        risiko: getRiskLevel(skor),
        skorRisiko: skor,
        rekomendasi: skor >= 70
          ? 'Segera audit semua item over-budget. Verifikasi adanya perubahan DPA yang sah. Siapkan dokumen justifikasi. Koordinasi dengan Inspektorat.'
          : 'Review mekanisme pengendalian anggaran. Pastikan tidak ada pencairan melebihi pagu tanpa perubahan DPA.',
        detail: {
          jenis: 'Belanja',
          namaAkun: `${overBudgetBelanja.length} Rekening Over-Budget`,
          anggaran: overBudgetBelanja.reduce((s, b) => s + b.anggaran, 0),
          realisasi: overBudgetBelanja.reduce((s, b) => s + b.realisasi, 0),
          persentase: safePct(
            overBudgetBelanja.reduce((s, b) => s + b.realisasi, 0),
            overBudgetBelanja.reduce((s, b) => s + b.anggaran, 0)
          ),
          selisih: totalOver,
        },
      })
    }

    // 5c. Zero realization with budget - potential "kegiatan fiktif" finding
    const zeroBelanja = belanja.filter(b => b.anggaran > 0 && b.realisasi === 0)
    if (zeroBelanja.length >= 3) {
      const totalZeroBudget = zeroBelanja.reduce((s, b) => s + b.anggaran, 0)
      const skor = zeroBelanja.length >= 10 ? 80 : zeroBelanja.length >= 5 ? 65 : 50

      temuan.push({
        id: `f-${++findingCounter}`,
        kategori: 'Potensi Temuan BPK',
        judul: `${zeroBelanja.length} Kegiatan Nihil — Potensi Kegiatan Fiktif`,
        deskripsi: `Terdapat ${zeroBelanja.length} rekening belanja dengan anggaran total Rp ${(totalZeroBudget / 1_000_000_000).toFixed(1)} M yang REALISASI NIHIL. BPK dapat menilai ini sebagai kegiatan yang tidak dilaksanakan atau potensi kegiatan fiktif.`,
        risiko: getRiskLevel(skor),
        skorRisiko: skor,
        rekomendasi: 'Verifikasi status kegiatan tiap rekening. Pastikan kegiatan benar-benar dijadwalkan. Siapkan bukti penunjukan dan kontrak untuk kegiatan yang akan dilaksanakan.',
        detail: {
          jenis: 'Belanja',
          namaAkun: `${zeroBelanja.length} Rekening Nihil`,
          anggaran: totalZeroBudget,
          realisasi: 0,
          persentase: 0,
          selisih: totalZeroBudget,
        },
      })
    }

    // 5d. SILPA too high - potential inefficiency finding
    const totalRealisasiPendapatan = pendapatan.reduce((s, p) => s + p.realisasi, 0)
    const totalAnggaranPendapatan = pendapatan.reduce((s, p) => s + p.anggaran, 0)
    const silpa = totalRealisasiPendapatan - totalRealisasiBelanja
    const silpaPct = safePct(silpa, totalAnggaranPendapatan)

    if (silpaPct > 15 && elapsedPct > 75) {
      const skor = silpaPct > 30 ? 80 : silpaPct > 20 ? 65 : 50
      temuan.push({
        id: `f-${++findingCounter}`,
        kategori: 'Potensi Temuan BPK',
        judul: `SILPA Tinggi ${silpaPct.toFixed(1)}% — Ketidakhematan`,
        deskripsi: `SILPA mencapai ${silpaPct.toFixed(1)}% dari total anggaran pendapatan (Rp ${(Math.abs(silpa) / 1_000_000_000).toFixed(1)} M). BPK dapat menilai adanya ketidakhematan dalam pengelolaan keuangan daerah.`,
        risiko: getRiskLevel(skor),
        skorRisiko: skor,
        rekomendasi: 'Percepat serapan belanja yang tertunda. Optimalkan realisasi program. Dokumentasikan alasan SILPA tinggi untuk antisipasi temuan.',
        detail: {
          jenis: 'Keseluruhan',
          namaAkun: 'SILPA',
          anggaran: totalAnggaranPendapatan,
          realisasi: silpa,
          persentase: silpaPct,
          selisih: silpa,
        },
      })
    }

    // Sort findings by risk score (highest first)
    temuan.sort((a, b) => b.skorRisiko - a.skorRisiko)

    // Compute summary
    const tinggi = temuan.filter(t => t.risiko === 'Tinggi').length
    const sedang = temuan.filter(t => t.risiko === 'Sedang').length
    const rendah = temuan.filter(t => t.risiko === 'Rendah').length
    const totalTemuan = temuan.length

    // Composite score: weighted average
    const avgSkor = totalTemuan > 0
      ? temuan.reduce((s, t) => s + t.skorRisiko, 0) / totalTemuan
      : 0
    // Boost if many high-risk findings
    const skorKeseluruhan = Math.min(100, Math.round(
      avgSkor + (tinggi * 3)
    ))
    const levelKeseluruhan = getRiskLevel(skorKeseluruhan)

    // Build indicators
    const indikator = [
      {
        label: 'Serapan Belanja',
        nilai: realisasiBelanjaPct,
        satuan: '%',
        risiko: realisasiBelanjaPct < 25 ? 'Tinggi' as RiskLevel : realisasiBelanjaPct < 50 ? 'Sedang' as RiskLevel : 'Rendah' as RiskLevel,
      },
      {
        label: 'Serapan Pendapatan',
        nilai: safePct(totalRealisasiPendapatan, totalAnggaranPendapatan),
        satuan: '%',
        risiko: safePct(totalRealisasiPendapatan, totalAnggaranPendapatan) < 50 ? 'Tinggi' as RiskLevel : safePct(totalRealisasiPendapatan, totalAnggaranPendapatan) < 75 ? 'Sedang' as RiskLevel : 'Rendah' as RiskLevel,
      },
      {
        label: 'Rekening Over-Budget',
        nilai: overBudgetBelanja.length,
        satuan: 'rekening',
        risiko: overBudgetBelanja.length >= 5 ? 'Tinggi' as RiskLevel : overBudgetBelanja.length >= 2 ? 'Sedang' as RiskLevel : 'Rendah' as RiskLevel,
      },
      {
        label: 'Kegiatan Nihil',
        nilai: zeroBelanja.length,
        satuan: 'rekening',
        risiko: zeroBelanja.length >= 10 ? 'Tinggi' as RiskLevel : zeroBelanja.length >= 5 ? 'Sedang' as RiskLevel : 'Rendah' as RiskLevel,
      },
      {
        label: 'Gap Waktu vs Realisasi',
        nilai: Math.max(0, gapTimeVsRealisasi),
        satuan: '%',
        risiko: gapTimeVsRealisasi > 30 ? 'Tinggi' as RiskLevel : gapTimeVsRealisasi > 15 ? 'Sedang' as RiskLevel : 'Rendah' as RiskLevel,
      },
      {
        label: 'SILPA',
        nilai: silpaPct,
        satuan: '%',
        risiko: silpaPct > 20 ? 'Tinggi' as RiskLevel : silpaPct > 10 ? 'Sedang' as RiskLevel : 'Rendah' as RiskLevel,
      },
      {
        label: 'Progress Waktu Tahun',
        nilai: Math.round(elapsedPct),
        satuan: '%',
        risiko: 'Rendah' as RiskLevel, // informational only
      },
    ]

    const result: AnalisisRisikoResult = {
      tahun: targetTahun,
      tanggalAnalisis: now.toISOString(),
      ringkasanRisiko: {
        tinggi,
        sedang,
        rendah,
        totalTemuan,
        skorKeseluruhan,
        levelKeseluruhan,
      },
      temuan,
      opdList: opdList.map(o => ({ id: o.id, kodeOpd: o.kodeOpd, namaOpd: o.namaOpd })),
      indikator,
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Analisis Risiko API error:', error)
    return NextResponse.json(
      { error: 'Failed to compute risk analysis' },
      { status: 500 }
    )
  }
}
