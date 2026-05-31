import { db } from '@/lib/db'

/**
 * Extract kode induk (parent code) from kodeAkun.
 * Takes the first 2 segments of a dot-separated code.
 * Examples:
 *   "4.1.01" → "4.1"
 *   "4.1"    → "4.1"
 *   "5.2.03" → "5.2"
 *   "6"      → "6"
 */
function getKodeInduk(kodeAkun: string): string {
  const parts = kodeAkun.split('.')
  return parts.slice(0, 2).join('.')
}

/**
 * Sync RealisasiAkun from Pendapatan, Belanja, and Pembiayaan data.
 * Groups source data by kode induk (first 2 segments of kodeAkun) and jenis,
 * then upserts the aggregated results into RealisasiAkun with autoSync=true.
 *
 * - Deletes previously auto-synced records for the given tahunAnggaranId
 * - Creates new records from aggregated source data
 * - Leaves manually entered records (autoSync=false) untouched
 */
export async function syncRealisasiAkun(tahunAnggaranId: string): Promise<void> {
  // Fetch all source data for this fiscal year
  const [pendapatanList, belanjaList, pembiayaanList] = await Promise.all([
    db.pendapatan.findMany({ where: { tahunAnggaranId } }),
    db.belanja.findMany({ where: { tahunAnggaranId } }),
    db.pembiayaan.findMany({ where: { tahunAnggaranId } }),
  ])

  // Aggregate by kode induk
  type AggKey = string // "jenis|kodeInduk" e.g., "Pendapatan|4.1"
  const aggregation = new Map<AggKey, {
    kodeInduk: string
    jenis: string
    namaAkun: string
    anggaran: number
    realisasi: number
  }>()

  // Helper to accumulate
  const accumulate = (items: Array<{ kodeAkun: string; namaAkun: string; kategori: string; anggaran: number; realisasi: number }>, jenis: string) => {
    for (const item of items) {
      const kodeInduk = getKodeInduk(item.kodeAkun)
      const key = `${jenis}|${kodeInduk}`

      const existing = aggregation.get(key)
      if (existing) {
        existing.anggaran += item.anggaran
        existing.realisasi += item.realisasi
      } else {
        // Use kategori as namaAkun for the parent level, fallback to the item's namaAkun
        aggregation.set(key, {
          kodeInduk,
          jenis,
          namaAkun: item.kategori || item.namaAkun,
          anggaran: item.anggaran,
          realisasi: item.realisasi,
        })
      }
    }
  }

  accumulate(pendapatanList, 'Pendapatan')
  accumulate(belanjaList, 'Belanja')
  accumulate(pembiayaanList, 'Pembiayaan')

  // Delete all previously auto-synced records for this tahun anggaran
  await db.realisasiAkun.deleteMany({
    where: {
      tahunAnggaranId,
      autoSync: true,
    },
  })

  // Create new auto-synced records
  const records = Array.from(aggregation.values())
  if (records.length > 0) {
    await db.realisasiAkun.createMany({
      data: records.map((r) => ({
        tahunAnggaranId,
        kodeAkun: r.kodeInduk,
        namaAkun: r.namaAkun,
        jenis: r.jenis,
        anggaran: r.anggaran,
        realisasi: r.realisasi,
        persentase: r.anggaran > 0
          ? Math.round((r.realisasi / r.anggaran) * 10000) / 100
          : 0,
        autoSync: true,
        tanggalUpdate: new Date(),
      })),
    })
  }
}
