"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Landmark,
  Award,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Target,
  Banknote,
  PiggyBank,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { DashboardData, formatRupiah, formatRupiahShort, formatPersentase } from "./types";
import { usePengaturan } from "@/context/PengaturanContext";

interface ExecutiveSummaryProps {
  data: DashboardData;
}

export default function ExecutiveSummary({ data }: ExecutiveSummaryProps) {
  const { pengaturan } = usePengaturan();
  const { ringkasan, realisasiSkpd } = data;

  // Calculate derived metrics
  const metrics = useMemo(() => {
    // SILPA = Sisa Lebih Perhitungan Anggaran
    // SILPA Prediksi: annualized projection based on current realization
    const now = new Date();
    const tahun = now.getFullYear();
    const startOfYear = new Date(tahun, 0, 1);
    const dayOfYear = Math.floor((now.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const totalDays = ((tahun % 4 === 0 && tahun % 100 !== 0) || tahun % 400 === 0) ? 366 : 365;
    const yearProgress = data.tahun === tahun ? dayOfYear / totalDays : 1;

    // Annualized prediction
    const predictedPendapatan = yearProgress > 0 ? ringkasan.realisasiPendapatan / yearProgress : ringkasan.realisasiPendapatan;
    const predictedBelanja = yearProgress > 0 ? ringkasan.realisasiBelanja / yearProgress : ringkasan.realisasiBelanja;

    // SILPA = Pendapatan - Belanja (actual)
    const silpaActual = ringkasan.realisasiPendapatan - ringkasan.realisasiBelanja;
    // SILPA Prediksi = Predicted Pendapatan - Predicted Belanja
    const silpaPrediksi = predictedPendapatan - predictedBelanja;
    const silpaPersentase = ringkasan.realisasiPendapatan > 0
      ? (silpaActual / ringkasan.realisasiPendapatan) * 100
      : 0;

    // Cash Position = Realisasi Pendapatan - Realisasi Belanja + Net Pembiayaan
    const cashPosition = ringkasan.realisasiPendapatan - ringkasan.realisasiBelanja + ringkasan.realisasiPembiayaan;

    // OPD rankings from RealisasiSkpd
    const skpdRanked = [...realisasiSkpd]
      .filter((s) => s.anggaran > 0)
      .sort((a, b) => b.persentase - a.persentase);

    const topOpd = skpdRanked.slice(0, 3);
    const bottomOpd = [...skpdRanked].sort((a, b) => a.persentase - b.persentase).slice(0, 3);

    return {
      silpaActual,
      silpaPrediksi,
      silpaPersentase,
      cashPosition,
      yearProgress,
      topOpd,
      bottomOpd,
      predictedPendapatan,
      predictedBelanja,
    };
  }, [ringkasan, realisasiSkpd, data.tahun]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.97 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
    },
  };

  // Get progress bar color based on percentage
  const getProgressColor = (pct: number) => {
    if (pct >= 90) return "bg-emerald-500";
    if (pct >= 75) return "bg-amber-500";
    if (pct >= 50) return "bg-orange-500";
    return "bg-red-500";
  };

  // Get status badge for realization
  const getStatusBadge = (pct: number) => {
    if (pct >= 95) return { label: "Sangat Baik", className: "bg-emerald-100 text-emerald-800 border-emerald-200" };
    if (pct >= 80) return { label: "Baik", className: "bg-emerald-50 text-emerald-700 border-emerald-200" };
    if (pct >= 60) return { label: "Cukup", className: "bg-amber-100 text-amber-800 border-amber-200" };
    if (pct >= 40) return { label: "Kurang", className: "bg-orange-100 text-orange-800 border-orange-200" };
    return { label: "Sangat Kurang", className: "bg-red-100 text-red-800 border-red-200" };
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-4"
    >
      {/* Section Header */}
      <motion.div variants={itemVariants} className="flex items-center gap-2">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${pengaturan.warnaPrimary}15`, color: pengaturan.warnaPrimary }}
        >
          <Target className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-foreground">Executive Summary</h3>
          <p className="text-[11px] text-muted-foreground">Ringkasan kinerja keuangan daerah</p>
        </div>
      </motion.div>

      {/* 6 Executive Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {/* 1. Realisasi Pendapatan */}
        <motion.div variants={itemVariants}>
          <Card className="relative overflow-hidden border-0 shadow-sm hover:shadow-md transition-shadow">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-green-400" />
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center">
                    <TrendingUp className="w-4.5 h-4.5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Realisasi Pendapatan</p>
                    <p className="text-[10px] text-muted-foreground/70">Hari Ini</p>
                  </div>
                </div>
                <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${getStatusBadge(ringkasan.persentasePendapatan).className}`}>
                  {getStatusBadge(ringkasan.persentasePendapatan).label}
                </Badge>
              </div>
              <p className="text-lg font-bold text-foreground tracking-tight">
                {formatRupiah(ringkasan.realisasiPendapatan)}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Progress
                  value={Math.min(ringkasan.persentasePendapatan, 100)}
                  className="h-1.5 flex-1"
                />
                <span className="text-xs font-mono font-semibold text-emerald-600">
                  {formatPersentase(ringkasan.persentasePendapatan)}
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1.5">
                Anggaran: {formatRupiah(ringkasan.totalPendapatan)}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* 2. Realisasi Belanja */}
        <motion.div variants={itemVariants}>
          <Card className="relative overflow-hidden border-0 shadow-sm hover:shadow-md transition-shadow">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 to-red-400" />
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-lg bg-rose-100 dark:bg-rose-950/40 flex items-center justify-center">
                    <TrendingDown className="w-4.5 h-4.5 text-rose-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Realisasi Belanja</p>
                    <p className="text-[10px] text-muted-foreground/70">Hari Ini</p>
                  </div>
                </div>
                <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${getStatusBadge(ringkasan.persentaseBelanja).className}`}>
                  {getStatusBadge(ringkasan.persentaseBelanja).label}
                </Badge>
              </div>
              <p className="text-lg font-bold text-foreground tracking-tight">
                {formatRupiah(ringkasan.realisasiBelanja)}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Progress
                  value={Math.min(ringkasan.persentaseBelanja, 100)}
                  className="h-1.5 flex-1"
                />
                <span className="text-xs font-mono font-semibold text-rose-600">
                  {formatPersentase(ringkasan.persentaseBelanja)}
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1.5">
                Anggaran: {formatRupiah(ringkasan.totalBelanja)}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* 3. SILPA Prediksi */}
        <motion.div variants={itemVariants}>
          <Card className="relative overflow-hidden border-0 shadow-sm hover:shadow-md transition-shadow">
            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${metrics.silpaActual >= 0 ? "from-blue-500 to-indigo-400" : "from-red-500 to-orange-400"}`} />
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${metrics.silpaActual >= 0 ? "bg-blue-100 dark:bg-blue-950/40" : "bg-red-100 dark:bg-red-950/40"}`}>
                    <PiggyBank className={`w-4.5 h-4.5 ${metrics.silpaActual >= 0 ? "text-blue-600" : "text-red-600"}`} />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">SILPA Prediksi</p>
                    <p className="text-[10px] text-muted-foreground/70">Sisa Lebih Perhitungan Anggaran</p>
                  </div>
                </div>
                <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${metrics.silpaActual >= 0 ? "bg-blue-100 text-blue-800 border-blue-200" : "bg-red-100 text-red-800 border-red-200"}`}>
                  {metrics.silpaActual >= 0 ? "Surplus" : "Defisit"}
                </Badge>
              </div>
              <p className={`text-lg font-bold tracking-tight ${metrics.silpaActual >= 0 ? "text-blue-700 dark:text-blue-400" : "text-red-700 dark:text-red-400"}`}>
                {metrics.silpaActual >= 0 ? "+" : ""}{formatRupiah(metrics.silpaActual)}
              </p>
              <div className="flex items-center gap-1.5 mt-2">
                {metrics.silpaActual >= 0 ? (
                  <ArrowUpRight className="w-3 h-3 text-blue-500" />
                ) : (
                  <ArrowDownRight className="w-3 h-3 text-red-500" />
                )}
                <span className="text-[11px] text-muted-foreground">
                  Prediksi akhir tahun: <span className={`font-medium ${metrics.silpaPrediksi >= 0 ? "text-blue-600" : "text-red-600"}`}>
                    {metrics.silpaPrediksi >= 0 ? "+" : ""}{formatRupiah(metrics.silpaPrediksi)}
                  </span>
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1.5">
                {metrics.silpaActual >= 0
                  ? `${Math.abs(metrics.silpaPersentase).toFixed(1)}% dari realisasi pendapatan`
                  : "Belanja melebihi pendapatan"
                }
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* 4. Cash Position */}
        <motion.div variants={itemVariants}>
          <Card className="relative overflow-hidden border-0 shadow-sm hover:shadow-md transition-shadow">
            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${metrics.cashPosition >= 0 ? "from-teal-500 to-cyan-400" : "from-orange-500 to-amber-400"}`} />
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${metrics.cashPosition >= 0 ? "bg-teal-100 dark:bg-teal-950/40" : "bg-orange-100 dark:bg-orange-950/40"}`}>
                    <Banknote className={`w-4.5 h-4.5 ${metrics.cashPosition >= 0 ? "text-teal-600" : "text-orange-600"}`} />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Cash Position</p>
                    <p className="text-[10px] text-muted-foreground/70">Posisi Kas Bersih</p>
                  </div>
                </div>
                <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${metrics.cashPosition >= 0 ? "bg-teal-100 text-teal-800 border-teal-200" : "bg-orange-100 text-orange-800 border-orange-200"}`}>
                  {metrics.cashPosition >= 0 ? "Positif" : "Negatif"}
                </Badge>
              </div>
              <p className={`text-lg font-bold tracking-tight ${metrics.cashPosition >= 0 ? "text-teal-700 dark:text-teal-400" : "text-orange-700 dark:text-orange-400"}`}>
                {metrics.cashPosition >= 0 ? "+" : ""}{formatRupiah(metrics.cashPosition)}
              </p>
              <div className="mt-2 space-y-1">
                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>Pendapatan</span>
                  <span className="font-medium text-emerald-600">+{formatRupiah(ringkasan.realisasiPendapatan)}</span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>Belanja</span>
                  <span className="font-medium text-rose-600">-{formatRupiah(ringkasan.realisasiBelanja)}</span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>Pembiayaan Net</span>
                  <span className={`font-medium ${ringkasan.realisasiPembiayaan >= 0 ? "text-blue-600" : "text-red-600"}`}>
                    {ringkasan.realisasiPembiayaan >= 0 ? "+" : ""}{formatRupiah(ringkasan.realisasiPembiayaan)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* 5. OPD Terbaik */}
        <motion.div variants={itemVariants}>
          <Card className="relative overflow-hidden border-0 shadow-sm hover:shadow-md transition-shadow">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-yellow-400" />
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-lg bg-amber-100 dark:bg-amber-950/40 flex items-center justify-center">
                    <Award className="w-4.5 h-4.5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">OPD Terbaik</p>
                    <p className="text-[10px] text-muted-foreground/70">Kinerja Realisasi Tertinggi</p>
                  </div>
                </div>
              </div>
              <div className="space-y-2 max-h-[120px] overflow-y-auto custom-scrollbar">
                {metrics.topOpd.length > 0 ? (
                  metrics.topOpd.map((skpd, idx) => (
                    <div key={skpd.id} className="flex items-center gap-2">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white ${idx === 0 ? "bg-amber-500" : idx === 1 ? "bg-amber-400" : "bg-amber-300"}`}>
                        {idx + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground truncate">
                          {skpd.namaSkpd}
                        </p>
                      </div>
                      <span className="text-[11px] font-mono font-semibold text-emerald-600 shrink-0">
                        {formatPersentase(skpd.persentase)}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-[11px] text-muted-foreground text-center py-4">Belum ada data OPD</p>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* 6. OPD Terburuk */}
        <motion.div variants={itemVariants}>
          <Card className="relative overflow-hidden border-0 shadow-sm hover:shadow-md transition-shadow">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 to-rose-400" />
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-lg bg-red-100 dark:bg-red-950/40 flex items-center justify-center">
                    <AlertTriangle className="w-4.5 h-4.5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">OPD Terburuk</p>
                    <p className="text-[10px] text-muted-foreground/70">Perlu Perhatian Khusus</p>
                  </div>
                </div>
              </div>
              <div className="space-y-2 max-h-[120px] overflow-y-auto custom-scrollbar">
                {metrics.bottomOpd.length > 0 ? (
                  metrics.bottomOpd.map((skpd, idx) => (
                    <div key={skpd.id} className="flex items-center gap-2">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white ${idx === 0 ? "bg-red-500" : idx === 1 ? "bg-red-400" : "bg-red-300"}`}>
                        {idx + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground truncate">
                          {skpd.namaSkpd}
                        </p>
                      </div>
                      <span className={`text-[11px] font-mono font-semibold shrink-0 ${skpd.persentase >= 50 ? "text-amber-600" : "text-red-600"}`}>
                        {formatPersentase(skpd.persentase)}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-[11px] text-muted-foreground text-center py-4">Belum ada data OPD</p>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
