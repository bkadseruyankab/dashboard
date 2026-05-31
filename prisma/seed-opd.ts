import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const opdData = [
  // Sekretariat & Inspektorat
  { kodeOpd: "1.01", namaOpd: "Sekretariat Daerah" },
  { kodeOpd: "1.02", namaOpd: "Sekretariat DPRD" },
  { kodeOpd: "1.03", namaOpd: "Inspektorat Daerah" },

  // Dinas
  { kodeOpd: "2.01", namaOpd: "Dinas Pendidikan" },
  { kodeOpd: "2.02", namaOpd: "Dinas Kesehatan" },
  { kodeOpd: "2.03", namaOpd: "Dinas Pekerjaan Umum dan Penataan Ruang" },
  { kodeOpd: "2.04", namaOpd: "Dinas Perumahan Rakyat dan Kawasan Permukiman" },
  { kodeOpd: "2.05", namaOpd: "Dinas Sosial" },
  { kodeOpd: "2.06", namaOpd: "Dinas Ketahanan Pangan dan Pertanian" },
  { kodeOpd: "2.07", namaOpd: "Dinas Lingkungan Hidup" },
  { kodeOpd: "2.08", namaOpd: "Dinas Kependudukan dan Pencatatan Sipil" },
  { kodeOpd: "2.09", namaOpd: "Dinas Pemberdayaan Masyarakat dan Desa" },
  { kodeOpd: "2.10", namaOpd: "Dinas Perhubungan" },
  { kodeOpd: "2.11", namaOpd: "Dinas Komunikasi dan Informatika" },
  { kodeOpd: "2.12", namaOpd: "Dinas Penanaman Modal dan Pelayanan Terpadu Satu Pintu" },
  { kodeOpd: "2.13", namaOpd: "Dinas Pemuda, Olahraga, Pariwisata dan Kebudayaan" },
  { kodeOpd: "2.14", namaOpd: "Dinas Perpustakaan dan Kearsipan" },
  { kodeOpd: "2.15", namaOpd: "Dinas Perikanan" },
  { kodeOpd: "2.16", namaOpd: "Dinas Koperasi, UKM, Perindustrian dan Perdagangan" },
  { kodeOpd: "2.17", namaOpd: "Dinas Tenaga Kerja dan Transmigrasi" },

  // Badan
  { kodeOpd: "3.01", namaOpd: "Badan Perencanaan Pembangunan Daerah, Penelitian dan Pengembangan" },
  { kodeOpd: "3.02", namaOpd: "Badan Pengelolaan Keuangan dan Aset Daerah" },
  { kodeOpd: "3.03", namaOpd: "Badan Kepegawaian dan Pengembangan SDM" },
  { kodeOpd: "3.04", namaOpd: "Badan Penanggulangan Bencana Daerah" },
  { kodeOpd: "3.05", namaOpd: "Badan Kesatuan Bangsa dan Politik" },
  { kodeOpd: "3.06", namaOpd: "Badan Pendapatan Daerah" },

  // Kecamatan
  { kodeOpd: "4.01", namaOpd: "Kecamatan Seruyan Hilir" },
  { kodeOpd: "4.02", namaOpd: "Kecamatan Seruyan Hilir Timur" },
  { kodeOpd: "4.03", namaOpd: "Kecamatan Danau Sembuluh" },
  { kodeOpd: "4.04", namaOpd: "Kecamatan Hanau" },
  { kodeOpd: "4.05", namaOpd: "Kecamatan Seruyan Raya" },
  { kodeOpd: "4.06", namaOpd: "Kecamatan Danau Seluluk" },
  { kodeOpd: "4.07", namaOpd: "Kecamatan Batu Ampar" },
  { kodeOpd: "4.08", namaOpd: "Kecamatan Seruyan Tengah" },
  { kodeOpd: "4.09", namaOpd: "Kecamatan Seruyan Hulu" },
  { kodeOpd: "4.10", namaOpd: "Kecamatan Suling Tambun" },
]

// Alokasi anggaran per OPD (realistis untuk Kabupaten Seruyan, Kalimantan Tengah)
// Total APBD sekitar 800-1200 miliar
// Anggaran dalam Rupiah
const anggaranOpd: Record<string, number> = {
  // Sekretariat & Inspektorat — core admin, besar
  "1.01": 85_000_000_000,    // Sekretariat Daerah — koordinasi seluruh pemerintahan
  "1.02": 52_000_000_000,    // Sekretariat DPRD — dukungan legislatif
  "1.03": 18_000_000_000,    // Inspektorat Daerah — pengawasan

  // Dinas — layanan publik, anggaran besar
  "2.01": 135_000_000_000,   // Dinas Pendidikan — terbesar, guru + sekolah
  "2.02": 112_000_000_000,   // Dinas Kesehatan — puskesmas + rsud
  "2.03": 168_000_000_000,   // Dinas PUPR — infrastruktur terbesar
  "2.04": 38_000_000_000,    // Dinas Perumahan — pembangunan rumah
  "2.05": 45_000_000_000,    // Dinas Sosial — bantuan sosial
  "2.06": 62_000_000_000,    // Dinas Ketahanan Pangan & Pertanian — pertanian besar
  "2.07": 28_000_000_000,    // Dinas Lingkungan Hidup
  "2.08": 25_000_000_000,    // Dinas Kependudukan & Catatan Sipil
  "2.09": 48_000_000_000,    // Dinas Pemberdayaan Masyarakat & Desa — dana desa
  "2.10": 35_000_000_000,    // Dinas Perhubungan — jalan + transportasi
  "2.11": 22_000_000_000,    // Dinas Kominfo — IT + komunikasi
  "2.12": 20_000_000_000,    // Dinas DPMPTSP — perizinan
  "2.13": 32_000_000_000,    // Dinas Pemuda, Olahraga, Pariwisata & Kebudayaan
  "2.14": 12_000_000_000,    // Dinas Perpustakaan & Kearsipan — kecil
  "2.15": 42_000_000_000,    // Dinas Perikanan — potensi besar di Seruyan
  "2.16": 25_000_000_000,    // Dinas Koperasi, UKM, Perindustrian & Perdagangan
  "2.17": 18_000_000_000,    // Dinas Tenaga Kerja & Transmigrasi

  // Badan — support, anggaran menengah
  "3.01": 28_000_000_000,    // Bappeda — perencanaan
  "3.02": 52_000_000_000,    // BPKAD — keuangan & aset
  "3.03": 22_000_000_000,    // BKPSDM — kepegawaian
  "3.04": 15_000_000_000,    // BPBD — bencana (bisa naik saat darurat)
  "3.05": 10_000_000_000,    // Kesbangpol — kecil
  "3.06": 38_000_000_000,    // Bapenda — pendapatan daerah

  // Kecamatan — kecil, operasional
  "4.01": 18_000_000_000,    // Kec. Seruyan Hilir — ibukota kabupaten
  "4.02": 12_000_000_000,    // Kec. Seruyan Hilir Timur
  "4.03": 10_000_000_000,    // Kec. Danau Sembuluh
  "4.04": 8_000_000_000,     // Kec. Hanau
  "4.05": 11_000_000_000,    // Kec. Seruyan Raya
  "4.06": 8_500_000_000,     // Kec. Danau Seluluk
  "4.07": 9_000_000_000,     // Kec. Batu Ampar
  "4.08": 10_500_000_000,    // Kec. Seruyan Tengah
  "4.09": 12_000_000_000,    // Kec. Seruyan Hulu
  "4.10": 7_500_000_000,     // Kec. Suling Tambun
}

// Rentang persentase realisasi per OPD (realistis)
// OPD dengan belanja modal besar cenderung realisasi lebih rendah (keterlambatan proyek)
// OPD dengan belanja operasi (gaji) cenderung realisasi tinggi
const realisasiRange: Record<string, [number, number]> = {
  // Sekretariat — belanja operasi tinggi → realisasi tinggi
  "1.01": [88, 96],
  "1.02": [85, 94],
  "1.03": [82, 92],

  // Dinas — bervariasi
  "2.01": [90, 97],    // Pendidikan — gaji guru, realisasi tinggi
  "2.02": [88, 95],    // Kesehatan — operasional + obat
  "2.03": [62, 78],    // PUPR — banyak proyek modal, sering terlambat
  "2.04": [58, 75],    // Perumahan — proyek pembangunan
  "2.05": [80, 92],    // Sosial — bantuan sosial lancar
  "2.06": [72, 86],    // Pertanian — program musiman
  "2.07": [75, 88],    // LH — program terbatas
  "2.08": [92, 98],    // Disdukcapil — operasional jasa
  "2.09": [78, 90],    // Pemberdayaan Masyarakat — dana desa
  "2.10": [65, 80],    // Perhubungan — infrastruktur
  "2.11": [82, 93],    // Kominfo — IT
  "2.12": [85, 95],    // DPMPTSP — pelayanan
  "2.13": [70, 85],    // Pariwisata — event & promosi
  "2.14": [88, 96],    // Perpustakaan — operasional
  "2.15": [68, 82],    // Perikanan — program pengembangan
  "2.16": [75, 88],    // Koperasi — pembinaan
  "2.17": [80, 92],    // Naker — pelatihan

  // Badan
  "3.01": [78, 90],    // Bappeda — perencanaan
  "3.02": [85, 95],    // BPKAD — keuangan
  "3.03": [90, 97],    // BKPSDM — gaji + diklat
  "3.04": [55, 75],    // BPBD — tergantung bencana
  "3.05": [82, 93],    // Kesbangpol
  "3.06": [88, 96],    // Bapenda — pendapatan

  // Kecamatan — operasional kecil → realisasi tinggi
  "4.01": [90, 97],
  "4.02": [88, 95],
  "4.03": [85, 94],
  "4.04": [86, 95],
  "4.05": [87, 95],
  "4.06": [84, 93],
  "4.07": [85, 94],
  "4.08": [86, 95],
  "4.09": [88, 96],
  "4.10": [83, 92],
}

function realisasiFromAnggaran(anggaran: number, minPct: number, maxPct: number): number {
  const pct = minPct + Math.random() * (maxPct - minPct)
  return Math.round(anggaran * pct / 100)
}

async function main() {
  console.log("🌱 Seeding OPD & Akun data for Kabupaten Seruyan...")

  // Find or create an active TahunAnggaran
  let tahunAnggaran = await prisma.tahunAnggaran.findFirst({
    where: { aktif: true }
  })

  if (!tahunAnggaran) {
    tahunAnggaran = await prisma.tahunAnggaran.findFirst()
  }

  if (!tahunAnggaran) {
    tahunAnggaran = await prisma.tahunAnggaran.create({
      data: { tahun: 2025, aktif: true }
    })
    console.log(`📅 Created TahunAnggaran: ${tahunAnggaran.tahun} (aktif)`)
  } else {
    console.log(`📅 Using TahunAnggaran: ${tahunAnggaran.tahun}`)
  }

  // ==========================================
  // SEED OPD DATA
  // ==========================================
  const deletedOpd = await prisma.opd.deleteMany({
    where: { tahunAnggaranId: tahunAnggaran.id }
  })
  if (deletedOpd.count > 0) {
    console.log(`🗑️  Removed ${deletedOpd.count} old OPD records for TA ${tahunAnggaran.tahun}`)
  }

  let opdCreated = 0
  for (const opd of opdData) {
    await prisma.opd.create({
      data: {
        kodeOpd: opd.kodeOpd,
        namaOpd: opd.namaOpd,
        tahunAnggaranId: tahunAnggaran.id,
      }
    })
    opdCreated++
  }
  console.log(`✅ OPD seeding complete: ${opdCreated} created`)

  // ==========================================
  // SEED REALISASI SKPD (AKUN) DATA
  // ==========================================
  const deletedSkpd = await prisma.realisasiSkpd.deleteMany({
    where: { tahunAnggaranId: tahunAnggaran.id }
  })
  if (deletedSkpd.count > 0) {
    console.log(`🗑️  Removed ${deletedSkpd.count} old Realisasi SKPD records for TA ${tahunAnggaran.tahun}`)
  }

  // Also clean up old realisasi logs for this tahun anggaran
  const deletedLogs = await prisma.realisasiLog.deleteMany({
    where: { tahunAnggaranId: tahunAnggaran.id, sumberType: "RealisasiSkpd" }
  })
  if (deletedLogs.count > 0) {
    console.log(`🗑️  Removed ${deletedLogs.count} old RealisasiLog records for SKPD`)
  }

  let skpdCreated = 0
  let totalAnggaran = 0
  let totalRealisasi = 0

  for (const opd of opdData) {
    const anggaran = anggaranOpd[opd.kodeOpd] ?? 10_000_000_000
    const [minPct, maxPct] = realisasiRange[opd.kodeOpd] ?? [75, 90]
    const realisasi = realisasiFromAnggaran(anggaran, minPct, maxPct)
    const persentase = Math.round((realisasi / anggaran) * 10000) / 100

    const record = await prisma.realisasiSkpd.create({
      data: {
        tahunAnggaranId: tahunAnggaran.id,
        kodeSkpd: opd.kodeOpd,
        namaSkpd: opd.namaOpd,
        anggaran,
        realisasi,
        persentase,
        tanggalUpdate: new Date(),
      }
    })

    // Create initial log
    await prisma.realisasiLog.create({
      data: {
        sumberType: "RealisasiSkpd",
        sumberId: record.id,
        tahunAnggaranId: tahunAnggaran.id,
        kodeAkun: opd.kodeOpd,
        namaAkun: opd.namaOpd,
        kategori: null,
        anggaranSebelum: 0,
        anggaranSesudah: anggaran,
        realisasiSebelum: 0,
        realisasiSesudah: realisasi,
        tanggalPerubahan: new Date(),
      }
    }).catch(() => {})

    totalAnggaran += anggaran
    totalRealisasi += realisasi
    skpdCreated++
  }

  console.log(`✅ Realisasi SKPD seeding complete: ${skpdCreated} created`)

  // ==========================================
  // SUMMARY
  // ==========================================
  const totalPersentase = totalAnggaran > 0
    ? Math.round((totalRealisasi / totalAnggaran) * 10000) / 100
    : 0

  console.log("")
  console.log("══════════════════════════════════════════════")
  console.log("📊 RINGKASAN DATA AKUN OPD / SKPD")
  console.log("══════════════════════════════════════════════")
  console.log(`📅 Tahun Anggaran : ${tahunAnggaran.tahun}`)
  console.log(`🏢 Total OPD      : ${opdCreated}`)
  console.log(`📋 Total Akun SKPD: ${skpdCreated}`)
  console.log(`💰 Total Anggaran : Rp ${totalAnggaran.toLocaleString("id-ID")}`)
  console.log(`📈 Total Realisasi: Rp ${totalRealisasi.toLocaleString("id-ID")}`)
  console.log(`📊 Persentase     : ${totalPersentase}%`)
  console.log("══════════════════════════════════════════════")

  // Breakdown per kelompok
  const groups = [
    { name: "Sekretariat & Inspektorat", codes: ["1.01", "1.02", "1.03"] },
    { name: "Dinas", codes: opdData.filter(o => o.kodeOpd.startsWith("2.")).map(o => o.kodeOpd) },
    { name: "Badan", codes: opdData.filter(o => o.kodeOpd.startsWith("3.")).map(o => o.kodeOpd) },
    { name: "Kecamatan", codes: opdData.filter(o => o.kodeOpd.startsWith("4.")).map(o => o.kodeOpd) },
  ]

  console.log("")
  for (const group of groups) {
    let grpAnggaran = 0
    let grpRealisasi = 0
    for (const code of group.codes) {
      grpAnggaran += anggaranOpd[code] ?? 0
      // Estimate realisasi from range midpoint
      const [min, max] = realisasiRange[code] ?? [75, 90]
      grpRealisasi += Math.round((anggaranOpd[code] ?? 0) * ((min + max) / 2) / 100)
    }
    const grpPct = grpAnggaran > 0 ? Math.round((grpRealisasi / grpAnggaran) * 10000) / 100 : 0
    console.log(`  ${group.name}:`)
    console.log(`    Anggaran  : Rp ${grpAnggaran.toLocaleString("id-ID")}`)
    console.log(`    Realisasi : Rp ${grpRealisasi.toLocaleString("id-ID")} (~${grpPct}%)`)
  }
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error("❌ Seed error:", e)
    await prisma.$disconnect()
    process.exit(1)
  })
