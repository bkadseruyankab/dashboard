"use client";

import { useMemo } from "react";
import {
  DashboardData,
  formatRupiah,
  formatRupiahShort,
  formatRupiahFull,
  formatPersentase,
  safePercentage,
  getRealisasiBadgeClass,
  getRealisasiBarClass,
} from "./types";
import { usePengaturan } from "@/context/PengaturanContext";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  FileText,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  BarChart3,
  Target,
  Lightbulb,
  Shield,
  Scale,
  Banknote,
  Coins,
  Printer,
  Landmark,
} from "lucide-react";

type RingkasanEksekutifProps = {
  data: DashboardData;
};

// ─── Animation variants ───────────────────────────────────────────────────────
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.07, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
  },
};

// ─── Helper: group array by kategori and sum ─────────────────────────────────
function groupByKategori(
  items: Array<{
    kategori: string;
    anggaran: number;
    realisasi: number;
    persentase: number;
  }>
) {
  const map = new Map<
    string,
    { anggaran: number; realisasi: number; count: number }
  >();
  for (const item of items) {
    const existing = map.get(item.kategori) || {
      anggaran: 0,
      realisasi: 0,
      count: 0,
    };
    existing.anggaran += item.anggaran;
    existing.realisasi += item.realisasi;
    existing.count += 1;
    map.set(item.kategori, existing);
  }
  return Array.from(map.entries())
    .map(([kategori, val]) => ({
      kategori,
      anggaran: val.anggaran,
      realisasi: val.realisasi,
      persentase: safePercentage(val.realisasi, val.anggaran),
      count: val.count,
    }))
    .sort((a, b) => b.anggaran - a.anggaran);
}

// ─── Helper: format Indonesian date ───────────────────────────────────────────
function formatIndonesianDate(date: Date): string {
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════════════════════
export default function RingkasanEksekutif({ data }: RingkasanEksekutifProps) {
  const { pengaturan } = usePengaturan();
  const { ringkasan, tahun } = data;

  // ── Derived data ──────────────────────────────────────────────────────────
  const pendapatanByKategori = useMemo(
    () => groupByKategori(data.pendapatan),
    [data.pendapatan]
  );
  const belanjaByKategori = useMemo(
    () => groupByKategori(data.belanja),
    [data.belanja]
  );

  const surplusDefisit = ringkasan.realisasiPendapatan - ringkasan.realisasiBelanja;

  // Top/worst SKPD
  const sortedSkpd = useMemo(
    () => [...data.realisasiSkpd].sort((a, b) => b.persentase - a.persentase),
    [data.realisasiSkpd]
  );
  const top5Skpd = sortedSkpd.slice(0, 5);
  const bottom5Skpd = [...data.realisasiSkpd]
    .sort((a, b) => a.persentase - b.persentase)
    .slice(0, 5);

  // Trend calculations
  const trendWithGrowth = useMemo(() => {
    const sorted = [...data.trendApbd].sort((a, b) => a.tahun - b.tahun);
    return sorted.map((item, idx) => {
      const prev = idx > 0 ? sorted[idx - 1] : null;
      return {
        ...item,
        pendapatanGrowth: prev
          ? safePercentage(item.pendapatan - prev.pendapatan, prev.pendapatan)
          : null,
        belanjaGrowth: prev
          ? safePercentage(item.belanja - prev.belanja, prev.belanja)
          : null,
      };
    });
  }, [data.trendApbd]);

  // YoY trend for the KPI card
  const yoyApbdGrowth = useMemo(() => {
    if (data.trendApbd.length < 2) return null;
    const sorted = [...data.trendApbd].sort((a, b) => a.tahun - b.tahun);
    const current = sorted.find((t) => t.tahun === tahun);
    const prevYear = tahun - 1;
    const prev = sorted.find((t) => t.tahun === prevYear);
    if (!current || !prev) return null;
    return safePercentage(
      (current.pendapatan + current.belanja) - (prev.pendapatan + prev.belanja),
      prev.pendapatan + prev.belanja
    );
  }, [data.trendApbd, tahun]);

  // ── Auto-generated insights ───────────────────────────────────────────────
  const insights = useMemo(() => {
    const result: { type: "success" | "warning" | "info"; text: string }[] = [];

    // Pendapatan insight
    if (ringkasan.persentasePendapatan >= 90) {
      result.push({
        type: "success",
        text: `Kinerja pendapatan sangat baik dengan realisasi ${formatPersentase(ringkasan.persentasePendapatan)} dari target ${formatRupiah(ringkasan.totalPendapatan)}.`,
      });
    } else if (ringkasan.persentasePendapatan >= 75) {
      result.push({
        type: "info",
        text: `Realisasi pendapatan mencapai ${formatPersentase(ringkasan.persentasePendapatan)}, masih perlu peningkatan untuk mencapai target optimal.`,
      });
    } else {
      result.push({
        type: "warning",
        text: `Realisasi pendapatan hanya ${formatPersentase(ringkasan.persentasePendapatan)}, perlu evaluasi serius terhadap strategi pendapatan daerah.`,
      });
    }

    // Belanja insight
    if (ringkasan.persentaseBelanja >= 95) {
      result.push({
        type: "warning",
        text: `Serapan belanja tinggi (${formatPersentase(ringkasan.persentaseBelanja)}), perlu pengawasan agar tidak terjadi overspending.`,
      });
    } else if (ringkasan.persentaseBelanja >= 75) {
      result.push({
        type: "success",
        text: `Serapan belanja ${formatPersentase(ringkasan.persentaseBelanja)} menunjukkan pemanfaatan anggaran yang cukup baik.`,
      });
    } else {
      result.push({
        type: "info",
        text: `Serapan belanja ${formatPersentase(ringkasan.persentaseBelanja)}, masih terdapat sisa anggaran yang perlu dioptimalkan.`,
      });
    }

    // Surplus/Defisit insight
    if (surplusDefisit > 0) {
      result.push({
        type: "success",
        text: `APBD dalam kondisi surplus sebesar ${formatRupiah(surplusDefisit)} menunjukkan pengelolaan keuangan yang stabil.`,
      });
    } else if (surplusDefisit < 0) {
      result.push({
        type: "warning",
        text: `APBD mengalami defisit sebesar ${formatRupiah(Math.abs(surplusDefisit))}, perlu perhatian khusus terhadap keseimbangan fiskal.`,
      });
    } else {
      result.push({
        type: "info",
        text: "APBD dalam kondisi seimbang antara pendapatan dan belanja.",
      });
    }

    // Low-performing SKPD warning
    const lowSkpdCount = data.realisasiSkpd.filter(
      (s) => s.persentase < 50
    ).length;
    if (lowSkpdCount > 0) {
      result.push({
        type: "warning",
        text: `Terdapat ${lowSkpdCount} SKPD/OPD dengan realisasi di bawah 50% yang memerlukan perhatian khusus.`,
      });
    }

    return result;
  }, [ringkasan, surplusDefisit, data.realisasiSkpd]);

  const recommendations = useMemo(() => {
    const recs: string[] = [];

    // Recommendation based on pendapatan
    if (ringkasan.persentasePendapatan < 75) {
      recs.push(
        "Meningkatkan intensifikasi pendapatan asli daerah melalui optimalisasi potensi pajak, retribusi, dan hasil pengelolaan kekayaan daerah."
      );
    }

    // Recommendation based on belanja
    if (ringkasan.persentaseBelanja < 70) {
      recs.push(
        "Mempercepat pelaksanaan program dan kegiatan untuk meningkatkan serapan anggaran belanja, terutama pada belanja modal."
      );
    } else if (ringkasan.persentaseBelanja > 95) {
      recs.push(
        "Melakukan pengendalian belanja secara ketat untuk mencegah potensi overspending dan menjaga disiplin anggaran."
      );
    }

    // Recommendation based on low-performing SKPDs
    const lowSkpdCount = data.realisasiSkpd.filter(
      (s) => s.persentase < 50
    ).length;
    if (lowSkpdCount > 0) {
      recs.push(
        `Memberikan pendampingan dan evaluasi kinerja kepada ${lowSkpdCount} SKPD/OPD yang memiliki realisasi di bawah 50%.`
      );
    }

    // Always add a forward-looking recommendation
    if (surplusDefisit > 0) {
      recs.push(
        "Memanfaatkan surplus anggaran untuk meningkatkan investasi pada infrastruktur dan pelayanan publik yang berkelanjutan."
      );
    }

    // Ensure at least 2 recommendations
    if (recs.length < 2) {
      recs.push(
        "Melakukan evaluasi menyeluruh terhadap kinerja keuangan daerah untuk perbaikan perencanaan anggaran tahun berikutnya."
      );
    }

    return recs.slice(0, 4);
  }, [ringkasan, surplusDefisit, data.realisasiSkpd]);

  // ── Print handler ─────────────────────────────────────────────────────────
  const handlePrint = () => {
    window.print();
  };

  // ── Primary/secondary colors ─────────────────────────────────────────────
  const primary = pengaturan.warnaPrimary || "#1B5E20";
  const secondary = pengaturan.warnaSecondary || "#2E7D32";
  const accent = pengaturan.warnaAccent || "#F9A825";
  const dark = pengaturan.warnaDark || "#0D3B12";

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 print:space-y-4"
    >
      {/* ═══════════════════════════════════════════════════════════════════════
          1. PAGE TITLE SECTION
          ═══════════════════════════════════════════════════════════════════════ */}
      <motion.div variants={itemVariants}>
        <div
          className="relative overflow-hidden rounded-2xl text-white"
          style={{
            background: `linear-gradient(135deg, ${dark}, ${primary}, ${primary}dd)`,
          }}
        >
          {/* Background decorative elements */}
          <div className="absolute inset-0 opacity-[0.06] pointer-events-none">
            <div className="absolute top-2 left-[10%] w-20 h-20 border-2 border-white rounded-lg rotate-12" />
            <div className="absolute top-12 left-[35%] w-12 h-12 border-2 border-white rounded-full" />
            <div className="absolute bottom-4 left-[55%] w-24 h-14 border-2 border-white rounded-lg -rotate-6" />
            <div className="absolute top-8 right-[15%] w-16 h-16 border-2 border-white rounded-xl rotate-45" />
            <div className="absolute bottom-8 right-[40%] w-10 h-10 border-2 border-white rounded-full" />
          </div>

          {/* Shimmer overlay */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.04] to-transparent pointer-events-none"
            animate={{ x: ["-100%", "100%"] }}
            transition={{ duration: 4, repeat: Infinity, repeatDelay: 5, ease: "linear" }}
          />

          <div className="relative px-6 lg:px-10 py-8 lg:py-10">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center shrink-0 print:hidden">
                  <FileText className="w-7 h-7 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Scale className="w-4 h-4 text-amber-300 print:hidden" />
                    <span className="text-xs font-medium text-emerald-200 uppercase tracking-widest">
                      Ringkasan Eksekutif
                    </span>
                  </div>
                  <h1 className="text-xl lg:text-2xl font-extrabold tracking-wide leading-tight">
                    Ringkasan Eksekutif
                  </h1>
                  <p className="text-sm text-emerald-100 mt-1 font-medium">
                    Laporan Kinerja Keuangan Daerah Tahun Anggaran {tahun}
                  </p>
                  <p className="text-xs text-emerald-200/70 mt-0.5">
                    {pengaturan.namaPemerintah || "Pemerintah Kabupaten Seruyan"}
                  </p>
                </div>
              </div>

              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2.5 bg-white/15 hover:bg-white/25 backdrop-blur-sm rounded-lg text-sm font-medium transition-all duration-300 border border-white/20 print:hidden"
              >
                <Printer className="w-4 h-4" />
                Cetak Laporan
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════════════════
          2. KPI OVERVIEW CARDS
          ═══════════════════════════════════════════════════════════════════════ */}
      <motion.div variants={itemVariants}>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {/* Card 1: Total APBD */}
          <KpiCard
            title="Total APBD"
            value={formatRupiahFull(ringkasan.totalAnggaran)}
            subtitle={formatRupiahShort(ringkasan.totalAnggaran)}
            icon={<Landmark className="w-5 h-5 text-white" />}
            iconBg="bg-gradient-to-br from-emerald-500 to-green-600"
            accentColor={primary}
            trend={
              yoyApbdGrowth !== null
                ? {
                    value: yoyApbdGrowth,
                    label: "YoY",
                  }
                : undefined
            }
          />

          {/* Card 2: Realisasi Pendapatan */}
          <KpiCard
            title="Realisasi Pendapatan"
            value={formatPersentase(ringkasan.persentasePendapatan)}
            subtitle={`${formatRupiah(ringkasan.realisasiPendapatan)} dari ${formatRupiah(ringkasan.totalPendapatan)}`}
            icon={<TrendingUp className="w-5 h-5 text-white" />}
            iconBg="bg-gradient-to-br from-teal-500 to-emerald-600"
            accentColor={primary}
            progressValue={ringkasan.persentasePendapatan}
            progressClass={getRealisasiBarClass(ringkasan.persentasePendapatan)}
          />

          {/* Card 3: Realisasi Belanja */}
          <KpiCard
            title="Realisasi Belanja"
            value={formatPersentase(ringkasan.persentaseBelanja)}
            subtitle={`${formatRupiah(ringkasan.realisasiBelanja)} dari ${formatRupiah(ringkasan.totalBelanja)}`}
            icon={<TrendingDown className="w-5 h-5 text-white" />}
            iconBg="bg-gradient-to-br from-amber-500 to-orange-500"
            accentColor="#B45309"
            progressValue={ringkasan.persentaseBelanja}
            progressClass={getRealisasiBarClass(ringkasan.persentaseBelanja)}
          />

          {/* Card 4: Surplus / Defisit */}
          <KpiCard
            title="Surplus / Defisit"
            value={formatRupiahFull(Math.abs(surplusDefisit))}
            subtitle={
              surplusDefisit >= 0
                ? `Surplus ${formatRupiahShort(surplusDefisit)}`
                : `Defisit ${formatRupiahShort(Math.abs(surplusDefisit))}`
            }
            icon={
              surplusDefisit >= 0 ? (
                <ArrowUpRight className="w-5 h-5 text-white" />
              ) : surplusDefisit < 0 ? (
                <ArrowDownRight className="w-5 h-5 text-white" />
              ) : (
                <Minus className="w-5 h-5 text-white" />
              )
            }
            iconBg={
              surplusDefisit >= 0
                ? "bg-gradient-to-br from-emerald-500 to-green-600"
                : "bg-gradient-to-br from-red-500 to-rose-600"
            }
            accentColor={surplusDefisit >= 0 ? "#059669" : "#DC2626"}
            badge={
              <Badge
                className={`text-[10px] px-2 py-0.5 border font-bold ${
                  surplusDefisit >= 0
                    ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                    : "bg-red-100 text-red-800 border-red-200"
                }`}
              >
                {surplusDefisit >= 0 ? "SURPLUS" : "DEFISIT"}
              </Badge>
            }
          />
        </div>
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════════════════
          3. ANALISIS PENDAPATAN
          ═══════════════════════════════════════════════════════════════════════ */}
      <motion.div variants={itemVariants}>
        <Card className="shadow-md border-0 overflow-hidden">
          <CardHeader
            className="pb-3 text-white"
            style={{
              background: `linear-gradient(135deg, ${primary}, ${secondary})`,
            }}
          >
            <CardTitle className="text-sm font-bold flex items-center gap-2 tracking-wide uppercase">
              <Coins className="w-4 h-4" />
              Analisis Pendapatan
              <Badge className="bg-white/20 text-white border-0 text-[10px] ml-auto">
                TA {tahun}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {/* Summary row */}
            <div className="grid grid-cols-3 gap-0 border-b border-border/50">
              <div className="p-4 text-center border-r border-border/50">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Total Anggaran
                </p>
                <p className="text-lg font-bold text-foreground mt-1">
                  {formatRupiahFull(ringkasan.totalPendapatan)}
                </p>
              </div>
              <div className="p-4 text-center border-r border-border/50">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Total Realisasi
                </p>
                <p className="text-lg font-bold text-foreground mt-1">
                  {formatRupiahFull(ringkasan.realisasiPendapatan)}
                </p>
              </div>
              <div className="p-4 text-center">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Persentase
                </p>
                <div className="flex items-center justify-center gap-2 mt-1">
                  <p className="text-lg font-bold">
                    {formatPersentase(ringkasan.persentasePendapatan)}
                  </p>
                  <Badge
                    className={`text-[10px] px-1.5 py-0 h-5 border ${getRealisasiBadgeClass(ringkasan.persentasePendapatan)}`}
                  >
                    {ringkasan.persentasePendapatan >= 90
                      ? "Sangat Baik"
                      : ringkasan.persentasePendapatan >= 75
                        ? "Baik"
                        : ringkasan.persentasePendapatan >= 50
                          ? "Cukup"
                          : "Kurang"}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Category table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-emerald-50/70">
                    <th className="text-left py-3 px-4 text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                      Kategori
                    </th>
                    <th className="text-right py-3 px-4 text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                      Anggaran
                    </th>
                    <th className="text-right py-3 px-4 text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                      Realisasi
                    </th>
                    <th className="text-center py-3 px-4 text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                      %
                    </th>
                    <th className="py-3 px-4 text-[11px] font-bold text-emerald-800 uppercase tracking-wider w-36">
                      Progress
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pendapatanByKategori.map((cat, idx) => (
                    <tr
                      key={cat.kategori}
                      className={`border-b border-border/30 hover:bg-emerald-50/30 transition-colors ${cat.persentase < 50 ? "bg-red-50/30" : ""}`}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {cat.persentase < 50 && (
                            <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                          )}
                          <div>
                            <p className="font-medium text-foreground text-xs">
                              {cat.kategori}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              {cat.count} akun
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-xs text-foreground">
                        {formatRupiahFull(cat.anggaran)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-xs text-foreground">
                        {formatRupiahFull(cat.realisasi)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge
                          className={`text-[10px] px-1.5 py-0 h-5 border ${getRealisasiBadgeClass(cat.persentase)}`}
                        >
                          {formatPersentase(cat.persentase)}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                            <motion.div
                              className={`h-full rounded-full ${getRealisasiBarClass(cat.persentase)}`}
                              initial={{ width: 0 }}
                              animate={{
                                width: `${Math.min(cat.persentase, 100)}%`,
                              }}
                              transition={{
                                duration: 1,
                                delay: 0.2 + idx * 0.06,
                                ease: [0.22, 1, 0.36, 1],
                              }}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {pendapatanByKategori.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="py-8 text-center text-xs text-muted-foreground"
                      >
                        Belum ada data pendapatan
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════════════════
          4. ANALISIS BELANJA
          ═══════════════════════════════════════════════════════════════════════ */}
      <motion.div variants={itemVariants}>
        <Card className="shadow-md border-0 overflow-hidden">
          <CardHeader
            className="pb-3 text-white"
            style={{
              background: `linear-gradient(135deg, #92400E, #B45309)`,
            }}
          >
            <CardTitle className="text-sm font-bold flex items-center gap-2 tracking-wide uppercase">
              <Banknote className="w-4 h-4" />
              Analisis Belanja
              <Badge className="bg-white/20 text-white border-0 text-[10px] ml-auto">
                TA {tahun}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {/* Summary row */}
            <div className="grid grid-cols-3 gap-0 border-b border-border/50">
              <div className="p-4 text-center border-r border-border/50">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Total Anggaran
                </p>
                <p className="text-lg font-bold text-foreground mt-1">
                  {formatRupiahFull(ringkasan.totalBelanja)}
                </p>
              </div>
              <div className="p-4 text-center border-r border-border/50">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Total Realisasi
                </p>
                <p className="text-lg font-bold text-foreground mt-1">
                  {formatRupiahFull(ringkasan.realisasiBelanja)}
                </p>
              </div>
              <div className="p-4 text-center">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Persentase
                </p>
                <div className="flex items-center justify-center gap-2 mt-1">
                  <p className="text-lg font-bold">
                    {formatPersentase(ringkasan.persentaseBelanja)}
                  </p>
                  <Badge
                    className={`text-[10px] px-1.5 py-0 h-5 border ${getRealisasiBadgeClass(ringkasan.persentaseBelanja)}`}
                  >
                    {ringkasan.persentaseBelanja >= 90
                      ? "Sangat Baik"
                      : ringkasan.persentaseBelanja >= 75
                        ? "Baik"
                        : ringkasan.persentaseBelanja >= 50
                          ? "Cukup"
                          : "Kurang"}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Category table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-amber-50/70">
                    <th className="text-left py-3 px-4 text-[11px] font-bold text-amber-800 uppercase tracking-wider">
                      Kategori
                    </th>
                    <th className="text-right py-3 px-4 text-[11px] font-bold text-amber-800 uppercase tracking-wider">
                      Anggaran
                    </th>
                    <th className="text-right py-3 px-4 text-[11px] font-bold text-amber-800 uppercase tracking-wider">
                      Realisasi
                    </th>
                    <th className="text-center py-3 px-4 text-[11px] font-bold text-amber-800 uppercase tracking-wider">
                      %
                    </th>
                    <th className="py-3 px-4 text-[11px] font-bold text-amber-800 uppercase tracking-wider w-36">
                      Progress
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {belanjaByKategori.map((cat, idx) => {
                    const isOverspending = cat.realisasi > cat.anggaran;
                    return (
                      <tr
                        key={cat.kategori}
                        className={`border-b border-border/30 hover:bg-amber-50/30 transition-colors ${isOverspending ? "bg-red-50/30" : ""}`}
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            {isOverspending && (
                              <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                            )}
                            <div>
                              <p className="font-medium text-foreground text-xs">
                                {cat.kategori}
                              </p>
                              <p className="text-[10px] text-muted-foreground">
                                {cat.count} akun
                                {isOverspending && (
                                  <span className="text-red-600 font-semibold ml-1">
                                    — Overspending!
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-xs text-foreground">
                          {formatRupiahFull(cat.anggaran)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-xs text-foreground">
                          {formatRupiahFull(cat.realisasi)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Badge
                            className={`text-[10px] px-1.5 py-0 h-5 border ${isOverspending ? "bg-red-100 text-red-800 border-red-200" : getRealisasiBadgeClass(cat.persentase)}`}
                          >
                            {isOverspending
                              ? `+${formatPersentase(cat.persentase - 100)}`
                              : formatPersentase(cat.persentase)}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                              <motion.div
                                className={`h-full rounded-full ${isOverspending ? "bg-red-500" : getRealisasiBarClass(cat.persentase)}`}
                                initial={{ width: 0 }}
                                animate={{
                                  width: `${Math.min(cat.persentase, 100)}%`,
                                }}
                                transition={{
                                  duration: 1,
                                  delay: 0.2 + idx * 0.06,
                                  ease: [0.22, 1, 0.36, 1],
                                }}
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {belanjaByKategori.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="py-8 text-center text-xs text-muted-foreground"
                      >
                        Belum ada data belanja
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════════════════
          5. KINERJA SKPD/OPD
          ═══════════════════════════════════════════════════════════════════════ */}
      <motion.div variants={itemVariants}>
        <Card className="shadow-md border-0 overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: accent }}
              />
              Kinerja SKPD/OPD
              <Badge variant="secondary" className="ml-auto text-[10px]">
                {data.realisasiSkpd.length} SKPD
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Top 5 Best Performing */}
              <div className="rounded-xl border border-emerald-200 overflow-hidden">
                <div className="bg-emerald-700 text-white px-4 py-2.5 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">
                    Realisasi Tertinggi
                  </span>
                </div>
                <div className="divide-y divide-emerald-100">
                  {top5Skpd.map((skpd, idx) => (
                    <div
                      key={skpd.id}
                      className="px-4 py-3 hover:bg-emerald-50/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-emerald-600 w-5 shrink-0">
                          {idx + 1}.
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">
                            {skpd.namaSkpd}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {skpd.kodeSkpd} • {formatRupiah(skpd.realisasi)}
                          </p>
                        </div>
                        <Badge
                          className={`text-[10px] px-2 py-0 h-5 border shrink-0 ${getRealisasiBadgeClass(skpd.persentase)}`}
                        >
                          {formatPersentase(skpd.persentase)}
                        </Badge>
                      </div>
                      <div className="mt-2 ml-8">
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <motion.div
                            className={`h-full rounded-full ${getRealisasiBarClass(skpd.persentase)}`}
                            initial={{ width: 0 }}
                            animate={{
                              width: `${Math.min(skpd.persentase, 100)}%`,
                            }}
                            transition={{
                              duration: 0.8,
                              delay: 0.3 + idx * 0.08,
                              ease: [0.22, 1, 0.36, 1],
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  {top5Skpd.length === 0 && (
                    <div className="px-4 py-6 text-center text-xs text-muted-foreground">
                      Belum ada data
                    </div>
                  )}
                </div>
              </div>

              {/* Top 5 Worst Performing */}
              <div className="rounded-xl border border-red-200 overflow-hidden">
                <div className="bg-red-700 text-white px-4 py-2.5 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">
                    Realisasi Terendah
                  </span>
                </div>
                <div className="divide-y divide-red-100">
                  {bottom5Skpd.map((skpd, idx) => (
                    <div
                      key={skpd.id}
                      className="px-4 py-3 hover:bg-red-50/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-red-600 w-5 shrink-0">
                          {idx + 1}.
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">
                            {skpd.namaSkpd}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {skpd.kodeSkpd} • {formatRupiah(skpd.realisasi)}
                          </p>
                        </div>
                        <Badge
                          className={`text-[10px] px-2 py-0 h-5 border shrink-0 ${getRealisasiBadgeClass(skpd.persentase)}`}
                        >
                          {formatPersentase(skpd.persentase)}
                        </Badge>
                      </div>
                      <div className="mt-2 ml-8">
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <motion.div
                            className={`h-full rounded-full ${getRealisasiBarClass(skpd.persentase)}`}
                            initial={{ width: 0 }}
                            animate={{
                              width: `${Math.min(skpd.persentase, 100)}%`,
                            }}
                            transition={{
                              duration: 0.8,
                              delay: 0.3 + idx * 0.08,
                              ease: [0.22, 1, 0.36, 1],
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  {bottom5Skpd.length === 0 && (
                    <div className="px-4 py-6 text-center text-xs text-muted-foreground">
                      Belum ada data
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════════════════
          6. TREN APBD
          ═══════════════════════════════════════════════════════════════════════ */}
      <motion.div variants={itemVariants}>
        <Card className="shadow-md border-0 overflow-hidden">
          <CardHeader
            className="pb-3 text-white"
            style={{
              background: `linear-gradient(135deg, ${dark}, ${primary})`,
            }}
          >
            <CardTitle className="text-sm font-bold flex items-center gap-2 tracking-wide uppercase">
              <BarChart3 className="w-4 h-4" />
              Tren APBD — Perbandingan Tahunan
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-emerald-50/70">
                    <th className="text-left py-3 px-4 text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                      Tahun
                    </th>
                    <th className="text-right py-3 px-4 text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                      Pendapatan
                    </th>
                    <th className="text-center py-3 px-4 text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                      Pertumbuhan
                    </th>
                    <th className="text-right py-3 px-4 text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                      Belanja
                    </th>
                    <th className="text-center py-3 px-4 text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                      Pertumbuhan
                    </th>
                    <th className="text-right py-3 px-4 text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                      Selisih
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {trendWithGrowth.map((item, idx) => {
                    const selisih = item.pendapatan - item.belanja;
                    const isCurrentYear = item.tahun === tahun;
                    return (
                      <tr
                        key={item.tahun}
                        className={`border-b border-border/30 transition-colors ${isCurrentYear ? "bg-emerald-50/50 font-semibold" : "hover:bg-muted/30"}`}
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            {isCurrentYear && (
                              <Badge className="text-[9px] px-1.5 py-0 h-4 bg-emerald-100 text-emerald-800 border-emerald-200 border">
                                TA
                              </Badge>
                            )}
                            <span className="font-medium text-xs">
                              {item.tahun}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-xs">
                          {formatRupiahFull(item.pendapatan)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {item.pendapatanGrowth !== null ? (
                            <span
                              className={`inline-flex items-center gap-1 text-[11px] font-semibold ${item.pendapatanGrowth >= 0 ? "text-emerald-600" : "text-red-600"}`}
                            >
                              {item.pendapatanGrowth >= 0 ? (
                                <ArrowUpRight className="w-3 h-3" />
                              ) : (
                                <ArrowDownRight className="w-3 h-3" />
                              )}
                              {formatPersentase(Math.abs(item.pendapatanGrowth))}
                            </span>
                          ) : (
                            <span className="text-[11px] text-muted-foreground">
                              —
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-xs">
                          {formatRupiahFull(item.belanja)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {item.belanjaGrowth !== null ? (
                            <span
                              className={`inline-flex items-center gap-1 text-[11px] font-semibold ${item.belanjaGrowth >= 0 ? "text-amber-600" : "text-emerald-600"}`}
                            >
                              {item.belanjaGrowth >= 0 ? (
                                <ArrowUpRight className="w-3 h-3" />
                              ) : (
                                <ArrowDownRight className="w-3 h-3" />
                              )}
                              {formatPersentase(Math.abs(item.belanjaGrowth))}
                            </span>
                          ) : (
                            <span className="text-[11px] text-muted-foreground">
                              —
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span
                            className={`font-mono text-xs font-semibold ${selisih >= 0 ? "text-emerald-600" : "text-red-600"}`}
                          >
                            {selisih >= 0 ? "+" : "-"}
                            {formatRupiahFull(Math.abs(selisih))}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {trendWithGrowth.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="py-8 text-center text-xs text-muted-foreground"
                      >
                        Belum ada data tren APBD
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════════════════
          7. KESIMPULAN & REKOMENDASI
          ═══════════════════════════════════════════════════════════════════════ */}
      <motion.div variants={itemVariants}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Kesimpulan */}
          <Card className="shadow-md border-0 overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Target className="w-4 h-4 text-emerald-600" />
                Kesimpulan
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              {insights.map((insight, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + idx * 0.1, duration: 0.4 }}
                  className={`flex items-start gap-3 p-3 rounded-lg border ${
                    insight.type === "success"
                      ? "bg-emerald-50 border-emerald-200"
                      : insight.type === "warning"
                        ? "bg-amber-50 border-amber-200"
                        : "bg-blue-50 border-blue-200"
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    {insight.type === "success" && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    )}
                    {insight.type === "warning" && (
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                    )}
                    {insight.type === "info" && (
                      <Shield className="w-4 h-4 text-blue-600" />
                    )}
                  </div>
                  <p
                    className={`text-xs leading-relaxed ${
                      insight.type === "success"
                        ? "text-emerald-800"
                        : insight.type === "warning"
                          ? "text-amber-800"
                          : "text-blue-800"
                    }`}
                  >
                    {insight.text}
                  </p>
                </motion.div>
              ))}
            </CardContent>
          </Card>

          {/* Rekomendasi */}
          <Card className="shadow-md border-0 overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-amber-500" />
                Rekomendasi
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              {recommendations.map((rec, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + idx * 0.1, duration: 0.4 }}
                  className="flex items-start gap-3 p-3 rounded-lg bg-amber-50/50 border border-amber-200/60"
                >
                  <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[10px] font-bold text-amber-700">
                      {idx + 1}
                    </span>
                  </div>
                  <p className="text-xs text-amber-900 leading-relaxed">
                    {rec}
                  </p>
                </motion.div>
              ))}
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════════════════
          8. TANDA TANGAN
          ═══════════════════════════════════════════════════════════════════════ */}
      <motion.div variants={itemVariants}>
        <Card className="shadow-md border-0 overflow-hidden">
          <CardContent className="p-6 lg:p-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-12">
              {/* Left: Mengetahui */}
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-1">
                  Mengetahui,
                </p>
                <p className="text-sm font-bold text-foreground">
                  Kepala BPKAD
                </p>
                <div className="mt-16 mb-2">
                  <Separator className="bg-foreground/40" />
                </div>
                <p className="text-sm font-bold text-foreground">
                  NIP. ____________________
                </p>
              </div>

              {/* Right: Bupati */}
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-1">
                  Seruyan, {formatIndonesianDate(new Date())}
                </p>
                <p className="text-sm font-bold text-foreground">
                  Bupati Seruyan
                </p>
                <div className="mt-16 mb-2">
                  <Separator className="bg-foreground/40" />
                </div>
                <p className="text-sm font-bold text-foreground">
                  NIP. ____________________
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Print footer - only visible in print */}
      <div className="hidden print:block text-center text-[10px] text-gray-400 mt-6">
        Dokumen ini dicetak dari {pengaturan.namaAplikasi || "Dashboard Keuangan"} —{" "}
        {pengaturan.namaPemerintah || "Pemerintah Kabupaten Seruyan"} —{" "}
        {formatIndonesianDate(new Date())}
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// KPI Card Sub-Component
// ═══════════════════════════════════════════════════════════════════════════════
type KpiCardProps = {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  iconBg: string;
  accentColor: string;
  progressValue?: number;
  progressClass?: string;
  trend?: { value: number; label: string };
  badge?: React.ReactNode;
};

function KpiCard({
  title,
  value,
  subtitle,
  icon,
  iconBg,
  accentColor,
  progressValue,
  progressClass,
  trend,
  badge,
}: KpiCardProps) {
  return (
    <Card className="overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-500 group relative">
      {/* Top accent bar */}
      <div
        className="h-1.5 relative overflow-hidden"
        style={{
          background: `linear-gradient(to right, ${accentColor}, ${accentColor}cc)`,
        }}
      >
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
          animate={{ x: ["-100%", "100%"] }}
          transition={{
            duration: 3,
            repeat: Infinity,
            repeatDelay: 2,
            ease: "linear",
          }}
        />
      </div>

      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              {title}
            </p>
            <div className="flex items-center gap-2 mt-1.5">
              <p className="text-xl lg:text-2xl font-extrabold tracking-tight leading-tight">
                {value}
              </p>
              {badge}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">
              {subtitle}
            </p>
          </div>

          {/* Icon */}
          <div
            className={`${iconBg} p-3 rounded-xl shrink-0 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 relative`}
          >
            {icon}
            <div className="absolute inset-0 rounded-xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          </div>
        </div>

        {/* Trend indicator */}
        {trend && (
          <div className="mt-2 flex items-center gap-1.5">
            {trend.value >= 0 ? (
              <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" />
            ) : (
              <ArrowDownRight className="w-3.5 h-3.5 text-red-500" />
            )}
            <span
              className={`text-[11px] font-semibold ${trend.value >= 0 ? "text-emerald-600" : "text-red-600"}`}
            >
              {trend.value >= 0 ? "+" : ""}
              {formatPersentase(trend.value)}
            </span>
            <span className="text-[10px] text-muted-foreground">
              {trend.label}
            </span>
          </div>
        )}

        {/* Progress bar */}
        {progressValue !== undefined && progressClass && (
          <div className="mt-3 pt-3 border-t border-border/50">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-muted-foreground font-medium">
                Progress
              </span>
              <span className="font-bold text-foreground text-sm">
                {formatPersentase(progressValue)}
              </span>
            </div>
            <div className="h-2.5 bg-muted/80 rounded-full overflow-hidden relative">
              <motion.div
                className={`h-full rounded-full relative ${progressClass}`}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(progressValue, 100)}%` }}
                transition={{
                  duration: 1.5,
                  delay: 0.3,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                  animate={{ x: ["-100%", "100%"] }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatDelay: 3,
                    ease: "linear",
                    delay: 1,
                  }}
                />
              </motion.div>
            </div>
          </div>
        )}
      </CardContent>

      {/* Hover gradient overlay */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500 pointer-events-none rounded-xl"
        style={{
          background: `linear-gradient(135deg, ${accentColor}, transparent)`,
        }}
      />
    </Card>
  );
}
