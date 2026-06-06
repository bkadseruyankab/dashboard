"use client";

import { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DashboardData,
  formatRupiahFull,
  formatPersentase,
  getRealisasiBadgeClass,
  getRealisasiBarClass,
  safePercentage,
} from "./types";
import { usePengaturan } from "@/context/PengaturanContext";
import { Calendar, ChevronDown, ChevronUp, Home, FileText } from "lucide-react";

type RealisasiAkunReportProps = {
  data: DashboardData;
};

const JENIS_ORDER = ["Pendapatan", "Belanja", "Pembiayaan"] as const;

const JENIS_LABELS: Record<string, string> = {
  Pendapatan: "PENDAPATAN DAERAH",
  Belanja: "BELANJA DAERAH",
  Pembiayaan: "PEMBIAYAAN",
};

const JENIS_COLORS: Record<string, { bg: string; border: string; text: string; headerBg: string }> = {
  Pendapatan: { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-800", headerBg: "bg-emerald-700" },
  Belanja: { bg: "bg-red-50", border: "border-red-200", text: "text-red-800", headerBg: "bg-red-700" },
  Pembiayaan: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-800", headerBg: "bg-amber-700" },
};

export default function RealisasiAkunReport({ data }: RealisasiAkunReportProps) {
  const { pengaturan, logoSrc } = usePengaturan();
  const [tanggalFilter, setTanggalFilter] = useState(() => {
    const now = new Date();
    return `${now.getDate().toString().padStart(2, "0")}/${(now.getMonth() + 1).toString().padStart(2, "0")}/${now.getFullYear()}`;
  });
  const [expandedJenis, setExpandedJenis] = useState<Set<string>>(new Set(JENIS_ORDER));

  const toggleJenis = (jenis: string) => {
    setExpandedJenis((prev) => {
      const next = new Set(prev);
      if (next.has(jenis)) {
        next.delete(jenis);
      } else {
        next.add(jenis);
      }
      return next;
    });
  };

  // Group realisasi akun data by jenis
  const groupedData = useMemo(() => {
    const groups: Record<string, typeof data.realisasiAkun> = {};
    for (const jenis of JENIS_ORDER) {
      groups[jenis] = data.realisasiAkun.filter((item) => item.jenis === jenis);
    }
    return groups;
  }, [data.realisasiAkun]);

  // Calculate totals
  const totalAnggaran = data.realisasiAkun.reduce((s, i) => s + i.anggaran, 0);
  const totalRealisasi = data.realisasiAkun.reduce((s, i) => s + i.realisasi, 0);
  const totalPersentase = safePercentage(totalRealisasi, totalAnggaran);

  // Format date for display
  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    return d.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-0">
      {/* ===== HEADER BAR ===== */}
      <div
        className="relative overflow-hidden rounded-t-xl text-white"
        style={{
          background: `linear-gradient(135deg, ${pengaturan.warnaDark || "#1a1a5e"}, ${pengaturan.warnaPrimary || "#3F3F9F"}, ${pengaturan.warnaPrimary || "#3F3F9F"}dd)`,
        }}
      >
        {/* Background pattern - subtle icons */}
        <div className="absolute inset-0 opacity-[0.07]">
          <div className="absolute top-2 left-[10%] w-16 h-16 border-2 border-white rounded-lg rotate-12" />
          <div className="absolute top-8 left-[30%] w-10 h-10 border-2 border-white rounded-full" />
          <div className="absolute bottom-4 left-[50%] w-20 h-12 border-2 border-white rounded-lg -rotate-6" />
          <div className="absolute top-6 right-[15%] w-14 h-14 border-2 border-white rounded-xl rotate-45" />
          <div className="absolute bottom-2 right-[35%] w-8 h-8 border-2 border-white rounded-full" />
          <div className="absolute top-4 left-[70%] w-12 h-8 border-2 border-white rotate-12" />
          <div className="absolute bottom-6 left-[5%] w-10 h-6 border-2 border-white -rotate-3" />
        </div>

        <div className="relative flex items-center justify-between px-5 lg:px-8 py-4">
          <h1 className="text-base lg:text-lg font-bold tracking-wider uppercase">
            Realisasi Anggaran Per-Akun
          </h1>
          <div className="flex items-center gap-2 text-sm">
            <Home className="w-4 h-4" style={{ color: pengaturan.warnaAccent || "#FFD700" }} />
            <span style={{ color: pengaturan.warnaAccent || "#FFD700" }} className="font-medium">
              Dashboard
            </span>
            <span className="text-white/60">/</span>
            <span style={{ color: pengaturan.warnaAccent || "#FFD700" }} className="font-medium">
              Akun
            </span>
          </div>
        </div>
      </div>

      {/* ===== DATE SELECTOR CARD ===== */}
      <div className="bg-white border border-gray-200 px-5 lg:px-8 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-gray-500" />
          <label className="text-sm font-semibold text-gray-700">Tanggal</label>
        </div>
        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={tanggalFilter.split("/").reverse().join("-")}
            onChange={(e) => {
              const val = e.target.value;
              if (val) {
                const [y, m, d] = val.split("-");
                setTanggalFilter(`${d}/${m}/${y}`);
              }
            }}
            className="w-[180px] h-9 text-sm"
          />
        </div>
      </div>

      {/* ===== TITLE BLOCK ===== */}
      <div className="bg-white border-x border-b border-gray-200 px-5 lg:px-8 py-8">
        <div className="text-center space-y-2">
          <h2 className="text-xl lg:text-2xl font-bold tracking-wide text-gray-900 uppercase">
            Realisasi Anggaran
          </h2>
          <p className="text-base lg:text-lg font-semibold text-gray-800 uppercase">
            {pengaturan.namaPemerintah || "Pemerintah Kabupaten Seruyan"}
          </p>
          <p className="text-sm lg:text-base font-medium text-gray-700 uppercase">
            Tahun Anggaran {data.tahun}
          </p>
          <p className="text-xs lg:text-sm text-gray-500 font-medium uppercase">
            Sampai Dengan : {tanggalFilter}
          </p>
        </div>
      </div>

      {/* ===== SUMMARY STATS ===== */}
      <div className="bg-white border-x border-b border-gray-200 px-5 lg:px-8 py-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Total Anggaran */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-xl p-4 border border-gray-200">
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Total Anggaran</p>
            <p className="text-lg lg:text-xl font-bold text-gray-900 mt-1">{formatRupiahFull(totalAnggaran)}</p>
          </div>
          {/* Total Realisasi */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-xl p-4 border border-gray-200">
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Total Realisasi</p>
            <p className="text-lg lg:text-xl font-bold text-gray-900 mt-1">{formatRupiahFull(totalRealisasi)}</p>
          </div>
          {/* Persentase */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-xl p-4 border border-gray-200">
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Persentase Realisasi</p>
            <div className="flex items-center gap-3 mt-1">
              <p className="text-lg lg:text-xl font-bold text-gray-900">{formatPersentase(totalPersentase)}</p>
              <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ${getRealisasiBarClass(totalPersentase)}`}
                  style={{ width: `${Math.min(totalPersentase, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== DATA TABLES BY JENIS ===== */}
      {JENIS_ORDER.map((jenis) => {
        const items = groupedData[jenis] || [];
        const jenisTotalAnggaran = items.reduce((s, i) => s + i.anggaran, 0);
        const jenisTotalRealisasi = items.reduce((s, i) => s + i.realisasi, 0);
        const jenisTotalPersentase = safePercentage(jenisTotalRealisasi, jenisTotalAnggaran);
        const colors = JENIS_COLORS[jenis];
        const isExpanded = expandedJenis.has(jenis);

        return (
          <div
            key={jenis}
            className="bg-white border-x border-b border-gray-200"
          >
            {/* Jenis Header - Clickable */}
            <button
              onClick={() => toggleJenis(jenis)}
              className={`w-full flex items-center justify-between px-5 lg:px-8 py-3 ${colors.headerBg} text-white hover:opacity-95 transition-opacity`}
            >
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4" />
                <span className="text-sm font-bold tracking-wider uppercase">
                  {JENIS_LABELS[jenis]}
                </span>
                <Badge className="bg-white/20 text-white border-0 text-[10px] px-2 py-0.5">
                  {items.length} Akun
                </Badge>
              </div>
              <div className="flex items-center gap-4">
                <div className="hidden sm:flex items-center gap-4 text-xs">
                  <span className="text-white/80">Anggaran: <strong className="text-white">{formatRupiahFull(jenisTotalAnggaran)}</strong></span>
                  <span className="text-white/80">Realisasi: <strong className="text-white">{formatRupiahFull(jenisTotalRealisasi)}</strong></span>
                  <span className="text-white/80">Persentase: <strong className="text-white">{formatPersentase(jenisTotalPersentase)}</strong></span>
                </div>
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </div>
            </button>

            {/* Table */}
            {isExpanded && (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className={`${colors.bg} hover:${colors.bg}`}>
                        <TableHead className="text-[11px] font-bold w-10 text-center">#</TableHead>
                        <TableHead className={`text-[11px] font-bold w-20 ${colors.text}`}>Kode</TableHead>
                        <TableHead className={`text-[11px] font-bold ${colors.text}`}>Nama Akun</TableHead>
                        <TableHead className={`text-[11px] font-bold text-right w-40 ${colors.text}`}>Anggaran (Rp)</TableHead>
                        <TableHead className={`text-[11px] font-bold text-right w-40 ${colors.text}`}>Realisasi (Rp)</TableHead>
                        <TableHead className={`text-[11px] font-bold text-center w-32 ${colors.text}`}>Persentase</TableHead>
                        <TableHead className={`text-[11px] font-bold text-center w-36 ${colors.text}`}>Tgl Input</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-gray-400 text-sm">
                            Belum ada data realisasi {jenis.toLowerCase()}
                          </TableCell>
                        </TableRow>
                      ) : (
                        items.map((item, idx) => (
                          <TableRow key={item.id} className="hover:bg-gray-50/80 transition-colors">
                            <TableCell className="text-center text-[11px] text-gray-400">
                              {idx + 1}
                            </TableCell>
                            <TableCell className="font-mono text-sm font-semibold text-gray-800">
                              {item.kodeAkun}
                            </TableCell>
                            <TableCell className="text-xs font-medium text-gray-700 max-w-[240px]">
                              {item.namaAkun}
                            </TableCell>
                            <TableCell className="text-right font-mono text-xs text-gray-800">
                              {formatRupiahFull(item.anggaran)}
                            </TableCell>
                            <TableCell className="text-right font-mono text-xs text-gray-800">
                              {formatRupiahFull(item.realisasi)}
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all ${getRealisasiBarClass(item.persentase)}`}
                                    style={{ width: `${Math.min(item.persentase, 100)}%` }}
                                  />
                                </div>
                                <Badge
                                  className={`text-[10px] px-1.5 py-0 h-5 border whitespace-nowrap ${getRealisasiBadgeClass(item.persentase)}`}
                                >
                                  {formatPersentase(item.persentase)}
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell className="text-center text-[11px] text-gray-400">
                              {formatDisplayDate(item.tanggalInput)}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Subtotal Row */}
                {items.length > 0 && (
                  <div className={`px-5 lg:px-8 py-3 ${colors.bg} border-t ${colors.border}`}>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                      <span className={`text-xs font-bold uppercase tracking-wider ${colors.text}`}>
                        Subtotal {JENIS_LABELS[jenis]}
                      </span>
                      <div className="flex items-center gap-4 text-xs">
                        <span className="text-gray-600">
                          Anggaran: <strong className="text-gray-900">{formatRupiahFull(jenisTotalAnggaran)}</strong>
                        </span>
                        <span className="text-gray-600">
                          Realisasi: <strong className="text-gray-900">{formatRupiahFull(jenisTotalRealisasi)}</strong>
                        </span>
                        <Badge className={`text-[10px] px-2 py-0.5 h-6 border ${getRealisasiBadgeClass(jenisTotalPersentase)}`}>
                          {formatPersentase(jenisTotalPersentase)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        );
      })}

      {/* ===== GRAND TOTAL ===== */}
      <div className="bg-white border border-gray-200 rounded-b-xl px-5 lg:px-8 py-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2"
          style={{ borderTop: `3px solid ${pengaturan.warnaPrimary || "#3F3F9F"}` }}
        >
          <div className="pt-3">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-800">
              Total Keseluruhan Realisasi
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs pt-3">
            <span className="text-gray-600">
              Anggaran: <strong className="text-gray-900 text-sm">{formatRupiahFull(totalAnggaran)}</strong>
            </span>
            <span className="text-gray-600">
              Realisasi: <strong className="text-gray-900 text-sm">{formatRupiahFull(totalRealisasi)}</strong>
            </span>
            <Badge className={`text-xs px-3 py-1 h-7 border font-bold ${getRealisasiBadgeClass(totalPersentase)}`}>
              {formatPersentase(totalPersentase)}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}
