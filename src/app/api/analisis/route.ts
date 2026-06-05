import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

// ─── Types ───────────────────────────────────────────────────────────────────

type Risiko = 'Rendah' | 'Sedang' | 'Tinggi'

interface TemuanBase {
  id: string
  namaAkun: string
  kodeAkun: string
  jenis: 'Pendapatan' | 'Belanja'
  anggaran: number
  realisasi: number
  persentase: number
  gap: number
  opdNama: string | null
  risiko: Risiko
  rekomendasi: string
}

interface KategoriTemuan {
  id: string
  nama: string
  deskripsi: string
  icon: string
  warna: string
  temuan: TemuanBase[]
}

interface AnalisisResult {
  tahun: number
  ringkasan: {
    totalTemuan: number
    risikoRendah: number
    risikoSedang: number
    risikoTinggi: number
  }
  kategori: KategoriTemuan[]
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const safePct = (anggaran: number, realisasi: number): number =>
  anggaran > 0 ? Math.round((realisasi / anggaran) * 10000) / 100 : 0

const safeDiv = (num: number, den: number): number =>
  den > 0 ? num / den : 0

const formatRupiah = (n: number): string => {
  if (n >= 1_000_000_000_000) return `${(n / 1_000_000_000_000).toFixed(1)} triliun`
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)} miliar`
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} juta`
  return `${n.toLocaleString('id-ID')}`
}

function getDayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0)
  const diff = date.getTime() - start.getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

function getDaysInYear(year: number): number {
  return (year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)) ? 366 : 365
}

function isStale(date: Date, thresholdDays: number): boolean {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  return diffMs > thresholdDays * 24 * 60 * 60 * 1000
}

// ─── Main Handler ────────────────────────────────────────────────────────────

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const tahunParam = searchParams.get('tahun')

    // ── Resolve target fiscal year ─────────────────────────────────────────
    const tahunList = await db.tahunAnggaran.findMany({ orderBy: { tahun: 'asc' } })
    if (!tahunList.length) {
      return NextResponse.json({ error: 'Belum ada data tahun anggaran' }, { status: 404 })
    }

    let targetTahun: number
    if (tahunParam) {
      const parsed = parseInt(tahunParam, 10)
      if (isNaN(parsed) || parsed < 2000 || parsed > 2100) {
        return NextResponse.json({ error: 'Parameter tahun tidak valid' }, { status: 400 })
      }
      targetTahun = parsed
    } else {
      const activeTa = tahunList.find((t) => t.aktif)
      targetTahun = activeTa ? activeTa.tahun : tahunList[tahunList.length - 1].tahun
    }

    const tahunAnggaran = await db.tahunAnggaran.findUnique({ where: { tahun: targetTahun } })
    if (!tahunAnggaran) {
      return NextResponse.json({ error: `Data tahun ${targetTahun} tidak ditemukan` }, { status: 404 })
    }

    const taId = tahunAnggaran.id

    // ── Fetch all data in parallel ─────────────────────────────────────────
    const [pendapatan, belanja, pembiayaan, realisasiAkun, opdList, belanjaHistory, pendapatanHistory] =
      await Promise.all([
        db.pendapatan.findMany({ where: { tahunAnggaranId: taId }, include: { opd: true } }),
        db.belanja.findMany({ where: { tahunAnggaranId: taId }, include: { opd: true } }),
        db.pembiayaan.findMany({ where: { tahunAnggaranId: taId }, include: { opd: true } }),
        db.realisasiAkun.findMany({ where: { tahunAnggaranId: taId } }),
        db.opd.findMany({ where: { tahunAnggaranId: taId } }),
        db.belanjaHistory.findMany({
          where: { belanja: { tahunAnggaranId: taId } },
          orderBy: { tanggalUpdate: 'asc' },
        }),
        db.pendapatanHistory.findMany({
          where: { pendapatan: { tahunAnggaranId: taId } },
          orderBy: { tanggalUpdate: 'asc' },
        }),
      ])

    // Build OPD lookup map
    const opdMap = new Map<string, string>()
    for (const opd of opdList) {
      opdMap.set(opd.id, opd.namaOpd)
    }

    const getOpdNama = (opdId: string | null): string | null =>
      opdId ? (opdMap.get(opdId) ?? null) : null

    // Time progress calculation
    const now = new Date()
    const currentYear = now.getFullYear()
    const dayOfYear = getDayOfYear(now)
    const daysInTargetYear = getDaysInYear(targetTahun)
    let timeProgress: number
    if (currentYear === targetTahun) {
      timeProgress = safeDiv(dayOfYear, daysInTargetYear)
    } else if (currentYear > targetTahun) {
      timeProgress = 1.0 // Year is over
    } else {
      timeProgress = 0.0 // Year hasn't started
    }

    // ── Category 1: Anggaran Besar dengan Realisasi Rendah ─────────────────
    const cat1Temuan: TemuanBase[] = []

    // Combine pendapatan and belanja into a unified list
    const allItems = [
      ...pendapatan.map((p) => ({
        id: p.id,
        kodeAkun: p.kodeAkun,
        namaAkun: p.namaAkun,
        jenis: 'Pendapatan' as const,
        anggaran: p.anggaran,
        realisasi: p.realisasi,
        opdId: p.opdId,
        tanggalUpdate: p.tanggalUpdate,
      })),
      ...belanja.map((b) => ({
        id: b.id,
        kodeAkun: b.kodeAkun,
        namaAkun: b.namaAkun,
        jenis: 'Belanja' as const,
        anggaran: b.anggaran,
        realisasi: b.realisasi,
        opdId: b.opdId,
        tanggalUpdate: b.tanggalUpdate,
      })),
    ]

    if (allItems.length > 0) {
      // Find top 25% by anggaran value
      const sortedByAnggaran = [...allItems].sort((a, b) => b.anggaran - a.anggaran)
      const top25Count = Math.max(1, Math.ceil(sortedByAnggaran.length * 0.25))
      const top25Items = sortedByAnggaran.slice(0, top25Count)
      const top25Ids = new Set(top25Items.map((item) => item.id))

      for (const item of allItems) {
        if (!top25Ids.has(item.id)) continue
        if (item.anggaran <= 0) continue

        const pct = safeDiv(item.realisasi, item.anggaran)
        if (pct >= 0.75) continue // Only include items with realisasi < 75%

        const gap = item.anggaran - item.realisasi
        const persentase = safePct(item.anggaran, item.realisasi)

        let risiko: Risiko
        if (pct < 0.25) {
          risiko = 'Tinggi'
        } else if (pct < 0.5) {
          risiko = 'Sedang'
        } else {
          risiko = 'Rendah'
        }

        const jenisLabel = item.jenis === 'Pendapatan' ? 'Pendapatan' : 'Belanja'
        const rekomendasi = pct < 0.25
          ? `Realisasi ${jenisLabel.toLowerCase()} "${item.namaAkun}" sangat rendah (${persentase}%). Perlu evaluasi penyebab dan tindakan percepatan realisasi atau revisi anggaran.`
          : pct < 0.5
            ? `Realisasi ${jenisLabel.toLowerCase()} "${item.namaAkun}" masih di bawah 50% (${persentase}%). Perlu penguatan strategi pencapaian target dan monitoring berkala.`
            : `Realisasi ${jenisLabel.toLowerCase()} "${item.namaAkun}" cukup tertinggal (${persentase}%). Perlu peningkatan intensitas pelaksanaan agar mencapai target.`

        cat1Temuan.push({
          id: `ABR-${item.id}`,
          namaAkun: item.namaAkun,
          kodeAkun: item.kodeAkun,
          jenis: item.jenis,
          anggaran: item.anggaran,
          realisasi: item.realisasi,
          persentase,
          gap,
          opdNama: getOpdNama(item.opdId),
          risiko,
          rekomendasi,
        })
      }
    }

    // Sort by gap descending
    cat1Temuan.sort((a, b) => b.gap - a.gap)

    // ── Category 2: Kegiatan yang Tidak Bergerak ───────────────────────────
    const cat2Temuan: TemuanBase[] = []

    const stagnantItems = [
      ...pendapatan.map((p) => ({
        id: p.id,
        kodeAkun: p.kodeAkun,
        namaAkun: p.namaAkun,
        jenis: 'Pendapatan' as const,
        anggaran: p.anggaran,
        realisasi: p.realisasi,
        opdId: p.opdId,
        tanggalUpdate: p.tanggalUpdate,
      })),
      ...belanja.map((b) => ({
        id: b.id,
        kodeAkun: b.kodeAkun,
        namaAkun: b.namaAkun,
        jenis: 'Belanja' as const,
        anggaran: b.anggaran,
        realisasi: b.realisasi,
        opdId: b.opdId,
        tanggalUpdate: b.tanggalUpdate,
      })),
    ]

    for (const item of stagnantItems) {
      if (item.anggaran <= 0) continue
      const pct = safeDiv(item.realisasi, item.anggaran)
      if (pct >= 0.01) continue // Only items with realisasi < 1% of anggaran

      const stale = isStale(item.tanggalUpdate, 60)
      let risiko: Risiko
      if (item.anggaran > 1_000_000_000 && pct === 0) {
        risiko = 'Tinggi'
      } else if (item.anggaran > 100_000_000 && pct === 0) {
        risiko = 'Sedang'
      } else {
        risiko = 'Rendah'
      }

      const persentase = safePct(item.anggaran, item.realisasi)
      const gap = item.anggaran - item.realisasi
      const staleInfo = stale ? ' Data tidak diperbarui selama > 60 hari.' : ''
      const jenisLabel = item.jenis === 'Pendapatan' ? 'Pendapatan' : 'Belanja'
      const rekomendasi = risiko === 'Tinggi'
        ? `Anggaran ${jenisLabel.toLowerCase()} "${item.namaAkun}" sebesar ${formatRupiah(item.anggaran)} tidak terserap sama sekali.${staleInfo} Perlu konfirmasi ke OPD terkait dan pertimbangkan realokasi anggaran.`
        : risiko === 'Sedang'
          ? `Anggaran ${jenisLabel.toLowerCase()} "${item.namaAkun}" sebesar ${formatRupiah(item.anggaran)} belum terealisasi.${staleInfo} Perlu tindak lanjut percepatan atau revisi.`
          : `Realisasi ${jenisLabel.toLowerCase()} "${item.namaAkun}" sangat rendah.${staleInfo} Perlu evaluasi kelayakan anggaran.`

      cat2Temuan.push({
        id: `TBG-${item.id}`,
        namaAkun: item.namaAkun,
        kodeAkun: item.kodeAkun,
        jenis: item.jenis,
        anggaran: item.anggaran,
        realisasi: item.realisasi,
        persentase,
        gap,
        opdNama: getOpdNama(item.opdId),
        risiko,
        rekomendasi,
      })
    }

    cat2Temuan.sort((a, b) => b.anggaran - a.anggaran)

    // ── Category 3: Potensi Penumpukan Belanja Akhir Tahun ────────────────
    const cat3Temuan: TemuanBase[] = []

    // Group belanja history by belanjaId for per-item analysis
    const belanjaHistoryByBelanjaId = new Map<string, typeof belanjaHistory>()
    for (const h of belanjaHistory) {
      const list = belanjaHistoryByBelanjaId.get(h.belanjaId) ?? []
      list.push(h)
      belanjaHistoryByBelanjaId.set(h.belanjaId, list)
    }

    for (const b of belanja) {
      if (b.anggaran <= 0) continue

      const pct = safeDiv(b.realisasi, b.anggaran)
      const persentase = safePct(b.anggaran, b.realisasi)
      const gap = b.anggaran - b.realisasi

      // Check if item is behind time progress significantly
      // Flag if time progress > X% but realization < X% * 0.7
      const expectedMinRealisasi = timeProgress * 0.7
      const isBehindSchedule = timeProgress > 0.5 && pct < expectedMinRealisasi

      // Check for history clustering in Q4
      const itemHistory = belanjaHistoryByBelanjaId.get(b.id) ?? []
      const itemQ4Count = itemHistory.filter((h) => {
        const d = new Date(h.tanggalUpdate)
        return d.getFullYear() === targetTahun && d.getMonth() >= 9 // Oct=9, Nov=10, Dec=11
      }).length
      const itemQ4Ratio = safeDiv(itemQ4Count, Math.max(itemHistory.length, 1))
      const hasClustering = itemQ4Ratio > 0.5 && itemHistory.length >= 2

      if (!isBehindSchedule && !hasClustering) continue

      let risiko: Risiko
      if (timeProgress > 0.75 && pct < 0.3) {
        risiko = 'Tinggi'
      } else if (timeProgress > 0.5 && pct < 0.4) {
        risiko = 'Sedang'
      } else {
        risiko = 'Rendah'
      }

      const clusteringNote = hasClustering
        ? ` Pola update realisasi terkonsentrasi di kuartal terakhir (${(itemQ4Ratio * 100).toFixed(0)}% update di Q4).`
        : ''
      const rekomendasi = risiko === 'Tinggi'
        ? `Belanja "${b.namaAkun}" sangat tertinggal: waktu tahun ${(timeProgress * 100).toFixed(0)}% tetapi realisasi hanya ${persentase}%.${clusteringNote} Perlu percepatan penyerapan segera atau revisi anggaran untuk menghindari penumpukan akhir tahun.`
        : risiko === 'Sedang'
          ? `Belanja "${b.namaAkun}" tertinggal dari progres waktu (${(timeProgress * 100).toFixed(0)}% waktu, ${persentase}% realisasi).${clusteringNote} Perlu pemerataan penyerapan anggaran.`
          : `Belanja "${b.namaAkun}" sedikit tertinggal dari progres waktu.${clusteringNote} Pantau untuk menghindari penumpukan di akhir tahun.`

      cat3Temuan.push({
        id: `PBA-${b.id}`,
        namaAkun: b.namaAkun,
        kodeAkun: b.kodeAkun,
        jenis: 'Belanja',
        anggaran: b.anggaran,
        realisasi: b.realisasi,
        persentase,
        gap,
        opdNama: getOpdNama(b.opdId),
        risiko,
        rekomendasi,
      })
    }

    cat3Temuan.sort((a, b) => a.persentase - b.persentase)

    // ── Category 4: Belanja Tidak Wajar ────────────────────────────────────
    const cat4Temuan: TemuanBase[] = []

    // 4a. Overspending: realisasi > anggaran
    const overspendItems = belanja.filter((b) => b.anggaran > 0 && b.realisasi > b.anggaran)

    // 4b. Outlier by kategori: realisasi > 3x average for that kategori
    const belanjaByKategori = new Map<string, { items: typeof belanja; totalRealisasi: number }>()
    for (const b of belanja) {
      const entry = belanjaByKategori.get(b.kategori) ?? { items: [], totalRealisasi: 0 }
      entry.items.push(b)
      entry.totalRealisasi += b.realisasi
      belanjaByKategori.set(b.kategori, entry)
    }

    const outlierItems: typeof belanja = []
    for (const [, group] of belanjaByKategori) {
      if (group.items.length < 2) continue
      const avgRealisasi = safeDiv(group.totalRealisasi, group.items.length)
      for (const b of group.items) {
        if (avgRealisasi > 0 && b.realisasi > 3 * avgRealisasi && b.anggaran > 0) {
          outlierItems.push(b)
        }
      }
    }

    // 4c. Sudden spikes from BelanjaHistory: > 50% of anggaran in single update
    const spikeBelanjaIds = new Set<string>()
    for (const h of belanjaHistory) {
      const belanjaItem = belanja.find((b) => b.id === h.belanjaId)
      if (!belanjaItem || belanjaItem.anggaran <= 0) continue
      const increase = Math.abs(h.realisasiBaru - h.realisasiLama)
      if (increase > 0.5 * belanjaItem.anggaran) {
        spikeBelanjaIds.add(h.belanjaId)
      }
    }

    // Combine all abnormal items, deduplicate by id
    const abnormalBelanjaMap = new Map<string, {
      item: (typeof belanja)[number]
      reasons: string[]
    }>()

    for (const b of overspendItems) {
      const entry = abnormalBelanjaMap.get(b.id) ?? { item: b, reasons: [] }
      const overspendPct = safeDiv(b.realisasi - b.anggaran, b.anggaran) * 100
      entry.reasons.push(`Overspending ${overspendPct.toFixed(1)}%`)
      abnormalBelanjaMap.set(b.id, entry)
    }

    for (const b of outlierItems) {
      const entry = abnormalBelanjaMap.get(b.id) ?? { item: b, reasons: [] }
      const group = belanjaByKategori.get(b.kategori)!
      const avgRealisasi = safeDiv(group.totalRealisasi, group.items.length)
      const ratio = avgRealisasi > 0 ? safeDiv(b.realisasi, avgRealisasi) : 0
      entry.reasons.push(`Realisasi ${ratio.toFixed(1)}x rata-rata kategori "${b.kategori}"`)
      abnormalBelanjaMap.set(b.id, entry)
    }

    for (const belanjaId of spikeBelanjaIds) {
      const b = belanja.find((bl) => bl.id === belanjaId)
      if (!b) continue
      const entry = abnormalBelanjaMap.get(b.id) ?? { item: b, reasons: [] }
      entry.reasons.push('Lonjakan tajam dalam update riwayat')
      abnormalBelanjaMap.set(b.id, entry)
    }

    for (const [, { item: b, reasons }] of abnormalBelanjaMap) {
      const pct = safeDiv(b.realisasi, b.anggaran)
      const persentase = safePct(b.anggaran, b.realisasi)
      const gap = b.realisasi - b.anggaran // positive for overspending

      let risiko: Risiko
      if (pct > 1.2) {
        risiko = 'Tinggi' // > 20% overspending
      } else if (pct > 1.0 || reasons.some((r) => r.includes('x rata-rata'))) {
        risiko = 'Sedang'
      } else {
        risiko = 'Rendah'
      }

      const reasonStr = reasons.join('; ')
      const rekomendasi = risiko === 'Tinggi'
        ? `Belanja "${b.namaAkun}" melebihi anggaran secara signifikan (${persentase}%). ${reasonStr}. Perlu audit penyebab overspending dan pertimbangan pergeseran/revisi anggaran.`
        : risiko === 'Sedang'
          ? `Belanja "${b.namaAkun}" menunjukkan pola tidak wajar. ${reasonStr}. Perlu verifikasi dan penjelasan dari OPD terkait.`
          : `Belanja "${b.namaAkun}" memiliki indikasi anomali ringan. ${reasonStr}. Perlu pemantauan lebih lanjut.`

      cat4Temuan.push({
        id: `BTW-${b.id}`,
        namaAkun: b.namaAkun,
        kodeAkun: b.kodeAkun,
        jenis: 'Belanja',
        anggaran: b.anggaran,
        realisasi: b.realisasi,
        persentase,
        gap: Math.abs(gap),
        opdNama: getOpdNama(b.opdId),
        risiko,
        rekomendasi,
      })
    }

    cat4Temuan.sort((a, b) => b.persentase - a.persentase)

    // ── Category 5: Potensi Temuan BPK ────────────────────────────────────
    const cat5Temuan: TemuanBase[] = []
    const cat5Ids = new Set<string>() // To avoid duplicates

    // 5a. Overspending items (from belanja)
    for (const b of belanja) {
      if (b.anggaran > 0 && b.realisasi > b.anggaran) {
        const persentase = safePct(b.anggaran, b.realisasi)
        const overspendAmount = b.realisasi - b.anggaran
        const overspendRatio = safeDiv(overspendAmount, b.anggaran)

        let risiko: Risiko
        if (overspendRatio > 0.2) {
          risiko = 'Tinggi'
        } else if (overspendRatio > 0.1) {
          risiko = 'Sedang'
        } else {
          risiko = 'Rendah'
        }

        const rekomendasi = risiko === 'Tinggi'
          ? `Belanja "${b.namaAkun}" melebihi anggaran ${(overspendRatio * 100).toFixed(1)}% — potensi temuan BPK atas pembelanjaan tanpa dasar anggaran. Segera lakukan revisi/pergeseran anggaran.`
          : `Belanja "${b.namaAkun}" sedikit melebihi anggaran. Verifikasi kelengkapan dokumen pendukung realisasi.`

        const temuanId = `BPK-OVR-${b.id}`
        if (!cat5Ids.has(temuanId)) {
          cat5Ids.add(temuanId)
          cat5Temuan.push({
            id: temuanId,
            namaAkun: b.namaAkun,
            kodeAkun: b.kodeAkun,
            jenis: 'Belanja',
            anggaran: b.anggaran,
            realisasi: b.realisasi,
            persentase,
            gap: overspendAmount,
            opdNama: getOpdNama(b.opdId),
            risiko,
            rekomendasi,
          })
        }
      }
    }

    // 5b. Zero realization on large budgets (both pendapatan and belanja)
    const allForBpk = [
      ...pendapatan.map((p) => ({ ...p, jenis: 'Pendapatan' as const })),
      ...belanja.map((b) => ({ ...b, jenis: 'Belanja' as const })),
    ]

    for (const item of allForBpk) {
      if (item.anggaran <= 0 || item.realisasi > 0) continue

      let risiko: Risiko
      if (item.anggaran > 1_000_000_000) {
        risiko = 'Tinggi'
      } else if (item.anggaran > 500_000_000) {
        risiko = 'Sedang'
      } else {
        risiko = 'Rendah'
      }

      const rekomendasi = risiko === 'Tinggi'
        ? `Anggaran ${item.jenis.toLowerCase()} "${item.namaAkun}" sebesar ${formatRupiah(item.anggaran)} tidak terealisasi sama sekali — risiko tinggi temuan BPK. Perlu justifikasi atau realokasi.`
        : risiko === 'Sedang'
          ? `Anggaran ${item.jenis.toLowerCase()} "${item.namaAkun}" sebesar ${formatRupiah(item.anggaran)} nol realisasi — potensi pertanyaan audit. Perlu penjelasan keterlambatan/hibah.`
          : `Anggaran ${item.jenis.toLowerCase()} "${item.namaAkun}" belum terealisasi. Evaluasi kelayakan alokasi.`

      const temuanId = `BPK-ZERO-${item.jenis}-${item.id}`
      if (!cat5Ids.has(temuanId)) {
        cat5Ids.add(temuanId)
        cat5Temuan.push({
          id: temuanId,
          namaAkun: item.namaAkun,
          kodeAkun: item.kodeAkun,
          jenis: item.jenis,
          anggaran: item.anggaran,
          realisasi: item.realisasi,
          persentase: 0,
          gap: item.anggaran,
          opdNama: getOpdNama(item.opdId),
          risiko,
          rekomendasi,
        })
      }
    }

    // 5c. Very low realization (< 30%) on budgets > 1 billion
    for (const item of allForBpk) {
      if (item.anggaran <= 1_000_000_000) continue
      const pct = safeDiv(item.realisasi, item.anggaran)
      if (pct >= 0.3 || pct === 0) continue // 0% already handled above

      const persentase = safePct(item.anggaran, item.realisasi)
      const temuanId = `BPK-LOW-${item.jenis}-${item.id}`
      if (cat5Ids.has(temuanId)) continue
      cat5Ids.add(temuanId)

      const risiko: Risiko = 'Tinggi'
      const rekomendasi = `Realisasi ${item.jenis.toLowerCase()} "${item.namaAkun}" hanya ${persentase}% dari anggaran ${formatRupiah(item.anggaran)} — pemicu audit kinerja BPK. Perlu penjelasan kinerja dan rencana tindak lanjut.`

      cat5Temuan.push({
        id: temuanId,
        namaAkun: item.namaAkun,
        kodeAkun: item.kodeAkun,
        jenis: item.jenis,
        anggaran: item.anggaran,
        realisasi: item.realisasi,
        persentase,
        gap: item.anggaran - item.realisasi,
        opdNama: getOpdNama(item.opdId),
        risiko,
        rekomendasi,
      })
    }

    // 5d. Data inconsistency: RealisasiAkun totals vs actual Pendapatan/Belanja totals
    const realisasiAkunPendapatan = realisasiAkun.filter((r) => r.jenis === 'Pendapatan')
    const realisasiAkunBelanja = realisasiAkun.filter((r) => r.jenis === 'Belanja')

    const raTotalPendapatanAnggaran = realisasiAkunPendapatan.reduce((s, r) => s + r.anggaran, 0)
    const raTotalPendapatanRealisasi = realisasiAkunPendapatan.reduce((s, r) => s + r.realisasi, 0)
    const raTotalBelanjaAnggaran = realisasiAkunBelanja.reduce((s, r) => s + r.anggaran, 0)
    const raTotalBelanjaRealisasi = realisasiAkunBelanja.reduce((s, r) => s + r.realisasi, 0)

    const actualTotalPendapatanAnggaran = pendapatan.reduce((s, p) => s + p.anggaran, 0)
    const actualTotalPendapatanRealisasi = pendapatan.reduce((s, p) => s + p.realisasi, 0)
    const actualTotalBelanjaAnggaran = belanja.reduce((s, b) => s + b.anggaran, 0)
    const actualTotalBelanjaRealisasi = belanja.reduce((s, b) => s + b.realisasi, 0)

    // Check for significant mismatches (> 5% difference)
    const checkMismatch = (
      raTotal: number,
      actualTotal: number,
      _label: string,
      jenis: 'Pendapatan' | 'Belanja',
      subLabel: string
    ) => {
      if (raTotal <= 0 || actualTotal <= 0) return
      const diff = Math.abs(raTotal - actualTotal)
      const diffPct = safeDiv(diff, actualTotal) * 100
      if (diffPct > 5) {
        const temuanId = `BPK-MISMATCH-${jenis}-${subLabel}`
        if (cat5Ids.has(temuanId)) return
        cat5Ids.add(temuanId)

        let risiko: Risiko
        if (diffPct > 20) {
          risiko = 'Tinggi'
        } else if (diffPct > 10) {
          risiko = 'Sedang'
        } else {
          risiko = 'Rendah'
        }

        const rekomendasi = risiko === 'Tinggi'
          ? `Inkonsistensi data signifikan pada ${jenis.toLowerCase()} (${subLabel}): total RealisasiAkun (${formatRupiah(raTotal)}) berbeda ${diffPct.toFixed(1)}% dari data aktual (${formatRupiah(actualTotal)}). Perlu rekonsiliasi data segera — risiko temuan BPK.`
          : `Perbedaan data ${jenis.toLowerCase()} (${subLabel}): RealisasiAkun vs aktual ${diffPct.toFixed(1)}%. Perlu verifikasi sinkronisasi data.`

        cat5Temuan.push({
          id: temuanId,
          namaAkun: `Total ${jenis} (${subLabel}) - Inkonsistensi Data`,
          kodeAkun: '-',
          jenis,
          anggaran: actualTotal,
          realisasi: raTotal,
          persentase: safePct(actualTotal, raTotal),
          gap: diff,
          opdNama: null,
          risiko,
          rekomendasi,
        })
      }
    }

    checkMismatch(raTotalPendapatanAnggaran, actualTotalPendapatanAnggaran, 'Anggaran', 'Pendapatan', 'Anggaran')
    checkMismatch(raTotalPendapatanRealisasi, actualTotalPendapatanRealisasi, 'Realisasi', 'Pendapatan', 'Realisasi')
    checkMismatch(raTotalBelanjaAnggaran, actualTotalBelanjaAnggaran, 'Anggaran', 'Belanja', 'Anggaran')
    checkMismatch(raTotalBelanjaRealisasi, actualTotalBelanjaRealisasi, 'Realisasi', 'Belanja', 'Realisasi')

    // 5e. Belanja Modal vs Belanja Operasi ratio
    const totalBelanjaModal = belanja
      .filter((b) => b.kategori === 'Modal')
      .reduce((s, b) => s + b.anggaran, 0)
    const totalBelanjaAll = belanja.reduce((s, b) => s + b.anggaran, 0)

    if (totalBelanjaAll > 0 && totalBelanjaModal > 0) {
      const modalRatio = safeDiv(totalBelanjaModal, totalBelanjaAll) * 100
      if (modalRatio < 30) {
        const temuanId = 'BPK-MODAL-RATIO'
        if (!cat5Ids.has(temuanId)) {
          cat5Ids.add(temuanId)

          let risiko: Risiko
          if (modalRatio < 20) {
            risiko = 'Tinggi'
          } else {
            risiko = 'Sedang'
          }

          const rekomendasi = risiko === 'Tinggi'
            ? `Proporsi Belanja Modal hanya ${modalRatio.toFixed(1)}% dari total belanja — di bawah standar minimal 30%. BPK berpotensi menilai kurangnya investasi pembangunan. Perlu evaluasi komposisi belanja.`
            : `Proporsi Belanja Modal ${modalRatio.toFixed(1)}% mendekati batas minimum. Perlu peningkatan alokasi belanja modal untuk mendukung pembangunan.`

          cat5Temuan.push({
            id: temuanId,
            namaAkun: 'Rasio Belanja Modal vs Total Belanja',
            kodeAkun: '-',
            jenis: 'Belanja',
            anggaran: totalBelanjaAll,
            realisasi: totalBelanjaModal,
            persentase: Math.round(modalRatio * 100) / 100,
            gap: totalBelanjaAll * 0.3 - totalBelanjaModal,
            opdNama: null,
            risiko,
            rekomendasi,
          })
        }
      }
    }

    cat5Temuan.sort((a, b) => {
      const risikoOrder = { Tinggi: 0, Sedang: 1, Rendah: 2 }
      return risikoOrder[a.risiko] - risikoOrder[b.risiko] || b.gap - a.gap
    })

    // ── Build final result ─────────────────────────────────────────────────
    const kategori: KategoriTemuan[] = [
      {
        id: 'anggaran-besar-rendah',
        nama: 'Anggaran Besar, Realisasi Rendah',
        deskripsi:
          'Item anggaran dengan nilai besar (top 25%) namun realisasi di bawah 75%, mengindikasikan potensi inefisiensi atau hambatan pelaksanaan.',
        icon: 'TrendingDown',
        warna: 'text-orange-500',
        temuan: cat1Temuan,
      },
      {
        id: 'kegiatan-tidak-bergerak',
        nama: 'Kegiatan Tidak Bergerak',
        deskripsi:
          'Item anggaran yang belum terserap sama sekali (< 1% realisasi), berpotensi menjadi tumpukan anggaran yang tidak produktif.',
        icon: 'PauseCircle',
        warna: 'text-red-500',
        temuan: cat2Temuan,
      },
      {
        id: 'potensi-penumpukan',
        nama: 'Potensi Penumpukan Belanja Akhir Tahun',
        deskripsi:
          'Belanja yang tertinggal jauh dari progres waktu atau memiliki pola update terkonsentrasi di akhir tahun, berisiko menimbulkan pemborosan.',
        icon: 'AlertTriangle',
        warna: 'text-yellow-500',
        temuan: cat3Temuan,
      },
      {
        id: 'belanja-tidak-wajar',
        nama: 'Belanja Tidak Wajar',
        deskripsi:
          'Item belanja dengan pola anomali: overspending, realisasi jauh di atas rata-rata kategori, atau lonjakan tajam dalam update riwayat.',
        icon: 'ShieldAlert',
        warna: 'text-purple-500',
        temuan: cat4Temuan,
      },
      {
        id: 'potensi-temuan-bpk',
        nama: 'Potensi Temuan BPK',
        deskripsi:
          'Item yang berpotensi menjadi temuan audit BPK: overspending, zero realization pada anggaran besar, inkonsistensi data, atau rasio belanja modal tidak memadai.',
        icon: 'FileWarning',
        warna: 'text-rose-600',
        temuan: cat5Temuan,
      },
    ]

    // Calculate summary
    const allTemuan = kategori.flatMap((k) => k.temuan)
    const totalTemuan = allTemuan.length
    const risikoTinggi = allTemuan.filter((t) => t.risiko === 'Tinggi').length
    const risikoSedang = allTemuan.filter((t) => t.risiko === 'Sedang').length
    const risikoRendah = allTemuan.filter((t) => t.risiko === 'Rendah').length

    const result: AnalisisResult = {
      tahun: targetTahun,
      ringkasan: {
        totalTemuan,
        risikoRendah,
        risikoSedang,
        risikoTinggi,
      },
      kategori,
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Analisis API error:', error)
    return NextResponse.json(
      { error: 'Gagal melakukan analisis data anggaran' },
      { status: 500 }
    )
  }
}
