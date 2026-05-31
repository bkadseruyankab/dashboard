import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database for Pemerintah Kabupaten Seruyan...')

  // Clean existing data
  await prisma.realisasiSkpd.deleteMany()
  await prisma.realisasiAkun.deleteMany()
  await prisma.pembiayaan.deleteMany()
  await prisma.belanja.deleteMany()
  await prisma.pendapatan.deleteMany()
  await prisma.opd.deleteMany()
  await prisma.kategori.deleteMany()
  await prisma.tahunAnggaran.deleteMany()

  // ==========================================
  // KATEGORI (Categories for dynamic dropdowns)
  // ==========================================
  const kategoriData = [
    // Pendapatan categories
    { jenis: 'Pendapatan', namaKategori: 'PAD', kodeKategori: '4.1', urutan: 1, aktif: true },
    { jenis: 'Pendapatan', namaKategori: 'Transfer', kodeKategori: '4.2', urutan: 2, aktif: true },
    { jenis: 'Pendapatan', namaKategori: 'Lainnya', kodeKategori: '4.3', urutan: 3, aktif: true },

    // Belanja categories
    { jenis: 'Belanja', namaKategori: 'Operasi', kodeKategori: '5.1', urutan: 1, aktif: true },
    { jenis: 'Belanja', namaKategori: 'Modal', kodeKategori: '5.2', urutan: 2, aktif: true },
    { jenis: 'Belanja', namaKategori: 'Tak Terduga', kodeKategori: '5.3', urutan: 3, aktif: true },
    { jenis: 'Belanja', namaKategori: 'Transfer', kodeKategori: '5.4', urutan: 4, aktif: true },

    // Pembiayaan categories
    { jenis: 'Pembiayaan', namaKategori: 'Penerimaan', kodeKategori: '6.1', urutan: 1, aktif: true },
    { jenis: 'Pembiayaan', namaKategori: 'Pengeluaran', kodeKategori: '6.2', urutan: 2, aktif: true },

    // Realisasi Akun categories (jenis)
    { jenis: 'RealisasiAkun', namaKategori: 'Pendapatan', kodeKategori: null, urutan: 1, aktif: true },
    { jenis: 'RealisasiAkun', namaKategori: 'Belanja', kodeKategori: null, urutan: 2, aktif: true },
    { jenis: 'RealisasiAkun', namaKategori: 'Pembiayaan', kodeKategori: null, urutan: 3, aktif: true },
  ]

  for (const k of kategoriData) {
    await prisma.kategori.create({ data: k })
  }
  console.log('  Created Kategori data (13 categories)')

  // ==========================================
  // TAHUN ANGGARAN (Fiscal Years)
  // ==========================================
  const ta2022 = await prisma.tahunAnggaran.create({
    data: { tahun: 2022, aktif: false },
  })
  const ta2023 = await prisma.tahunAnggaran.create({
    data: { tahun: 2023, aktif: false },
  })
  const ta2024 = await prisma.tahunAnggaran.create({
    data: { tahun: 2024, aktif: true },
  })

  console.log('Created fiscal years: 2022, 2023, 2024')

  // ==========================================
  // Helper function
  // ==========================================
  function realisasiFromAnggaran(anggaran: number, minPct: number, maxPct: number): number {
    const pct = minPct + Math.random() * (maxPct - minPct)
    return Math.round(anggaran * pct / 100)
  }

  // ==========================================
  // PENDAPATAN DATA
  // ==========================================
  // Total APBD for Seruyan around 800-1200 billion IDR
  // Pendapatan roughly 70-80% of total APBD

  const pendapatanData: Record<number, Array<{ kodeAkun: string; namaAkun: string; kategori: string; anggaran: number; realisasiPct: [number, number] }>> = {
    2022: [
      // PAD (Pendapatan Asli Daerah) - ~10-12% of total pendapatan
      { kodeAkun: '4.1.1', namaAkun: 'Pajak Daerah', kategori: 'PAD', anggaran: 25_800_000_000, realisasiPct: [82, 92] },
      { kodeAkun: '4.1.2', namaAkun: 'Retribusi Daerah', kategori: 'PAD', anggaran: 18_500_000_000, realisasiPct: [85, 95] },
      { kodeAkun: '4.1.3', namaAkun: 'Hasil Pengelolaan Kekayaan Daerah', kategori: 'PAD', anggaran: 12_300_000_000, realisasiPct: [70, 85] },
      { kodeAkun: '4.1.4', namaAkun: 'Lain-lain PAD yang Sah', kategori: 'PAD', anggaran: 8_200_000_000, realisasiPct: [75, 88] },
      // Transfer - ~85% of total pendapatan
      { kodeAkun: '4.2.1', namaAkun: 'Dana Perimbangan', kategori: 'Transfer', anggaran: 625_000_000_000, realisasiPct: [90, 98] },
      { kodeAkun: '4.2.2', namaAkun: 'Dana Transfer Lainnya', kategori: 'Transfer', anggaran: 45_000_000_000, realisasiPct: [85, 95] },
      // Lainnya
      { kodeAkun: '4.3.1', namaAkun: 'Pendapatan Lain-lain', kategori: 'Lainnya', anggaran: 15_200_000_000, realisasiPct: [72, 86] },
    ],
    2023: [
      { kodeAkun: '4.1.1', namaAkun: 'Pajak Daerah', kategori: 'PAD', anggaran: 28_500_000_000, realisasiPct: [83, 93] },
      { kodeAkun: '4.1.2', namaAkun: 'Retribusi Daerah', kategori: 'PAD', anggaran: 19_800_000_000, realisasiPct: [86, 95] },
      { kodeAkun: '4.1.3', namaAkun: 'Hasil Pengelolaan Kekayaan Daerah', kategori: 'PAD', anggaran: 13_100_000_000, realisasiPct: [72, 87] },
      { kodeAkun: '4.1.4', namaAkun: 'Lain-lain PAD yang Sah', kategori: 'PAD', anggaran: 9_500_000_000, realisasiPct: [76, 89] },
      { kodeAkun: '4.2.1', namaAkun: 'Dana Perimbangan', kategori: 'Transfer', anggaran: 680_000_000_000, realisasiPct: [91, 98] },
      { kodeAkun: '4.2.2', namaAkun: 'Dana Transfer Lainnya', kategori: 'Transfer', anggaran: 48_500_000_000, realisasiPct: [86, 96] },
      { kodeAkun: '4.3.1', namaAkun: 'Pendapatan Lain-lain', kategori: 'Lainnya', anggaran: 16_800_000_000, realisasiPct: [74, 88] },
    ],
    2024: [
      { kodeAkun: '4.1.1', namaAkun: 'Pajak Daerah', kategori: 'PAD', anggaran: 31_200_000_000, realisasiPct: [80, 92] },
      { kodeAkun: '4.1.2', namaAkun: 'Retribusi Daerah', kategori: 'PAD', anggaran: 21_500_000_000, realisasiPct: [84, 94] },
      { kodeAkun: '4.1.3', namaAkun: 'Hasil Pengelolaan Kekayaan Daerah', kategori: 'PAD', anggaran: 14_200_000_000, realisasiPct: [68, 84] },
      { kodeAkun: '4.1.4', namaAkun: 'Lain-lain PAD yang Sah', kategori: 'PAD', anggaran: 10_800_000_000, realisasiPct: [73, 87] },
      { kodeAkun: '4.2.1', namaAkun: 'Dana Perimbangan', kategori: 'Transfer', anggaran: 735_000_000_000, realisasiPct: [88, 97] },
      { kodeAkun: '4.2.2', namaAkun: 'Dana Transfer Lainnya', kategori: 'Transfer', anggaran: 52_000_000_000, realisasiPct: [83, 94] },
      { kodeAkun: '4.3.1', namaAkun: 'Pendapatan Lain-lain', kategori: 'Lainnya', anggaran: 18_500_000_000, realisasiPct: [70, 85] },
    ],
  }

  const taMap: Record<number, string> = {
    2022: ta2022.id,
    2023: ta2023.id,
    2024: ta2024.id,
  }

  for (const [tahun, items] of Object.entries(pendapatanData)) {
    for (const item of items) {
      const realisasi = realisasiFromAnggaran(item.anggaran, item.realisasiPct[0], item.realisasiPct[1])
      await prisma.pendapatan.create({
        data: {
          tahunAnggaranId: taMap[Number(tahun)],
          kodeAkun: item.kodeAkun,
          namaAkun: item.namaAkun,
          kategori: item.kategori,
          anggaran: item.anggaran,
          realisasi,
        },
      })
    }
    console.log(`  Created Pendapatan data for ${tahun}`)
  }

  // ==========================================
  // BELANJA DATA
  // ==========================================
  const belanjaData: Record<number, Array<{ kodeAkun: string; namaAkun: string; kategori: string; anggaran: number; realisasiPct: [number, number] }>> = {
    2022: [
      // Belanja Operasi
      { kodeAkun: '5.1.1', namaAkun: 'Belanja Pegawai', kategori: 'Operasi', anggaran: 285_000_000_000, realisasiPct: [92, 99] },
      { kodeAkun: '5.1.2', namaAkun: 'Belanja Barang dan Jasa', kategori: 'Operasi', anggaran: 85_000_000_000, realisasiPct: [80, 92] },
      { kodeAkun: '5.1.3', namaAkun: 'Belanja Modal Tanah', kategori: 'Operasi', anggaran: 5_500_000_000, realisasiPct: [60, 80] },
      { kodeAkun: '5.1.4', namaAkun: 'Belanja Bunga', kategori: 'Operasi', anggaran: 2_800_000_000, realisasiPct: [88, 98] },
      { kodeAkun: '5.1.5', namaAkun: 'Belanja Subsidi', kategori: 'Operasi', anggaran: 8_500_000_000, realisasiPct: [75, 90] },
      { kodeAkun: '5.1.6', namaAkun: 'Belanja Hibah', kategori: 'Operasi', anggaran: 12_000_000_000, realisasiPct: [70, 88] },
      { kodeAkun: '5.1.7', namaAkun: 'Belanja Bantuan Sosial', kategori: 'Operasi', anggaran: 18_500_000_000, realisasiPct: [82, 94] },
      // Belanja Modal
      { kodeAkun: '5.2.1', namaAkun: 'Belanja Modal Tanah', kategori: 'Modal', anggaran: 15_000_000_000, realisasiPct: [55, 75] },
      { kodeAkun: '5.2.2', namaAkun: 'Belanja Modal Peralatan dan Mesin', kategori: 'Modal', anggaran: 28_000_000_000, realisasiPct: [65, 82] },
      { kodeAkun: '5.2.3', namaAkun: 'Belanja Modal Gedung dan Bangunan', kategori: 'Modal', anggaran: 42_000_000_000, realisasiPct: [60, 78] },
      { kodeAkun: '5.2.4', namaAkun: 'Belanja Modal Jalan, Jaringan, dan Irigasi', kategori: 'Modal', anggaran: 55_000_000_000, realisasiPct: [58, 76] },
      { kodeAkun: '5.2.5', namaAkun: 'Belanja Modal Aset Tetap Lainnya', kategori: 'Modal', anggaran: 8_500_000_000, realisasiPct: [62, 80] },
      // Belanja Tak Terduga
      { kodeAkun: '5.3.1', namaAkun: 'Belanja Tak Terduga', kategori: 'Tak Terduga', anggaran: 12_000_000_000, realisasiPct: [30, 60] },
      // Belanja Transfer
      { kodeAkun: '5.4.1', namaAkun: 'Belanja Transfer', kategori: 'Transfer', anggaran: 95_000_000_000, realisasiPct: [85, 96] },
    ],
    2023: [
      { kodeAkun: '5.1.1', namaAkun: 'Belanja Pegawai', kategori: 'Operasi', anggaran: 305_000_000_000, realisasiPct: [93, 99] },
      { kodeAkun: '5.1.2', namaAkun: 'Belanja Barang dan Jasa', kategori: 'Operasi', anggaran: 92_000_000_000, realisasiPct: [81, 93] },
      { kodeAkun: '5.1.3', namaAkun: 'Belanja Modal Tanah', kategori: 'Operasi', anggaran: 6_200_000_000, realisasiPct: [58, 78] },
      { kodeAkun: '5.1.4', namaAkun: 'Belanja Bunga', kategori: 'Operasi', anggaran: 3_100_000_000, realisasiPct: [89, 98] },
      { kodeAkun: '5.1.5', namaAkun: 'Belanja Subsidi', kategori: 'Operasi', anggaran: 9_200_000_000, realisasiPct: [76, 91] },
      { kodeAkun: '5.1.6', namaAkun: 'Belanja Hibah', kategori: 'Operasi', anggaran: 13_500_000_000, realisasiPct: [71, 89] },
      { kodeAkun: '5.1.7', namaAkun: 'Belanja Bantuan Sosial', kategori: 'Operasi', anggaran: 20_800_000_000, realisasiPct: [83, 95] },
      { kodeAkun: '5.2.1', namaAkun: 'Belanja Modal Tanah', kategori: 'Modal', anggaran: 16_500_000_000, realisasiPct: [56, 76] },
      { kodeAkun: '5.2.2', namaAkun: 'Belanja Modal Peralatan dan Mesin', kategori: 'Modal', anggaran: 30_000_000_000, realisasiPct: [66, 83] },
      { kodeAkun: '5.2.3', namaAkun: 'Belanja Modal Gedung dan Bangunan', kategori: 'Modal', anggaran: 46_500_000_000, realisasiPct: [61, 79] },
      { kodeAkun: '5.2.4', namaAkun: 'Belanja Modal Jalan, Jaringan, dan Irigasi', kategori: 'Modal', anggaran: 62_000_000_000, realisasiPct: [59, 77] },
      { kodeAkun: '5.2.5', namaAkun: 'Belanja Modal Aset Tetap Lainnya', kategori: 'Modal', anggaran: 9_800_000_000, realisasiPct: [63, 81] },
      { kodeAkun: '5.3.1', namaAkun: 'Belanja Tak Terduga', kategori: 'Tak Terduga', anggaran: 13_500_000_000, realisasiPct: [28, 55] },
      { kodeAkun: '5.4.1', namaAkun: 'Belanja Transfer', kategori: 'Transfer', anggaran: 102_000_000_000, realisasiPct: [86, 97] },
    ],
    2024: [
      { kodeAkun: '5.1.1', namaAkun: 'Belanja Pegawai', kategori: 'Operasi', anggaran: 328_000_000_000, realisasiPct: [91, 98] },
      { kodeAkun: '5.1.2', namaAkun: 'Belanja Barang dan Jasa', kategori: 'Operasi', anggaran: 98_500_000_000, realisasiPct: [78, 91] },
      { kodeAkun: '5.1.3', namaAkun: 'Belanja Modal Tanah', kategori: 'Operasi', anggaran: 7_000_000_000, realisasiPct: [55, 75] },
      { kodeAkun: '5.1.4', namaAkun: 'Belanja Bunga', kategori: 'Operasi', anggaran: 3_500_000_000, realisasiPct: [87, 97] },
      { kodeAkun: '5.1.5', namaAkun: 'Belanja Subsidi', kategori: 'Operasi', anggaran: 10_500_000_000, realisasiPct: [74, 90] },
      { kodeAkun: '5.1.6', namaAkun: 'Belanja Hibah', kategori: 'Operasi', anggaran: 15_000_000_000, realisasiPct: [68, 86] },
      { kodeAkun: '5.1.7', namaAkun: 'Belanja Bantuan Sosial', kategori: 'Operasi', anggaran: 23_000_000_000, realisasiPct: [80, 93] },
      { kodeAkun: '5.2.1', namaAkun: 'Belanja Modal Tanah', kategori: 'Modal', anggaran: 18_000_000_000, realisasiPct: [52, 72] },
      { kodeAkun: '5.2.2', namaAkun: 'Belanja Modal Peralatan dan Mesin', kategori: 'Modal', anggaran: 33_000_000_000, realisasiPct: [64, 82] },
      { kodeAkun: '5.2.3', namaAkun: 'Belanja Modal Gedung dan Bangunan', kategori: 'Modal', anggaran: 52_000_000_000, realisasiPct: [58, 76] },
      { kodeAkun: '5.2.4', namaAkun: 'Belanja Modal Jalan, Jaringan, dan Irigasi', kategori: 'Modal', anggaran: 68_000_000_000, realisasiPct: [55, 73] },
      { kodeAkun: '5.2.5', namaAkun: 'Belanja Modal Aset Tetap Lainnya', kategori: 'Modal', anggaran: 11_000_000_000, realisasiPct: [60, 78] },
      { kodeAkun: '5.3.1', namaAkun: 'Belanja Tak Terduga', kategori: 'Tak Terduga', anggaran: 15_000_000_000, realisasiPct: [25, 50] },
      { kodeAkun: '5.4.1', namaAkun: 'Belanja Transfer', kategori: 'Transfer', anggaran: 110_000_000_000, realisasiPct: [84, 95] },
    ],
  }

  for (const [tahun, items] of Object.entries(belanjaData)) {
    for (const item of items) {
      const realisasi = realisasiFromAnggaran(item.anggaran, item.realisasiPct[0], item.realisasiPct[1])
      await prisma.belanja.create({
        data: {
          tahunAnggaranId: taMap[Number(tahun)],
          kodeAkun: item.kodeAkun,
          namaAkun: item.namaAkun,
          kategori: item.kategori,
          anggaran: item.anggaran,
          realisasi,
        },
      })
    }
    console.log(`  Created Belanja data for ${tahun}`)
  }

  // ==========================================
  // PEMBIAYAAN DATA
  // ==========================================
  const pembiayaanData: Record<number, Array<{ kodeAkun: string; namaAkun: string; kategori: string; anggaran: number; realisasiPct: [number, number] }>> = {
    2022: [
      { kodeAkun: '6.1.1', namaAkun: 'Sisa Lebih Perhitungan Anggaran', kategori: 'Penerimaan', anggaran: 35_000_000_000, realisasiPct: [85, 98] },
      { kodeAkun: '6.1.2', namaAkun: 'Penerimaan Pinjaman Daerah', kategori: 'Penerimaan', anggaran: 15_000_000_000, realisasiPct: [80, 95] },
      { kodeAkun: '6.1.3', namaAkun: 'Penerimaan Hasil Pengelolaan Aset', kategori: 'Penerimaan', anggaran: 8_000_000_000, realisasiPct: [70, 88] },
      { kodeAkun: '6.2.1', namaAkun: 'Penyertaan Modal Pemerintah Daerah', kategori: 'Pengeluaran', anggaran: 12_000_000_000, realisasiPct: [75, 90] },
      { kodeAkun: '6.2.2', namaAkun: 'Pembayaran Pokok Utang', kategori: 'Pengeluaran', anggaran: 18_500_000_000, realisasiPct: [90, 99] },
      { kodeAkun: '6.2.3', namaAkun: 'Pengeluaran Bantuan Luar Negeri', kategori: 'Pengeluaran', anggaran: 2_500_000_000, realisasiPct: [65, 85] },
    ],
    2023: [
      { kodeAkun: '6.1.1', namaAkun: 'Sisa Lebih Perhitungan Anggaran', kategori: 'Penerimaan', anggaran: 38_500_000_000, realisasiPct: [86, 98] },
      { kodeAkun: '6.1.2', namaAkun: 'Penerimaan Pinjaman Daerah', kategori: 'Penerimaan', anggaran: 16_500_000_000, realisasiPct: [82, 96] },
      { kodeAkun: '6.1.3', namaAkun: 'Penerimaan Hasil Pengelolaan Aset', kategori: 'Penerimaan', anggaran: 9_200_000_000, realisasiPct: [72, 89] },
      { kodeAkun: '6.2.1', namaAkun: 'Penyertaan Modal Pemerintah Daerah', kategori: 'Pengeluaran', anggaran: 13_500_000_000, realisasiPct: [76, 91] },
      { kodeAkun: '6.2.2', namaAkun: 'Pembayaran Pokok Utang', kategori: 'Pengeluaran', anggaran: 20_000_000_000, realisasiPct: [91, 99] },
      { kodeAkun: '6.2.3', namaAkun: 'Pengeluaran Bantuan Luar Negeri', kategori: 'Pengeluaran', anggaran: 3_000_000_000, realisasiPct: [66, 86] },
    ],
    2024: [
      { kodeAkun: '6.1.1', namaAkun: 'Sisa Lebih Perhitungan Anggaran', kategori: 'Penerimaan', anggaran: 42_000_000_000, realisasiPct: [84, 97] },
      { kodeAkun: '6.1.2', namaAkun: 'Penerimaan Pinjaman Daerah', kategori: 'Penerimaan', anggaran: 18_000_000_000, realisasiPct: [80, 95] },
      { kodeAkun: '6.1.3', namaAkun: 'Penerimaan Hasil Pengelolaan Aset', kategori: 'Penerimaan', anggaran: 10_500_000_000, realisasiPct: [68, 87] },
      { kodeAkun: '6.2.1', namaAkun: 'Penyertaan Modal Pemerintah Daerah', kategori: 'Pengeluaran', anggaran: 15_000_000_000, realisasiPct: [73, 89] },
      { kodeAkun: '6.2.2', namaAkun: 'Pembayaran Pokok Utang', kategori: 'Pengeluaran', anggaran: 22_000_000_000, realisasiPct: [89, 98] },
      { kodeAkun: '6.2.3', namaAkun: 'Pengeluaran Bantuan Luar Negeri', kategori: 'Pengeluaran', anggaran: 3_500_000_000, realisasiPct: [62, 82] },
    ],
  }

  for (const [tahun, items] of Object.entries(pembiayaanData)) {
    for (const item of items) {
      const realisasi = realisasiFromAnggaran(item.anggaran, item.realisasiPct[0], item.realisasiPct[1])
      await prisma.pembiayaan.create({
        data: {
          tahunAnggaranId: taMap[Number(tahun)],
          kodeAkun: item.kodeAkun,
          namaAkun: item.namaAkun,
          kategori: item.kategori,
          anggaran: item.anggaran,
          realisasi,
        },
      })
    }
    console.log(`  Created Pembiayaan data for ${tahun}`)
  }

  // ==========================================
  // REALISASI AKUN DATA
  // ==========================================
  // Aggregated per-account realization for each year
  const realisasiAkunData: Record<number, Array<{ kodeAkun: string; namaAkun: string; jenis: string; anggaran: number; realisasiPct: [number, number] }>> = {
    2022: [
      { kodeAkun: '4.1', namaAkun: 'Pendapatan Asli Daerah (PAD)', jenis: 'Pendapatan', anggaran: 64_800_000_000, realisasiPct: [78, 90] },
      { kodeAkun: '4.2', namaAkun: 'Dana Transfer', jenis: 'Pendapatan', anggaran: 670_000_000_000, realisasiPct: [89, 97] },
      { kodeAkun: '4.3', namaAkun: 'Pendapatan Lain-lain', jenis: 'Pendapatan', anggaran: 15_200_000_000, realisasiPct: [72, 86] },
      { kodeAkun: '5.1', namaAkun: 'Belanja Operasi', jenis: 'Belanja', anggaran: 417_300_000_000, realisasiPct: [85, 95] },
      { kodeAkun: '5.2', namaAkun: 'Belanja Modal', jenis: 'Belanja', anggaran: 148_500_000_000, realisasiPct: [60, 78] },
      { kodeAkun: '5.3', namaAkun: 'Belanja Tak Terduga', jenis: 'Belanja', anggaran: 12_000_000_000, realisasiPct: [30, 60] },
      { kodeAkun: '5.4', namaAkun: 'Belanja Transfer', jenis: 'Belanja', anggaran: 95_000_000_000, realisasiPct: [85, 96] },
      { kodeAkun: '6.1', namaAkun: 'Penerimaan Pembiayaan', jenis: 'Pembiayaan', anggaran: 58_000_000_000, realisasiPct: [82, 95] },
      { kodeAkun: '6.2', namaAkun: 'Pengeluaran Pembiayaan', jenis: 'Pembiayaan', anggaran: 33_000_000_000, realisasiPct: [80, 94] },
    ],
    2023: [
      { kodeAkun: '4.1', namaAkun: 'Pendapatan Asli Daerah (PAD)', jenis: 'Pendapatan', anggaran: 70_900_000_000, realisasiPct: [80, 92] },
      { kodeAkun: '4.2', namaAkun: 'Dana Transfer', jenis: 'Pendapatan', anggaran: 728_500_000_000, realisasiPct: [90, 98] },
      { kodeAkun: '4.3', namaAkun: 'Pendapatan Lain-lain', jenis: 'Pendapatan', anggaran: 16_800_000_000, realisasiPct: [74, 88] },
      { kodeAkun: '5.1', namaAkun: 'Belanja Operasi', jenis: 'Belanja', anggaran: 450_300_000_000, realisasiPct: [86, 96] },
      { kodeAkun: '5.2', namaAkun: 'Belanja Modal', jenis: 'Belanja', anggaran: 164_800_000_000, realisasiPct: [61, 79] },
      { kodeAkun: '5.3', namaAkun: 'Belanja Tak Terduga', jenis: 'Belanja', anggaran: 13_500_000_000, realisasiPct: [28, 55] },
      { kodeAkun: '5.4', namaAkun: 'Belanja Transfer', jenis: 'Belanja', anggaran: 102_000_000_000, realisasiPct: [86, 97] },
      { kodeAkun: '6.1', namaAkun: 'Penerimaan Pembiayaan', jenis: 'Pembiayaan', anggaran: 64_200_000_000, realisasiPct: [83, 96] },
      { kodeAkun: '6.2', namaAkun: 'Pengeluaran Pembiayaan', jenis: 'Pembiayaan', anggaran: 36_500_000_000, realisasiPct: [81, 95] },
    ],
    2024: [
      { kodeAkun: '4.1', namaAkun: 'Pendapatan Asli Daerah (PAD)', jenis: 'Pendapatan', anggaran: 77_700_000_000, realisasiPct: [77, 89] },
      { kodeAkun: '4.2', namaAkun: 'Dana Transfer', jenis: 'Pendapatan', anggaran: 787_000_000_000, realisasiPct: [88, 97] },
      { kodeAkun: '4.3', namaAkun: 'Pendapatan Lain-lain', jenis: 'Pendapatan', anggaran: 18_500_000_000, realisasiPct: [70, 85] },
      { kodeAkun: '5.1', namaAkun: 'Belanja Operasi', jenis: 'Belanja', anggaran: 485_500_000_000, realisasiPct: [84, 94] },
      { kodeAkun: '5.2', namaAkun: 'Belanja Modal', jenis: 'Belanja', anggaran: 182_000_000_000, realisasiPct: [58, 76] },
      { kodeAkun: '5.3', namaAkun: 'Belanja Tak Terduga', jenis: 'Belanja', anggaran: 15_000_000_000, realisasiPct: [25, 50] },
      { kodeAkun: '5.4', namaAkun: 'Belanja Transfer', jenis: 'Belanja', anggaran: 110_000_000_000, realisasiPct: [84, 95] },
      { kodeAkun: '6.1', namaAkun: 'Penerimaan Pembiayaan', jenis: 'Pembiayaan', anggaran: 70_500_000_000, realisasiPct: [80, 94] },
      { kodeAkun: '6.2', namaAkun: 'Pengeluaran Pembiayaan', jenis: 'Pembiayaan', anggaran: 40_500_000_000, realisasiPct: [78, 93] },
    ],
  }

  for (const [tahun, items] of Object.entries(realisasiAkunData)) {
    for (const item of items) {
      const realisasi = realisasiFromAnggaran(item.anggaran, item.realisasiPct[0], item.realisasiPct[1])
      const persentase = Math.round((realisasi / item.anggaran) * 10000) / 100
      await prisma.realisasiAkun.create({
        data: {
          tahunAnggaranId: taMap[Number(tahun)],
          kodeAkun: item.kodeAkun,
          namaAkun: item.namaAkun,
          jenis: item.jenis,
          anggaran: item.anggaran,
          realisasi,
          persentase,
        },
      })
    }
    console.log(`  Created Realisasi Akun data for ${tahun}`)
  }

  // ==========================================
  // OPD (Organisasi Perangkat Daerah) DATA
  // ==========================================
  const opdList = [
    // Sekretariat & Inspektorat
    { kode: '1.01', nama: 'Sekretariat Daerah', kepala: 'H. Sudarsono, S.Sos, M.Si', alamat: 'Jl. Trans Kalimantan No. 1', telepon: '(0513) 21001', email: 'setda@seruyankab.go.id' },
    { kode: '1.02', nama: 'Sekretariat DPRD', kepala: 'Hj. Siti Aminah, S.Sos', alamat: 'Jl. Trans Kalimantan No. 2', telepon: '(0513) 21002', email: 'sekdprd@seruyankab.go.id' },
    { kode: '1.03', nama: 'Inspektorat Daerah', kepala: 'Drs. H. Mulyadi, M.M', alamat: 'Jl. Inspektorat No. 1', telepon: '(0513) 21003', email: 'inspektorat@seruyankab.go.id' },
    // Dinas
    { kode: '2.01', nama: 'Dinas Pendidikan', kepala: 'Dra. Hj. Ratna Dewi, M.Pd', alamat: 'Jl. Pendidikan No. 1', telepon: '(0513) 21004', email: 'disdik@seruyankab.go.id' },
    { kode: '2.02', nama: 'Dinas Kesehatan', kepala: 'dr. H. Ahmad Fauzi, M.Kes', alamat: 'Jl. Kesehatan No. 2', telepon: '(0513) 21005', email: 'dinkes@seruyankab.go.id' },
    { kode: '2.03', nama: 'Dinas Pekerjaan Umum dan Penataan Ruang', kepala: 'Ir. H. Bambang, MT', alamat: 'Jl. PUPR No. 1', telepon: '(0513) 21006', email: 'pupr@seruyankab.go.id' },
    { kode: '2.04', nama: 'Dinas Perumahan Rakyat dan Kawasan Permukiman', kepala: 'Ir. Hj. Susilowati, M.T', alamat: 'Jl. Perumahan No. 1', telepon: '(0513) 21007', email: 'disperkim@seruyankab.go.id' },
    { kode: '2.05', nama: 'Dinas Sosial', kepala: 'Hj. Nurhasanah, S.Sos', alamat: 'Jl. Sosial No. 1', telepon: '(0513) 21008', email: 'dinsos@seruyankab.go.id' },
    { kode: '2.06', nama: 'Dinas Ketahanan Pangan dan Pertanian', kepala: 'Ir. H. Tani, M.Si', alamat: 'Jl. Pertanian No. 1', telepon: '(0513) 21009', email: 'dispertani@seruyankab.go.id' },
    { kode: '2.07', nama: 'Dinas Lingkungan Hidup', kepala: 'Ir. Hj. Lestari, M.Sc', alamat: 'Jl. Lingkungan No. 1', telepon: '(0513) 21010', email: 'dlh@seruyankab.go.id' },
    { kode: '2.08', nama: 'Dinas Kependudukan dan Pencatatan Sipil', kepala: 'H. M. Rizki, S.H', alamat: 'Jl. Disdukcapil No. 1', telepon: '(0513) 21011', email: 'disdukcapil@seruyankab.go.id' },
    { kode: '2.09', nama: 'Dinas Pemberdayaan Masyarakat dan Desa', kepala: 'H. Sudirman, S.Sos, M.M', alamat: 'Jl. PMD No. 1', telepon: '(0513) 21012', email: 'dispmd@seruyankab.go.id' },
    { kode: '2.10', nama: 'Dinas Perhubungan', kepala: 'Ir. H. Trans, M.T', alamat: 'Jl. Perhubungan No. 1', telepon: '(0513) 21013', email: 'dishub@seruyankab.go.id' },
    { kode: '2.11', nama: 'Dinas Komunikasi dan Informatika', kepala: 'H. Teknologi, S.Kom', alamat: 'Jl. Diskominfo No. 1', telepon: '(0513) 21014', email: 'diskominfo@seruyankab.go.id' },
    { kode: '2.12', nama: 'Dinas Penanaman Modal dan Pelayanan Terpadu Satu Pintu', kepala: 'H. Pelayanan, S.H', alamat: 'Jl. DPMPTSP No. 1', telepon: '(0513) 21015', email: 'dpmptsp@seruyankab.go.id' },
    { kode: '2.13', nama: 'Dinas Pemuda, Olahraga, Pariwisata dan Kebudayaan', kepala: 'H. Olahraga, S.Pd', alamat: 'Jl. Pariwisata No. 1', telepon: '(0513) 21016', email: 'disporaparbud@seruyankab.go.id' },
    { kode: '2.14', nama: 'Dinas Perpustakaan dan Kearsipan', kepala: 'Hj. Arsip, S.IP', alamat: 'Jl. Perpustakaan No. 1', telepon: '(0513) 21017', email: 'dispusip@seruyankab.go.id' },
    { kode: '2.15', nama: 'Dinas Perikanan', kepala: 'Ir. H. Perikanan, M.Si', alamat: 'Jl. Perikanan No. 1', telepon: '(0513) 21018', email: 'diskan@seruyankab.go.id' },
    { kode: '2.16', nama: 'Dinas Koperasi, UKM, Perindustrian dan Perdagangan', kepala: 'H. Koperasi, S.E', alamat: 'Jl. Koperasi No. 1', telepon: '(0513) 21019', email: 'diskopumkm@seruyankab.go.id' },
    { kode: '2.17', nama: 'Dinas Tenaga Kerja dan Transmigrasi', kepala: 'H. Naker, S.Sos', alamat: 'Jl. Nakertrans No. 1', telepon: '(0513) 21020', email: 'disnakertrans@seruyankab.go.id' },
    // Badan
    { kode: '3.01', nama: 'Badan Perencanaan Pembangunan Daerah, Penelitian dan Pengembangan', kepala: 'Drs. H. Sudirman, M.M', alamat: 'Jl. Trans Kalimantan No. 3', telepon: '(0513) 21021', email: 'bappeda@seruyankab.go.id' },
    { kode: '3.02', nama: 'Badan Pengelolaan Keuangan dan Aset Daerah', kepala: 'Ir. H. Rahmat, M.Si', alamat: 'Jl. Trans Kalimantan No. 4', telepon: '(0513) 21022', email: 'bpkad@seruyankab.go.id' },
    { kode: '3.03', nama: 'Badan Kepegawaian dan Pengembangan SDM', kepala: 'H. Kepegawaian, S.AP', alamat: 'Jl. BKPSDM No. 1', telepon: '(0513) 21023', email: 'bkpsdm@seruyankab.go.id' },
    { kode: '3.04', nama: 'Badan Penanggulangan Bencana Daerah', kepala: 'H. Bencana, S.Sos', alamat: 'Jl. BPBD No. 1', telepon: '(0513) 21024', email: 'bpbd@seruyankab.go.id' },
    { kode: '3.05', nama: 'Badan Kesatuan Bangsa dan Politik', kepala: 'H. Politik, S.IP', alamat: 'Jl. Kesbangpol No. 1', telepon: '(0513) 21025', email: 'kesbangpol@seruyankab.go.id' },
    { kode: '3.06', nama: 'Badan Pendapatan Daerah', kepala: 'H. Pendapatan, S.E', alamat: 'Jl. Bapenda No. 1', telepon: '(0513) 21026', email: 'bapenda@seruyankab.go.id' },
    // Kecamatan
    { kode: '4.01', nama: 'Kecamatan Seruyan Hilir', kepala: 'H. Camat Hilir, S.Sos', alamat: 'Kec. Seruyan Hilir', telepon: '(0513) 21027', email: 'kec-hilir@seruyankab.go.id' },
    { kode: '4.02', nama: 'Kecamatan Seruyan Hilir Timur', kepala: 'H. Camat Hilir Timur, S.Sos', alamat: 'Kec. Seruyan Hilir Timur', telepon: '(0513) 21028', email: 'kec-hilirtimur@seruyankab.go.id' },
    { kode: '4.03', nama: 'Kecamatan Danau Sembuluh', kepala: 'H. Camat Danau Sembuluh, S.Sos', alamat: 'Kec. Danau Sembuluh', telepon: '(0513) 21029', email: 'kec-danasembuluh@seruyankab.go.id' },
    { kode: '4.04', nama: 'Kecamatan Hanau', kepala: 'H. Camat Hanau, S.Sos', alamat: 'Kec. Hanau', telepon: '(0513) 21030', email: 'kec-hanau@seruyankab.go.id' },
    { kode: '4.05', nama: 'Kecamatan Seruyan Raya', kepala: 'H. Camat Raya, S.Sos', alamat: 'Kec. Seruyan Raya', telepon: '(0513) 21031', email: 'kec-raya@seruyankab.go.id' },
    { kode: '4.06', nama: 'Kecamatan Danau Seluluk', kepala: 'H. Camat Seluluk, S.Sos', alamat: 'Kec. Danau Seluluk', telepon: '(0513) 21032', email: 'kec-seluluk@seruyankab.go.id' },
    { kode: '4.07', nama: 'Kecamatan Batu Ampar', kepala: 'H. Camat Batu Ampar, S.Sos', alamat: 'Kec. Batu Ampar', telepon: '(0513) 21033', email: 'kec-batuampar@seruyankab.go.id' },
    { kode: '4.08', nama: 'Kecamatan Seruyan Tengah', kepala: 'H. Camat Tengah, S.Sos', alamat: 'Kec. Seruyan Tengah', telepon: '(0513) 21034', email: 'kec-tengah@seruyankab.go.id' },
    { kode: '4.09', nama: 'Kecamatan Seruyan Hulu', kepala: 'H. Camat Hulu, S.Sos', alamat: 'Kec. Seruyan Hulu', telepon: '(0513) 21035', email: 'kec-hulu@seruyankab.go.id' },
    { kode: '4.10', nama: 'Kecamatan Suling Tambun', kepala: 'H. Camat Suling Tambun, S.Sos', alamat: 'Kec. Suling Tambun', telepon: '(0513) 21036', email: 'kec-sulingtambun@seruyankab.go.id' },
  ]

  for (const [tahun, taId] of Object.entries(taMap)) {
    for (const opd of opdList) {
      await prisma.opd.create({
        data: {
          tahunAnggaranId: taId,
          kodeOpd: opd.kode,
          namaOpd: opd.nama,
          kepalaOpd: opd.kepala,
          alamat: opd.alamat,
          telepon: opd.telepon,
          email: opd.email,
        },
      })
    }
    console.log(`  Created OPD data for ${tahun}`)
  }

  // ==========================================
  // REALISASI SKPD DATA
  // ==========================================
  const skpdList = [
    // Sekretariat & Inspektorat
    { kode: '1.01', nama: 'Sekretariat Daerah' },
    { kode: '1.02', nama: 'Sekretariat DPRD' },
    { kode: '1.03', nama: 'Inspektorat Daerah' },
    // Dinas
    { kode: '2.01', nama: 'Dinas Pendidikan' },
    { kode: '2.02', nama: 'Dinas Kesehatan' },
    { kode: '2.03', nama: 'Dinas Pekerjaan Umum dan Penataan Ruang' },
    { kode: '2.04', nama: 'Dinas Perumahan Rakyat dan Kawasan Permukiman' },
    { kode: '2.05', nama: 'Dinas Sosial' },
    { kode: '2.06', nama: 'Dinas Ketahanan Pangan dan Pertanian' },
    { kode: '2.07', nama: 'Dinas Lingkungan Hidup' },
    { kode: '2.08', nama: 'Dinas Kependudukan dan Pencatatan Sipil' },
    { kode: '2.09', nama: 'Dinas Pemberdayaan Masyarakat dan Desa' },
    { kode: '2.10', nama: 'Dinas Perhubungan' },
    { kode: '2.11', nama: 'Dinas Komunikasi dan Informatika' },
    { kode: '2.12', nama: 'Dinas Penanaman Modal dan Pelayanan Terpadu Satu Pintu' },
    { kode: '2.13', nama: 'Dinas Pemuda, Olahraga, Pariwisata dan Kebudayaan' },
    { kode: '2.14', nama: 'Dinas Perpustakaan dan Kearsipan' },
    { kode: '2.15', nama: 'Dinas Perikanan' },
    { kode: '2.16', nama: 'Dinas Koperasi, UKM, Perindustrian dan Perdagangan' },
    { kode: '2.17', nama: 'Dinas Tenaga Kerja dan Transmigrasi' },
    // Badan
    { kode: '3.01', nama: 'Badan Perencanaan Pembangunan Daerah, Penelitian dan Pengembangan' },
    { kode: '3.02', nama: 'Badan Pengelolaan Keuangan dan Aset Daerah' },
    { kode: '3.03', nama: 'Badan Kepegawaian dan Pengembangan SDM' },
    { kode: '3.04', nama: 'Badan Penanggulangan Bencana Daerah' },
    { kode: '3.05', nama: 'Badan Kesatuan Bangsa dan Politik' },
    { kode: '3.06', nama: 'Badan Pendapatan Daerah' },
    // Kecamatan
    { kode: '4.01', nama: 'Kecamatan Seruyan Hilir' },
    { kode: '4.02', nama: 'Kecamatan Seruyan Hilir Timur' },
    { kode: '4.03', nama: 'Kecamatan Danau Sembuluh' },
    { kode: '4.04', nama: 'Kecamatan Hanau' },
    { kode: '4.05', nama: 'Kecamatan Seruyan Raya' },
    { kode: '4.06', nama: 'Kecamatan Danau Seluluk' },
    { kode: '4.07', nama: 'Kecamatan Batu Ampar' },
    { kode: '4.08', nama: 'Kecamatan Seruyan Tengah' },
    { kode: '4.09', nama: 'Kecamatan Seruyan Hulu' },
    { kode: '4.10', nama: 'Kecamatan Suling Tambun' },
  ]

  // Budget allocation per SKPD varies - larger OPDs get more
  const skpdAnggaranBase: Record<string, number> = {
    '1.01': 35_000_000_000,   // Sekretariat Daerah
    '1.02': 18_000_000_000,   // Sekretariat DPRD
    '1.03': 12_000_000_000,   // Inspektorat Daerah
    '2.01': 125_000_000_000,  // Dinas Pendidikan
    '2.02': 98_000_000_000,   // Dinas Kesehatan
    '2.03': 145_000_000_000,  // Dinas PUPR
    '2.04': 32_000_000_000,   // Dinas Perumahan
    '2.05': 42_000_000_000,   // Dinas Sosial
    '2.06': 55_000_000_000,   // Dinas Ketahanan Pangan & Pertanian
    '2.07': 25_000_000_000,   // Dinas Lingkungan Hidup
    '2.08': 22_000_000_000,   // Dinas Kependudukan
    '2.09': 38_000_000_000,   // Dinas PMD
    '2.10': 28_000_000_000,   // Dinas Perhubungan
    '2.11': 18_000_000_000,   // Dinas Kominfo
    '2.12': 15_000_000_000,   // Dinas DPMPTSP
    '2.13': 22_000_000_000,   // Dinas Pemuda Olahraga Pariwisata
    '2.14': 8_000_000_000,    // Dinas Perpustakaan
    '2.15': 35_000_000_000,   // Dinas Perikanan
    '2.16': 20_000_000_000,   // Dinas Koperasi UKM
    '2.17': 16_000_000_000,   // Dinas Tenaga Kerja
    '3.01': 28_000_000_000,   // Bappeda
    '3.02': 45_000_000_000,   // BPKAD
    '3.03': 20_000_000_000,   // BKPSDM
    '3.04': 15_000_000_000,   // BPBD
    '3.05': 10_000_000_000,   // Kesbangpol
    '3.06': 35_000_000_000,   // Bapenda
    '4.01': 18_000_000_000,   // Kec. Seruyan Hilir
    '4.02': 12_000_000_000,   // Kec. Seruyan Hilir Timur
    '4.03': 10_000_000_000,   // Kec. Danau Sembuluh
    '4.04': 8_000_000_000,    // Kec. Hanau
    '4.05': 12_000_000_000,   // Kec. Seruyan Raya
    '4.06': 8_000_000_000,    // Kec. Danau Seluluk
    '4.07': 9_000_000_000,    // Kec. Batu Ampar
    '4.08': 10_000_000_000,   // Kec. Seruyan Tengah
    '4.09': 11_000_000_000,   // Kec. Seruyan Hulu
    '4.10': 7_000_000_000,    // Kec. Suling Tambun
  }

  const skpdRealisasiRange: Record<string, [number, number]> = {
    '1.01': [85, 95], '1.02': [80, 92], '1.03': [83, 94],
    '2.01': [88, 96], '2.02': [86, 95], '2.03': [65, 80],
    '2.04': [70, 85], '2.05': [80, 92], '2.06': [72, 85],
    '2.07': [75, 88], '2.08': [90, 98], '2.09': [78, 90],
    '2.10': [75, 88], '2.11': [82, 93], '2.12': [80, 92],
    '2.13': [72, 86], '2.14': [78, 90], '2.15': [70, 84],
    '2.16': [75, 88], '2.17': [80, 92],
    '3.01': [78, 90], '3.02': [85, 95], '3.03': [82, 93],
    '3.04': [65, 82], '3.05': [80, 92], '3.06': [85, 95],
    '4.01': [88, 96], '4.02': [86, 94], '4.03': [84, 93],
    '4.04': [85, 95], '4.05': [82, 92], '4.06': [83, 93],
    '4.07': [84, 94], '4.08': [82, 92], '4.09': [85, 95],
    '4.10': [80, 90],
  }

  const yearGrowthFactor: Record<number, number> = {
    2022: 0.92,
    2023: 1.0,
    2024: 1.08,
  }

  for (const [tahun, taId] of Object.entries(taMap)) {
    const growth = yearGrowthFactor[Number(tahun)]
    for (const skpd of skpdList) {
      const baseAnggaran = skpdAnggaranBase[skpd.kode]
      const anggaran = Math.round(baseAnggaran * growth)
      const [minPct, maxPct] = skpdRealisasiRange[skpd.kode]
      const realisasi = realisasiFromAnggaran(anggaran, minPct, maxPct)
      const persentase = Math.round((realisasi / anggaran) * 10000) / 100

      await prisma.realisasiSkpd.create({
        data: {
          tahunAnggaranId: taId,
          kodeSkpd: skpd.kode,
          namaSkpd: skpd.nama,
          anggaran,
          realisasi,
          persentase,
        },
      })
    }
    console.log(`  Created Realisasi SKPD data for ${tahun}`)
  }

  console.log('\n✅ Seeding completed successfully!')
  console.log('  - 13 Kategori (Pendapatan, Belanja, Pembiayaan, RealisasiAkun)')
  console.log('  - 3 Fiscal Years: 2022, 2023, 2024')
  console.log('  - Pendapatan: 7 accounts × 3 years')
  console.log('  - Belanja: 14 accounts × 3 years')
  console.log('  - Pembiayaan: 6 accounts × 3 years')
  console.log('  - Realisasi Akun: 9 accounts × 3 years')
  console.log('  - OPD: 36 organisations × 3 years')
  console.log('  - Realisasi SKPD: 36 OPD × 3 years')
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
