import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import * as XLSX from 'xlsx'

type JenisData = 'pendapatan' | 'belanja' | 'pembiayaan'

// GET /api/admin/import/template?jenis=pendapatan&format=xlsx
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const jenis = searchParams.get('jenis') as JenisData | null
    const format = searchParams.get('format') || 'xlsx' // default to xlsx

    if (!jenis || !['pendapatan', 'belanja', 'pembiayaan'].includes(jenis)) {
      return NextResponse.json(
        { error: 'jenis query parameter must be pendapatan, belanja, or pembiayaan' },
        { status: 400 }
      )
    }

    // Get available kategori for this jenis
    const kategoris = await db.kategori.findMany({
      where: { jenis: jenis.charAt(0).toUpperCase() + jenis.slice(1), aktif: true },
      orderBy: { urutan: 'asc' },
    })

    const kategoriList = kategoris.length > 0
      ? kategoris.map(k => k.namaKategori)
      : getDefaultKategoriList(jenis)

    // If CSV format requested, return CSV
    if (format === 'csv') {
      return generateCSV(jenis, kategoriList)
    }

    // Default: generate XLSX
    return generateXLSX(jenis, kategoriList)
  } catch (error) {
    console.error('GET template error:', error)
    return NextResponse.json({ error: 'Failed to generate template' }, { status: 500 })
  }
}

function getDefaultKategoriList(jenis: JenisData): string[] {
  switch (jenis) {
    case 'pendapatan': return ['PAD', 'Transfer', 'Lainnya']
    case 'belanja': return ['Operasi', 'Modal', 'Tak Terduga', 'Transfer']
    case 'pembiayaan': return ['Penerimaan', 'Pengeluaran']
  }
}

function generateCSV(jenis: JenisData, kategoriList: string[]) {
  const kategoriNames = kategoriList.join(', ')
  const header = 'Kode Akun,Nama Akun,Kategori,Anggaran,Realisasi'
  const exampleRows = getExampleRows(jenis)
  const comment = `# Template Import ${jenis.charAt(0).toUpperCase() + jenis.slice(1)}\n# Kategori tersedia: ${kategoriNames}\n# Anggaran & Realisasi: angka tanpa Rp. Mendukung koma desimal (contoh: 31500000000 atau 31.500.000.000,5). Nilai 0 juga dapat diimpor.\n# Gunakan titik-koma (;) sebagai pemisah jika angka mengandung koma desimal.\n#`
  const csv = `${comment}\n${header}\n${exampleRows}`

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="template_${jenis}.csv"`,
    },
  })
}

function generateXLSX(jenis: JenisData, kategoriList: string[]) {
  const jenisLabel = jenis.charAt(0).toUpperCase() + jenis.slice(1)
  const wb = XLSX.utils.book_new()

  // ====== Sheet 1: Template Data ======
  const headerRow = ['Kode Akun', 'Nama Akun', 'Kategori', 'Anggaran', 'Realisasi']
  const exampleData = getExampleDataArray(jenis)
  const emptyRows = Array.from({ length: 50 }, () => ['', '', '', '', ''])

  const wsData = [headerRow, ...exampleData, ...emptyRows]
  const ws = XLSX.utils.aoa_to_sheet(wsData)

  // Set column widths
  ws['!cols'] = [
    { wch: 15 }, // Kode Akun
    { wch: 35 }, // Nama Akun
    { wch: 20 }, // Kategori
    { wch: 22 }, // Anggaran
    { wch: 22 }, // Realisasi
  ]

  // Add data validation for Kategori column (column C)
  // We'll add a note about valid categories in the instruction sheet

  XLSX.utils.book_append_sheet(wb, ws, 'Template Data')

  // ====== Sheet 2: Petunjuk (Instructions) ======
  const instrData = [
    [`PETUNJUK IMPORT DATA ${jenisLabel.toUpperCase()}`],
    [''],
    ['Kolom yang harus diisi:'],
    ['Kode Akun', 'Kode akun/rekening (contoh: 1.01, 2.01, 3.01)'],
    ['Nama Akun', 'Nama akun/rekening (contoh: PAD, Belanja Operasi)'],
    ['Kategori', `Pilih salah satu: ${kategoriList.join(', ')}`],
    ['Anggaran', 'Nilai anggaran dalam Rupiah (tanpa Rp, mendukung koma desimal)'],
    ['Realisasi', 'Nilai realisasi dalam Rupiah (tanpa Rp, mendukung koma desimal)'],
    [''],
    ['CONTOH FORMAT ANGGARAN/REALISASI:'],
    ['Benar', '31500000000 (31,5 miliar, tanpa titik/koma)'],
    ['Benar', '31.500.000.000 (titik sebagai pemisah ribuan)'],
    ['Benar', '31.500.000.000,5 (koma desimal di belakang)'],
    ['Benar', '0 (nol juga bisa diimpor)'],
    ['Salah', 'Rp 31.500.000.000 (ada prefix Rp)'],
    [''],
    ['KATEGORI YANG TERSEDIA:'],
    ...kategoriList.map(k => [k]),
    [''],
    ['CATATAN:'],
    ['- Jangan mengubah header kolom pada baris pertama'],
    ['- Hapus contoh data sebelum mengisi data Anda'],
    ['- Pastikan Kategori sesuai dengan daftar di atas'],
    ['- Anggaran dan Realisasi bisa berupa angka 0 (nol)'],
    ['- Format mendukung koma (,) untuk desimal: 31500,5 artinya 31500.5'],
    ['- Titik (.) dianggap sebagai pemisah ribuan: 31.500.000 = 31500000'],
    ['- Simpan file dalam format .xlsx setelah selesai mengisi'],
  ]

  const wsInstr = XLSX.utils.aoa_to_sheet(instrData)
  wsInstr['!cols'] = [
    { wch: 25 },
    { wch: 55 },
  ]

  // Merge the title row
  wsInstr['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 1 } },
  ]

  XLSX.utils.book_append_sheet(wb, wsInstr, 'Petunjuk')

  // ====== Sheet 3: Referensi Kategori ======
  const katData = [
    ['Daftar Kategori yang Valid'],
    [''],
    ['Kategori'],
    ...kategoriList.map(k => [k]),
  ]

  const wsKat = XLSX.utils.aoa_to_sheet(katData)
  wsKat['!cols'] = [{ wch: 25 }]
  wsKat['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 0 } },
  ]

  XLSX.utils.book_append_sheet(wb, wsKat, 'Referensi Kategori')

  // Generate buffer
  const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' })

  return new NextResponse(buf, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="template_${jenis}.xlsx"`,
    },
  })
}

function getExampleRows(jenis: JenisData): string {
  switch (jenis) {
    case 'pendapatan':
      return '1.01,Pendapatan Asli Daerah,PAD,31500000000,28000000000\n1.02,Dana Transfer,Transfer,52000000000,48000000000\n1.03,Pendapatan Lainnya,Lainnya,0,0'
    case 'belanja':
      return '2.01,Belanja Operasi,Operasi,35000000000,32000000000\n2.02,Belanja Modal,Modal,15000000000,12000000000\n2.03,Belanja Tak Terduga,Tak Terduga,0,0'
    case 'pembiayaan':
      return '3.01,Silpa,Penerimaan,5000000000,4500000000\n3.02,Pembayaran Pinjaman,Pengeluaran,3000000000,2800000000'
  }
}

function getExampleDataArray(jenis: JenisData): string[][] {
  switch (jenis) {
    case 'pendapatan':
      return [
        ['1.01', 'Pendapatan Asli Daerah', 'PAD', '31.500.000.000,5', '28.000.000.000'],
        ['1.02', 'Dana Transfer', 'Transfer', '52.000.000.000', '48.000.000.000,75'],
        ['1.03', 'Pendapatan Lainnya', 'Lainnya', '0', '0'],
      ]
    case 'belanja':
      return [
        ['2.01', 'Belanja Operasi', 'Operasi', '35.000.000.000', '32.000.000.000,5'],
        ['2.02', 'Belanja Modal', 'Modal', '15.000.000.000', '12.000.000.000'],
        ['2.03', 'Belanja Tak Terduga', 'Tak Terduga', '0', '0'],
      ]
    case 'pembiayaan':
      return [
        ['3.01', 'Silpa', 'Penerimaan', '5.000.000.000', '4.500.000.000,25'],
        ['3.02', 'Pembayaran Pinjaman', 'Pengeluaran', '3.000.000.000', '2.800.000.000'],
      ]
  }
}
