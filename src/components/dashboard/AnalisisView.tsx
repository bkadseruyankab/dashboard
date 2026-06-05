"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldAlert,
  TrendingDown,
  PauseCircle,
  AlertTriangle,
  FileWarning,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle2,
  Info,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Lightbulb,
  Shield,
  BarChart3,
  Clock,
  Loader2,
  X,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  formatRupiah,
  formatRupiahFull,
  formatRupiahShort,
  formatPersentase,
  safePercentage,
} from "./types";
import { usePengaturan } from "@/context/PengaturanContext";

// ─── Types ────────────────────────────────────────────────────────────────────

type Risiko = "Rendah" | "Sedang" | "Tinggi";

interface Temuan {
  id: string;
  namaAkun: string;
  kodeAkun: string;
  jenis: "Pendapatan" | "Belanja";
  anggaran: number;
  realisasi: number;
  persentase: number;
  gap: number;
  opdNama: string | null;
  risiko: Risiko;
  rekomendasi: string;
}

interface KategoriTemuan {
  id: string;
  nama: string;
  deskripsi: string;
  icon: string;
  warna: string;
  temuan: Temuan[];
}

interface AnalisisData {
  tahun: number;
  ringkasan: {
    totalTemuan: number;
    risikoRendah: number;
    risikoSedang: number;
    risikoTinggi: number;
  };
  kategori: KategoriTemuan[];
}

// ─── Icon Map ─────────────────────────────────────────────────────────────────

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  TrendingDown,
  PauseCircle,
  AlertTriangle,
  ShieldAlert,
  FileWarning,
};

// ─── Animation Variants ───────────────────────────────────────────────────────

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getRisikoBadge(risiko: Risiko) {
  switch (risiko) {
    case "Tinggi":
      return {
        className:
          "bg-red-100 text-red-800 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800",
        dotClass: "bg-red-500",
        label: "Tinggi",
      };
    case "Sedang":
      return {
        className:
          "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
        dotClass: "bg-amber-500",
        label: "Sedang",
      };
    case "Rendah":
      return {
        className:
          "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
        dotClass: "bg-emerald-500",
        label: "Rendah",
      };
  }
}

function getRisikoBarClass(risiko: Risiko) {
  switch (risiko) {
    case "Tinggi":
      return "bg-red-500";
    case "Sedang":
      return "bg-amber-500";
    case "Rendah":
      return "bg-emerald-500";
  }
}

function getKategoriGradient(id: string): { from: string; to: string; accent: string } {
  switch (id) {
    case "anggaran-besar-rendah":
      return { from: "from-orange-600", to: "to-amber-500", accent: "orange" };
    case "kegiatan-tidak-bergerak":
      return { from: "from-red-700", to: "to-rose-500", accent: "red" };
    case "potensi-penumpukan":
      return { from: "from-yellow-600", to: "to-amber-500", accent: "yellow" };
    case "belanja-tidak-wajar":
      return { from: "from-purple-700", to: "to-violet-500", accent: "purple" };
    case "potensi-temuan-bpk":
      return { from: "from-rose-700", to: "to-red-500", accent: "rose" };
    default:
      return { from: "from-slate-600", to: "to-slate-500", accent: "slate" };
  }
}

// ─── Sub-Components ───────────────────────────────────────────────────────────

function RisikoGauge({ ringkasan }: { ringkasan: AnalisisData["ringkasan"] }) {
  const { pengaturan } = usePengaturan();
  const total = ringkasan.totalTemuan || 1;
  const tinggiPct = (ringkasan.risikoTinggi / total) * 100;
  const sedangPct = (ringkasan.risikoSedang / total) * 100;
  const rendahPct = (ringkasan.risikoRendah / total) * 100;

  // Overall risk level
  const overallRisk: Risiko =
    ringkasan.risikoTinggi > ringkasan.risikoSedang &&
    ringkasan.risikoTinggi > ringkasan.risikoRendah
      ? "Tinggi"
      : ringkasan.risikoSedang > ringkasan.risikoRendah
        ? "Sedang"
        : "Rendah";

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {/* Overall Risk */}
      <motion.div variants={itemVariants}>
        <Card className="relative overflow-hidden border-0 shadow-sm hover:shadow-md transition-shadow">
          <div
            className="absolute top-0 left-0 right-0 h-1"
            style={{
              background: `linear-gradient(to right, ${pengaturan.warnaPrimary}, ${pengaturan.warnaAccent})`,
            }}
          />
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${pengaturan.warnaPrimary}15` }}
              >
                <ShieldAlert
                  className="w-4 h-4"
                  style={{ color: pengaturan.warnaPrimary }}
                />
              </div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Risiko Keseluruhan
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                className={`text-xs font-bold px-2.5 py-0.5 border ${getRisikoBadge(overallRisk).className}`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${getRisikoBadge(overallRisk).dotClass} mr-1.5`}
                />
                {overallRisk}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Total Temuan */}
      <motion.div variants={itemVariants}>
        <Card className="relative overflow-hidden border-0 shadow-sm hover:shadow-md transition-shadow">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-slate-500 to-slate-400" />
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-slate-600" />
              </div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Total Temuan
              </p>
            </div>
            <p className="text-2xl font-bold text-foreground">{ringkasan.totalTemuan}</p>
            <p className="text-[10px] text-muted-foreground">item teridentifikasi</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tinggi */}
      <motion.div variants={itemVariants}>
        <Card className="relative overflow-hidden border-0 shadow-sm hover:shadow-md transition-shadow">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 to-rose-400" />
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-950/40 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-red-600" />
              </div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Risiko Tinggi
              </p>
            </div>
            <p className="text-2xl font-bold text-red-600">{ringkasan.risikoTinggi}</p>
            <div className="flex items-center gap-1 mt-1">
              <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-red-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${tinggiPct}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </div>
              <span className="text-[10px] font-mono text-muted-foreground">
                {tinggiPct.toFixed(0)}%
              </span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Sedang + Rendah */}
      <motion.div variants={itemVariants}>
        <Card className="relative overflow-hidden border-0 shadow-sm hover:shadow-md transition-shadow">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-emerald-400" />
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950/40 flex items-center justify-center">
                <Info className="w-4 h-4 text-amber-600" />
              </div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Sedang / Rendah
              </p>
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold text-amber-600">{ringkasan.risikoSedang}</p>
              <span className="text-sm text-muted-foreground">/</span>
              <p className="text-2xl font-bold text-emerald-600">{ringkasan.risikoRendah}</p>
            </div>
            <div className="flex items-center gap-1 mt-1">
              <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden flex">
                <motion.div
                  className="h-full bg-amber-500 rounded-l-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${sedangPct}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
                <motion.div
                  className="h-full bg-emerald-500 rounded-r-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${rendahPct}%` }}
                  transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
                />
              </div>
              <span className="text-[10px] font-mono text-muted-foreground">
                {(sedangPct + rendahPct).toFixed(0)}%
              </span>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

function TemuanCard({ temuan, index }: { temuan: Temuan; index: number }) {
  const [showRekomendasi, setShowRekomendasi] = useState(false);
  const badge = getRisikoBadge(temuan.risiko);

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04, duration: 0.35 }}
      className="group"
    >
      <div className="rounded-lg border border-border/60 bg-card p-3 hover:bg-accent/30 transition-colors">
        <div className="flex items-start gap-3">
          {/* Risk indicator */}
          <div
            className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${badge.dotClass}`}
          />

          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-foreground truncate">
                  {temuan.namaAkun}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] font-mono text-muted-foreground">
                    {temuan.kodeAkun}
                  </span>
                  <Badge
                    variant="outline"
                    className={`text-[9px] px-1 py-0 h-4 border ${
                      temuan.jenis === "Pendapatan"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800"
                        : "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-800"
                    }`}
                  >
                    {temuan.jenis}
                  </Badge>
                  {temuan.opdNama && (
                    <span className="text-[9px] text-muted-foreground truncate">
                      {temuan.opdNama}
                    </span>
                  )}
                </div>
              </div>
              <Badge
                className={`text-[10px] font-bold px-2 py-0 h-5 border shrink-0 ${badge.className}`}
              >
                {temuan.risiko}
              </Badge>
            </div>

            {/* Financial info */}
            <div className="flex items-center gap-3 mt-2">
              <div className="flex-1">
                <div className="flex items-center justify-between text-[10px] mb-1">
                  <span className="text-muted-foreground">Realisasi</span>
                  <span className="font-mono font-semibold">
                    {formatPersentase(temuan.persentase)}
                  </span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${getRisikoBarClass(temuan.risiko)}`}
                    initial={{ width: 0 }}
                    animate={{
                      width: `${Math.min(Math.abs(temuan.persentase), 100)}%`,
                    }}
                    transition={{ duration: 0.6, delay: 0.2 + index * 0.04 }}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 mt-2 text-[10px]">
              <div>
                <span className="text-muted-foreground">Anggaran: </span>
                <span className="font-mono font-medium text-foreground">
                  {formatRupiah(temuan.anggaran)}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Realisasi: </span>
                <span className="font-mono font-medium text-foreground">
                  {formatRupiah(temuan.realisasi)}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Gap: </span>
                <span
                  className={`font-mono font-medium ${temuan.gap > 0 ? "text-red-600" : "text-emerald-600"}`}
                >
                  {formatRupiah(temuan.gap)}
                </span>
              </div>
            </div>

            {/* Recommendation toggle */}
            <button
              onClick={() => setShowRekomendasi(!showRekomendasi)}
              className="flex items-center gap-1 mt-2 text-[10px] font-medium text-primary hover:text-primary/80 transition-colors"
            >
              <Lightbulb className="w-3 h-3" />
              Rekomendasi
              {showRekomendasi ? (
                <ChevronUp className="w-3 h-3" />
              ) : (
                <ChevronDown className="w-3 h-3" />
              )}
            </button>

            <AnimatePresence>
              {showRekomendasi && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <div className="mt-1.5 p-2.5 rounded-md bg-primary/5 border border-primary/10">
                    <p className="text-[11px] text-foreground leading-relaxed">
                      {temuan.rekomendasi}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function KategoriSection({
  kategori,
  defaultExpanded,
}: {
  kategori: KategoriTemuan;
  defaultExpanded: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [filterRisiko, setFilterRisiko] = useState<Risiko | "Semua">("Semua");
  const Icon = iconMap[kategori.icon] || AlertTriangle;
  const gradient = getKategoriGradient(kategori.id);

  const filteredTemuan = useMemo(() => {
    if (filterRisiko === "Semua") return kategori.temuan;
    return kategori.temuan.filter((t) => t.risiko === filterRisiko);
  }, [kategori.temuan, filterRisiko]);

  const tinggiCount = kategori.temuan.filter((t) => t.risiko === "Tinggi").length;
  const sedangCount = kategori.temuan.filter((t) => t.risiko === "Sedang").length;
  const rendahCount = kategori.temuan.filter((t) => t.risiko === "Rendah").length;

  return (
    <motion.div variants={itemVariants}>
      <Card className="shadow-md border-0 overflow-hidden">
        {/* Header */}
        <CardHeader
          className="pb-3 text-white cursor-pointer"
          style={{
            background: `linear-gradient(135deg, var(--tw-gradient-stops))`,
          }}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div
            className={`bg-gradient-to-r ${gradient.from} ${gradient.to} -m-6 p-6`}
          >
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold flex items-center gap-2 tracking-wide uppercase">
                <Icon className="w-4 h-4" />
                {kategori.nama}
                <Badge className="bg-white/20 text-white border-0 text-[10px] ml-1">
                  {kategori.temuan.length} temuan
                </Badge>
              </CardTitle>
              <div className="flex items-center gap-2">
                {tinggiCount > 0 && (
                  <span className="text-[10px] font-bold bg-red-500/50 px-1.5 py-0.5 rounded">
                    {tinggiCount} Tinggi
                  </span>
                )}
                {sedangCount > 0 && (
                  <span className="text-[10px] font-bold bg-amber-500/50 px-1.5 py-0.5 rounded">
                    {sedangCount} Sedang
                  </span>
                )}
                {isExpanded ? (
                  <ChevronUp className="w-5 h-5 text-white/70" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-white/70" />
                )}
              </div>
            </div>
            <p className="text-[11px] text-white/70 mt-1 leading-relaxed">
              {kategori.deskripsi}
            </p>
          </div>
        </CardHeader>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <CardContent className="p-4">
                {/* Filter bar */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Filter:
                  </span>
                  {(["Semua", "Tinggi", "Sedang", "Rendah"] as const).map(
                    (filter) => (
                      <button
                        key={filter}
                        onClick={() => setFilterRisiko(filter)}
                        className={`text-[10px] font-medium px-2 py-0.5 rounded-full border transition-all ${
                          filterRisiko === filter
                            ? filter === "Tinggi"
                              ? "bg-red-100 text-red-800 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800"
                              : filter === "Sedang"
                                ? "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800"
                                : filter === "Rendah"
                                  ? "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                                  : "bg-primary/10 text-primary border-primary/20"
                            : "bg-muted/50 text-muted-foreground border-border/50 hover:bg-muted"
                        }`}
                      >
                        {filter === "Semua"
                          ? `Semua (${kategori.temuan.length})`
                          : `${filter} (${
                              filter === "Tinggi"
                                ? tinggiCount
                                : filter === "Sedang"
                                  ? sedangCount
                                  : rendahCount
                            })`}
                      </button>
                    )
                  )}
                </div>

                {/* Temuan list */}
                <div className="space-y-2 max-h-[600px] overflow-y-auto custom-scrollbar pr-1">
                  {filteredTemuan.length > 0 ? (
                    filteredTemuan.map((temuan, idx) => (
                      <TemuanCard key={temuan.id} temuan={temuan} index={idx} />
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <CheckCircle2 className="w-8 h-8 text-emerald-400 mb-2" />
                      <p className="text-sm font-medium text-foreground">
                        Tidak ada temuan
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {filterRisiko === "Semua"
                          ? "Semua item dalam kategori ini dalam kondisi baik."
                          : `Tidak ada temuan dengan risiko ${filterRisiko}.`}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════════════════════

export default function AnalisisView({ tahun }: { tahun: number }) {
  const { pengaturan } = usePengaturan();
  const [data, setData] = useState<AnalisisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedAll, setExpandedAll] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/analisis?tahun=${tahun}`);
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || "Gagal memuat data analisis");
      }
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [tahun]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="relative overflow-hidden rounded-2xl h-40">
          <div
            className="absolute inset-0 animate-pulse"
            style={{
              background: `linear-gradient(135deg, ${pengaturan.warnaPrimary}20, ${pengaturan.warnaAccent}10)`,
            }}
          />
          <div className="relative p-6 flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-white/10 animate-pulse" />
            <div className="space-y-2">
              <div className="h-4 w-48 rounded bg-white/10 animate-pulse" />
              <div className="h-3 w-64 rounded bg-white/5 animate-pulse" />
            </div>
          </div>
        </div>

        {/* Cards skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-28 rounded-xl border border-border/40 bg-card animate-pulse"
            />
          ))}
        </div>

        {/* Category skeleton */}
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-48 rounded-xl border border-border/40 bg-card animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <motion.div
        className="flex flex-col items-center justify-center py-20"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="p-4 rounded-full bg-destructive/10 mb-4">
          <AlertCircle className="w-8 h-8 text-destructive" />
        </div>
        <h3 className="text-lg font-semibold mb-2">
          Gagal Memuat Data Analisis
        </h3>
        <p className="text-sm text-muted-foreground mb-4">{error}</p>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm"
        >
          <RefreshCw className="w-4 h-4" />
          Coba Lagi
        </button>
      </motion.div>
    );
  }

  if (!data) return null;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* ═══════════════════════════════════════════════════════════════════════
          1. HERO BANNER
          ═══════════════════════════════════════════════════════════════════════ */}
      <motion.div variants={itemVariants}>
        <div
          className="relative overflow-hidden rounded-2xl text-white"
          style={{
            background: `linear-gradient(135deg, ${pengaturan.warnaDark}, ${pengaturan.warnaPrimary}, ${pengaturan.warnaPrimary}dd)`,
          }}
        >
          {/* Background decorative elements */}
          <div className="absolute inset-0 opacity-[0.06] pointer-events-none">
            <div className="absolute top-2 left-[10%] w-20 h-20 border-2 border-white rounded-lg rotate-12" />
            <div className="absolute top-12 left-[35%] w-12 h-12 border-2 border-white rounded-full" />
            <div className="absolute bottom-4 left-[55%] w-24 h-14 border-2 border-white rounded-lg -rotate-6" />
            <div className="absolute top-8 right-[15%] w-16 h-16 border-2 border-white rounded-xl rotate-45" />
          </div>

          {/* Shimmer overlay */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.04] to-transparent pointer-events-none"
            animate={{ x: ["-100%", "100%"] }}
            transition={{
              duration: 4,
              repeat: Infinity,
              repeatDelay: 5,
              ease: "linear",
            }}
          />

          <div className="relative px-6 lg:px-10 py-8 lg:py-10">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center shrink-0">
                  <ShieldAlert className="w-7 h-7 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Shield className="w-4 h-4 text-amber-300" />
                    <span className="text-xs font-medium text-emerald-200 uppercase tracking-widest">
                      Analisis Keuangan
                    </span>
                  </div>
                  <h1 className="text-xl lg:text-2xl font-extrabold tracking-wide leading-tight">
                    Analisis Transaksi & Realisasi Anggaran
                  </h1>
                  <p className="text-sm text-emerald-100 mt-1 font-medium">
                    Identifikasi Risiko & Rekomendasi Tindak Lanjut — TA {tahun}
                  </p>
                  <p className="text-xs text-emerald-200/70 mt-0.5">
                    {pengaturan.namaPemerintah}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setExpandedAll(!expandedAll)}
                  variant="outline"
                  size="sm"
                  className="bg-white/10 hover:bg-white/20 border-white/20 text-white text-xs"
                >
                  {expandedAll ? (
                    <>
                      <ChevronUp className="w-3 h-3 mr-1" />
                      Tutup Semua
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3 h-3 mr-1" />
                      Buka Semua
                    </>
                  )}
                </Button>
                <Button
                  onClick={fetchData}
                  variant="outline"
                  size="sm"
                  className="bg-white/10 hover:bg-white/20 border-white/20 text-white text-xs"
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Refresh
                </Button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════════════════
          2. RISK SUMMARY GAUGE
          ═══════════════════════════════════════════════════════════════════════ */}
      <motion.div variants={itemVariants}>
        <RisikoGauge ringkasan={data.ringkasan} />
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════════════════
          3. CATEGORY SECTIONS
          ═══════════════════════════════════════════════════════════════════════ */}
      {data.kategori.map((kategori, idx) => (
        <KategoriSection
          key={kategori.id}
          kategori={kategori}
          defaultExpanded={expandedAll}
        />
      ))}

      {/* ═══════════════════════════════════════════════════════════════════════
          4. NO FINDINGS MESSAGE
          ═══════════════════════════════════════════════════════════════════════ */}
      {data.ringkasan.totalTemuan === 0 && (
        <motion.div variants={itemVariants}>
          <Card className="shadow-md border-0 overflow-hidden">
            <CardContent className="p-10 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center mb-4">
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">
                Tidak Ada Temuan Risiko
              </h3>
              <p className="text-sm text-muted-foreground max-w-md">
                Semua transaksi dan realisasi anggaran berada dalam kondisi baik
                untuk Tahun Anggaran {tahun}. Tidak ditemukan indikasi risiko
                yang memerlukan perhatian khusus.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}
