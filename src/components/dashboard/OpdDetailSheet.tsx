"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  formatRupiahFull,
  formatRupiahShort,
  formatPersentase,
  getRealisasiBadgeClass,
  getRealisasiBarClass,
  safePercentage,
} from "./types";
import { usePengaturan } from "@/context/PengaturanContext";
import {
  Building2,
  TrendingUp,
  Wallet,
  CreditCard,
  Landmark,
  ChevronDown,
  ChevronUp,
  Loader2,
  AlertCircle,
  FileText,
  Info,
  Link2,
  Search,
} from "lucide-react";

// ===== Type Definitions =====
type OpdInfo = {
  id: string;
  kodeOpd: string;
  namaOpd: string;
  kepalaOpd: string | null;
};

type FinancialItem = {
  id: string;
  kodeAkun: string;
  namaAkun: string;
  kategori: string;
  anggaran: number;
  realisasi: number;
  persentase: number;
};

type FinancialGroup = {
  kategori: string;
  totalAnggaran: number;
  totalRealisasi: number;
  persentase: number;
  items: FinancialItem[];
};

type FinancialSummary = {
  totalAnggaran: number;
  totalRealisasi: number;
  persentase: number;
  count: number;
};

type OpdDetailData = {
  opd: OpdInfo;
  tahunAnggaranId: string;
  dataMatchMode: 'opdId' | 'kodeAkun' | 'fallback';
  realisasiSkpd: {
    id: string;
    kodeSkpd: string;
    namaSkpd: string;
    anggaran: number;
    realisasi: number;
    persentase: number;
    tanggalUpdate: string;
  } | null;
  summary: {
    totalAnggaran: number;
    totalRealisasi: number;
    persentase: number;
    pendapatan: FinancialSummary;
    belanja: FinancialSummary;
    pembiayaan: FinancialSummary;
  };
  pendapatan: { groups: FinancialGroup[] };
  belanja: { groups: FinancialGroup[] };
  pembiayaan: { groups: FinancialGroup[] };
};

type OpdDetailSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  opdId?: string;
  kodeSkpd?: string;
  tahunAnggaranId?: string;
  namaSkpd?: string;
  kodeSkpdDisplay?: string;
};

// ===== Collapsible Section Component =====
function FinancialSection({
  title,
  icon: Icon,
  groups,
  summary,
  colorTheme,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  groups: FinancialGroup[];
  summary: FinancialSummary;
  colorTheme: "emerald" | "red" | "amber";
}) {
  const [expanded, setExpanded] = useState(true);

  const colorMap = {
    emerald: {
      header: "bg-emerald-700",
      border: "border-emerald-200",
      bg: "bg-emerald-50",
      text: "text-emerald-800",
      badge: "bg-emerald-100 text-emerald-800 border-emerald-200",
      bar: "bg-emerald-500",
      lightBg: "bg-emerald-50/50",
    },
    red: {
      header: "bg-red-700",
      border: "border-red-200",
      bg: "bg-red-50",
      text: "text-red-800",
      badge: "bg-red-100 text-red-800 border-red-200",
      bar: "bg-red-500",
      lightBg: "bg-red-50/50",
    },
    amber: {
      header: "bg-amber-700",
      border: "border-amber-200",
      bg: "bg-amber-50",
      text: "text-amber-800",
      badge: "bg-amber-100 text-amber-800 border-amber-200",
      bar: "bg-amber-500",
      lightBg: "bg-amber-50/50",
    },
  };

  const colors = colorMap[colorTheme];

  return (
    <div className={`rounded-lg border ${colors.border} overflow-hidden`}>
      {/* Section Header */}
      <div
        className={`${colors.header} text-white px-4 py-2.5 flex items-center justify-between cursor-pointer`}
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4" />
          <span className="text-xs font-bold uppercase tracking-wider">{title}</span>
          <Badge className="bg-white/20 text-white border-0 text-[10px] px-2 py-0 h-5">
            {summary.count} Akun
          </Badge>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] opacity-90">
            Anggaran: {formatRupiahFull(summary.totalAnggaran)}
          </span>
          <span className="text-[10px] opacity-90">
            Realisasi: {formatRupiahFull(summary.totalRealisasi)}
          </span>
          <Badge className={`text-[10px] px-1.5 py-0 h-5 border font-bold ${getRealisasiBadgeClass(summary.persentase)}`}>
            {formatPersentase(summary.persentase)}
          </Badge>
          {expanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </div>
      </div>

      {/* Section Content */}
      {expanded && (
        <div className="divide-y divide-gray-100">
          {groups.length === 0 ? (
            <div className="px-4 py-6 text-center text-xs text-gray-400">
              <FileText className="w-6 h-6 mx-auto mb-1 opacity-30" />
              Belum ada data {title.toLowerCase()}
            </div>
          ) : (
            groups.map((group, gIdx) => (
              <div key={gIdx}>
                {/* Category Sub-header */}
                <div className={`${colors.lightBg} px-4 py-2 flex items-center justify-between border-b ${colors.border}`}>
                  <span className={`text-[11px] font-semibold ${colors.text}`}>
                    {group.kategori}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-gray-500">
                      {formatRupiahShort(group.totalAnggaran)}
                    </span>
                    <Badge className={`text-[10px] px-1.5 py-0 h-5 border ${getRealisasiBadgeClass(group.persentase)}`}>
                      {formatPersentase(group.persentase)}
                    </Badge>
                  </div>
                </div>

                {/* Items Table */}
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="text-[10px] font-bold w-12 py-1.5">Kode</TableHead>
                        <TableHead className="text-[10px] font-bold py-1.5">Nama Akun</TableHead>
                        <TableHead className="text-[10px] font-bold text-right w-28 py-1.5">Anggaran</TableHead>
                        <TableHead className="text-[10px] font-bold text-right w-28 py-1.5">Realisasi</TableHead>
                        <TableHead className="text-[10px] font-bold text-center w-24 py-1.5">%</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {group.items.map((item) => (
                        <TableRow key={item.id} className="hover:bg-gray-50/50">
                          <TableCell className="font-mono text-[10px] text-gray-500 py-1.5">
                            {item.kodeAkun}
                          </TableCell>
                          <TableCell className="text-[11px] font-medium text-gray-700 py-1.5 max-w-[200px]">
                            <span className="truncate block" title={item.namaAkun}>
                              {item.namaAkun}
                            </span>
                          </TableCell>
                          <TableCell className="text-right font-mono text-[10px] text-gray-700 py-1.5">
                            {formatRupiahFull(item.anggaran)}
                          </TableCell>
                          <TableCell className="text-right font-mono text-[10px] text-gray-700 py-1.5">
                            {formatRupiahFull(item.realisasi)}
                          </TableCell>
                          <TableCell className="text-center py-1.5">
                            <div className="flex items-center gap-1">
                              <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${getRealisasiBarClass(item.persentase)}`}
                                  style={{ width: `${Math.min(item.persentase, 100)}%` }}
                                />
                              </div>
                              <Badge className={`text-[9px] px-1 py-0 h-4 border ${getRealisasiBadgeClass(item.persentase)}`}>
                                {formatPersentase(item.persentase)}
                              </Badge>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ===== Main Sheet Component =====
export default function OpdDetailSheet({
  open,
  onOpenChange,
  opdId,
  kodeSkpd,
  tahunAnggaranId,
  namaSkpd,
  kodeSkpdDisplay,
}: OpdDetailSheetProps) {
  const { pengaturan } = usePengaturan();
  const [detail, setDetail] = useState<OpdDetailData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDetail = useCallback(async () => {
    if (!open) return;
    if (!tahunAnggaranId) return;
    if (!opdId && !kodeSkpd) return;

    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ tahunAnggaranId });
      if (opdId) params.set("opdId", opdId);
      if (kodeSkpd) params.set("kodeSkpd", kodeSkpd);

      const res = await fetch(`/api/admin/realisasi-skpd/detail?${params}`);
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Gagal memuat detail OPD");
      }
      const data = await res.json();
      setDetail(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }, [open, opdId, kodeSkpd, tahunAnggaranId]);

  useEffect(() => {
    if (open) {
      fetchDetail();
    } else {
      setDetail(null);
      setError(null);
    }
  }, [open, fetchDetail]);

  const displayNama = detail?.opd.namaOpd || namaSkpd || "OPD";
  const displayKode = detail?.opd.kodeOpd || kodeSkpdDisplay || "";

  // Check if we have detailed per-item data
  const hasDetailedData = detail
    ? detail.summary.pendapatan.count > 0 ||
      detail.summary.belanja.count > 0 ||
      detail.summary.pembiayaan.count > 0
    : false;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl md:max-w-3xl lg:max-w-4xl overflow-y-auto p-0"
      >
        {/* Header */}
        <SheetHeader className="p-4 pb-0">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: pengaturan.warnaPrimary || "#1B5E20" }}
            >
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <SheetTitle className="text-sm font-bold truncate">
                {displayNama}
              </SheetTitle>
              <SheetDescription className="text-[11px]">
                Kode: {displayKode}
                {detail?.opd.kepalaOpd && ` • Kepala: ${detail.opd.kepalaOpd}`}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="p-4 space-y-4">
          {/* Loading State */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
              <p className="text-xs text-gray-400 mt-2">Memuat data detail OPD...</p>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="w-8 h-8 text-red-400" />
              <p className="text-sm text-red-600 mt-2">{error}</p>
              <button
                onClick={fetchDetail}
                className="mt-2 text-xs text-blue-600 hover:underline"
              >
                Coba lagi
              </button>
            </div>
          )}

          {/* Detail Content */}
          {detail && !loading && !error && (
            <>
              {/* Data Source Indicator */}
              {detail.dataMatchMode === 'opdId' && (
                <div className="flex items-start gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <Link2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[11px] font-medium text-emerald-800">Data Terhubung Langsung</p>
                    <p className="text-[10px] text-emerald-600 mt-0.5">
                      Data rincian Pendapatan, Belanja & Pembiayaan terhubung langsung ke OPD ini melalui ID OPD
                    </p>
                  </div>
                </div>
              )}
              {detail.dataMatchMode === 'kodeAkun' && (
                <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <Search className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[11px] font-medium text-amber-800">Data Berdasarkan Kode Akun</p>
                    <p className="text-[10px] text-amber-600 mt-0.5">
                      Data belum terhubung langsung ke OPD. Rincian ditampilkan berdasarkan kecocokan awalan kode akun dengan kode OPD ({detail.opd.kodeOpd}).
                      Hubungkan data ke OPD melalui panel Admin untuk hasil yang lebih akurat.
                    </p>
                  </div>
                </div>
              )}
              {detail.dataMatchMode !== 'opdId' && detail.dataMatchMode !== 'kodeAkun' && detail.realisasiSkpd && (
                <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[11px] font-medium text-blue-800">Data Ringkasan Realisasi SKPD</p>
                    <p className="text-[10px] text-blue-600 mt-0.5">
                      Data rincian per-akun belum tersedia untuk OPD ini. Nilai yang ditampilkan merupakan data ringkasan dari Realisasi SKPD.
                      Input data melalui akun OPD akan menampilkan rincian secara otomatis.
                    </p>
                  </div>
                </div>
              )}

              {/* Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* Total Anggaran */}
                <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-xl p-3 border border-gray-200">
                  <p className="text-[9px] font-semibold text-gray-500 uppercase tracking-wider">
                    Total Anggaran
                  </p>
                  <p className="text-sm font-bold text-gray-900 mt-0.5">
                    {formatRupiahShort(detail.summary.totalAnggaran)}
                  </p>
                  <p className="text-[9px] text-gray-400 mt-0.5">
                    {formatRupiahFull(detail.summary.totalAnggaran)}
                  </p>
                </div>

                {/* Total Realisasi */}
                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-xl p-3 border border-emerald-200">
                  <p className="text-[9px] font-semibold text-emerald-600 uppercase tracking-wider">
                    Total Realisasi
                  </p>
                  <p className="text-sm font-bold text-emerald-900 mt-0.5">
                    {formatRupiahShort(detail.summary.totalRealisasi)}
                  </p>
                  <p className="text-[9px] text-emerald-500 mt-0.5">
                    {formatRupiahFull(detail.summary.totalRealisasi)}
                  </p>
                </div>

                {/* Persentase */}
                <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-xl p-3 border border-amber-200">
                  <p className="text-[9px] font-semibold text-amber-600 uppercase tracking-wider">
                    Persentase
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-sm font-bold text-amber-900">
                      {formatPersentase(detail.summary.persentase)}
                    </p>
                    <div className="flex-1 h-2 bg-amber-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${getRealisasiBarClass(detail.summary.persentase)}`}
                        style={{
                          width: `${Math.min(detail.summary.persentase, 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Jumlah Akun */}
                <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl p-3 border border-purple-200">
                  <p className="text-[9px] font-semibold text-purple-600 uppercase tracking-wider">
                    Total Akun
                  </p>
                  <p className="text-sm font-bold text-purple-900 mt-0.5">
                    {detail.summary.pendapatan.count +
                      detail.summary.belanja.count +
                      detail.summary.pembiayaan.count}{" "}
                    Akun
                  </p>
                  <p className="text-[9px] text-purple-500 mt-0.5">
                    P:{detail.summary.pendapatan.count} • B:
                    {detail.summary.belanja.count} • Pb:
                    {detail.summary.pembiayaan.count}
                  </p>
                </div>
              </div>

              {/* Per-Type Summary Bar */}
              <div className="grid grid-cols-3 gap-2">
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200">
                  <Wallet className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[9px] font-semibold text-emerald-600 uppercase">
                      Pendapatan
                    </p>
                    <p className="text-[11px] font-bold text-emerald-900 truncate">
                      {formatRupiahShort(detail.summary.pendapatan.totalAnggaran)}
                    </p>
                    <p className="text-[9px] text-emerald-600">
                      Realisasi: {formatPersentase(detail.summary.pendapatan.persentase)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-red-50 border border-red-200">
                  <CreditCard className="w-4 h-4 text-red-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[9px] font-semibold text-red-600 uppercase">
                      Belanja
                    </p>
                    <p className="text-[11px] font-bold text-red-900 truncate">
                      {formatRupiahShort(detail.summary.belanja.totalAnggaran)}
                    </p>
                    <p className="text-[9px] text-red-600">
                      Realisasi: {formatPersentase(detail.summary.belanja.persentase)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-50 border border-amber-200">
                  <Landmark className="w-4 h-4 text-amber-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[9px] font-semibold text-amber-600 uppercase">
                      Pembiayaan
                    </p>
                    <p className="text-[11px] font-bold text-amber-900 truncate">
                      {formatRupiahShort(detail.summary.pembiayaan.totalAnggaran)}
                    </p>
                    <p className="text-[9px] text-amber-600">
                      Realisasi: {formatPersentase(detail.summary.pembiayaan.persentase)}
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Financial Detail Sections - only show when there's detailed data */}
              {hasDetailedData ? (
                <>
                  {/* Pendapatan Section */}
                  <FinancialSection
                    title="Pendapatan"
                    icon={Wallet}
                    groups={detail.pendapatan.groups}
                    summary={detail.summary.pendapatan}
                    colorTheme="emerald"
                  />

                  {/* Belanja Section */}
                  <FinancialSection
                    title="Belanja"
                    icon={CreditCard}
                    groups={detail.belanja.groups}
                    summary={detail.summary.belanja}
                    colorTheme="red"
                  />

                  {/* Pembiayaan Section */}
                  <FinancialSection
                    title="Pembiayaan"
                    icon={Landmark}
                    groups={detail.pembiayaan.groups}
                    summary={detail.summary.pembiayaan}
                    colorTheme="amber"
                  />
                </>
              ) : (
                /* Fallback: Show summary view when no detailed per-item data */
                <div className="space-y-3">
                  {/* Pendapatan Summary */}
                  <div className="rounded-lg border border-emerald-200 overflow-hidden">
                    <div className="bg-emerald-700 text-white px-4 py-2 flex items-center gap-2">
                      <Wallet className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase tracking-wider">Pendapatan</span>
                    </div>
                    <div className="px-4 py-3 bg-emerald-50/50 grid grid-cols-3 gap-3">
                      <div>
                        <p className="text-[9px] font-semibold text-emerald-600 uppercase">Anggaran</p>
                        <p className="text-xs font-bold text-emerald-900">{formatRupiahFull(detail.summary.pendapatan.totalAnggaran)}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-semibold text-emerald-600 uppercase">Realisasi</p>
                        <p className="text-xs font-bold text-emerald-900">{formatRupiahFull(detail.summary.pendapatan.totalRealisasi)}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-semibold text-emerald-600 uppercase">Persentase</p>
                        <Badge className={`text-[10px] px-1.5 py-0 h-5 border ${getRealisasiBadgeClass(detail.summary.pendapatan.persentase)}`}>
                          {formatPersentase(detail.summary.pendapatan.persentase)}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Belanja Summary */}
                  <div className="rounded-lg border border-red-200 overflow-hidden">
                    <div className="bg-red-700 text-white px-4 py-2 flex items-center gap-2">
                      <CreditCard className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase tracking-wider">Belanja</span>
                    </div>
                    <div className="px-4 py-3 bg-red-50/50 grid grid-cols-3 gap-3">
                      <div>
                        <p className="text-[9px] font-semibold text-red-600 uppercase">Anggaran</p>
                        <p className="text-xs font-bold text-red-900">{formatRupiahFull(detail.summary.belanja.totalAnggaran)}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-semibold text-red-600 uppercase">Realisasi</p>
                        <p className="text-xs font-bold text-red-900">{formatRupiahFull(detail.summary.belanja.totalRealisasi)}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-semibold text-red-600 uppercase">Persentase</p>
                        <Badge className={`text-[10px] px-1.5 py-0 h-5 border ${getRealisasiBadgeClass(detail.summary.belanja.persentase)}`}>
                          {formatPersentase(detail.summary.belanja.persentase)}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Pembiayaan Summary */}
                  <div className="rounded-lg border border-amber-200 overflow-hidden">
                    <div className="bg-amber-700 text-white px-4 py-2 flex items-center gap-2">
                      <Landmark className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase tracking-wider">Pembiayaan</span>
                    </div>
                    <div className="px-4 py-3 bg-amber-50/50 grid grid-cols-3 gap-3">
                      <div>
                        <p className="text-[9px] font-semibold text-amber-600 uppercase">Anggaran</p>
                        <p className="text-xs font-bold text-amber-900">{formatRupiahFull(detail.summary.pembiayaan.totalAnggaran)}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-semibold text-amber-600 uppercase">Realisasi</p>
                        <p className="text-xs font-bold text-amber-900">{formatRupiahFull(detail.summary.pembiayaan.totalRealisasi)}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-semibold text-amber-600 uppercase">Persentase</p>
                        <Badge className={`text-[10px] px-1.5 py-0 h-5 border ${getRealisasiBadgeClass(detail.summary.pembiayaan.persentase)}`}>
                          {formatPersentase(detail.summary.pembiayaan.persentase)}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Info message about detailed data */}
                  <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-blue-700">
                      Rincian data per-akun akan tersedia secara otomatis ketika OPD menginput data Pendapatan, Belanja, dan Pembiayaan melalui akun OPD masing-masing.
                    </p>
                  </div>
                </div>
              )}

              {/* Grand Total */}
              <div className="rounded-lg border border-gray-300 overflow-hidden">
                <div
                  className="px-4 py-3 text-white flex items-center justify-between"
                  style={{
                    backgroundColor: pengaturan.warnaPrimary || "#1B5E20",
                  }}
                >
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">
                      Total Keseluruhan
                    </span>
                  </div>
                  <Badge
                    className={`text-xs px-2 py-0.5 h-6 border font-bold ${getRealisasiBadgeClass(
                      detail.summary.persentase
                    )}`}
                  >
                    {formatPersentase(detail.summary.persentase)}
                  </Badge>
                </div>
                <div className="px-4 py-3 bg-gray-50 grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-[9px] font-semibold text-gray-500 uppercase">
                      Anggaran
                    </p>
                    <p className="text-sm font-bold text-gray-900">
                      {formatRupiahFull(detail.summary.totalAnggaran)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[9px] font-semibold text-gray-500 uppercase">
                      Realisasi
                    </p>
                    <p className="text-sm font-bold text-gray-900">
                      {formatRupiahFull(detail.summary.totalRealisasi)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[9px] font-semibold text-gray-500 uppercase">
                      Sisa Anggaran
                    </p>
                    <p className="text-sm font-bold text-gray-900">
                      {formatRupiahFull(
                        detail.summary.totalAnggaran -
                          detail.summary.totalRealisasi
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* No Data State (when detail is null and not loading) */}
          {!detail && !loading && !error && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Building2 className="w-8 h-8 text-gray-300" />
              <p className="text-xs text-gray-400 mt-2">
                Klik pada baris SKPD/OPD untuk melihat detail rincian data
              </p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
