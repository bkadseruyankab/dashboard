export type DashboardData = {
  tahun: number;
  tahunList: number[];
  ringkasan: {
    totalAnggaran: number;
    totalPendapatan: number;
    totalBelanja: number;
    totalPembiayaan: number;
    realisasiPendapatan: number;
    realisasiBelanja: number;
    persentasePendapatan: number;
    persentaseBelanja: number;
  };
  pendapatan: Array<{
    id: string;
    kodeAkun: string;
    namaAkun: string;
    kategori: string;
    anggaran: number;
    realisasi: number;
    persentase: number;
  }>;
  belanja: Array<{
    id: string;
    kodeAkun: string;
    namaAkun: string;
    kategori: string;
    anggaran: number;
    realisasi: number;
    persentase: number;
  }>;
  pembiayaan: Array<{
    id: string;
    kodeAkun: string;
    namaAkun: string;
    kategori: string;
    anggaran: number;
    realisasi: number;
    persentase: number;
  }>;
  realisasiAkun: Array<{
    id: string;
    kodeAkun: string;
    namaAkun: string;
    jenis: string;
    anggaran: number;
    realisasi: number;
    persentase: number;
  }>;
  realisasiSkpd: Array<{
    id: string;
    kodeSkpd: string;
    namaSkpd: string;
    anggaran: number;
    realisasi: number;
    persentase: number;
  }>;
  trendApbd: Array<{
    tahun: number;
    pendapatan: number;
    belanja: number;
  }>;
};

export type ActiveView = 
  | "dashboard" 
  | "apbd" 
  | "pendapatan" 
  | "belanja" 
  | "pembiayaan" 
  | "realisasi-akun" 
  | "realisasi-skpd"
  | "transparansi";

export function formatRupiah(value: number): string {
  if (value >= 1_000_000_000_000) {
    return `${(value / 1_000_000_000_000).toFixed(2)} T`;
  }
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(2)} M`;
  }
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(2)} Jt`;
  }
  return value.toLocaleString("id-ID");
}

export function formatRupiahFull(value: number): string {
  return `Rp ${value.toLocaleString("id-ID")}`;
}

export function formatPersentase(value: number): string {
  return `${value.toFixed(2)}%`;
}
