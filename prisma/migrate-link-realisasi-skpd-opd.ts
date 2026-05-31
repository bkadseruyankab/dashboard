/**
 * One-time migration script: Link existing RealisasiSkpd records to OPDs
 * by matching kodeSkpd = kodeOpd and setting the opdId FK.
 * Also updates namaSkpd from the OPD record to keep names in sync.
 */
import { db } from '../src/lib/db'

async function main() {
  console.log('Starting migration: Link RealisasiSkpd to OPDs...')

  // Get all RealisasiSkpd records without opdId
  const unlinked = await db.realisasiSkpd.findMany({
    where: { opdId: null },
    select: { id: true, kodeSkpd: true, namaSkpd: true },
  })
  console.log(`Found ${unlinked.length} RealisasiSkpd records without opdId`)

  // Get all OPDs
  const opds = await db.opd.findMany({
    select: { id: true, kodeOpd: true, namaOpd: true },
  })
  const kodeToOpd = new Map(opds.map((opd) => [opd.kodeOpd, opd]))

  let linked = 0
  let notFound = 0

  for (const record of unlinked) {
    const opd = kodeToOpd.get(record.kodeSkpd)
    if (opd) {
      await db.realisasiSkpd.update({
        where: { id: record.id },
        data: {
          opdId: opd.id,
          namaSkpd: opd.namaOpd,
        },
      })
      linked++
      console.log(`  ✓ Linked "${record.kodeSkpd}" (${record.namaSkpd}) → OPD "${opd.namaOpd}"`)
    } else {
      notFound++
      console.log(`  ✗ No matching OPD for kodeSkpd="${record.kodeSkpd}" (${record.namaSkpd})`)
    }
  }

  console.log(`\nMigration complete: ${linked} linked, ${notFound} not found`)
}

main()
  .catch((err) => {
    console.error('Migration failed:', err)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
