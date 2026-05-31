"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Building2,
  Calendar,
  Shield,
  Tag,
  Landmark,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Plus,
  Trash2,
  Palette,
  UserPlus,
  ChevronRight,
  Rocket,
  Eye,
  EyeOff,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

// ============ TYPES ============
interface SetupWizardProps {
  onComplete: () => void;
}

interface KategoriItem {
  jenis: string;
  namaKategori: string;
  kodeKategori?: string;
  urutan: number;
}

interface OpdItem {
  kodeOpd: string;
  namaOpd: string;
  kepalaOpd?: string;
}

type StepId =
  | "welcome"
  | "identitas"
  | "tahun-anggaran"
  | "admin-account"
  | "kategori"
  | "opd"
  | "complete";

interface StepConfig {
  id: StepId;
  title: string;
  description: string;
  icon: React.ElementType;
}

const STEPS: StepConfig[] = [
  { id: "welcome", title: "Selamat Datang", description: "Mulai konfigurasi dashboard", icon: Sparkles },
  { id: "identitas", title: "Identitas Instansi", description: "Nama & branding aplikasi", icon: Building2 },
  { id: "tahun-anggaran", title: "Tahun Anggaran", description: "Atur periode anggaran", icon: Calendar },
  { id: "admin-account", title: "Akun Administrator", description: "Buat akun superadmin", icon: Shield },
  { id: "kategori", title: "Kategori Akun", description: "Kategori Pendapatan/Belanja", icon: Tag },
  { id: "opd", title: "Data OPD", description: "Organisasi Perangkat Daerah", icon: Landmark },
  { id: "complete", title: "Selesai!", description: "Dashboard siap digunakan", icon: CheckCircle2 },
];

// Default kategori suggestions
const DEFAULT_KATEGORI: KategoriItem[] = [
  { jenis: "Pendapatan", namaKategori: "PAD", kodeKategori: "4.1", urutan: 1 },
  { jenis: "Pendapatan", namaKategori: "Transfer", kodeKategori: "4.2", urutan: 2 },
  { jenis: "Pendapatan", namaKategori: "Lain-Lain PAD yang Sah", kodeKategori: "4.3", urutan: 3 },
  { jenis: "Belanja", namaKategori: "Belanja Operasi", kodeKategori: "5.1", urutan: 1 },
  { jenis: "Belanja", namaKategori: "Belanja Modal", kodeKategori: "5.2", urutan: 2 },
  { jenis: "Belanja", namaKategori: "Belanja Tak Terduga", kodeKategori: "5.3", urutan: 3 },
  { jenis: "Belanja", namaKategori: "Belanja Transfer", kodeKategori: "5.4", urutan: 4 },
  { jenis: "Pembiayaan", namaKategori: "Penerimaan Pembiayaan", kodeKategori: "6.1", urutan: 1 },
  { jenis: "Pembiayaan", namaKategori: "Pengeluaran Pembiayaan", kodeKategori: "6.2", urutan: 2 },
  { jenis: "RealisasiAkun", namaKategori: "Pendapatan", kodeKategori: "4", urutan: 1 },
  { jenis: "RealisasiAkun", namaKategori: "Belanja", kodeKategori: "5", urutan: 2 },
  { jenis: "RealisasiAkun", namaKategori: "Pembiayaan", kodeKategori: "6", urutan: 3 },
];

// Default OPD suggestions for Kabupaten
const DEFAULT_OPD: OpdItem[] = [
  { kodeOpd: "1.01", namaOpd: "Sekretariat Daerah" },
  { kodeOpd: "1.02", namaOpd: "Sekretariat DPRD" },
  { kodeOpd: "2.01", namaOpd: "Dinas Pendidikan dan Kebudayaan" },
  { kodeOpd: "2.02", namaOpd: "Dinas Kesehatan" },
  { kodeOpd: "2.03", namaOpd: "Dinas Pekerjaan Umum dan Penataan Ruang" },
  { kodeOpd: "2.04", namaOpd: "Dinas Perumahan dan Kawasan Permukiman" },
  { kodeOpd: "2.05", namaOpd: "Dinas Sosial" },
  { kodeOpd: "2.06", namaOpd: "Dinas Pemberdayaan Perempuan dan Perlindungan Anak" },
  { kodeOpd: "2.07", namaOpd: "Dinas Kependudukan dan Pencatatan Sipil" },
  { kodeOpd: "2.08", namaOpd: "Dinas Ketahanan Pangan" },
  { kodeOpd: "2.09", namaOpd: "Dinas Lingkungan Hidup" },
  { kodeOpd: "2.10", namaOpd: "Dinas Pemuda dan Olahraga" },
  { kodeOpd: "3.01", namaOpd: "Badan Perencanaan Pembangunan Daerah" },
  { kodeOpd: "3.02", namaOpd: "Badan Kepegawaian Daerah" },
  { kodeOpd: "3.03", namaOpd: "Badan Pendapatan Daerah" },
  { kodeOpd: "3.04", namaOpd: "Badan Pengelolaan Keuangan dan Aset Daerah" },
  { kodeOpd: "4.01", namaOpd: "Inspektorat" },
  { kodeOpd: "5.01", namaOpd: "Kecamatan Seruyan Hilir" },
  { kodeOpd: "5.02", namaOpd: "Kecamatan Seruyan Tengah" },
  { kodeOpd: "5.03", namaOpd: "Kecamatan Seruyan Hulu" },
  { kodeOpd: "5.04", namaOpd: "Kecamatan Seruyan Rungan" },
  { kodeOpd: "5.05", namaOpd: "Kecamatan Hanau" },
  { kodeOpd: "5.06", namaOpd: "Kecamatan Danau Sembuluh" },
];

// ============ MAIN COMPONENT ============
export default function SetupWizard({ onComplete }: SetupWizardProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Form state for each step
  const [identitas, setIdentitas] = useState({
    namaAplikasi: "Dashboard Keuangan Daerah",
    namaPemerintah: "Pemerintah Kabupaten Seruyan",
    namaInstansi: "BKAD Kab. Seruyan",
    warnaPrimary: "#1B5E20",
    warnaSecondary: "#2E7D32",
    warnaAccent: "#F9A825",
    alamatInstansi: "",
    teleponInstansi: "",
    emailInstansi: "",
    websiteInstansi: "",
  });

  const [tahunAnggaran, setTahunAnggaran] = useState(new Date().getFullYear());
  const [adminAccount, setAdminAccount] = useState({
    name: "Administrator",
    email: "admin@seruyankab.go.id",
    password: "",
    confirmPassword: "",
  });

  const [kategoriList, setKategoriList] = useState<KategoriItem[]>(DEFAULT_KATEGORI);
  const [opdList, setOpdList] = useState<OpdItem[]>(DEFAULT_OPD);

  const currentStep = STEPS[currentStepIndex];
  const progress = ((currentStepIndex) / (STEPS.length - 1)) * 100;

  // ============ SAVE HANDLERS ============
  const saveStep = useCallback(async (stepId: StepId) => {
    setSaving(true);
    try {
      switch (stepId) {
        case "identitas": {
          const res = await fetch("/api/setup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ step: "identitas", data: identitas }),
          });
          if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || "Gagal menyimpan identitas");
          }
          break;
        }
        case "tahun-anggaran": {
          const res = await fetch("/api/setup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ step: "tahun-anggaran", data: { tahun: tahunAnggaran } }),
          });
          if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || "Gagal menyimpan tahun anggaran");
          }
          break;
        }
        case "admin-account": {
          if (adminAccount.password !== adminAccount.confirmPassword) {
            throw new Error("Password dan konfirmasi password tidak sama");
          }
          if (adminAccount.password.length < 6) {
            throw new Error("Password minimal 6 karakter");
          }
          const res = await fetch("/api/setup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              step: "admin-account",
              data: {
                name: adminAccount.name,
                email: adminAccount.email,
                password: adminAccount.password,
              },
            }),
          });
          if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || "Gagal membuat akun admin");
          }
          break;
        }
        case "kategori": {
          const res = await fetch("/api/setup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ step: "kategori", data: { kategoriList } }),
          });
          if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || "Gagal menyimpan kategori");
          }
          break;
        }
        case "opd": {
          const res = await fetch("/api/setup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ step: "opd", data: { opdList } }),
          });
          if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || "Gagal menyimpan data OPD");
          }
          break;
        }
        case "complete": {
          const res = await fetch("/api/setup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ step: "finish", data: {} }),
          });
          if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || "Gagal menyelesaikan setup");
          }
          break;
        }
      }
    } finally {
      setSaving(false);
    }
  }, [identitas, tahunAnggaran, adminAccount, kategoriList, opdList]);

  const goNext = useCallback(async () => {
    try {
      await saveStep(currentStep.id);
      if (currentStep.id === "complete") {
        onComplete();
        return;
      }
      setCurrentStepIndex((prev) => Math.min(prev + 1, STEPS.length - 1));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Terjadi kesalahan");
    }
  }, [currentStep, saveStep, onComplete]);

  const goBack = useCallback(() => {
    setCurrentStepIndex((prev) => Math.max(prev - 1, 0));
  }, []);

  // ============ KATEGORI HELPERS ============
  const addKategori = (jenis: string) => {
    setKategoriList((prev) => [
      ...prev,
      { jenis, namaKategori: "", kodeKategori: "", urutan: prev.filter((k) => k.jenis === jenis).length + 1 },
    ]);
  };

  const removeKategori = (index: number) => {
    setKategoriList((prev) => prev.filter((_, i) => i !== index));
  };

  const updateKategori = (index: number, field: keyof KategoriItem, value: string | number) => {
    setKategoriList((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  // ============ OPD HELPERS ============
  const addOpd = () => {
    setOpdList((prev) => [...prev, { kodeOpd: "", namaOpd: "" }]);
  };

  const removeOpd = (index: number) => {
    setOpdList((prev) => prev.filter((_, i) => i !== index));
  };

  const updateOpd = (index: number, field: keyof OpdItem, value: string) => {
    setOpdList((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  // Group kategori by jenis
  const kategoriByJenis = (jenis: string) => kategoriList.filter((k) => k.jenis === jenis);

  // ============ RENDER ============
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-amber-50 flex items-center justify-center p-4">
      {/* Background decorations */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-200/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-amber-200/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-green-100/30 rounded-full blur-2xl animate-pulse" style={{ animationDelay: "2s" }} />
      </div>

      <div className="relative w-full max-w-4xl">
        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-emerald-800">
              Setup Wizard
            </span>
            <span className="text-sm text-muted-foreground">
              Langkah {currentStepIndex + 1} dari {STEPS.length}
            </span>
          </div>
          <div className="h-2 bg-emerald-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            />
          </div>
          {/* Step indicators */}
          <div className="hidden md:flex items-center justify-between mt-3">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex flex-col items-center gap-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                    index < currentStepIndex
                      ? "bg-emerald-600 text-white"
                      : index === currentStepIndex
                      ? "bg-emerald-500 text-white ring-2 ring-emerald-300 ring-offset-2"
                      : "bg-emerald-100 text-emerald-400"
                  }`}
                >
                  {index < currentStepIndex ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    index + 1
                  )}
                </div>
                <span
                  className={`text-[10px] font-medium ${
                    index <= currentStepIndex ? "text-emerald-700" : "text-emerald-300"
                  }`}
                >
                  {step.title}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Main content card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep.id}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.35, ease: "easeInOut" }}
          >
            <Card className="border-0 shadow-2xl shadow-emerald-900/10 overflow-hidden">
              {/* Card header with gradient */}
              <div
                className="relative p-6 text-white overflow-hidden"
                style={{
                  background: `linear-gradient(135deg, ${identitas.warnaPrimary}, ${identitas.warnaSecondary})`,
                }}
              >
                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-20 translate-x-20" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-16 -translate-x-16" />

                <div className="relative flex items-center gap-4">
                  <motion.div
                    className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm"
                    initial={{ scale: 0, rotate: -90 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  >
                    <currentStep.icon className="w-7 h-7" />
                  </motion.div>
                  <div>
                    <h2 className="text-xl lg:text-2xl font-bold">{currentStep.title}</h2>
                    <p className="text-sm text-white/80 mt-0.5">{currentStep.description}</p>
                  </div>
                </div>
              </div>

              <CardContent className="p-6 lg:p-8">
                {currentStep.id === "welcome" && <WelcomeStep identitas={identitas} />}
                {currentStep.id === "identitas" && (
                  <IdentitasStep identitas={identitas} setIdentitas={setIdentitas} />
                )}
                {currentStep.id === "tahun-anggaran" && (
                  <TahunAnggaranStep tahun={tahunAnggaran} setTahun={setTahunAnggaran} />
                )}
                {currentStep.id === "admin-account" && (
                  <AdminAccountStep
                    adminAccount={adminAccount}
                    setAdminAccount={setAdminAccount}
                    showPassword={showPassword}
                    setShowPassword={setShowPassword}
                  />
                )}
                {currentStep.id === "kategori" && (
                  <KategoriStep
                    kategoriList={kategoriList}
                    addKategori={addKategori}
                    removeKategori={removeKategori}
                    updateKategori={updateKategori}
                    kategoriByJenis={kategoriByJenis}
                  />
                )}
                {currentStep.id === "opd" && (
                  <OpdStep opdList={opdList} addOpd={addOpd} removeOpd={removeOpd} updateOpd={updateOpd} />
                )}
                {currentStep.id === "complete" && (
                  <CompleteStep
                    identitas={identitas}
                    tahunAnggaran={tahunAnggaran}
                    adminAccount={adminAccount}
                    kategoriCount={kategoriList.length}
                    opdCount={opdList.length}
                  />
                )}

                {/* Navigation buttons */}
                <div className="flex items-center justify-between mt-8 pt-6 border-t">
                  <Button
                    variant="outline"
                    onClick={goBack}
                    disabled={currentStepIndex === 0 || saving}
                    className="gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Kembali
                  </Button>

                  <Button
                    onClick={goNext}
                    disabled={saving}
                    className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Menyimpan...
                      </>
                    ) : currentStep.id === "complete" ? (
                      <>
                        <Rocket className="w-4 h-4" />
                        Mulai Dashboard
                      </>
                    ) : (
                      <>
                        Lanjut
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

// ============ WELCOME STEP ============
function WelcomeStep({ identitas }: { identitas: { namaPemerintah: string } }) {
  const features = [
    { icon: Building2, title: "Manajemen OPD", desc: "Kelola data Organisasi Perangkat Daerah" },
    { icon: Calendar, title: "Tahun Anggaran", desc: "Atur periode anggaran daerah" },
    { icon: TrendingUp, title: "Pendapatan & Belanja", desc: "Input dan monitoring realisasi APBD" },
    { icon: Shield, title: "Role-Based Access", desc: "Admin & OPD dengan akses terpisah" },
    { icon: Tag, title: "Kategori Dinamis", desc: "Kategori akun yang fleksibel" },
    { icon: Rocket, title: "Import Excel", desc: "Import data massal via template XLSX" },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center space-y-3">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center mx-auto shadow-lg shadow-emerald-200"
        >
          <Sparkles className="w-10 h-10 text-white" />
        </motion.div>
        <h3 className="text-2xl font-bold text-foreground">Selamat Datang!</h3>
        <p className="text-muted-foreground max-w-lg mx-auto">
          Wizard ini akan membantu Anda mengkonfigurasi <strong>{identitas.namaPemerintah}</strong> secara lengkap.
          Ikuti setiap langkah untuk menyiapkan dashboard keuangan daerah Anda.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {features.map((feature, index) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + index * 0.07, duration: 0.4 }}
            className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
          >
            <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
              <feature.icon className="w-4 h-4 text-emerald-700" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{feature.title}</p>
              <p className="text-xs text-muted-foreground">{feature.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800">
        <AlertCircle className="w-5 h-5 shrink-0" />
        <p className="text-sm">
          Proses setup hanya perlu dilakukan sekali. Data yang dimasukkan dapat diubah nanti melalui panel admin.
        </p>
      </div>
    </div>
  );
}

// ============ IDENTITAS STEP ============
function IdentitasStep({
  identitas,
  setIdentitas,
}: {
  identitas: {
    namaAplikasi: string;
    namaPemerintah: string;
    namaInstansi: string;
    warnaPrimary: string;
    warnaSecondary: string;
    warnaAccent: string;
    alamatInstansi: string;
    teleponInstansi: string;
    emailInstansi: string;
    websiteInstansi: string;
  };
  setIdentitas: React.Dispatch<
    React.SetStateAction<{
      namaAplikasi: string;
      namaPemerintah: string;
      namaInstansi: string;
      warnaPrimary: string;
      warnaSecondary: string;
      warnaAccent: string;
      alamatInstansi: string;
      teleponInstansi: string;
      emailInstansi: string;
      websiteInstansi: string;
    }>
  >;
}) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="namaAplikasi" className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            Nama Aplikasi
          </Label>
          <Input
            id="namaAplikasi"
            value={identitas.namaAplikasi}
            onChange={(e) => setIdentitas((prev) => ({ ...prev, namaAplikasi: e.target.value }))}
            placeholder="Dashboard Keuangan Daerah"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="namaPemerintah" className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-emerald-600" />
            Nama Pemerintah
          </Label>
          <Input
            id="namaPemerintah"
            value={identitas.namaPemerintah}
            onChange={(e) => setIdentitas((prev) => ({ ...prev, namaPemerintah: e.target.value }))}
            placeholder="Pemerintah Kabupaten Seruyan"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="namaInstansi" className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-emerald-600" />
            Nama Instansi
          </Label>
          <Input
            id="namaInstansi"
            value={identitas.namaInstansi}
            onChange={(e) => setIdentitas((prev) => ({ ...prev, namaInstansi: e.target.value }))}
            placeholder="BKAD Kab. Seruyan"
          />
          <p className="text-xs text-muted-foreground">Nama instansi/OPD pengelola (tampil di sidebar & login)</p>
        </div>
      </div>

      <Separator />

      {/* Color picker section */}
      <div className="space-y-3">
        <Label className="flex items-center gap-2 text-base font-semibold">
          <Palette className="w-5 h-5 text-emerald-600" />
          Tema Warna
        </Label>
        <p className="text-sm text-muted-foreground">Atur warna utama untuk tampilan dashboard</p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { key: "warnaPrimary" as const, label: "Warna Primer" },
            { key: "warnaSecondary" as const, label: "Warna Sekunder" },
            { key: "warnaAccent" as const, label: "Warna Aksen" },
          ].map(({ key, label }) => (
            <div key={key} className="space-y-2">
              <Label className="text-sm">{label}</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={identitas[key]}
                  onChange={(e) => setIdentitas((prev) => ({ ...prev, [key]: e.target.value }))}
                  className="w-10 h-10 rounded-lg border cursor-pointer"
                />
                <Input
                  value={identitas[key]}
                  onChange={(e) => setIdentitas((prev) => ({ ...prev, [key]: e.target.value }))}
                  className="flex-1 font-mono text-sm"
                  maxLength={7}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Preview */}
        <div className="mt-4 p-4 rounded-xl border bg-muted/30">
          <p className="text-xs text-muted-foreground mb-2">Preview Tema:</p>
          <div className="flex items-center gap-3">
            <div
              className="w-16 h-16 rounded-lg shadow-md flex items-center justify-center text-white text-xs font-bold"
              style={{ background: `linear-gradient(135deg, ${identitas.warnaPrimary}, ${identitas.warnaSecondary})` }}
            >
              Sidebar
            </div>
            <div
              className="w-16 h-16 rounded-lg shadow-md flex items-center justify-center text-xs font-bold"
              style={{ backgroundColor: identitas.warnaAccent, color: "#fff" }}
            >
              Aksen
            </div>
            <div className="flex-1 h-16 rounded-lg shadow-md border flex items-center justify-center text-xs text-muted-foreground">
              Konten
            </div>
          </div>
        </div>
      </div>

      <Separator />

      {/* Institution info */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">Informasi Instansi (Opsional)</Label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-sm">Alamat</Label>
            <Input
              value={identitas.alamatInstansi}
              onChange={(e) => setIdentitas((prev) => ({ ...prev, alamatInstansi: e.target.value }))}
              placeholder="Jl. ..."
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm">Telepon</Label>
            <Input
              value={identitas.teleponInstansi}
              onChange={(e) => setIdentitas((prev) => ({ ...prev, teleponInstansi: e.target.value }))}
              placeholder="0522 ..."
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm">Email</Label>
            <Input
              type="email"
              value={identitas.emailInstansi}
              onChange={(e) => setIdentitas((prev) => ({ ...prev, emailInstansi: e.target.value }))}
              placeholder="info@seruyankab.go.id"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm">Website</Label>
            <Input
              value={identitas.websiteInstansi}
              onChange={(e) => setIdentitas((prev) => ({ ...prev, websiteInstansi: e.target.value }))}
              placeholder="https://seruyankab.go.id"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ============ TAHUN ANGGARAN STEP ============
function TahunAnggaranStep({
  tahun,
  setTahun,
}: {
  tahun: number;
  setTahun: React.Dispatch<React.SetStateAction<number>>;
}) {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2 mb-4">
        <Calendar className="w-12 h-12 text-emerald-600 mx-auto" />
        <p className="text-muted-foreground">
          Pilih tahun anggaran yang akan digunakan. Hanya ada satu tahun anggaran aktif pada satu waktu.
        </p>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
        {years.map((y) => (
          <motion.button
            key={y}
            onClick={() => setTahun(y)}
            className={`p-4 rounded-xl border-2 text-center transition-all duration-200 ${
              tahun === y
                ? "border-emerald-500 bg-emerald-50 text-emerald-700 shadow-md shadow-emerald-100"
                : "border-muted bg-card hover:border-emerald-200 hover:bg-emerald-50/50"
            }`}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <span className={`text-2xl font-bold ${tahun === y ? "text-emerald-700" : "text-foreground"}`}>
              {y}
            </span>
            {tahun === y && (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="mt-1">
                <Badge className="bg-emerald-600 text-white text-[10px]">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Aktif
                </Badge>
              </motion.div>
            )}
          </motion.button>
        ))}
      </div>

      <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
        <Calendar className="w-5 h-5 text-emerald-600 shrink-0" />
        <div>
          <p className="text-sm font-medium text-emerald-800">
            Tahun Anggaran Dipilih: <strong>{tahun}</strong>
          </p>
          <p className="text-xs text-emerald-600">Tahun anggaran dapat ditambahkan lagi nanti melalui panel admin.</p>
        </div>
      </div>
    </div>
  );
}

// ============ ADMIN ACCOUNT STEP ============
function AdminAccountStep({
  adminAccount,
  setAdminAccount,
  showPassword,
  setShowPassword,
}: {
  adminAccount: { name: string; email: string; password: string; confirmPassword: string };
  setAdminAccount: React.Dispatch<
    React.SetStateAction<{ name: string; email: string; password: string; confirmPassword: string }>
  >;
  showPassword: boolean;
  setShowPassword: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const passwordMatch = adminAccount.password === adminAccount.confirmPassword;
  const passwordValid = adminAccount.password.length >= 6;

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2 mb-4">
        <UserPlus className="w-12 h-12 text-emerald-600 mx-auto" />
        <p className="text-muted-foreground">
          Buat akun superadmin untuk mengelola seluruh sistem. Akun ini memiliki akses penuh ke semua fitur.
        </p>
      </div>

      <div className="max-w-md mx-auto space-y-4">
        <div className="space-y-2">
          <Label htmlFor="adminName" className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-600" />
            Nama Lengkap
          </Label>
          <Input
            id="adminName"
            value={adminAccount.name}
            onChange={(e) => setAdminAccount((prev) => ({ ...prev, name: e.target.value }))}
            placeholder="Administrator"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="adminEmail">Email</Label>
          <Input
            id="adminEmail"
            type="email"
            value={adminAccount.email}
            onChange={(e) => setAdminAccount((prev) => ({ ...prev, email: e.target.value }))}
            placeholder="admin@seruyankab.go.id"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="adminPassword">Password</Label>
          <div className="relative">
            <Input
              id="adminPassword"
              type={showPassword ? "text" : "password"}
              value={adminAccount.password}
              onChange={(e) => setAdminAccount((prev) => ({ ...prev, password: e.target.value }))}
              placeholder="Minimal 6 karakter"
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {adminAccount.password && !passwordValid && (
            <p className="text-xs text-red-500 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> Password minimal 6 karakter
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="adminConfirmPassword">Konfirmasi Password</Label>
          <Input
            id="adminConfirmPassword"
            type={showPassword ? "text" : "password"}
            value={adminAccount.confirmPassword}
            onChange={(e) => setAdminAccount((prev) => ({ ...prev, confirmPassword: e.target.value }))}
            placeholder="Ulangi password"
          />
          {adminAccount.confirmPassword && !passwordMatch && (
            <p className="text-xs text-red-500 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> Password tidak sama
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg max-w-md mx-auto">
        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
        <p className="text-sm text-amber-800">
          Simpan baik-baik akun ini. Anda memerlukannya untuk login ke panel admin.
        </p>
      </div>
    </div>
  );
}

// ============ KATEGORI STEP ============
function KategoriStep({
  kategoriList,
  addKategori,
  removeKategori,
  updateKategori,
  kategoriByJenis,
}: {
  kategoriList: KategoriItem[];
  addKategori: (jenis: string) => void;
  removeKategori: (index: number) => void;
  updateKategori: (index: number, field: keyof KategoriItem, value: string | number) => void;
  kategoriByJenis: (jenis: string) => KategoriItem[];
}) {
  const jenisList: Array<{ jenis: string; icon: React.ElementType }> = [
    { jenis: "Pendapatan", icon: TrendingUp },
    { jenis: "Belanja", icon: TrendingDown },
    { jenis: "Pembiayaan", icon: DollarSign },
    { jenis: "RealisasiAkun", icon: BarChart3 },
  ];

  return (
    <div className="space-y-5">
      <div className="text-center space-y-2 mb-2">
        <Tag className="w-10 h-10 text-emerald-600 mx-auto" />
        <p className="text-muted-foreground text-sm">
          Kategori digunakan untuk mengelompokkan akun-akun anggaran. Kategori default sudah tersedia, Anda dapat menambah atau mengubahnya.
        </p>
      </div>

      {jenisList.map(({ jenis, icon: Icon }) => (
        <div key={jenis} className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon className="w-4 h-4 text-emerald-600" />
              <Label className="text-sm font-semibold">
                {jenis === "RealisasiAkun" ? "Realisasi Akun" : jenis}
              </Label>
              <Badge variant="secondary" className="text-[10px]">
                {kategoriByJenis(jenis).length}
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => addKategori(jenis)}
              className="h-7 text-xs gap-1"
            >
              <Plus className="w-3 h-3" />
              Tambah
            </Button>
          </div>

          <div className="space-y-2 pl-2">
            {kategoriList.map((kat, index) => {
              if (kat.jenis !== jenis) return null;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="flex items-center gap-2"
                >
                  <Input
                    value={kat.kodeKategori || ""}
                    onChange={(e) => updateKategori(index, "kodeKategori", e.target.value)}
                    placeholder="Kode"
                    className="w-24 h-8 text-xs font-mono"
                  />
                  <Input
                    value={kat.namaKategori}
                    onChange={(e) => updateKategori(index, "namaKategori", e.target.value)}
                    placeholder="Nama kategori"
                    className="flex-1 h-8 text-xs"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeKategori(index)}
                    className="h-8 w-8 p-0 text-red-400 hover:text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </motion.div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ============ OPD STEP ============
function OpdStep({
  opdList,
  addOpd,
  removeOpd,
  updateOpd,
}: {
  opdList: OpdItem[];
  addOpd: () => void;
  removeOpd: (index: number) => void;
  updateOpd: (index: number, field: keyof OpdItem, value: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="text-center space-y-2 mb-2">
        <Landmark className="w-10 h-10 text-emerald-600 mx-auto" />
        <p className="text-muted-foreground text-sm">
          Tambahkan data OPD (Organisasi Perangkat Daerah). Data OPD default Kabupaten Seruyan sudah tersedia.
        </p>
      </div>

      <div className="flex items-center justify-between">
        <Badge variant="secondary" className="text-xs">
          {opdList.length} OPD
        </Badge>
        <Button variant="outline" size="sm" onClick={addOpd} className="gap-1">
          <Plus className="w-3.5 h-3.5" />
          Tambah OPD
        </Button>
      </div>

      <div className="max-h-96 overflow-y-auto space-y-2 pr-1">
        {opdList.map((opd, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.02 }}
            className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
              <span className="text-[10px] font-bold text-emerald-700">{index + 1}</span>
            </div>
            <Input
              value={opd.kodeOpd}
              onChange={(e) => updateOpd(index, "kodeOpd", e.target.value)}
              placeholder="Kode OPD"
              className="w-24 h-8 text-xs font-mono"
            />
            <Input
              value={opd.namaOpd}
              onChange={(e) => updateOpd(index, "namaOpd", e.target.value)}
              placeholder="Nama OPD"
              className="flex-1 h-8 text-xs"
            />
            <Input
              value={opd.kepalaOpd || ""}
              onChange={(e) => updateOpd(index, "kepalaOpd", e.target.value)}
              placeholder="Kepala OPD (opsional)"
              className="w-36 h-8 text-xs hidden sm:block"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeOpd(index)}
              className="h-8 w-8 p-0 text-red-400 hover:text-red-600 hover:bg-red-50 shrink-0"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </motion.div>
        ))}
      </div>

      <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
        <ChevronRight className="w-5 h-5 text-emerald-600 shrink-0" />
        <p className="text-sm text-emerald-800">
          Akun OPD akan otomatis dibuat dengan format{" "}
          <code className="bg-emerald-100 px-1 rounded text-xs">opd-{"{kode}"}@seruyankab.go.id</code> dan
          password default <code className="bg-emerald-100 px-1 rounded text-xs">seruyan2024</code>
        </p>
      </div>
    </div>
  );
}

// ============ COMPLETE STEP ============
function CompleteStep({
  identitas,
  tahunAnggaran,
  adminAccount,
  kategoriCount,
  opdCount,
}: {
  identitas: { namaAplikasi: string; namaPemerintah: string; namaInstansi: string };
  tahunAnggaran: number;
  adminAccount: { name: string; email: string };
  kategoriCount: number;
  opdCount: number;
}) {
  const summaryItems = [
    { label: "Nama Aplikasi", value: identitas.namaAplikasi },
    { label: "Pemerintah", value: identitas.namaPemerintah },
    { label: "Instansi", value: identitas.namaInstansi },
    { label: "Tahun Anggaran", value: String(tahunAnggaran) },
    { label: "Akun Admin", value: adminAccount.email },
    { label: "Kategori Akun", value: `${kategoriCount} kategori` },
    { label: "Data OPD", value: `${opdCount} organisasi` },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center space-y-3">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
        >
          <CheckCircle2 className="w-20 h-20 text-emerald-500 mx-auto" />
        </motion.div>
        <motion.h3
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-2xl font-bold text-foreground"
        >
          Setup Selesai!
        </motion.h3>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-muted-foreground"
        >
          Dashboard keuangan daerah Anda siap digunakan. Berikut ringkasan konfigurasi:
        </motion.p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="max-w-md mx-auto space-y-2"
      >
        {summaryItems.map((item, index) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 + index * 0.08 }}
            className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
          >
            <span className="text-sm text-muted-foreground">{item.label}</span>
            <span className="text-sm font-semibold text-foreground">{item.value}</span>
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg max-w-md mx-auto"
      >
        <Rocket className="w-5 h-5 text-emerald-600 shrink-0" />
        <p className="text-sm text-emerald-800">
          Klik <strong>&quot;Mulai Dashboard&quot;</strong> untuk menyelesaikan setup dan masuk ke dashboard.
        </p>
      </motion.div>
    </div>
  );
}
