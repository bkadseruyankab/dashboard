import { db } from '@/lib/db'

/**
 * Sync RealisasiSkpd from Pendapatan, Belanja, and Pembiayaan data.
 * Aggregates source data per OPD for a given tahunAnggaranId,
 * then upserts the aggregated results into RealisasiSkpd with autoSync=true.
 *
 * - Deletes previously auto-synced records for the given tahunAnggaranId
 * - Creates new records from aggregated source data per OPD
 * - Leaves manually entered records (autoSync=false) untouched
 */
export async function syncRealisasiSkpd(tahunAnggaranId: string): Promise<void> {
  // Get all OPDs for this fiscal year
  const opdList = await db.opd.findMany({
    where: { tahunAnggaranId },
    orderBy: { kodeOpd: 'asc' },
  })

  if (opdList.length === 0) {
    // No OPDs for this year, delete any auto-synced records
    await db.realisasiSkpd.deleteMany({
      where: { tahunAnggaranId, autoSync: true },
    })
    return
  }

  // Fetch all source data for this fiscal year
  const [pendapatanList, belanjaList, pembiayaanList] = await Promise.all([
    db.pendapatan.findMany({ where: { tahunAnggaranId } }),
    db.belanja.findMany({ where: { tahunAnggaranId } }),
    db.pembiayaan.findMany({ where: { tahunAnggaranId } }),
  ])

  // Aggregate data per OPD
  const aggregation = new Map<string, {
    kodeSkpd: string
    namaSkpd: string
    anggaran: number
    realisasi: number
  }>()

  // Initialize all OPDs with zero values
  for (const opd of opdList) {
    aggregation.set(opd.id, {
      kodeSkpd: opd.kodeOpd,
      namaSkpd: opd.namaOpd,
      anggaran: 0,
      realisasi: 0,
    })
  }

  // Helper to accumulate data for an OPD
  const accumulateForOpd = (
    items: Array<{ opdId: string | null; anggaran: number; realisasi: number }>,
  ) => {
    for (const item of items) {
      if (!item.opdId) continue // Skip items not linked to an OPD
      const existing = aggregation.get(item.opdId)
      if (existing) {
        existing.anggaran += item.anggaran
        existing.realisasi += item.realisasi
      }
    }
  }

  accumulateForOpd(pendapatanList)
  accumulateForOpd(belanjaList)
  accumulateForOpd(pembiayaanList)

  // Delete all previously auto-synced records for this tahun anggaran
  await db.realisasiSkpd.deleteMany({
    where: {
      tahunAnggaranId,
      autoSync: true,
    },
  })

  // Create new auto-synced records
  const records = Array.from(aggregation.values())
    .filter((r) => r.anggaran > 0 || r.realisasi > 0) // Only create records with data

  if (records.length > 0) {
    await db.realisasiSkpd.createMany({
      data: records.map((r) => ({
        tahunAnggaranId,
        kodeSkpd: r.kodeSkpd,
        namaSkpd: r.namaSkpd,
        anggaran: r.anggaran,
        realisasi: r.realisasi,
        persentase: r.anggaran > 0
          ? Math.round((r.realisasi / r.anggaran) * 10000) / 100
          : 0,
        autoSync: true,
      })),
    })
  }
}
