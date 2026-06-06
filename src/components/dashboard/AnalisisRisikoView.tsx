"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DashboardData,
  formatRupiahShort,
  formatRupiahFull,
  formatPersentase,
  safePercentage,
} from "./types";
import RupiahCell from "./RupiahCell";
import { usePengaturan } from "@/context/PengaturanContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  AlertOctagon,
  ShieldCheck,
  ShieldAlert,
  TrendingDown,
  Clock,
  BarChart3,
  ChevronDown,
  ChevronUp,
  Filter,
  Search,
  Zap,
  Target,
  Activity,
  FileWarning,
  Landmark,
  CircleDot,
  ChevronRight,
  RefreshCw,
  Info,
  ArrowUpRight,
  ArrowDownRight,
  CircleAlert,
  CheckCircle2,
  XCircle,
} from "lucide-react";

type RiskLevel = "Rendah" | "Sedang" | "Tinggi";

type RiskFinding = {
  id: string;
  kategori: string;
  judul: string;
  deskripsi: string;
  risiko: RiskLevel;
  skorRisiko: number;
  rekomendasi: string;
  opdNama?: string;
  detail: {
    kodeAkun?: string;
    namaAkun?: string;
    namaSkpd?: string;
    kodeSkpd?: string;
    opdNama?: string;
    jenis: string;
    anggaran: number;
    realisasi: number;
    persentase: number;
    selisih: number;
  };
};

type AnalisisData = {
  tahun: number;
  tanggalAnalisis: string;
  ringkasanRisiko: {
    tinggi: number;
    sedang: number;
    rendah: number;
    totalTemuan: number;
    skorKeseluruhan: number;
    levelKeseluruhan: RiskLevel;
  };
  temuan: RiskFinding[];
  indikator: {
    label: string;
    nilai: number | string;
    satuan: string;
    risiko: RiskLevel;
  }[];
  opdList: { id: string; kodeOpd: string; namaOpd: string }[];
};

type AnalisisRisikoViewProps = {
  data: DashboardData;
};

function getRiskBadgeClass(level: RiskLevel): string {
  switch (level) {
    case "Tinggi":
      return "bg-red-100 text-red-800 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800";
    case "Sedang":
      return "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800";
    case "Rendah":
      return "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800";
  }
}

function getRiskBgClass(level: RiskLevel): string {
  switch (level) {
    case "Tinggi":
      return "from-red-500 to-rose-600";
    case "Sedang":
      return "from-amber-500 to-orange-500";
    case "Rendah":
      return "from-emerald-500 to-green-600";
  }
}

function getRiskIcon(level: RiskLevel) {
  switch (level) {
    case "Tinggi":
      return AlertOctagon;
    case "Sedang":
      return AlertTriangle;
    case "Rendah":
      return ShieldCheck;
  }
}

function getKategoriIcon(kategori: string) {
  if (kategori.includes("Anggaran Besar")) return TrendingDown;
  if (kategori.includes("Tidak Bergerak")) return Clock;
  if (kategori.includes("Penumpukan")) return BarChart3;
  if (kategori.includes("Tidak Wajar")) return FileWarning;
  if (kategori.includes("BPK")) return ShieldAlert;
  return CircleDot;
}

function getKategoriColor(kategori: string): string {
  if (kategori.includes("Anggaran Besar")) return "from-violet-500 to-purple-600";
  if (kategori.includes("Tidak Bergerak")) return "from-slate-500 to-gray-600";
  if (kategori.includes("Penumpukan")) return "from-amber-500 to-orange-500";
  if (kategori.includes("Tidak Wajar")) return "from-red-500 to-rose-600";
  if (kategori.includes("BPK")) return "from-rose-600 to-red-700";
  return "from-slate-500 to-gray-600";
}

export default function AnalisisRisikoView({ data }: AnalisisRisikoViewProps) {
  const { pengaturan } = usePengaturan();
  const [analisisData, setAnalisisData] = useState<AnalisisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterRisiko, setFilterRisiko] = useState<string>("semua");
  const [filterKategori, setFilterKategori] = useState<string>("semua");
  const [filterOpd, setFilterOpd] = useState<string>("semua");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchAnalisis = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/dashboard/analisis-risiko?tahun=${data.tahun}`);
        if (!res.ok) throw new Error("Gagal memuat data analisis");
        const json = await res.json();
        setAnalisisData(json);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };
    fetchAnalisis();
  }, [data.tahun]);

  if (loading) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton />
      </div>
    );
  }

  if (error || !analisisData) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="p-4 rounded-full bg-destructive/10 mb-4">
          <AlertTriangle className="w-8 h-8 text-destructive" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Gagal Memuat Analisis</h3>
        <p className="text-sm text-muted-foreground mb-4">{error}</p>
        <Button
          onClick={() => window.location.reload()}
          className="flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Coba Lagi
        </Button>
      </div>
    );
  }

  const { ringkasanRisiko, temuan, indikator } = analisisData;

  // Unique categories for filter
  const kategoriList = [...new Set(temuan.map((t) => t.kategori))];
  const opdList = analisisData.opdList || [];

  // Filter findings
  const filteredTemuan = temuan.filter((t) => {
    if (filterRisiko !== "semua" && t.risiko !== filterRisiko) return false;
    if (filterKategori !== "semua" && t.kategori !== filterKategori) return false;
    if (filterOpd !== "semua") {
      const selectedOpdNama = opdList.find(o => o.id === filterOpd)?.namaOpd;
      if (selectedOpdNama && t.opdNama !== selectedOpdNama && t.detail.namaSkpd !== selectedOpdNama) return false;
    }
    if (
      searchTerm &&
      !t.judul.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !t.deskripsi.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !(t.detail.namaAkun?.toLowerCase().includes(searchTerm.toLowerCase())) &&
      !(t.detail.namaSkpd?.toLowerCase().includes(searchTerm.toLowerCase())) &&
      !(t.opdNama?.toLowerCase().includes(searchTerm.toLowerCase()))
    )
      return false;
    return true;
  });

  // Current date info
  const now = new Date();
  const months = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember",
  ];
  const todayStr = `${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;

  // Card animation variants
  const cardVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.97 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        delay: 0.05 + i * 0.06,
        duration: 0.5,
        ease: [0.22, 1, 0.36, 1],
      },
    }),
  };

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
        {/* Background decorations */}
        <div className="absolute -right-16 -top-16 w-56 h-56 border border-white/10 rounded-full" />
        <div className="absolute -right-8 -top-8 w-36 h-36 border border-white/[0.06] rounded-full" />
        <div className="absolute w-40 h-40 bg-white/5 rounded-full blur-2xl -right-10 top-1/2 -translate-y-1/2" />

        <div className="relative flex flex-col sm:flex-row items-center gap-5">
          <div className="shrink-0">
            <div className="w-14 h-14 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
              <ShieldAlert className="w-7 h-7 text-white" />
            </div>
          </div>
          <div className="text-center sm:text-left flex-1">
            <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
              <Zap className="w-4 h-4 text-yellow-300" />
              <span className="text-xs font-medium text-emerald-200 uppercase tracking-widest">
                Analisis Risiko
              </span>
              <Zap className="w-4 h-4 text-yellow-300" />
            </div>
            <h2 className="text-xl lg:text-2xl font-extrabold tracking-wide">
              Analisis Risiko Keuangan Daerah
            </h2>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-2">
              <span className="flex items-center gap-1.5 text-xs text-emerald-200 bg-white/10 rounded-full px-3 py-1">
                <Clock className="w-3.5 h-3.5" />
                {todayStr}
              </span>
              <span className="flex items-center gap-1.5 text-xs text-emerald-200 bg-white/10 rounded-full px-3 py-1">
                <Landmark className="w-3.5 h-3.5" />
                TA {data.tahun}
              </span>
              <Badge
                className={`text-xs ${getRiskBadgeClass(ringkasanRisiko.levelKeseluruhan)}`}
                variant="outline"
              >
                Risiko {ringkasanRisiko.levelKeseluruhan} — Skor {ringkasanRisiko.skorKeseluruhan}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* ====== RISK SUMMARY CARDS ====== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Overall Risk Score */}
        <motion.div custom={0} variants={cardVariants} initial="hidden" animate="visible">
          <Card className="overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 h-full">
            <div
              className="h-1.5"
              style={{
                background: `linear-gradient(to right, ${pengaturan.warnaPrimary}, ${pengaturan.warnaSecondary})`,
              }}
            />
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Skor Risiko Keseluruhan
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span
                      className={`text-3xl font-extrabold ${
                        ringkasanRisiko.levelKeseluruhan === "Tinggi"
                          ? "text-red-600"
                          : ringkasanRisiko.levelKeseluruhan === "Sedang"
                            ? "text-amber-600"
                            : "text-emerald-600"
                      }`}
                    >
                      {ringkasanRisiko.skorKeseluruhan}
                    </span>
                    <span className="text-sm text-muted-foreground">/100</span>
                  </div>
                </div>
                <div
                  className={`p-3 rounded-xl shrink-0 shadow-lg bg-gradient-to-br ${getRiskBgClass(
                    ringkasanRisiko.levelKeseluruhan
                  )}`}
                >
                  {(() => {
                    const Icon = getRiskIcon(ringkasanRisiko.levelKeseluruhan);
                    return <Icon className="w-6 h-6 text-white" />;
                  })()}
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-border/50">
                <div className="h-3 bg-muted/80 rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${
                      ringkasanRisiko.skorKeseluruhan >= 70
                        ? "bg-red-500"
                        : ringkasanRisiko.skorKeseluruhan >= 40
                          ? "bg-amber-500"
                          : "bg-emerald-500"
                    }`}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(ringkasanRisiko.skorKeseluruhan, 100)}%` }}
                    transition={{ duration: 1.2, delay: 0.3 }}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground mt-1.5">
                  Level: <span className="font-bold">{ringkasanRisiko.levelKeseluruhan}</span> — {ringkasanRisiko.totalTemuan} temuan ditemukan
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* High Risk Count */}
        <motion.div custom={1} variants={cardVariants} initial="hidden" animate="visible">
          <Card className="overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 h-full">
            <div className="h-1.5 bg-gradient-to-r from-red-500 to-rose-600" />
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Risiko Tinggi
                  </p>
                  <div className="text-3xl font-extrabold text-red-600 mt-1.5">
                    {ringkasanRisiko.tinggi}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    temuan kritis
                  </p>
                </div>
                <div className="bg-gradient-to-br from-red-400 to-rose-600 p-3 rounded-xl shrink-0 shadow-lg">
                  <AlertOctagon className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-border/50">
                <p className="text-[10px] text-muted-foreground">
                  Perlu tindakan segera dan pengawasan ketat
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Medium Risk Count */}
        <motion.div custom={2} variants={cardVariants} initial="hidden" animate="visible">
          <Card className="overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 h-full">
            <div className="h-1.5 bg-gradient-to-r from-amber-500 to-orange-500" />
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Risiko Sedang
                  </p>
                  <div className="text-3xl font-extrabold text-amber-600 mt-1.5">
                    {ringkasanRisiko.sedang}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    temuan perlu perhatian
                  </p>
                </div>
                <div className="bg-gradient-to-br from-amber-400 to-orange-500 p-3 rounded-xl shrink-0 shadow-lg">
                  <AlertTriangle className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-border/50">
                <p className="text-[10px] text-muted-foreground">
                  Perlu monitoring dan tindak lanjut terjadwal
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Low Risk Count */}
        <motion.div custom={3} variants={cardVariants} initial="hidden" animate="visible">
          <Card className="overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 h-full">
            <div className="h-1.5 bg-gradient-to-r from-emerald-500 to-green-600" />
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Risiko Rendah
                  </p>
                  <div className="text-3xl font-extrabold text-emerald-600 mt-1.5">
                    {ringkasanRisiko.rendah}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    temuan minor
                  </p>
                </div>
                <div className="bg-gradient-to-br from-emerald-400 to-green-600 p-3 rounded-xl shrink-0 shadow-lg">
                  <ShieldCheck className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-border/50">
                <p className="text-[10px] text-muted-foreground">
                  Cukup dipantau secara berkala
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* ====== INDICATORS ====== */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
      >
        <Card className="shadow-lg border-0 overflow-hidden">
          <div
            className="text-white px-6 py-4"
            style={{
              background: `linear-gradient(135deg, ${pengaturan.warnaPrimary}, ${pengaturan.warnaSecondary})`,
            }}
          >
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              <h3 className="text-base font-bold uppercase tracking-wide">
                Indikator Risiko
              </h3>
            </div>
            <p className="text-xs text-emerald-100 mt-1">
              Ringkasan indikator kunci — TA {data.tahun}
            </p>
          </div>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
              {indikator.map((ind, idx) => {
                const RiskIcon = getRiskIcon(ind.risiko);
                return (
                  <motion.div
                    key={ind.label}
                    custom={idx}
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
                    className="rounded-xl border border-border/50 p-3 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center gap-1.5 mb-2">
                      <RiskIcon
                        className={`w-3.5 h-3.5 ${
                          ind.risiko === "Tinggi"
                            ? "text-red-500"
                            : ind.risiko === "Sedang"
                              ? "text-amber-500"
                              : "text-emerald-500"
                        }`}
                      />
                      <span className="text-[10px] text-muted-foreground font-medium uppercase truncate">
                        {ind.label}
                      </span>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span
                        className={`text-xl font-extrabold ${
                          ind.risiko === "Tinggi"
                            ? "text-red-600"
                            : ind.risiko === "Sedang"
                              ? "text-amber-600"
                              : "text-emerald-600"
                        }`}
                      >
                        {typeof ind.nilai === "number"
                          ? ind.nilai % 1 !== 0
                            ? ind.nilai.toFixed(1)
                            : ind.nilai
                          : ind.nilai}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {ind.satuan}
                      </span>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-[9px] px-1.5 py-0 mt-1.5 ${getRiskBadgeClass(ind.risiko)}`}
                    >
                      {ind.risiko}
                    </Badge>
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ====== FILTERS ====== */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="shadow-md border-0">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                <Filter className="w-4 h-4" />
                Filter Temuan
              </div>
              <div className="flex flex-wrap gap-3 flex-1">
                {/* Risk Level Filter */}
                <Select value={filterRisiko} onValueChange={setFilterRisiko}>
                  <SelectTrigger className="w-[160px] h-9 text-sm">
                    <SelectValue placeholder="Level Risiko" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="semua">Semua Risiko</SelectItem>
                    <SelectItem value="Tinggi">🔴 Tinggi</SelectItem>
                    <SelectItem value="Sedang">🟡 Sedang</SelectItem>
                    <SelectItem value="Rendah">🟢 Rendah</SelectItem>
                  </SelectContent>
                </Select>

                {/* Category Filter */}
                <Select value={filterKategori} onValueChange={setFilterKategori}>
                  <SelectTrigger className="w-[240px] h-9 text-sm">
                    <SelectValue placeholder="Kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="semua">Semua Kategori</SelectItem>
                    {kategoriList.map((k) => (
                      <SelectItem key={k} value={k}>
                        {k}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* OPD Filter */}
                <Select value={filterOpd} onValueChange={setFilterOpd}>
                  <SelectTrigger className="w-[240px] h-9 text-sm">
                    <SelectValue placeholder="OPD" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="semua">Semua OPD</SelectItem>
                    {opdList.map((o) => (
                      <SelectItem key={o.id} value={o.id}>
                        {o.namaOpd}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Search */}
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Cari temuan..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full h-9 pl-8 pr-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                {filteredTemuan.length} dari {temuan.length} temuan
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ====== FINDINGS LIST ====== */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {filteredTemuan.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <Card className="border-0 shadow-md">
                <CardContent className="py-12 text-center">
                  <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                  <h4 className="text-lg font-bold text-emerald-700">
                    Tidak Ada Temuan
                  </h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {filterRisiko !== "semua" || filterKategori !== "semua" || filterOpd !== "semua" || searchTerm
                      ? "Tidak ada temuan yang cocok dengan filter. Coba ubah kriteria pencarian."
                      : "Semua indikator keuangan dalam batas aman."}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            filteredTemuan.map((temuan, idx) => {
              const isExpanded = expandedId === temuan.id;
              const KategoriIcon = getKategoriIcon(temuan.kategori);
              const RiskIcon = getRiskIcon(temuan.risiko);

              return (
                <motion.div
                  key={temuan.id}
                  custom={idx}
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  exit={{ opacity: 0, y: -10 }}
                  layout
                >
                  <Card className="overflow-hidden border-0 shadow-md hover:shadow-lg transition-all duration-300">
                    {/* Risk color bar */}
                    <div
                      className="h-1"
                      style={{
                        background: `linear-gradient(to right, ${
                          temuan.risiko === "Tinggi"
                            ? "#ef4444, #dc2626"
                            : temuan.risiko === "Sedang"
                              ? "#f59e0b, #d97706"
                              : "#10b981, #059669"
                        })`,
                      }}
                    />

                    <CardContent className="p-0">
                      {/* Main row - clickable */}
                      <button
                        onClick={() =>
                          setExpandedId(isExpanded ? null : temuan.id)
                        }
                        className="w-full text-left p-4 hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          {/* Category Icon */}
                          <div
                            className={`w-10 h-10 rounded-lg bg-gradient-to-br ${getKategoriColor(
                              temuan.kategori
                            )} flex items-center justify-center shrink-0 shadow-md`}
                          >
                            <KategoriIcon className="w-5 h-5 text-white" />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <Badge
                                variant="outline"
                                className={`text-[10px] ${getRiskBadgeClass(temuan.risiko)}`}
                              >
                                <RiskIcon className="w-3 h-3 mr-1" />
                                {temuan.risiko} ({temuan.skorRisiko})
                              </Badge>
                              <Badge
                                variant="outline"
                                className="text-[10px] bg-muted/50 text-muted-foreground"
                              >
                                {temuan.kategori}
                              </Badge>
                              {temuan.detail.jenis && (
                                <Badge
                                  variant="outline"
                                  className={`text-[10px] ${
                                    temuan.detail.jenis === "Belanja"
                                      ? "bg-red-50 text-red-700 border-red-200"
                                      : temuan.detail.jenis === "Pendapatan"
                                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                        : temuan.detail.jenis === "SKPD"
                                          ? "bg-blue-50 text-blue-700 border-blue-200"
                                          : "bg-violet-50 text-violet-700 border-violet-200"
                                  }`}
                                >
                                  {temuan.detail.jenis}
                                </Badge>
                              )}
                              {(temuan.opdNama || temuan.detail.opdNama) && (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/30 dark:text-teal-400 dark:border-teal-800"
                                >
                                  <Landmark className="w-3 h-3 mr-1" />
                                  {temuan.opdNama || temuan.detail.opdNama}
                                </Badge>
                              )}
                            </div>
                            <h4 className="text-sm font-bold text-foreground leading-snug">
                              {temuan.judul}
                            </h4>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {temuan.deskripsi}
                            </p>
                          </div>

                          {/* Expand indicator */}
                          <div className="shrink-0 mt-1">
                            {isExpanded ? (
                              <ChevronUp className="w-5 h-5 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-muted-foreground" />
                            )}
                          </div>
                        </div>
                      </button>

                      {/* Expanded detail */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="overflow-hidden"
                          >
                            <div className="px-4 pb-4 border-t border-border/50 pt-4 space-y-4">
                              {/* OPD Name - prominently displayed */}
                              {(temuan.opdNama || temuan.detail.opdNama) && (
                                <div className="flex items-center gap-2 p-3 rounded-lg bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-teal-950/20 dark:to-emerald-950/20 border border-teal-200 dark:border-teal-800">
                                  <Landmark className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                                  <div>
                                    <p className="text-[10px] text-teal-600 dark:text-teal-400 font-medium uppercase">OPD Pengampu</p>
                                    <p className="text-sm font-bold text-teal-800 dark:text-teal-300">{temuan.opdNama || temuan.detail.opdNama}</p>
                                  </div>
                                </div>
                              )}
                              {/* Detail data */}
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {temuan.detail.kodeAkun && (
                                  <div className="bg-muted/30 rounded-lg p-2.5">
                                    <p className="text-[10px] text-muted-foreground font-medium uppercase">
                                      Kode Akun
                                    </p>
                                    <p className="text-sm font-bold mt-0.5 font-mono">
                                      {temuan.detail.kodeAkun}
                                    </p>
                                  </div>
                                )}
                                {temuan.detail.namaSkpd && (
                                  <div className="bg-muted/30 rounded-lg p-2.5">
                                    <p className="text-[10px] text-muted-foreground font-medium uppercase">
                                      SKPD
                                    </p>
                                    <p className="text-sm font-bold mt-0.5 truncate">
                                      {temuan.detail.namaSkpd}
                                    </p>
                                  </div>
                                )}
                                <div className="bg-muted/30 rounded-lg p-2.5">
                                  <p className="text-[10px] text-muted-foreground font-medium uppercase">
                                    Anggaran
                                  </p>
                                  <p className="text-sm font-bold mt-0.5">
                                    <RupiahCell value={temuan.detail.anggaran} />
                                  </p>
                                </div>
                                <div className="bg-muted/30 rounded-lg p-2.5">
                                  <p className="text-[10px] text-muted-foreground font-medium uppercase">
                                    Realisasi
                                  </p>
                                  <p className="text-sm font-bold mt-0.5">
                                    <RupiahCell value={temuan.detail.realisasi} />
                                  </p>
                                </div>
                              </div>

                              {/* Progress bar */}
                              <div>
                                <div className="flex items-center justify-between text-xs mb-1.5">
                                  <span className="text-muted-foreground font-medium">
                                    Persentase Realisasi
                                  </span>
                                  <span className="font-bold text-sm">
                                    {formatPersentase(temuan.detail.persentase)}
                                  </span>
                                </div>
                                <div className="h-3 bg-muted/80 rounded-full overflow-hidden">
                                  <motion.div
                                    className={`h-full rounded-full ${
                                      temuan.detail.persentase >= 90
                                        ? "bg-emerald-500"
                                        : temuan.detail.persentase >= 75
                                          ? "bg-amber-500"
                                          : temuan.detail.persentase >= 50
                                            ? "bg-orange-500"
                                            : "bg-red-500"
                                    }`}
                                    initial={{ width: 0 }}
                                    animate={{
                                      width: `${Math.min(
                                        Math.abs(temuan.detail.persentase),
                                        100
                                      )}%`,
                                    }}
                                    transition={{ duration: 0.8, delay: 0.1 }}
                                  />
                                </div>
                                <div className="flex items-center justify-between mt-1.5">
                                  <span className="text-[10px] text-muted-foreground">
                                    Selisih: {formatRupiahShort(Math.abs(temuan.detail.selisih))}
                                    {temuan.detail.selisih < 0 ? " (lebih)" : ""}
                                  </span>
                                </div>
                              </div>

                              {/* Recommendation */}
                              <div
                                className={`rounded-xl p-4 ${
                                  temuan.risiko === "Tinggi"
                                    ? "bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800"
                                    : temuan.risiko === "Sedang"
                                      ? "bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800"
                                      : "bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800"
                                }`}
                              >
                                <div className="flex items-center gap-2 mb-2">
                                  <Target
                                    className={`w-4 h-4 ${
                                      temuan.risiko === "Tinggi"
                                        ? "text-red-600"
                                        : temuan.risiko === "Sedang"
                                          ? "text-amber-600"
                                          : "text-emerald-600"
                                    }`}
                                  />
                                  <span
                                    className={`text-xs font-bold uppercase ${
                                      temuan.risiko === "Tinggi"
                                        ? "text-red-700"
                                        : temuan.risiko === "Sedang"
                                          ? "text-amber-700"
                                          : "text-emerald-700"
                                    }`}
                                  >
                                    Rekomendasi Tindak Lanjut
                                  </span>
                                </div>
                                <p className="text-sm leading-relaxed text-foreground/90">
                                  {temuan.rekomendasi}
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>

      {/* ====== RISK DISTRIBUTION CHART (simple bar) ====== */}
      {temuan.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.4 }}
        >
          <Card className="shadow-lg border-0 overflow-hidden">
            <div
              className="text-white px-6 py-4"
              style={{
                background: `linear-gradient(135deg, ${pengaturan.warnaPrimary}, ${pengaturan.warnaSecondary})`,
              }}
            >
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                <h3 className="text-base font-bold uppercase tracking-wide">
                  Distribusi Temuan per Kategori
                </h3>
              </div>
            </div>
            <CardContent className="p-4">
              <div className="space-y-4">
                {kategoriList.map((kategori) => {
                  const kategoriTemuan = temuan.filter(
                    (t) => t.kategori === kategori
                  );
                  const tinggiCount = kategoriTemuan.filter(
                    (t) => t.risiko === "Tinggi"
                  ).length;
                  const sedangCount = kategoriTemuan.filter(
                    (t) => t.risiko === "Sedang"
                  ).length;
                  const rendahCount = kategoriTemuan.filter(
                    (t) => t.risiko === "Rendah"
                  ).length;
                  const total = kategoriTemuan.length;
                  const maxTotal = temuan.length;

                  const KIcon = getKategoriIcon(kategori);

                  return (
                    <div key={kategori}>
                      <div className="flex items-center gap-3 mb-2">
                        <div
                          className={`w-8 h-8 rounded-lg bg-gradient-to-br ${getKategoriColor(
                            kategori
                          )} flex items-center justify-center shrink-0`}
                        >
                          <KIcon className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-bold truncate">
                              {kategori}
                            </p>
                            <span className="text-xs text-muted-foreground font-medium shrink-0 ml-2">
                              {total} temuan
                            </span>
                          </div>
                          <div className="flex gap-2 mt-1">
                            {tinggiCount > 0 && (
                              <span className="text-[10px] font-semibold text-red-600 bg-red-50 rounded px-1.5 py-0.5">
                                {tinggiCount} Tinggi
                              </span>
                            )}
                            {sedangCount > 0 && (
                              <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 rounded px-1.5 py-0.5">
                                {sedangCount} Sedang
                              </span>
                            )}
                            {rendahCount > 0 && (
                              <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 rounded px-1.5 py-0.5">
                                {rendahCount} Rendah
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      {/* Stacked bar */}
                      <div className="h-4 bg-muted/50 rounded-full overflow-hidden flex">
                        {tinggiCount > 0 && (
                          <motion.div
                            className="h-full bg-red-500"
                            initial={{ width: 0 }}
                            animate={{
                              width: `${(tinggiCount / maxTotal) * 100}%`,
                            }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                          />
                        )}
                        {sedangCount > 0 && (
                          <motion.div
                            className="h-full bg-amber-500"
                            initial={{ width: 0 }}
                            animate={{
                              width: `${(sedangCount / maxTotal) * 100}%`,
                            }}
                            transition={{ duration: 0.8, delay: 0.3 }}
                          />
                        )}
                        {rendahCount > 0 && (
                          <motion.div
                            className="h-full bg-emerald-500"
                            initial={{ width: 0 }}
                            animate={{
                              width: `${(rendahCount / maxTotal) * 100}%`,
                            }}
                            transition={{ duration: 0.8, delay: 0.4 }}
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}

// ====== LOADING SKELETON ======
function LoadingSkeleton() {
  return (
    <>
      {/* Header skeleton */}
      <div className="h-40 rounded-2xl overflow-hidden">
        <div className="h-full w-full bg-gradient-to-r from-muted/80 to-muted animate-pulse" />
      </div>

      {/* Summary cards skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-36 rounded-xl bg-muted/50 animate-pulse" />
        ))}
      </div>

      {/* Indicators skeleton */}
      <div className="h-48 rounded-xl bg-muted/50 animate-pulse" />

      {/* Filter skeleton */}
      <div className="h-16 rounded-xl bg-muted/50 animate-pulse" />

      {/* Findings skeleton */}
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="h-28 rounded-xl bg-muted/50 animate-pulse" />
      ))}
    </>
  );
}
