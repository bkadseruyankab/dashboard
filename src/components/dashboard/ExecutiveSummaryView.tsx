"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
import RupiahCell from "./RupiahCell";
import { usePengaturan } from "@/context/PengaturanContext";
import { motion, useMotionValue, animate } from "framer-motion";
import { useEffect, useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Trophy,
  AlertTriangle,
  Landmark,
  DollarSign,
  BarChart3,
  Shield,
  Clock,
  Target,
  Zap,
  ChevronRight,
} from "lucide-react";

type ExecutiveSummaryViewProps = {
  data: DashboardData;
};

// Animated counter hook
function useAnimatedCounter(target: number, duration: number = 2) {
  const motionValue = useMotionValue(0);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const controls = animate(motionValue, target, {
      duration,
      ease: [0.22, 1, 0.36, 1],
    });

    const unsubscribe = motionValue.on("change", (v) => {
      setDisplay(v);
    });

    return () => {
      controls.stop();
      unsubscribe();
    };
  }, [target, duration, motionValue]);

  return display;
}

function formatCounterValue(num: number): string {
  if (num >= 1_000_000_000_000)
    return `${(num / 1_000_000_000_000).toFixed(1)} T`;
  if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(1)} M`;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)} Jt`;
  return Math.round(num).toLocaleString("id-ID");
}

// Card animation variants
const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: 0.1 + i * 0.08,
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
};

export default function ExecutiveSummaryView({ data }: ExecutiveSummaryViewProps) {
  const { ringkasan, realisasiSkpd, pembiayaan, tahun } = data;
  const { pengaturan, logoSrc } = usePengaturan();

  // ===== COMPUTED METRICS =====

  // 1. Realisasi Pendapatan
  const realisasiPendapatan = ringkasan.realisasiPendapatan;
  const anggaranPendapatan = ringkasan.totalPendapatan;
  const persentasePendapatan = ringkasan.persentasePendapatan;
  const sisaPendapatan = anggaranPendapatan - realisasiPendapatan;

  // 2. Realisasi Belanja
  const realisasiBelanja = ringkasan.realisasiBelanja;
  const anggaranBelanja = ringkasan.totalBelanja;
  const persentaseBelanja = ringkasan.persentaseBelanja;
  const sisaBelanja = anggaranBelanja - realisasiBelanja;

  // 3. SILPA Prediksi (Sisa Lebih Perhitungan Anggaran)
  // SILPA = Pendapatan - Belanja + Pembiayaan Netto
  const totalPembiayaanMasuk = pembiayaan
    .filter((p) => p.realisasi > 0)
    .reduce((s, p) => s + p.realisasi, 0);
  const totalPembiayaanKeluar = pembiayaan
    .filter((p) => p.realisasi < 0)
    .reduce((s, p) => s + Math.abs(p.realisasi), 0);
  const silpa =
    realisasiPendapatan - realisasiBelanja + totalPembiayaanMasuk - totalPembiayaanKeluar;
  const isSilpaPositive = silpa >= 0;

  // 4. Cash Position (sisa anggaran yang belum direalisasikan)
  const cashPosition = anggaranPendapatan - realisasiBelanja;
  const isCashPositive = cashPosition >= 0;

  // 5 & 6. OPD Rankings
  const sortedSkpd = [...realisasiSkpd].sort(
    (a, b) => b.persentase - a.persentase
  );
  const topOpd = sortedSkpd.slice(0, 5);
  const bottomOpd = [...sortedSkpd]
    .sort((a, b) => a.persentase - b.persentase)
    .slice(0, 5);

  // Get current date in Indonesian
  const today = new Date();
  const months = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember",
  ];
  const todayStr = `${today.getDate()} ${months[today.getMonth()]} ${today.getFullYear()}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.4 }}
      className="space-y-6"
    >
      {/* ====== HEADER ====== */}
      <div
        className="relative overflow-hidden rounded-2xl text-white p-6 lg:p-8"
        style={{
          background: `linear-gradient(135deg, ${pengaturan.warnaPrimary}, ${pengaturan.warnaSecondary}, ${pengaturan.warnaPrimary}dd)`,
        }}
      >
        {/* Background decoration */}
        <div className="absolute -right-16 -top-16 w-56 h-56 border border-white/10 rounded-full" />
        <div className="absolute -right-8 -top-8 w-36 h-36 border border-white/[0.06] rounded-full" />
        <div className="absolute w-40 h-40 bg-white/5 rounded-full blur-2xl -right-10 top-1/2 -translate-y-1/2" />

        <div className="relative flex flex-col sm:flex-row items-center gap-5">
          <div className="shrink-0">
            <div className="w-14 h-14 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
              <BarChart3 className="w-7 h-7 text-white" />
            </div>
          </div>
          <div className="text-center sm:text-left flex-1">
            <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
              <Zap className="w-4 h-4 text-yellow-300" />
              <span className="text-xs font-medium text-emerald-200 uppercase tracking-widest">
                Ringkasan Eksekutif
              </span>
              <Zap className="w-4 h-4 text-yellow-300" />
            </div>
            <h2 className="text-xl lg:text-2xl font-extrabold tracking-wide">
              Executive Summary
            </h2>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-2">
              <span className="flex items-center gap-1.5 text-xs text-emerald-200 bg-white/10 rounded-full px-3 py-1">
                <Clock className="w-3.5 h-3.5" />
                {todayStr}
              </span>
              <span className="flex items-center gap-1.5 text-xs text-emerald-200 bg-white/10 rounded-full px-3 py-1">
                <Landmark className="w-3.5 h-3.5" />
                TA {tahun}
              </span>
              <span className="flex items-center gap-1.5 text-xs text-emerald-200 bg-white/10 rounded-full px-3 py-1">
                <Shield className="w-3.5 h-3.5" />
                {pengaturan.namaInstansi}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ====== 6 KPI METRIC CARDS ====== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {/* 1. Realisasi Pendapatan Hari Ini */}
        <motion.div custom={0} variants={cardVariants} initial="hidden" animate="visible">
          <Card className="overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-500 group relative h-full">
            <div className="h-1.5 bg-gradient-to-r from-emerald-500 to-green-500 relative overflow-hidden">
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                animate={{ x: ["-100%", "100%"] }}
                transition={{ duration: 3, repeat: Infinity, repeatDelay: 2, ease: "linear" }}
              />
            </div>
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Realisasi Pendapatan
                  </p>
                  <div className="text-2xl lg:text-3xl font-extrabold mt-1.5 tracking-tight text-emerald-700 dark:text-emerald-400">
                    Rp {formatCounterValue(useAnimatedCounter(realisasiPendapatan, 2))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatRupiahShort(realisasiPendapatan)}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-emerald-400 to-green-600 p-3 rounded-xl shrink-0 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-border/50">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="text-muted-foreground font-medium">Realisasi</span>
                  <span className="font-bold text-sm">{formatPersentase(persentasePendapatan)}</span>
                </div>
                <div className="h-2.5 bg-muted/80 rounded-full overflow-hidden relative">
                  <motion.div
                    className={`h-full rounded-full ${getRealisasiBarClass(persentasePendapatan)}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(persentasePendapatan, 100)}%` }}
                    transition={{ duration: 1.5, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  />
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[10px] text-muted-foreground">
                    Anggaran: {formatRupiahShort(anggaranPendapatan)}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    Sisa: {formatRupiahShort(Math.abs(sisaPendapatan))}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* 2. Realisasi Belanja Hari Ini */}
        <motion.div custom={1} variants={cardVariants} initial="hidden" animate="visible">
          <Card className="overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-500 group relative h-full">
            <div className="h-1.5 bg-gradient-to-r from-red-500 to-rose-500 relative overflow-hidden">
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                animate={{ x: ["-100%", "100%"] }}
                transition={{ duration: 3, repeat: Infinity, repeatDelay: 2, ease: "linear" }}
              />
            </div>
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Realisasi Belanja
                  </p>
                  <div className="text-2xl lg:text-3xl font-extrabold mt-1.5 tracking-tight text-red-700 dark:text-red-400">
                    Rp {formatCounterValue(useAnimatedCounter(realisasiBelanja, 2))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatRupiahShort(realisasiBelanja)}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-red-400 to-red-600 p-3 rounded-xl shrink-0 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                  <TrendingDown className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-border/50">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="text-muted-foreground font-medium">Realisasi</span>
                  <span className="font-bold text-sm">{formatPersentase(persentaseBelanja)}</span>
                </div>
                <div className="h-2.5 bg-muted/80 rounded-full overflow-hidden relative">
                  <motion.div
                    className={`h-full rounded-full ${getRealisasiBarClass(persentaseBelanja)}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(persentaseBelanja, 100)}%` }}
                    transition={{ duration: 1.5, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  />
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[10px] text-muted-foreground">
                    Anggaran: {formatRupiahShort(anggaranBelanja)}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    Sisa: {formatRupiahShort(Math.abs(sisaBelanja))}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* 3. SILPA Prediksi */}
        <motion.div custom={2} variants={cardVariants} initial="hidden" animate="visible">
          <Card className="overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-500 group relative h-full">
            <div
              className="h-1.5 relative overflow-hidden"
              style={{
                background: isSilpaPositive
                  ? "linear-gradient(to right, #10b981, #059669)"
                  : "linear-gradient(to right, #ef4444, #dc2626)",
              }}
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                animate={{ x: ["-100%", "100%"] }}
                transition={{ duration: 3, repeat: Infinity, repeatDelay: 2, ease: "linear" }}
              />
            </div>
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    SILPA Prediksi
                  </p>
                  <div
                    className={`text-2xl lg:text-3xl font-extrabold mt-1.5 tracking-tight ${
                      isSilpaPositive
                        ? "text-emerald-700 dark:text-emerald-400"
                        : "text-red-700 dark:text-red-400"
                    }`}
                  >
                    {isSilpaPositive ? "" : "-"}Rp{" "}
                    {formatCounterValue(
                      useAnimatedCounter(Math.abs(silpa), 2)
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Sisa Lebih Perhitungan Anggaran
                  </p>
                </div>
                <div
                  className={`p-3 rounded-xl shrink-0 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 ${
                    isSilpaPositive
                      ? "bg-gradient-to-br from-emerald-400 to-green-600"
                      : "bg-gradient-to-br from-red-400 to-red-600"
                  }`}
                >
                  {isSilpaPositive ? (
                    <ArrowUpRight className="w-6 h-6 text-white" />
                  ) : (
                    <ArrowDownRight className="w-6 h-6 text-white" />
                  )}
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-border/50">
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={`text-xs ${
                      isSilpaPositive
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-red-50 text-red-700 border-red-200"
                    }`}
                  >
                    {isSilpaPositive ? (
                      <TrendingUp className="w-3 h-3 mr-1" />
                    ) : (
                      <TrendingDown className="w-3 h-3 mr-1" />
                    )}
                    {isSilpaPositive ? "Surplus" : "Defisit"}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground">
                    = Pendapatan - Belanja + Pembiayaan Netto
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="text-[10px] bg-muted/50 rounded px-1.5 py-0.5">
                    Pendapatan: {formatRupiahShort(realisasiPendapatan)}
                  </span>
                  <span className="text-[10px] bg-muted/50 rounded px-1.5 py-0.5">
                    Belanja: -{formatRupiahShort(realisasiBelanja)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* 4. Cash Position */}
        <motion.div custom={3} variants={cardVariants} initial="hidden" animate="visible">
          <Card className="overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-500 group relative h-full">
            <div
              className="h-1.5 relative overflow-hidden"
              style={{
                background: isCashPositive
                  ? "linear-gradient(to right, #3b82f6, #2563eb)"
                  : "linear-gradient(to right, #f59e0b, #d97706)",
              }}
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                animate={{ x: ["-100%", "100%"] }}
                transition={{ duration: 3, repeat: Infinity, repeatDelay: 2, ease: "linear" }}
              />
            </div>
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Cash Position
                  </p>
                  <div
                    className={`text-2xl lg:text-3xl font-extrabold mt-1.5 tracking-tight ${
                      isCashPositive
                        ? "text-blue-700 dark:text-blue-400"
                        : "text-amber-700 dark:text-amber-400"
                    }`}
                  >
                    {isCashPositive ? "" : "-"}Rp{" "}
                    {formatCounterValue(
                      useAnimatedCounter(Math.abs(cashPosition), 2)
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {isCashPositive
                      ? "Posisi Kas Surplus"
                      : "Posisi Kas Defisit"}
                  </p>
                </div>
                <div
                  className={`p-3 rounded-xl shrink-0 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 ${
                    isCashPositive
                      ? "bg-gradient-to-br from-blue-400 to-blue-600"
                      : "bg-gradient-to-br from-amber-400 to-amber-600"
                  }`}
                >
                  <Wallet className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-border/50">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground">Anggaran Pendapatan</span>
                    <span className="font-medium">{formatRupiahShort(anggaranPendapatan)}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground">Realisasi Belanja</span>
                    <span className="font-medium text-red-600">-{formatRupiahShort(realisasiBelanja)}</span>
                  </div>
                  <div className="h-px bg-border/50 my-1" />
                  <div className="flex items-center justify-between text-[11px] font-bold">
                    <span>Cash Position</span>
                    <span
                      className={
                        isCashPositive ? "text-blue-600" : "text-amber-600"
                      }
                    >
                      {isCashPositive ? "+" : "-"}
                      {formatRupiahShort(Math.abs(cashPosition))}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* 5. OPD Terbaik */}
        <motion.div custom={4} variants={cardVariants} initial="hidden" animate="visible">
          <Card className="overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-500 group relative h-full">
            <div className="h-1.5 bg-gradient-to-r from-yellow-400 to-amber-500 relative overflow-hidden">
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                animate={{ x: ["-100%", "100%"] }}
                transition={{ duration: 3, repeat: Infinity, repeatDelay: 2, ease: "linear" }}
              />
            </div>
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    OPD Terbaik
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Top 5 Realisasi Tertinggi
                  </p>
                </div>
                <div className="bg-gradient-to-br from-yellow-400 to-amber-500 p-2.5 rounded-xl shrink-0 shadow-lg">
                  <Trophy className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="space-y-2.5 max-h-[220px] overflow-y-auto custom-scrollbar">
                {topOpd.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    Belum ada data OPD
                  </p>
                ) : (
                  topOpd.map((opd, idx) => (
                    <div key={opd.id} className="flex items-center gap-2.5">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0 ${
                          idx === 0
                            ? "bg-yellow-500"
                            : idx === 1
                              ? "bg-gray-400"
                              : idx === 2
                                ? "bg-amber-600"
                                : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <p className="text-xs font-medium truncate">
                            {opd.namaSkpd}
                          </p>
                          <Badge
                            variant="outline"
                            className={`text-[10px] shrink-0 ${getRealisasiBadgeClass(opd.persentase)}`}
                          >
                            {formatPersentase(opd.persentase)}
                          </Badge>
                        </div>
                        <div className="h-1.5 bg-muted/80 rounded-full overflow-hidden mt-1">
                          <div
                            className={`h-full rounded-full ${getRealisasiBarClass(opd.persentase)}`}
                            style={{ width: `${Math.min(opd.persentase, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* 6. OPD Terburuk */}
        <motion.div custom={5} variants={cardVariants} initial="hidden" animate="visible">
          <Card className="overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-500 group relative h-full">
            <div className="h-1.5 bg-gradient-to-r from-orange-500 to-red-500 relative overflow-hidden">
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                animate={{ x: ["-100%", "100%"] }}
                transition={{ duration: 3, repeat: Infinity, repeatDelay: 2, ease: "linear" }}
              />
            </div>
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    OPD Terburuk
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Top 5 Realisasi Terendah
                  </p>
                </div>
                <div className="bg-gradient-to-br from-orange-400 to-red-500 p-2.5 rounded-xl shrink-0 shadow-lg">
                  <AlertTriangle className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="space-y-2.5 max-h-[220px] overflow-y-auto custom-scrollbar">
                {bottomOpd.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    Belum ada data OPD
                  </p>
                ) : (
                  bottomOpd.map((opd, idx) => (
                    <div key={opd.id} className="flex items-center gap-2.5">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                          idx === 0
                            ? "bg-red-500 text-white"
                            : idx === 1
                              ? "bg-orange-500 text-white"
                              : idx === 2
                                ? "bg-amber-500 text-white"
                                : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <p className="text-xs font-medium truncate">
                            {opd.namaSkpd}
                          </p>
                          <Badge
                            variant="outline"
                            className={`text-[10px] shrink-0 ${getRealisasiBadgeClass(opd.persentase)}`}
                          >
                            {formatPersentase(opd.persentase)}
                          </Badge>
                        </div>
                        <div className="h-1.5 bg-muted/80 rounded-full overflow-hidden mt-1">
                          <div
                            className={`h-full rounded-full ${getRealisasiBarClass(opd.persentase)}`}
                            style={{ width: `${Math.min(opd.persentase, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* ====== DETAILED BREAKDOWN ====== */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.4 }}
      >
        <Card className="shadow-lg border-0 overflow-hidden">
          {/* Card Header */}
          <div
            className="text-white px-6 py-4"
            style={{
              background: `linear-gradient(135deg, ${pengaturan.warnaPrimary}, ${pengaturan.warnaSecondary})`,
            }}
          >
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              <h3 className="text-base font-bold uppercase tracking-wide">
                Rincian Anggaran & Realisasi
              </h3>
            </div>
            <p className="text-xs text-emerald-100 mt-1">
              Tahun Anggaran {tahun} — {pengaturan.namaPemerintah}
            </p>
          </div>

          <CardContent className="p-0">
            {/* Pendapatan Row */}
            <div className="px-6 py-4 border-b">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                </div>
                <h4 className="text-sm font-bold text-emerald-800 dark:text-emerald-300 uppercase">
                  Pendapatan Daerah
                </h4>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-emerald-50 dark:bg-emerald-950/20 rounded-lg p-3">
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium uppercase">
                    Anggaran
                  </p>
                  <p className="text-sm font-bold mt-0.5">
                    <RupiahCell value={anggaranPendapatan} />
                  </p>
                </div>
                <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-3">
                  <p className="text-[10px] text-blue-600 dark:text-blue-400 font-medium uppercase">
                    Realisasi
                  </p>
                  <p className="text-sm font-bold mt-0.5">
                    <RupiahCell value={realisasiPendapatan} />
                  </p>
                </div>
                <div className="bg-amber-50 dark:bg-amber-950/20 rounded-lg p-3">
                  <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium uppercase">
                    Persentase
                  </p>
                  <p className="text-sm font-bold mt-0.5 flex items-center gap-1.5">
                    {formatPersentase(persentasePendapatan)}
                    <Badge
                      variant="outline"
                      className={`text-[9px] px-1 py-0 ${getRealisasiBadgeClass(persentasePendapatan)}`}
                    >
                      {persentasePendapatan >= 75 ? "Baik" : persentasePendapatan >= 50 ? "Cukup" : "Kurang"}
                    </Badge>
                  </p>
                </div>
              </div>
            </div>

            {/* Belanja Row */}
            <div className="px-6 py-4 border-b">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <TrendingDown className="w-4 h-4 text-red-600" />
                </div>
                <h4 className="text-sm font-bold text-red-800 dark:text-red-300 uppercase">
                  Belanja Daerah
                </h4>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-red-50 dark:bg-red-950/20 rounded-lg p-3">
                  <p className="text-[10px] text-red-600 dark:text-red-400 font-medium uppercase">
                    Anggaran
                  </p>
                  <p className="text-sm font-bold mt-0.5">
                    <RupiahCell value={anggaranBelanja} />
                  </p>
                </div>
                <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-3">
                  <p className="text-[10px] text-blue-600 dark:text-blue-400 font-medium uppercase">
                    Realisasi
                  </p>
                  <p className="text-sm font-bold mt-0.5">
                    <RupiahCell value={realisasiBelanja} />
                  </p>
                </div>
                <div className="bg-amber-50 dark:bg-amber-950/20 rounded-lg p-3">
                  <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium uppercase">
                    Persentase
                  </p>
                  <p className="text-sm font-bold mt-0.5 flex items-center gap-1.5">
                    {formatPersentase(persentaseBelanja)}
                    <Badge
                      variant="outline"
                      className={`text-[9px] px-1 py-0 ${getRealisasiBadgeClass(persentaseBelanja)}`}
                    >
                      {persentaseBelanja >= 75 ? "Baik" : persentaseBelanja >= 50 ? "Cukup" : "Kurang"}
                    </Badge>
                  </p>
                </div>
              </div>
            </div>

            {/* Pembiayaan Row */}
            <div className="px-6 py-4 border-b">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-amber-600" />
                </div>
                <h4 className="text-sm font-bold text-amber-800 dark:text-amber-300 uppercase">
                  Pembiayaan
                </h4>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-amber-50 dark:bg-amber-950/20 rounded-lg p-3">
                  <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium uppercase">
                    Anggaran
                  </p>
                  <p className="text-sm font-bold mt-0.5">
                    <RupiahCell value={ringkasan.totalPembiayaan} />
                  </p>
                </div>
                <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-3">
                  <p className="text-[10px] text-blue-600 dark:text-blue-400 font-medium uppercase">
                    Pembiayaan Masuk
                  </p>
                  <p className="text-sm font-bold mt-0.5">
                    <RupiahCell value={totalPembiayaanMasuk} />
                  </p>
                </div>
                <div className="bg-red-50 dark:bg-red-950/20 rounded-lg p-3">
                  <p className="text-[10px] text-red-600 dark:text-red-400 font-medium uppercase">
                    Pembiayaan Keluar
                  </p>
                  <p className="text-sm font-bold mt-0.5">
                    <RupiahCell value={totalPembiayaanKeluar} />
                  </p>
                </div>
              </div>
            </div>

            {/* SILPA Summary Row */}
            <div
              className="px-6 py-4"
              style={{
                backgroundColor: `${pengaturan.warnaPrimary}08`,
              }}
            >
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{
                        backgroundColor: `${pengaturan.warnaPrimary}15`,
                      }}
                    >
                      <BarChart3
                        className="w-4 h-4"
                        style={{ color: pengaturan.warnaPrimary }}
                      />
                    </div>
                    <h4
                      className="text-sm font-bold uppercase"
                      style={{ color: pengaturan.warnaPrimary }}
                    >
                      SILPA (Sisa Lebih Perhitungan Anggaran)
                    </h4>
                  </div>
                  <p className="text-xs text-muted-foreground ml-10">
                    Pendapatan - Belanja + Pembiayaan Netto
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge
                    variant="outline"
                    className={`text-xs ${getRealisasiBadgeClass(
                      safePercentage(silpa, anggaranPendapatan)
                    )}`}
                  >
                    {safePercentage(silpa, anggaranPendapatan).toFixed(2)}% dari Anggaran
                  </Badge>
                  <div className="text-right">
                    <p
                      className={`text-lg font-extrabold ${
                        isSilpaPositive
                          ? "text-emerald-600"
                          : "text-red-600"
                      }`}
                    >
                      {isSilpaPositive ? "+" : "-"}
                      <RupiahCell value={Math.abs(silpa)} />
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
