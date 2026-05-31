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
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import {
  DashboardData,
  formatRupiahFull,
  formatRupiahShort,
  formatPersentase,
  getRealisasiBadgeClass,
  getRealisasiBarClass,
  safePercentage,
} from "./types";
import OpdDetailSheet from "./OpdDetailSheet";
import { usePengaturan } from "@/context/PengaturanContext";
import {
  Calendar,
  Home,
  Building2,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Eye,
} from "lucide-react";
import { motion } from "framer-motion";

type RealisasiSkpdReportProps = {
  data: DashboardData;
};

type SortFieldType = "namaSkpd" | "anggaran" | "realisasi" | "persentase";

// Sort icon component - declared outside render to avoid state reset
function SortIcon({ field, sortField, sortDir }: { field: SortFieldType; sortField: SortFieldType; sortDir: "asc" | "desc" }) {
  if (sortField !== field) return null;
  return sortDir === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />;
}

// Chart configuration for the SKPD bar chart
const chartConfig: ChartConfig = {
  anggaran: {
    label: "Anggaran",
    color: "#2E7D32",
  },
  realisasi: {
    label: "Realisasi",
    color: "#F9A825",
  },
};

export default function RealisasiSkpdReport({ data }: RealisasiSkpdReportProps) {
  const { pengaturan } = usePengaturan();
  const [tanggalFilter, setTanggalFilter] = useState(() => {
    const now = new Date();
    return `${now.getDate().toString().padStart(2, "0")}/${(now.getMonth() + 1).toString().padStart(2, "0")}/${now.getFullYear()}`;
  });
  const [sortField, setSortField] = useState<SortFieldType>("anggaran");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [showChart, setShowChart] = useState(true);
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);
  const [selectedOpd, setSelectedOpd] = useState<{
    opdId?: string;
    kodeSkpd?: string;
    tahunAnggaranId?: string;
    namaSkpd?: string;
    kodeSkpdDisplay?: string;
  } | null>(null);

  // Sort SKPD data
  const sortedSkpd = useMemo(() => {
    return [...data.realisasiSkpd].sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "namaSkpd":
          cmp = a.namaSkpd.localeCompare(b.namaSkpd);
          break;
        case "anggaran":
          cmp = a.anggaran - b.anggaran;
          break;
        case "realisasi":
          cmp = a.realisasi - b.realisasi;
          break;
        case "persentase":
          cmp = a.persentase - b.persentase;
          break;
      }
      return sortDir === "desc" ? -cmp : cmp;
    });
  }, [data.realisasiSkpd, sortField, sortDir]);

  // Chart data - top 10 by anggaran
  const chartData = useMemo(() => {
    return [...data.realisasiSkpd]
      .sort((a, b) => b.anggaran - a.anggaran)
      .slice(0, 10)
      .map((item) => ({
        nama: item.namaSkpd.length > 20
          ? item.namaSkpd.substring(0, 20) + "…"
          : item.namaSkpd,
        fullName: item.namaSkpd,
        anggaran: item.anggaran,
        realisasi: item.realisasi,
        persentase: item.persentase,
      }));
  }, [data.realisasiSkpd]);

  // Calculate totals
  const totalAnggaran = data.realisasiSkpd.reduce((s, i) => s + i.anggaran, 0);
  const totalRealisasi = data.realisasiSkpd.reduce((s, i) => s + i.realisasi, 0);
  const totalPersentase = safePercentage(totalRealisasi, totalAnggaran);

  // SKPD ranking
  const topSkpd = [...data.realisasiSkpd].sort((a, b) => b.persentase - a.persentase);
  const bottomSkpd = [...data.realisasiSkpd].sort((a, b) => a.persentase - b.persentase);

  // Categorize by performance
  const excellentCount = data.realisasiSkpd.filter(s => s.persentase >= 90).length;
  const goodCount = data.realisasiSkpd.filter(s => s.persentase >= 75 && s.persentase < 90).length;
  const moderateCount = data.realisasiSkpd.filter(s => s.persentase >= 50 && s.persentase < 75).length;
  const lowCount = data.realisasiSkpd.filter(s => s.persentase < 50).length;

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

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDir(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  const handleOpdClick = (item: data.realisasiSkpd[number]) => {
    setSelectedOpd({
      opdId: item.opdId,
      kodeSkpd: item.kodeSkpd,
      tahunAnggaranId: item.tahunAnggaranId,
      namaSkpd: item.namaSkpd,
      kodeSkpdDisplay: item.kodeSkpd,
    });
    setDetailSheetOpen(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.5 }}
      className="space-y-0"
    >
      {/* ===== HEADER BAR ===== */}
      <div
        className="relative overflow-hidden rounded-t-xl text-white"
        style={{
          background: `linear-gradient(135deg, ${pengaturan.warnaDark || "#0D3B12"}, ${pengaturan.warnaPrimary || "#1B5E20"}, ${pengaturan.warnaPrimary || "#1B5E20"}dd)`,
        }}
      >
        {/* Background pattern */}
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
            Realisasi Anggaran Per-SKPD
          </h1>
          <div className="flex items-center gap-2 text-sm">
            <Home className="w-4 h-4" style={{ color: pengaturan.warnaAccent || "#FFD700" }} />
            <span style={{ color: pengaturan.warnaAccent || "#FFD700" }} className="font-medium">
              Dashboard
            </span>
            <span className="text-white/60">/</span>
            <span style={{ color: pengaturan.warnaAccent || "#FFD700" }} className="font-medium">
              SKPD
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
        <div className="sm:ml-auto text-xs text-gray-500">
          Total <strong>{data.realisasiSkpd.length}</strong> SKPD/OPD terdaftar
        </div>
      </div>

      {/* ===== TITLE BLOCK ===== */}
      <div className="bg-white border-x border-b border-gray-200 px-5 lg:px-8 py-8">
        <div className="text-center space-y-2">
          <h2 className="text-xl lg:text-2xl font-bold tracking-wide text-gray-900 uppercase">
            Realisasi Anggaran Per-SKPD/OPD
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
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-xl p-4 border border-emerald-200">
            <p className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider">Total Anggaran SKPD</p>
            <p className="text-lg lg:text-xl font-bold text-emerald-900 mt-1">{formatRupiahFull(totalAnggaran)}</p>
            <p className="text-xs text-emerald-600 mt-1">{formatRupiahShort(totalAnggaran)}</p>
          </div>
          {/* Total Realisasi */}
          <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-xl p-4 border border-amber-200">
            <p className="text-[10px] font-semibold text-amber-600 uppercase tracking-wider">Total Realisasi SKPD</p>
            <p className="text-lg lg:text-xl font-bold text-amber-900 mt-1">{formatRupiahFull(totalRealisasi)}</p>
            <p className="text-xs text-amber-600 mt-1">{formatRupiahShort(totalRealisasi)}</p>
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

      {/* ===== PERFORMANCE DISTRIBUTION ===== */}
      <div className="bg-white border-x border-b border-gray-200 px-5 lg:px-8 py-5">
        <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3">Distribusi Kinerja SKPD/OPD</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-50 border border-emerald-200">
            <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold text-sm">
              {excellentCount}
            </div>
            <div>
              <p className="text-xs font-semibold text-emerald-800">Sangat Baik</p>
              <p className="text-[10px] text-emerald-600">≥ 90%</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
            <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center text-white font-bold text-sm">
              {goodCount}
            </div>
            <div>
              <p className="text-xs font-semibold text-amber-800">Baik</p>
              <p className="text-[10px] text-amber-600">75-90%</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-orange-50 border border-orange-200">
            <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold text-sm">
              {moderateCount}
            </div>
            <div>
              <p className="text-xs font-semibold text-orange-800">Cukup</p>
              <p className="text-[10px] text-orange-600">50-75%</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50 border border-red-200">
            <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center text-white font-bold text-sm">
              {lowCount}
            </div>
            <div>
              <p className="text-xs font-semibold text-red-800">Kurang</p>
              <p className="text-[10px] text-red-600">&lt; 50%</p>
            </div>
          </div>
        </div>
      </div>

      {/* ===== BAR CHART ===== */}
      <div className="bg-white border-x border-b border-gray-200 px-5 lg:px-8 py-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Perbandingan Anggaran & Realisasi (Top 10)
          </h3>
          <button
            onClick={() => setShowChart(!showChart)}
            className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
          >
            {showChart ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {showChart ? "Sembunyikan" : "Tampilkan"}
          </button>
        </div>
        {showChart && (
          <ChartContainer config={chartConfig} className="h-[360px] w-full">
            <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} horizontal={false} />
              <XAxis
                type="number"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                fontSize={11}
                tickFormatter={(value) => formatRupiahShort(value)}
              />
              <YAxis
                type="category"
                dataKey="nama"
                tickLine={false}
                axisLine={false}
                tickMargin={6}
                fontSize={10}
                width={140}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value, _name, item) => formatRupiahFull(value as number)}
                    labelFormatter={(_label, payload) => {
                      if (payload?.[0]?.payload?.fullName) {
                        return payload[0].payload.fullName;
                      }
                      return _label;
                    }}
                  />
                }
              />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar
                dataKey="anggaran"
                fill="var(--color-anggaran)"
                radius={[0, 4, 4, 0]}
                barSize={14}
              />
              <Bar
                dataKey="realisasi"
                fill="var(--color-realisasi)"
                radius={[0, 4, 4, 0]}
                barSize={14}
              />
            </BarChart>
          </ChartContainer>
        )}
      </div>

      {/* ===== TOP & BOTTOM PERFORMERS ===== */}
      <div className="bg-white border-x border-b border-gray-200 px-5 lg:px-8 py-5">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Top Performers */}
          <div className="rounded-xl border border-emerald-200 overflow-hidden">
            <div className="bg-emerald-700 text-white px-4 py-2.5 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Realisasi Tertinggi</span>
            </div>
            <div className="divide-y divide-emerald-100">
              {topSkpd.slice(0, 5).map((skpd, idx) => (
                <div
                  key={skpd.id}
                  className="px-4 py-2.5 flex items-center gap-3 hover:bg-emerald-50/50 transition-colors cursor-pointer"
                  onClick={() => handleOpdClick(skpd)}
                >
                  <span className="text-xs font-bold text-emerald-600 w-5">{idx + 1}.</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{skpd.namaSkpd}</p>
                    <p className="text-[10px] text-gray-400">{skpd.kodeSkpd}</p>
                  </div>
                  <Badge className={`text-[10px] px-2 py-0 h-5 border ${getRealisasiBadgeClass(skpd.persentase)}`}>
                    {formatPersentase(skpd.persentase)}
                  </Badge>
                </div>
              ))}
              {topSkpd.length === 0 && (
                <div className="px-4 py-6 text-center text-xs text-gray-400">Belum ada data</div>
              )}
            </div>
          </div>

          {/* Bottom Performers */}
          <div className="rounded-xl border border-red-200 overflow-hidden">
            <div className="bg-red-700 text-white px-4 py-2.5 flex items-center gap-2">
              <TrendingDown className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Realisasi Terendah</span>
            </div>
            <div className="divide-y divide-red-100">
              {bottomSkpd.slice(0, 5).map((skpd, idx) => (
                <div
                  key={skpd.id}
                  className="px-4 py-2.5 flex items-center gap-3 hover:bg-red-50/50 transition-colors cursor-pointer"
                  onClick={() => handleOpdClick(skpd)}
                >
                  <span className="text-xs font-bold text-red-600 w-5">{idx + 1}.</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{skpd.namaSkpd}</p>
                    <p className="text-[10px] text-gray-400">{skpd.kodeSkpd}</p>
                  </div>
                  <Badge className={`text-[10px] px-2 py-0 h-5 border ${getRealisasiBadgeClass(skpd.persentase)}`}>
                    {formatPersentase(skpd.persentase)}
                  </Badge>
                </div>
              ))}
              {bottomSkpd.length === 0 && (
                <div className="px-4 py-6 text-center text-xs text-gray-400">Belum ada data</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ===== MAIN DATA TABLE ===== */}
      <div className="bg-white border-x border-b border-gray-200">
        {/* Table Header */}
        <div
          className="px-5 lg:px-8 py-3 text-white flex items-center gap-3"
          style={{ backgroundColor: pengaturan.warnaPrimary || "#1B5E20" }}
        >
          <Building2 className="w-4 h-4" />
          <span className="text-sm font-bold tracking-wider uppercase">
            Detail Realisasi Per-SKPD/OPD
          </span>
          <Badge className="bg-white/20 text-white border-0 text-[10px] px-2 py-0.5">
            {data.realisasiSkpd.length} SKPD
          </Badge>
        </div>

        {/* Sort info */}
        <div className="px-5 lg:px-8 py-2 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
          <span className="text-[10px] text-gray-500">Diurutkan berdasarkan:</span>
          <Badge variant="secondary" className="text-[10px] h-5">
            {sortField === "namaSkpd" ? "Nama" : sortField === "anggaran" ? "Anggaran" : sortField === "realisasi" ? "Realisasi" : "Persentase"}
            {sortDir === "desc" ? " ↓" : " ↑"}
          </Badge>
          <span className="text-[10px] text-emerald-600 ml-auto flex items-center gap-1">
            <Eye className="w-3 h-3" />
            Klik baris untuk melihat detail rincian OPD
          </span>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-emerald-50 hover:bg-emerald-50">
                <TableHead className="text-[11px] font-bold w-10 text-center">#</TableHead>
                <TableHead
                  className="text-[11px] font-bold w-20 cursor-pointer hover:text-emerald-700 select-none"
                  onClick={() => handleSort("namaSkpd")}
                >
                  <span className="flex items-center gap-1">Kode <SortIcon field="namaSkpd" sortField={sortField} sortDir={sortDir} /></span>
                </TableHead>
                <TableHead
                  className="text-[11px] font-bold cursor-pointer hover:text-emerald-700 select-none"
                  onClick={() => handleSort("namaSkpd")}
                >
                  <span className="flex items-center gap-1">Nama SKPD/OPD <SortIcon field="namaSkpd" sortField={sortField} sortDir={sortDir} /></span>
                </TableHead>
                <TableHead
                  className="text-[11px] font-bold text-right w-40 cursor-pointer hover:text-emerald-700 select-none"
                  onClick={() => handleSort("anggaran")}
                >
                  <span className="flex items-center justify-end gap-1">Anggaran (Rp) <SortIcon field="anggaran" sortField={sortField} sortDir={sortDir} /></span>
                </TableHead>
                <TableHead
                  className="text-[11px] font-bold text-right w-40 cursor-pointer hover:text-emerald-700 select-none"
                  onClick={() => handleSort("realisasi")}
                >
                  <span className="flex items-center justify-end gap-1">Realisasi (Rp) <SortIcon field="realisasi" sortField={sortField} sortDir={sortDir} /></span>
                </TableHead>
                <TableHead
                  className="text-[11px] font-bold text-center w-32 cursor-pointer hover:text-emerald-700 select-none"
                  onClick={() => handleSort("persentase")}
                >
                  <span className="flex items-center justify-center gap-1">Persentase <SortIcon field="persentase" sortField={sortField} sortDir={sortDir} /></span>
                </TableHead>
                <TableHead className="text-[11px] font-bold text-center w-36">
                  Tgl Update
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedSkpd.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-gray-400 text-sm">
                    <Building2 className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p>Belum ada data realisasi SKPD</p>
                    <p className="text-xs mt-1">Tambahkan data melalui panel Admin</p>
                  </TableCell>
                </TableRow>
              ) : (
                sortedSkpd.map((item, idx) => (
                  <TableRow
                    key={item.id}
                    className="hover:bg-emerald-50/50 transition-colors group cursor-pointer"
                    onClick={() => handleOpdClick(item)}
                  >
                    <TableCell className="text-center text-[11px] text-gray-400">
                      {idx + 1}
                    </TableCell>
                    <TableCell className="font-mono text-sm font-semibold text-gray-800">
                      {item.kodeSkpd}
                    </TableCell>
                    <TableCell className="text-xs font-medium text-gray-700 max-w-[240px]">
                      <div className="flex items-center gap-2">
                        <span className="truncate block" title={item.namaSkpd}>{item.namaSkpd}</span>
                        <Eye className="w-3.5 h-3.5 text-gray-300 group-hover:text-emerald-500 shrink-0 transition-colors" />
                      </div>
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
                      {formatDisplayDate(item.tanggalUpdate)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* ===== GRAND TOTAL ===== */}
      <div className="bg-white border border-gray-200 rounded-b-xl px-5 lg:px-8 py-4">
        <div
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2"
          style={{ borderTop: `3px solid ${pengaturan.warnaPrimary || "#1B5E20"}` }}
        >
          <div className="pt-3">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-800">
              Total Keseluruhan Realisasi SKPD/OPD
            </p>
            <p className="text-[10px] text-gray-500 mt-0.5">
              {data.realisasiSkpd.length} SKPD/OPD — Tahun Anggaran {data.tahun}
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

      {/* ===== OPD DETAIL SHEET ===== */}
      <OpdDetailSheet
        open={detailSheetOpen}
        onOpenChange={setDetailSheetOpen}
        opdId={selectedOpd?.opdId}
        kodeSkpd={selectedOpd?.kodeSkpd}
        tahunAnggaranId={selectedOpd?.tahunAnggaranId}
        namaSkpd={selectedOpd?.namaSkpd}
        kodeSkpdDisplay={selectedOpd?.kodeSkpdDisplay}
      />
    </motion.div>
  );
}
