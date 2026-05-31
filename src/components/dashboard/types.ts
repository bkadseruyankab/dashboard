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
    opdId: string | null;
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
    autoSync: boolean;
  }>;
  realisasiSkpd: Array<{
    id: string;
    kodeSkpd: string;
    namaSkpd: string;
    anggaran: number;
    realisasi: number;
    persentase: number;
  }>;
  opd: Array<{
    id: string;
    kodeOpd: string;
    namaOpd: string;
    kepalaOpd: string | null;
    alamat: string | null;
    telepon: string | null;
    email: string | null;
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
  | "opd"
  | "transparansi"
  | "admin";

export type AdminTab =
  | "tahun-anggaran"
  | "kategori"
  | "pendapatan"
  | "belanja"
  | "pembiayaan"
  | "realisasi-akun"
  | "realisasi-skpd"
  | "opd"
  | "pengaturan"
  | "akun";

/**
 * Formats a number with dots as thousand separators (Indonesian format).
 * e.g., 994200000000 → "994.200.000.000"
 * This is more reliable than toLocaleString which varies by environment.
 */
function formatWithDots(value: number): string {
  const isNegative = value < 0;
  const abs = Math.abs(Math.round(value));
  const str = abs.toString();
  const parts: string[] = [];
  let count = 0;
  for (let i = str.length - 1; i >= 0; i--) {
    if (count > 0 && count % 3 === 0) {
      parts.push(".");
    }
    parts.push(str[i]);
    count++;
  }
  const formatted = parts.reverse().join("");
  return isNegative ? "-" + formatted : formatted;
}

/** Short format: Rp 1.5 T, Rp 994.2 M, Rp 500.0 Jt */
export function formatRupiah(value: number): string {
  if (value >= 1_000_000_000_000) {
    return `Rp ${(value / 1_000_000_000_000).toFixed(1)} T`;
  }
  if (value >= 1_000_000_000) {
    return `Rp ${(value / 1_000_000_000).toFixed(1)} M`;
  }
  if (value >= 1_000_000) {
    return `Rp ${(value / 1_000_000).toFixed(1)} Jt`;
  }
  return `Rp ${formatWithDots(value)}`;
}

/** Descriptive format: 1.5 Triliun, 994.2 Miliar, 500.0 Juta */
export function formatRupiahShort(value: number): string {
  if (value >= 1_000_000_000_000) {
    return `${(value / 1_000_000_000_000).toFixed(1)} Triliun`;
  }
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(1)} Miliar`;
  }
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)} Juta`;
  }
  return `Rp ${formatWithDots(value)}`;
}

/** Full format: Rp 994.200.000.000 */
export function formatRupiahFull(value: number): string {
  return `Rp ${formatWithDots(value)}`;
}

/** Percentage format: 92.35% */
export function formatPersentase(value: number): string {
  if (!isFinite(value)) return "0.00%";
  return `${value.toFixed(2)}%`;
}

/** Safe percentage calculation — never returns NaN/Infinity */
export function safePercentage(numerator: number, denominator: number): number {
  if (!denominator || !isFinite(denominator)) return 0;
  const result = (numerator / denominator) * 100;
  return isFinite(result) ? Math.round(result * 100) / 100 : 0;
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
