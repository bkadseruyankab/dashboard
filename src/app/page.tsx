"use client";

import { useState, useEffect, useCallback } from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import SummaryCards from "@/components/dashboard/SummaryCards";
import PendapatanChart from "@/components/dashboard/PendapatanChart";
import BelanjaChart from "@/components/dashboard/BelanjaChart";
import TrendChart from "@/components/dashboard/TrendChart";
import RealisasiBarChart from "@/components/dashboard/RealisasiBarChart";
import DataTable from "@/components/dashboard/DataTable";
import RealisasiAkunView from "@/components/dashboard/RealisasiAkunView";
import RealisasiSkpdView from "@/components/dashboard/RealisasiSkpdView";
import APBDTable from "@/components/dashboard/APBDTable";
import TransparansiView from "@/components/dashboard/TransparansiView";
import SKPDQuickSummary from "@/components/dashboard/SKPDQuickSummary";
import AccountTable from "@/components/dashboard/AccountTable";
import OpdView from "@/components/dashboard/OpdView";
import ExecutiveSummaryView from "@/components/dashboard/ExecutiveSummaryView";
import AnalisisRisikoView from "@/components/dashboard/AnalisisRisikoView";
import FinancialCopilotView from "@/components/dashboard/FinancialCopilotView";
import {
  DashboardData,
  ActiveView,
  TahunAnggaranItem,
  formatRupiahShort,
} from "@/components/dashboard/types";
import AdminPanel from "@/components/admin/AdminPanel";
import OpdPanel from "@/components/admin/OpdPanel";
import LoginForm from "@/components/auth/LoginForm";
import SetupWizard from "@/components/setup/SetupWizard";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertCircle,
  RefreshCw,
  Clock,
  Info,
  Sparkles,
  TrendingUp,
  Shield,
  BarChart3,
  Eye,
  Activity,
  ChevronRight,
  AlertTriangle,
  BotMessageSquare,
} from "lucide-react";
import { usePengaturan } from "@/context/PengaturanContext";
import { useAuth } from "@/hooks/use-auth";
import { motion, AnimatePresence } from "framer-motion";

export default function Home() {
  const { pengaturan, logoSrc } = usePengaturan();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tahun, setTahun] = useState<number>(0); // 0 = not yet initialized
  const [activeView, setActiveView] = useState<ActiveView>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Setup wizard state
  const [needsSetup, setNeedsSetup] = useState<boolean | null>(null); // null = checking

  const fetchData = useCallback(async (tahunParam: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/dashboard?tahun=${tahunParam}`);
      if (!res.ok) throw new Error("Failed to fetch dashboard data");
      const json = await res.json();
      setData(json);
      // Auto-set tahun to the latest/active year on first load
      if (tahun === 0 && json.tahunList?.length > 0) {
        setTahun(json.tahun);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [tahun]);

  // Check if setup is needed on mount
  useEffect(() => {
    fetch("/api/setup")
      .then((res) => res.json())
      .then((json) => {
        setNeedsSetup(json.needsSetup === true);
      })
      .catch(() => {
        // If error, assume setup is not needed (database exists)
        setNeedsSetup(false);
      });
  }, []);

  useEffect(() => {
    // Don't fetch dashboard data if setup is needed
    if (needsSetup === true || needsSetup === null) return;
    // On first load, fetch the active year from the API
    if (tahun === 0) {
      fetch('/api/dashboard').then(res => res.json()).then(json => {
        if (json.activeTahun) {
          setTahun(json.activeTahun);
        } else if (json.tahun) {
          setTahun(json.tahun);
        }
      }).catch(() => {
        setTahun(2024); // fallback
      });
    } else {
      fetchData(tahun);
    }
  }, [tahun, fetchData, needsSetup]);

  const handleSetupComplete = useCallback(() => {
    setNeedsSetup(false);
    // Reload to refresh all data
    window.location.reload();
  }, []);

  // Listen for quick navigation events from DashboardView
  useEffect(() => {
    const handler = (e: Event) => {
      const customEvent = e as CustomEvent<ActiveView>;
      if (customEvent.detail) {
        setActiveView(customEvent.detail);
      }
    };
    window.addEventListener('navigate-view', handler);
    return () => window.removeEventListener('navigate-view', handler);
  }, []);

  // Show setup wizard if needed (after all hooks)
  if (needsSetup === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-amber-50">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full" />
          <p className="text-sm text-muted-foreground">Memeriksa konfigurasi...</p>
        </div>
      </div>
    );
  }

  if (needsSetup === true) {
    return <SetupWizard onComplete={handleSetupComplete} />;
  }

  const handleTahunChange = (newTahun: number) => {
    setTahun(newTahun);
  };

  const handleViewChange = (view: ActiveView) => {
    setActiveView(view);
  };

  // Helper to get tahun list as numbers for backward compatibility
  const tahunListNumbers = data?.tahunList?.map(t => t.tahun) || [];
  const activeTahunFromData = data?.tahunList?.find(t => t.aktif)?.tahun || tahun;

  const renderContent = () => {
    // Admin/OPD view: show login if not authenticated, panel if authenticated
    if (activeView === "admin") {
      if (authLoading) {
        return (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        );
      }
      if (!isAuthenticated) {
        return <LoginForm />;
      }
      // Show OPD Panel for OPD role, Admin Panel for admin/superadmin/bupati
      if (user?.role === "opd") {
        return <OpdPanel tahun={tahun} tahunList={data?.tahunList || []} />;
      }
      return <AdminPanel tahun={tahun} tahunList={data?.tahunList || []} />;
    }

    if (loading) return <LoadingSkeleton />;
    if (error) return <ErrorState error={error} onRetry={() => fetchData(tahun)} />;
    if (!data) return null;

    switch (activeView) {
      case "dashboard":
        return <DashboardView data={data} />;
      case "ringkasan-eksekutif":
        return <ExecutiveSummaryView data={data} />;
      case "analisis-risiko":
        return <AnalisisRisikoView data={data} />;
      case "copilot":
        return <FinancialCopilotView data={data} />;
      case "apbd":
        return <APBDTable data={data} />;
      case "pendapatan":
        return <PendapatanView data={data} />;
      case "belanja":
        return <BelanjaView data={data} />;
      case "pembiayaan":
        return <PembiayaanView data={data} />;
      case "realisasi-akun":
        return <RealisasiAkunView data={data} />;
      case "realisasi-skpd":
        return <RealisasiSkpdView data={data} />;
      case "opd":
        return <OpdView data={data} />;
      case "transparansi":
        return <TransparansiView data={data} />;
      default:
        return <DashboardView data={data} />;
    }
  };

  // When showing login form for admin, don't show the sidebar/header layout
  if (activeView === "admin" && !authLoading && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <LoginForm />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar
        activeView={activeView}
        onViewChange={handleViewChange}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      <div className="flex-1 flex flex-col min-w-0 lg:ml-[60px]">
        <DashboardHeader
          activeView={activeView}
          tahun={tahun}
          tahunList={data?.tahunList || []}
          activeTahun={activeTahunFromData}
          onTahunChange={handleTahunChange}
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
          onNavigateDashboard={() => setActiveView("dashboard")}
        />

        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeView}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35, ease: "easeInOut" }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Footer */}
        <footer
          className="text-white px-4 lg:px-6 py-3 mt-auto"
          style={{
            background: `linear-gradient(to right, ${pengaturan.warnaPrimary}, ${pengaturan.warnaSecondary})`,
          }}
        >
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <img
                src={logoSrc}
                alt="Logo Kabupaten Seruyan"
                width={24}
                height={24}
                className="w-6 h-6 object-contain"
              />
              <p className="text-xs text-emerald-100">
                © {new Date().getFullYear()} {pengaturan.namaPemerintah}
              </p>
            </div>
            <p className="text-[10px] text-emerald-200/60">
              Dashboard Monitoring Pengelolaan Keuangan Daerah
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}

// ============ FLOATING ORB COMPONENT ============
function FloatingOrb({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={`absolute rounded-full blur-3xl pointer-events-none ${className}`}
      style={style}
    />
  );
}

// ============ DASHBOARD VIEW (MODERN ANIMATED) ============
function DashboardView({ data }: { data: DashboardData }) {
  const { pengaturan, logoSrc } = usePengaturan();
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.97 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
    },
  };

  // Quick navigation items
  const quickNavItems = [
    { id: "ringkasan-eksekutif" as ActiveView, label: "Ringkasan Eksekutif", icon: BarChart3, color: "from-violet-500 to-purple-600", desc: "Executive Summary" },
    { id: "analisis-risiko" as ActiveView, label: "Analisis Risiko", icon: AlertTriangle, color: "from-rose-500 to-red-600", desc: "Risk Analysis" },
    { id: "copilot" as ActiveView, label: "AI Copilot", icon: BotMessageSquare, color: "from-amber-500 to-yellow-600", desc: "Tanya AI Keuangan" },
    { id: "realisasi-skpd" as ActiveView, label: "Realisasi SKPD", icon: TrendingUp, color: "from-teal-500 to-cyan-600", desc: "Per-SKPD/OPD" },
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* ====== HERO BANNER - Modern Animated ====== */}
      <motion.div variants={itemVariants}>
        <div
          className="relative overflow-hidden rounded-2xl text-white p-8 lg:p-10"
          style={{
            background: `linear-gradient(135deg, ${pengaturan.warnaPrimary}, ${pengaturan.warnaSecondary}, ${pengaturan.warnaPrimary}dd)`,
          }}
        >
          {/* Animated background orbs */}
          <FloatingOrb
            className="w-72 h-72 bg-white/5 animate-float-orb-slow"
            style={{ top: '-60px', right: '-40px' }}
          />
          <FloatingOrb
            className="w-48 h-48 bg-white/[0.07] animate-float-orb"
            style={{ bottom: '-30px', left: '10%' }}
          />
          <FloatingOrb
            className="w-32 h-32 bg-white/[0.04] animate-float-orb-fast"
            style={{ top: '20%', right: '30%' }}
          />
          <FloatingOrb
            className="w-24 h-24 bg-yellow-300/10 animate-float-orb-slow"
            style={{ bottom: '10%', right: '15%' }}
          />

          {/* Decorative rotating ring */}
          <div className="absolute -right-20 -top-20 w-60 h-60 border border-white/10 rounded-full animate-rotate-slow" />
          <div className="absolute -right-10 -top-10 w-40 h-40 border border-white/[0.06] rounded-full animate-rotate-slow" style={{ animationDirection: 'reverse' }} />

          {/* Decorative particles */}
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white/30 rounded-full animate-drift"
              style={{
                top: `${15 + i * 15}%`,
                left: `${10 + i * 14}%`,
                animationDelay: `${i * 1.3}s`,
                animationDuration: `${6 + i * 1.5}s`,
              }}
            />
          ))}

          {/* Content */}
          <div className="relative flex flex-col sm:flex-row items-center gap-6">
            {/* Logo */}
            <div className="relative shrink-0">
              <motion.img
                src={logoSrc}
                alt="Logo Kabupaten Seruyan"
                width={80}
                height={80}
                className="w-20 h-20 relative z-10 object-contain drop-shadow-lg"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
              />
            </div>

            <div className="text-center sm:text-left">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                  <Sparkles className="w-4 h-4 text-yellow-300" />
                  <span className="text-xs font-medium text-emerald-200 uppercase tracking-widest">
                    Dashboard Keuangan Daerah
                  </span>
                  <Sparkles className="w-4 h-4 text-yellow-300" />
                </div>
              </motion.div>

              <motion.h2
                className="text-xl lg:text-2xl font-extrabold tracking-wide leading-tight"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
              >
                Anggaran Pendapatan dan Belanja Daerah
              </motion.h2>

              <motion.p
                className="text-sm text-emerald-100 mt-2 font-medium"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                {pengaturan.namaPemerintah} — Tahun Anggaran {data.tahun}
              </motion.p>

              <motion.div
                className="flex flex-wrap items-center justify-center sm:justify-start gap-4 mt-3"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <span className="flex items-center gap-1.5 text-xs text-emerald-200 bg-white/10 rounded-full px-3 py-1 backdrop-blur-sm">
                  <Clock className="w-3.5 h-3.5" />
                  TA {data.tahun}
                </span>
                <span className="flex items-center gap-1.5 text-xs text-emerald-200 bg-white/10 rounded-full px-3 py-1 backdrop-blur-sm">
                  <Info className="w-3.5 h-3.5" />
                  Total APBD: {formatRupiahShort(data.ringkasan.totalAnggaran)}
                </span>
                <span className="flex items-center gap-1.5 text-xs text-emerald-200 bg-white/10 rounded-full px-3 py-1 backdrop-blur-sm">
                  <Shield className="w-3.5 h-3.5" />
                  {pengaturan.namaInstansi}
                </span>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ====== QUICK NAVIGATION CARDS ====== */}
      <motion.div variants={itemVariants}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {quickNavItems.map((item, index) => (
            <motion.button
              key={item.id}
              onClick={() => {
                // We need a way to navigate - dispatch custom event
                window.dispatchEvent(new CustomEvent('navigate-view', { detail: item.id }));
              }}
              className="group relative overflow-hidden rounded-xl p-4 text-left bg-card border border-border/50 shadow-sm hover:shadow-lg transition-all duration-300"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + index * 0.07, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Gradient accent bar */}
              <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${item.color} opacity-80 group-hover:opacity-100 transition-opacity`} />

              {/* Icon */}
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${item.color} flex items-center justify-center mb-3 shadow-md group-hover:scale-110 transition-transform duration-300`}>
                <item.icon className="w-5 h-5 text-white" />
              </div>

              <p className="text-sm font-bold text-foreground">{item.label}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{item.desc}</p>

              {/* Arrow indicator */}
              <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 group-hover:text-foreground/60 group-hover:translate-x-1 transition-all duration-300" />
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* ====== SUMMARY CARDS ====== */}
      <motion.div variants={itemVariants}>
        <SummaryCards data={data} />
      </motion.div>

      {/* ====== CHARTS ROW ====== */}
      <motion.div variants={itemVariants}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <PendapatanChart data={data} />
          <BelanjaChart data={data} />
        </div>
      </motion.div>

      {/* ====== TREND CHART ====== */}
      <motion.div variants={itemVariants}>
        <TrendChart data={data} />
      </motion.div>

      {/* ====== REALISASI BAR CHART ====== */}
      <motion.div variants={itemVariants}>
        <RealisasiBarChart data={data} />
      </motion.div>

      {/* ====== SKPD QUICK SUMMARY ====== */}
      <motion.div variants={itemVariants}>
        <SKPDQuickSummary data={data} />
      </motion.div>
    </motion.div>
  );
}

// ============ PENDAPATAN VIEW ============
function PendapatanView({ data }: { data: DashboardData }) {
  return (
    <div className="space-y-4">
      <PendapatanChart data={data} />
      <AccountTable
        items={data.pendapatan}
        title="Detail Pendapatan Daerah"
        colorClass="bg-emerald-50/50"
        headerColor="text-emerald-800"
        tahun={data.tahun}
      />
    </div>
  );
}

// ============ BELANJA VIEW ============
function BelanjaView({ data }: { data: DashboardData }) {
  return (
    <div className="space-y-4">
      <BelanjaChart data={data} />
      <AccountTable
        items={data.belanja}
        title="Detail Belanja Daerah"
        colorClass="bg-red-50/50"
        headerColor="text-red-800"
        tahun={data.tahun}
      />
    </div>
  );
}

// ============ PEMBIAYAAN VIEW ============
function PembiayaanView({ data }: { data: DashboardData }) {
  return (
    <AccountTable
      items={data.pembiayaan}
      title="Detail Pembiayaan"
      colorClass="bg-amber-50/50"
      headerColor="text-amber-800"
      tahun={data.tahun}
    />
  );
}

// ============ LOADING SKELETON (Modern) ============
function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Hero skeleton */}
      <div className="relative overflow-hidden rounded-2xl h-48">
        <Skeleton className="absolute inset-0" />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent animate-pulse" />
      </div>

      {/* Quick nav skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, duration: 0.4 }}
          >
            <Skeleton className="h-28 rounded-xl" />
          </motion.div>
        ))}
      </div>

      {/* Summary cards skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + i * 0.1, duration: 0.4 }}
          >
            <Skeleton className="h-44 rounded-xl" />
          </motion.div>
        ))}
      </div>

      {/* Charts skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
          <Skeleton className="h-96 rounded-xl" />
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}>
          <Skeleton className="h-96 rounded-xl" />
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.0 }}>
        <Skeleton className="h-80 rounded-xl" />
      </motion.div>
    </div>
  );
}

// ============ ERROR STATE ============
function ErrorState({
  error,
  onRetry,
}: {
  error: string;
  onRetry: () => void;
}) {
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
        Gagal Memuat Data Dashboard
      </h3>
      <p className="text-sm text-muted-foreground mb-4">{error}</p>
      <button
        onClick={onRetry}
        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm"
      >
        <RefreshCw className="w-4 h-4" />
        Coba Lagi
      </button>
    </motion.div>
  );
}
