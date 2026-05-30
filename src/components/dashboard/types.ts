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
    return `${(value / 1_000_000_000_000).toFixed(1)} T`;
  }
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(1)} M`;
  }
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)} Jt`;
  }
  return value.toLocaleString("id-ID");
}

export function formatRupiahShort(value: number): string {
  if (value >= 1_000_000_000_000) {
    const v = value / 1_000_000_000_000;
    return `${v.toFixed(1)} Triliun`;
  }
  if (value >= 1_000_000_000) {
    const v = value / 1_000_000_000;
    return `${v.toFixed(1)} Miliar`;
  }
  if (value >= 1_000_000) {
    const v = value / 1_000_000;
    return `${v.toFixed(1)} Juta`;
  }
  return `Rp ${value.toLocaleString("id-ID")}`;
}

export function formatRupiahFull(value: number): string {
  return `Rp ${value.toLocaleString("id-ID")}`;
}

export function formatPersentase(value: number): string {
  return `${value.toFixed(2)}%`;
}

export function getRealisasiBadgeClass(persentase: number): string {
  if (persentase >= 90) return "bg-emerald-100 text-emerald-800 border-emerald-200";
  if (persentase >= 75) return "bg-amber-100 text-amber-800 border-amber-200";
  if (persentase >= 50) return "bg-orange-100 text-orange-800 border-orange-200";
  return "bg-red-100 text-red-800 border-red-200";
}

export function getRealisasiBarClass(persentase: number): string {
  if (persentase >= 90) return "bg-emerald-500";
  if (persentase >= 75) return "bg-amber-500";
  if (persentase >= 50) return "bg-orange-500";
  return "bg-red-500";
}
