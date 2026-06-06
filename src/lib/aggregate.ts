/**
 * Aggregates an array of records by kodeAkun+kategori, summing anggaran and realisasi.
 * Records with the same kodeAkun within the same kategori are merged into one.
 *
 * Returns aggregated rows with:
 * - id: first record's id (for compatibility)
 * - sourceIds: array of all record IDs that were merged
 * - kodeAkun: the shared account code
 * - namaAkun: first record's name
 * - kategori: first record's kategori
 * - anggaran: sum of all anggaran values
 * - realisasi: sum of all realisasi values
 * - tanggalUpdate: most recent tanggalUpdate
 * - count: number of source records merged
 * - [other fields]: from first record
 */
export function aggregateByKode<T extends {
  id: string;
  kodeAkun: string;
  namaAkun: string;
  kategori: string;
  anggaran: number;
  realisasi: number;
  tanggalUpdate: string;
  [key: string]: unknown;
}>(records: T[]): (T & { sourceIds: string[]; count: number })[] {
  const grouped = new Map<string, T & { sourceIds: string[]; count: number }>();

  for (const record of records) {
    const key = `${record.kodeAkun}|||${record.kategori}`;
    const existing = grouped.get(key);

    if (existing) {
      existing.anggaran += record.anggaran;
      existing.realisasi += record.realisasi;
      existing.sourceIds.push(record.id);
      existing.count += 1;
      // Use the most recent tanggalUpdate
      if (new Date(record.tanggalUpdate) > new Date(existing.tanggalUpdate)) {
        existing.tanggalUpdate = record.tanggalUpdate;
      }
    } else {
      grouped.set(key, {
        ...record,
        sourceIds: [record.id],
        count: 1,
      });
    }
  }

  return Array.from(grouped.values());
}
