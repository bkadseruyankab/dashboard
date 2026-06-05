"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  Save,
  Upload,
  Trash2,
  Palette,
  Building2,
  Image as ImageIcon,
  Info,
  RotateCcw,
  AlertTriangle,
  LayoutList,
  Eye,
  EyeOff,
  Activity,
  BotMessageSquare,
  Thermometer,
  MessageSquare,
  Cpu,
  Key,
  Sparkles,
  Mic,
  Volume2,
  Globe,
  ImagePlus,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { usePengaturan } from "@/context/PengaturanContext";
import { Switch } from "@/components/ui/switch";
import type { SidebarVisibility, CopilotConfig, AiApiKeys } from "@/context/PengaturanContext";
import { DEFAULT_COPILOT_CONFIG, DEFAULT_AI_API_KEYS } from "@/context/PengaturanContext";

interface PengaturanData {
  id: string;
  namaAplikasi: string;
  namaPemerintah: string;
  namaInstansi: string;
  warnaPrimary: string;
  warnaSecondary: string;
  warnaAccent: string;
  warnaDark: string;
  logoBase64: string | null;
  logoUrl: string | null;
  alamatInstansi: string | null;
  teleponInstansi: string | null;
  emailInstansi: string | null;
  websiteInstansi: string | null;
  sidebarConfig: SidebarVisibility | null;
  loaderDisplayTime: number;
  copilotConfig: CopilotConfig | null;
}

const DEFAULT_SETTINGS: Omit<PengaturanData, "id"> = {
  namaAplikasi: "Dashboard Keuangan",
  namaPemerintah: "Pemerintah Kabupaten Seruyan",
  namaInstansi: "BKAD Kab. Seruyan",
  warnaPrimary: "#1B5E20",
  warnaSecondary: "#2E7D32",
  warnaAccent: "#F9A825",
  warnaDark: "#0D3B12",
  logoBase64: null,
  logoUrl: null,
  alamatInstansi: "",
  teleponInstansi: "",
  emailInstansi: "",
  websiteInstansi: "",
  sidebarConfig: {
    hiddenItems: {
      public: ["ringkasan-eksekutif", "copilot"],
    },
  },
  loaderDisplayTime: 5000,
  copilotConfig: null,
};

// Available sidebar items for visibility configuration
const SIDEBAR_ITEMS = [
  { id: "dashboard", label: "Dashboard", group: "Utama" },
  { id: "ringkasan-eksekutif", label: "Ringkasan Eksekutif", group: "Utama" },
  { id: "analisis-risiko", label: "Analisis Risiko", group: "Utama" },
  { id: "copilot", label: "AI Copilot", group: "Utama" },
  { id: "apbd", label: "APBD", group: "Anggaran" },
  { id: "pendapatan", label: "Pendapatan", group: "Anggaran" },
  { id: "belanja", label: "Belanja", group: "Anggaran" },
  { id: "pembiayaan", label: "Pembiayaan", group: "Anggaran" },
  { id: "realisasi-akun", label: "Realisasi Per-Akun", group: "Realisasi" },
  { id: "realisasi-skpd", label: "Realisasi Per-SKPD", group: "Realisasi" },
  { id: "opd", label: "OPD", group: "Lainnya" },
  { id: "transparansi", label: "Transparansi", group: "Lainnya" },
  { id: "admin", label: "Admin", group: "Lainnya" },
] as const;

// Roles that can have sidebar visibility configured
const ROLES = [
  { id: "public", label: "Publik", description: "Pengguna yang belum login (akses publik)" },
  { id: "admin", label: "Admin", description: "Administrator sistem" },
  { id: "superadmin", label: "Super Admin", description: "Super administrator" },
  { id: "opd", label: "OPD", description: "Organisasi Perangkat Daerah" },
  { id: "bupati", label: "Bupati/Kepala Daerah", description: "Pimpinan daerah" },
] as const;

interface ColorFieldConfig {
  key: keyof PengaturanData;
  label: string;
  description: string;
}

const COLOR_FIELDS: ColorFieldConfig[] = [
  { key: "warnaPrimary", label: "Warna Primer", description: "Sidebar & header utama" },
  { key: "warnaSecondary", label: "Warna Sekunder", description: "Gradient sekunder" },
  { key: "warnaAccent", label: "Warna Aksen", description: "Aksen emas (gold)" },
  { key: "warnaDark", label: "Warna Gelap", description: "Bayangan tergelap" },
];

function isValidHexColor(color: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(color);
}

function normalizeHex(value: string): string {
  let hex = value.trim();
  if (!hex.startsWith("#")) {
    hex = "#" + hex;
  }
  return hex;
}

export default function SettingsManager() {
  const { toast } = useToast();
  const { pengaturan: currentPengaturan, logoSrc, refetch: refetchPengaturan } = usePengaturan();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Omit<PengaturanData, "id">>(DEFAULT_SETTINGS);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoSizeWarning, setLogoSizeWarning] = useState(false);
  const [resettingSetup, setResettingSetup] = useState(false);
  const [activeSidebarRole, setActiveSidebarRole] = useState<string>("admin");
  const [showApiKeys, setShowApiKeys] = useState<Record<string, boolean>>({});

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/pengaturan");
      if (!res.ok) throw new Error("Gagal mengambil pengaturan");
      const json = await res.json();
      const data: PengaturanData = json.data;
      // Parse sidebarConfig from JSON string
      let parsedSidebarConfig: SidebarVisibility | null = null;
      if (data.sidebarConfig && typeof data.sidebarConfig === "string") {
        try {
          parsedSidebarConfig = JSON.parse(data.sidebarConfig as unknown as string);
        } catch {
          parsedSidebarConfig = null;
        }
      } else if (data.sidebarConfig && typeof data.sidebarConfig === "object") {
        parsedSidebarConfig = data.sidebarConfig;
      }
      // If no sidebarConfig from DB, use default (hides ringkasan-eksekutif & copilot for public)
      if (!parsedSidebarConfig) {
        parsedSidebarConfig = DEFAULT_SETTINGS.sidebarConfig;
      }
      setForm({
        namaAplikasi: data.namaAplikasi || DEFAULT_SETTINGS.namaAplikasi,
        namaPemerintah: data.namaPemerintah || DEFAULT_SETTINGS.namaPemerintah,
        namaInstansi: data.namaInstansi || DEFAULT_SETTINGS.namaInstansi,
        warnaPrimary: data.warnaPrimary || DEFAULT_SETTINGS.warnaPrimary,
        warnaSecondary: data.warnaSecondary || DEFAULT_SETTINGS.warnaSecondary,
        warnaAccent: data.warnaAccent || DEFAULT_SETTINGS.warnaAccent,
        warnaDark: data.warnaDark || DEFAULT_SETTINGS.warnaDark,
        logoBase64: data.logoBase64 ?? null,
        logoUrl: data.logoUrl ?? null,
        alamatInstansi: data.alamatInstansi ?? "",
        teleponInstansi: data.teleponInstansi ?? "",
        emailInstansi: data.emailInstansi ?? "",
        websiteInstansi: data.websiteInstansi ?? "",
        sidebarConfig: parsedSidebarConfig,
        loaderDisplayTime: data.loaderDisplayTime ?? 5000,
        copilotConfig: data.copilotConfig
          ? (typeof data.copilotConfig === "string"
            ? (() => { const parsed = JSON.parse(data.copilotConfig as unknown as string); return { ...DEFAULT_COPILOT_CONFIG, ...parsed, apiKeys: { ...DEFAULT_AI_API_KEYS, ...(parsed.apiKeys || {}) } }; })()
            : typeof data.copilotConfig === "object"
              ? { ...DEFAULT_COPILOT_CONFIG, ...data.copilotConfig, apiKeys: { ...DEFAULT_AI_API_KEYS, ...((data.copilotConfig as CopilotConfig).apiKeys || {}) } }
              : null)
          : null,
      });
      // Set logo preview
      if (data.logoBase64) {
        setLogoPreview(data.logoBase64);
      } else {
        setLogoPreview(null);
      }
    } catch {
      toast({
        title: "Error",
        description: "Gagal mengambil data pengaturan",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleFieldChange = (field: string, value: string | null) => {
    setForm((prev) => {
      if (field === "loaderDisplayTime") {
        return { ...prev, [field]: Number(value) || 0 };
      }
      return { ...prev, [field]: value };
    });
  };

  const handleColorHexChange = (field: keyof PengaturanData, value: string) => {
    const normalized = normalizeHex(value);
    handleFieldChange(field, normalized);
  };

  const handleColorPickerChange = (field: keyof PengaturanData, value: string) => {
    handleFieldChange(field, value);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (> 500KB warning)
    if (file.size > 500 * 1024) {
      setLogoSizeWarning(true);
    } else {
      setLogoSizeWarning(false);
    }

    // Check if file is too large (> 1MB reject)
    if (file.size > 1024 * 1024) {
      toast({
        title: "File Terlalu Besar",
        description: "Ukuran logo maksimal 1MB. Pilih file yang lebih kecil.",
        variant: "destructive",
      });
      e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setLogoPreview(base64);
      handleFieldChange("logoBase64", base64);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleRemoveLogo = () => {
    setLogoPreview(null);
    handleFieldChange("logoBase64", null);
    handleFieldChange("logoUrl", null);
    setLogoSizeWarning(false);
  };

  // Sidebar visibility toggle handler
  const handleSidebarToggle = (itemId: string, roleId: string, visible: boolean) => {
    const currentConfig = form.sidebarConfig || { hiddenItems: {} };
    const hiddenItems = { ...currentConfig.hiddenItems };
    const currentHidden = hiddenItems[roleId] || [];

    if (visible) {
      // Remove from hidden list
      hiddenItems[roleId] = currentHidden.filter((id) => id !== itemId);
    } else {
      // Add to hidden list
      hiddenItems[roleId] = [...currentHidden, itemId];
    }

    // Clean up empty arrays
    if (hiddenItems[roleId]?.length === 0) {
      delete hiddenItems[roleId];
    }

    const newConfig: SidebarVisibility = { hiddenItems };
    setForm((prev) => ({ ...prev, sidebarConfig: newConfig }));
  };

  // Check if a sidebar item is visible for a role
  const isSidebarItemVisible = (itemId: string, roleId: string): boolean => {
    const hiddenItems = form.sidebarConfig?.hiddenItems || {};
    const roleHidden = hiddenItems[roleId] || [];
    return !roleHidden.includes(itemId);
  };

  // Select all / Deselect all for a role
  const handleSelectAllForRole = (roleId: string, visible: boolean) => {
    const currentConfig = form.sidebarConfig || { hiddenItems: {} };
    const hiddenItems = { ...currentConfig.hiddenItems };

    if (visible) {
      // Show all: remove all items from hidden
      hiddenItems[roleId] = [];
    } else {
      // Hide all: add all items to hidden
      hiddenItems[roleId] = SIDEBAR_ITEMS.map((item) => item.id);
    }

    // Clean up empty arrays
    if (hiddenItems[roleId]?.length === 0) {
      delete hiddenItems[roleId];
    }

    const newConfig: SidebarVisibility = { hiddenItems };
    setForm((prev) => ({ ...prev, sidebarConfig: newConfig }));
  };

  const handleSave = async () => {
    // Validate colors
    for (const cf of COLOR_FIELDS) {
      const value = form[cf.key] as string;
      if (!isValidHexColor(value)) {
        toast({
          title: "Format Warna Tidak Valid",
          description: `${cf.label} harus dalam format #RRGGBB`,
          variant: "destructive",
        });
        return;
      }
    }

    setSaving(true);
    try {
      const payload = { ...form };
      // sidebarConfig is sent as object, the API will stringify it
      const res = await fetch("/api/admin/pengaturan", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Gagal menyimpan pengaturan");
      }

      toast({
        title: "Berhasil",
        description: "Pengaturan berhasil disimpan",
      });

      // Refresh the global theme context
      refetchPengaturan();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Gagal menyimpan pengaturan",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: currentPengaturan.warnaPrimary }} />
        <span className="ml-3 text-muted-foreground">Memuat pengaturan...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Section 1: Identitas Aplikasi */}
      <Card className="border-l-4" style={{ borderLeftColor: currentPengaturan.warnaPrimary }}>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <Info className="w-5 h-5" style={{ color: currentPengaturan.warnaPrimary }} />
            Identitas Aplikasi
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="namaAplikasi">Nama Aplikasi</Label>
              <Input
                id="namaAplikasi"
                value={form.namaAplikasi}
                onChange={(e) => handleFieldChange("namaAplikasi", e.target.value)}
                placeholder="Dashboard Keuangan"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="namaPemerintah">Nama Pemerintah</Label>
              <Input
                id="namaPemerintah"
                value={form.namaPemerintah}
                onChange={(e) => handleFieldChange("namaPemerintah", e.target.value)}
                placeholder="Pemerintah Kabupaten Seruyan"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="namaInstansi">Nama Instansi</Label>
              <Input
                id="namaInstansi"
                value={form.namaInstansi}
                onChange={(e) => handleFieldChange("namaInstansi", e.target.value)}
                placeholder="BKAD Kab. Seruyan"
              />
              <p className="text-xs text-muted-foreground">Nama instansi/OPD pengelola yang ditampilkan di sidebar, halaman login, dan homepage</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Tema & Warna */}
      <Card className="border-l-4" style={{ borderLeftColor: currentPengaturan.warnaSecondary }}>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <Palette className="w-5 h-5" style={{ color: currentPengaturan.warnaSecondary }} />
            Tema & Warna
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {COLOR_FIELDS.map((cf) => {
              const colorValue = form[cf.key] as string;
              const isValid = isValidHexColor(colorValue);
              return (
                <div key={cf.key} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">{cf.label}</Label>
                    <span className="text-xs text-muted-foreground">{cf.description}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Color swatch that triggers the hidden color picker */}
                    <button
                      type="button"
                      className="w-10 h-10 rounded-lg border-2 border-border shadow-sm transition-transform hover:scale-110 shrink-0"
                      style={{
                        backgroundColor: isValid ? colorValue : "#cccccc",
                      }}
                      onClick={() => {
                        const picker = document.getElementById(`picker-${cf.key}`);
                        picker?.click();
                      }}
                      title="Pilih warna"
                      aria-label={`Pilih ${cf.label}`}
                    />
                    {/* Hidden native color picker */}
                    <input
                      id={`picker-${cf.key}`}
                      type="color"
                      value={isValid ? colorValue : "#000000"}
                      onChange={(e) => handleColorPickerChange(cf.key, e.target.value)}
                      className="w-0 h-0 opacity-0 absolute"
                      tabIndex={-1}
                      aria-hidden="true"
                    />
                    {/* Hex input */}
                    <Input
                      value={colorValue}
                      onChange={(e) => handleColorHexChange(cf.key, e.target.value)}
                      placeholder="#000000"
                      className={`font-mono text-sm ${!isValid ? "border-red-400 focus-visible:ring-red-400" : ""}`}
                      maxLength={7}
                      aria-label={`${cf.label} kode hex`}
                    />
                  </div>
                  {!isValid && (
                    <p className="text-xs text-red-500">Format tidak valid, gunakan #RRGGBB</p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Theme Preview */}
          <div className="mt-6 p-4 rounded-xl border bg-muted/30">
            <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
              Pratinjau Tema
            </p>
            <div className="flex gap-3 items-stretch">
              {/* Mini Sidebar Mockup */}
              <div
                className="w-20 rounded-lg overflow-hidden flex flex-col shrink-0"
                style={{ backgroundColor: form.warnaDark }}
              >
                <div
                  className="px-2 py-2 flex items-center gap-1.5"
                  style={{ backgroundColor: form.warnaPrimary }}
                >
                  <div className="w-4 h-4 rounded-full bg-white/30" />
                  <div className="h-2 w-8 rounded bg-white/50" />
                </div>
                <div className="flex-1 py-2 px-1.5 space-y-1.5">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="flex items-center gap-1.5 px-1.5 py-1 rounded"
                      style={{
                        backgroundColor: i === 1 ? "rgba(255,255,255,0.15)" : "transparent",
                      }}
                    >
                      <div
                        className="w-2.5 h-2.5 rounded-sm"
                        style={{
                          backgroundColor: i === 1 ? form.warnaAccent : "rgba(255,255,255,0.4)",
                        }}
                      />
                      <div
                        className="h-1.5 rounded"
                        style={{
                          width: i === 1 ? "28px" : "22px",
                          backgroundColor: i === 1 ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.25)",
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Mini Content Area Mockup */}
              <div className="flex-1 rounded-lg overflow-hidden border bg-white">
                {/* Header bar */}
                <div
                  className="px-3 py-2 flex items-center justify-between"
                  style={{ backgroundColor: form.warnaPrimary }}
                >
                  <div className="h-2 w-16 rounded bg-white/50" />
                  <div
                    className="h-2 w-8 rounded"
                    style={{ backgroundColor: "rgba(255,255,255,0.4)" }}
                  />
                </div>
                {/* Content area */}
                <div className="p-2 space-y-2">
                  <div className="flex gap-1.5">
                    {[
                      form.warnaPrimary,
                      form.warnaSecondary,
                      form.warnaAccent,
                    ].map((color, i) => (
                      <div
                        key={i}
                        className="flex-1 h-8 rounded"
                        style={{ backgroundColor: color, opacity: 0.15 + i * 0.1 }}
                      />
                    ))}
                  </div>
                  <div className="flex gap-1.5">
                    <div
                      className="h-6 flex-1 rounded"
                      style={{ backgroundColor: form.warnaSecondary, opacity: 0.1 }}
                    />
                    <div
                      className="h-6 w-1/3 rounded"
                      style={{ backgroundColor: form.warnaAccent, opacity: 0.2 }}
                    />
                  </div>
                  {/* Accent bar */}
                  <div
                    className="h-1.5 w-full rounded"
                    style={{ backgroundColor: form.warnaAccent, opacity: 0.6 }}
                  />
                </div>
              </div>
            </div>

            {/* Color swatches summary */}
            <div className="flex items-center gap-2 mt-3">
              {COLOR_FIELDS.map((cf) => (
                <div key={cf.key} className="flex items-center gap-1.5">
                  <div
                    className="w-4 h-4 rounded border border-border"
                    style={{ backgroundColor: form[cf.key] as string }}
                  />
                  <span className="text-xs text-muted-foreground">{cf.label}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 3: Logo Aplikasi */}
      <Card className="border-l-4" style={{ borderLeftColor: currentPengaturan.warnaAccent }}>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <ImageIcon className="w-5 h-5" style={{ color: currentPengaturan.warnaAccent }} />
            Logo Aplikasi
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start">
            {/* Logo Preview */}
            <div className="flex items-center justify-center w-32 h-32 rounded-xl border-2 border-dashed border-border bg-muted/30 shrink-0 overflow-hidden">
              {logoPreview ? (
                <img
                  src={logoPreview}
                  alt="Logo Preview"
                  className="max-w-full max-h-full object-contain p-2"
                />
              ) : (
                <img
                  src={logoSrc}
                  alt="Logo Default"
                  className="max-w-full max-h-full object-contain p-2"
                />
              )}
            </div>

            {/* Upload Controls */}
            <div className="flex-1 space-y-3">
              <div className="space-y-2">
                <Label>Upload Logo Baru</Label>
                <p className="text-xs text-muted-foreground">
                  Format: PNG, JPG, SVG, atau GIF. Maksimal 1MB. Animasi GIF didukung.
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml,image/gif"
                  onChange={handleLogoUpload}
                  className="hidden"
                  aria-label="Upload logo"
                />
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="gap-1.5"
                  >
                    <Upload className="w-4 h-4" />
                    Pilih File
                  </Button>
                  {(logoPreview || form.logoBase64) && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleRemoveLogo}
                      className="gap-1.5 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                      Hapus Logo
                    </Button>
                  )}
                </div>
              </div>
              {logoSizeWarning && (
                <div className="flex items-start gap-2 p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-700">
                  <span className="text-sm">
                    ⚠️ Ukuran file melebihi 500KB. Ini dapat memperlambat pemuatan halaman.
                  </span>
                </div>
              )}
              {logoPreview && (
                <p className="text-xs text-muted-foreground">
                  ✅ Logo baru akan diterapkan setelah disimpan
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 4: Informasi Instansi */}
      <Card className="border-l-4" style={{ borderLeftColor: currentPengaturan.warnaDark }}>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="w-5 h-5" style={{ color: currentPengaturan.warnaDark }} />
            Informasi Instansi
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="alamatInstansi">Alamat Instansi</Label>
            <Input
              id="alamatInstansi"
              value={form.alamatInstansi || ""}
              onChange={(e) => handleFieldChange("alamatInstansi", e.target.value)}
              placeholder="Jl. ..."
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="teleponInstansi">Telepon</Label>
              <Input
                id="teleponInstansi"
                value={form.teleponInstansi || ""}
                onChange={(e) => handleFieldChange("teleponInstansi", e.target.value)}
                placeholder="+62 ..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emailInstansi">Email</Label>
              <Input
                id="emailInstansi"
                type="email"
                value={form.emailInstansi || ""}
                onChange={(e) => handleFieldChange("emailInstansi", e.target.value)}
                placeholder="email@seruyankab.go.id"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="websiteInstansi">Website</Label>
              <Input
                id="websiteInstansi"
                value={form.websiteInstansi || ""}
                onChange={(e) => handleFieldChange("websiteInstansi", e.target.value)}
                placeholder="https://seruyankab.go.id"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 5: Tampilan Sidebar */}
      <Card className="border-l-4" style={{ borderLeftColor: currentPengaturan.warnaAccent }}>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <LayoutList className="w-5 h-5" style={{ color: currentPengaturan.warnaAccent }} />
            Tampilan Sidebar per Role
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Atur menu sidebar mana yang tampil untuk setiap role. Item yang tidak dicentang akan disembunyikan dari sidebar untuk role tersebut.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Role tabs */}
          <div className="flex flex-wrap gap-2">
            {ROLES.map((role) => {
              const hiddenCount = (form.sidebarConfig?.hiddenItems?.[role.id] || []).length;
              const allVisible = hiddenCount === 0;
              return (
                <button
                  key={role.id}
                  onClick={() => setActiveSidebarRole(role.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all border ${
                    activeSidebarRole === role.id
                      ? "border-current shadow-sm"
                      : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
                  }`}
                  style={
                    activeSidebarRole === role.id
                      ? { backgroundColor: `${currentPengaturan.warnaPrimary}10`, color: currentPengaturan.warnaPrimary, borderColor: `${currentPengaturan.warnaPrimary}40` }
                      : undefined
                  }
                >
                  {role.label}
                  {!allVisible && (
                    <span className="text-[10px] bg-amber-100 text-amber-700 rounded-full px-1.5 py-0.5 font-semibold">
                      {SIDEBAR_ITEMS.length - hiddenCount}/{SIDEBAR_ITEMS.length}
                    </span>
                  )}
                  {allVisible && (
                    <span className="text-[10px] bg-emerald-100 text-emerald-700 rounded-full px-1.5 py-0.5 font-semibold">
                      Semua
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Active role description */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/40 rounded-lg px-3 py-2">
            <Info className="w-3.5 h-3.5 shrink-0" />
            <span>
              {ROLES.find((r) => r.id === activeSidebarRole)?.description} — 
              Item yang tidak dicentang akan tersembunyi untuk role <strong>{ROLES.find((r) => r.id === activeSidebarRole)?.label}</strong>
            </span>
          </div>

          {/* Select all / Deselect all */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSelectAllForRole(activeSidebarRole, true)}
              className="gap-1.5 text-xs"
            >
              <Eye className="w-3.5 h-3.5" />
              Tampilkan Semua
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSelectAllForRole(activeSidebarRole, false)}
              className="gap-1.5 text-xs"
            >
              <EyeOff className="w-3.5 h-3.5" />
              Sembunyikan Semua
            </Button>
          </div>

          {/* Sidebar items grid */}
          <div className="space-y-3">
            {(() => {
              const groups = [...new Set(SIDEBAR_ITEMS.map((item) => item.group))];
              return groups.map((group) => (
                <div key={group}>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    {group}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {SIDEBAR_ITEMS.filter((item) => item.group === group).map((item) => {
                      const visible = isSidebarItemVisible(item.id, activeSidebarRole);
                      return (
                        <div
                          key={item.id}
                          className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-all ${
                            visible
                              ? "border-emerald-200 bg-emerald-50/50"
                              : "border-border bg-muted/30"
                          }`}
                        >
                          <Switch
                            checked={visible}
                            onCheckedChange={(checked) =>
                              handleSidebarToggle(item.id, activeSidebarRole, checked)
                            }
                            className="data-[state=checked]:bg-emerald-500"
                          />
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium ${visible ? "text-foreground" : "text-muted-foreground line-through"}`}>
                              {item.label}
                            </p>
                          </div>
                          {visible ? (
                            <Eye className="w-4 h-4 text-emerald-500 shrink-0" />
                          ) : (
                            <EyeOff className="w-4 h-4 text-muted-foreground shrink-0" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ));
            })()}
          </div>
        </CardContent>
      </Card>

      {/* Section 6: Loader Display Time */}
      <Card className="border-l-4" style={{ borderLeftColor: currentPengaturan.warnaPrimary }}>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="w-5 h-5" style={{ color: currentPengaturan.warnaPrimary }} />
            Durasi Loader
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Atur berapa lama animasi loader (BudgetLoader) ditampilkan saat memuat data dashboard.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-6">
            <div className="flex-1 space-y-3">
              <div className="flex items-center justify-between">
                <Label>Durasi Tampil Loader</Label>
                <span className="text-2xl font-bold tabular-nums" style={{ color: currentPengaturan.warnaPrimary }}>
                  {(form.loaderDisplayTime / 1000).toFixed(1)}s
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={10000}
                step={500}
                value={form.loaderDisplayTime}
                onChange={(e) => handleFieldChange("loaderDisplayTime", e.target.value)}
                className="w-full h-2 rounded-full appearance-none cursor-pointer accent-emerald-600"
                style={{
                  background: `linear-gradient(to right, ${currentPengaturan.warnaPrimary} 0%, ${currentPengaturan.warnaPrimary} ${(form.loaderDisplayTime / 10000) * 100}%, #e2e8f0 ${(form.loaderDisplayTime / 10000) * 100}%, #e2e8f0 100%)`,
                }}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0s (Nonaktif)</span>
                <span>5s</span>
                <span>10s</span>
              </div>
            </div>
          </div>

          {/* Quick presets */}
          <div className="flex flex-wrap gap-2">
            {[
              { ms: 0, label: "Nonaktif" },
              { ms: 1500, label: "1.5 detik" },
              { ms: 3000, label: "3 detik" },
              { ms: 5000, label: "5 detik" },
              { ms: 8000, label: "8 detik" },
              { ms: 10000, label: "10 detik" },
            ].map((preset) => (
              <button
                key={preset.ms}
                onClick={() => handleFieldChange("loaderDisplayTime", String(preset.ms))}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  form.loaderDisplayTime === preset.ms
                    ? "border-current shadow-sm"
                    : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
                }`}
                style={
                  form.loaderDisplayTime === preset.ms
                    ? { backgroundColor: `${currentPengaturan.warnaPrimary}10`, color: currentPengaturan.warnaPrimary, borderColor: `${currentPengaturan.warnaPrimary}40` }
                    : undefined
                }
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Preview hint */}
          <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/40">
            <Activity className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
            <div className="text-xs text-muted-foreground space-y-1">
              <p>
                {form.loaderDisplayTime === 0
                  ? "Loader tidak akan ditampilkan, data langsung dimuat tanpa animasi."
                  : `Loader akan ditampilkan selama minimal ${(form.loaderDisplayTime / 1000).toFixed(1)} detik saat halaman dimuat atau tahun anggaran diubah.`
                }
              </p>
              <p className="text-muted-foreground/60">
                Tip: Durasi 3-5 detik memberikan pengalaman visual yang baik tanpa membuat pengguna menunggu terlalu lama.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 7: AI Copilot Configuration */}
      <Card className="border-l-4" style={{ borderLeftColor: currentPengaturan.warnaAccent }}>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <BotMessageSquare className="w-5 h-5" style={{ color: currentPengaturan.warnaAccent }} />
            AI Copilot
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Konfigurasi AI Financial Copilot untuk analisis keuangan daerah. Pengaturan ini memudahkan deploy dan kustomisasi.
          </p>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Enable/Disable */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center">
                <BotMessageSquare className="w-4.5 h-4.5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium">Aktifkan AI Copilot</p>
                <p className="text-xs text-muted-foreground">Nonaktifkan untuk menyembunyikan fitur chat AI</p>
              </div>
            </div>
            <Switch
              checked={form.copilotConfig?.enabled ?? DEFAULT_COPILOT_CONFIG.enabled}
              onCheckedChange={(checked) => {
                const current = form.copilotConfig || DEFAULT_COPILOT_CONFIG;
                setForm((prev) => ({ ...prev, copilotConfig: { ...current, enabled: checked } }));
              }}
              className="data-[state=checked]:bg-emerald-500"
            />
          </div>

          {(form.copilotConfig?.enabled ?? DEFAULT_COPILOT_CONFIG.enabled) && (
            <>
              {/* ═══ API Keys per Layanan AI ═══ */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5" />
                    API Key per Layanan AI
                  </h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 text-xs h-7"
                    onClick={() => {
                      const current = form.copilotConfig || DEFAULT_COPILOT_CONFIG;
                      setForm((prev) => ({ ...prev, copilotConfig: { ...current, apiKeys: { ...DEFAULT_AI_API_KEYS } } }));
                    }}
                  >
                    <RotateCcw className="w-3 h-3" />
                    Reset Semua Key
                  </Button>
                </div>

                {/* Base URL (shared) */}
                <div className="space-y-2 p-3 rounded-lg bg-muted/30 border border-border/50">
                  <Label htmlFor="aiBaseUrl" className="flex items-center gap-1.5 text-sm">
                    <Globe className="w-3.5 h-3.5 text-muted-foreground" />
                    Base URL API
                  </Label>
                  <Input
                    id="aiBaseUrl"
                    value={form.copilotConfig?.apiKeys?.baseUrl ?? ""}
                    onChange={(e) => {
                      const current = form.copilotConfig || DEFAULT_COPILOT_CONFIG;
                      setForm((prev) => ({
                        ...prev,
                        copilotConfig: {
                          ...current,
                          apiKeys: { ...(current.apiKeys || DEFAULT_AI_API_KEYS), baseUrl: e.target.value },
                        },
                      }));
                    }}
                    placeholder="https://api.example.com/v1 (opsional, kosongkan untuk default)"
                    className="font-mono text-sm"
                  />
                  <p className="text-[11px] text-muted-foreground">Base URL untuk semua layanan AI. Kosongkan untuk menggunakan endpoint default dari SDK.</p>
                </div>

                {/* API Key cards grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {([
                    { key: "llm" as const, label: "LLM / Chat", desc: "AI Copilot & chat keuangan", icon: Sparkles, placeholder: "sk-... atau API key LLM" },
                    { key: "vlm" as const, label: "Vision / VLM", desc: "Analisis gambar & dokumen", icon: Eye, placeholder: "API key untuk Vision Model" },
                    { key: "tts" as const, label: "Text-to-Speech", desc: "Bacakan laporan dengan suara", icon: Volume2, placeholder: "API key untuk TTS" },
                    { key: "asr" as const, label: "Speech-to-Text", desc: "Input suara untuk Copilot", icon: Mic, placeholder: "API key untuk ASR" },
                    { key: "imageGen" as const, label: "Image Generation", desc: "Buat gambar dengan AI", icon: ImagePlus, placeholder: "API key untuk Image Gen" },
                    { key: "webSearch" as const, label: "Web Search", desc: "Pencarian web real-time", icon: Globe, placeholder: "API key untuk Web Search" },
                  ] as const).map((item) => {
                    const keyValue = form.copilotConfig?.apiKeys?.[item.key] ?? "";
                    const hasKey = keyValue.length > 0;
                    const isShown = showApiKeys[item.key] ?? false;
                    return (
                      <div
                        key={item.key}
                        className={`rounded-lg border p-3 space-y-2 transition-all ${
                          hasKey ? "border-emerald-200 bg-emerald-50/30" : "border-border/60 bg-card"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${
                              hasKey ? "bg-emerald-100" : "bg-muted"
                            }`}>
                              <item.icon className={`w-3.5 h-3.5 ${hasKey ? "text-emerald-600" : "text-muted-foreground"}`} />
                            </div>
                            <div>
                              <p className="text-sm font-medium leading-tight">{item.label}</p>
                              <p className="text-[10px] text-muted-foreground leading-tight">{item.desc}</p>
                            </div>
                          </div>
                          {hasKey ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                          ) : (
                            <XCircle className="w-4 h-4 text-muted-foreground/40 shrink-0" />
                          )}
                        </div>
                        <div className="relative">
                          <Input
                            type={isShown ? "text" : "password"}
                            value={keyValue}
                            onChange={(e) => {
                              const current = form.copilotConfig || DEFAULT_COPILOT_CONFIG;
                              setForm((prev) => ({
                                ...prev,
                                copilotConfig: {
                                  ...current,
                                  apiKeys: { ...(current.apiKeys || DEFAULT_AI_API_KEYS), [item.key]: e.target.value },
                                },
                              }));
                            }}
                            placeholder={item.placeholder}
                            className="pr-9 font-mono text-xs h-8"
                          />
                          <button
                            type="button"
                            onClick={() => setShowApiKeys((prev) => ({ ...prev, [item.key]: !prev[item.key] }))}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            aria-label={isShown ? "Sembunyikan" : "Tampilkan"}
                          >
                            {isShown ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* API Keys summary */}
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/40 border border-border/40">
                  <Key className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <p className="text-[11px] text-muted-foreground">
                    {(() => {
                      const keys = form.copilotConfig?.apiKeys || DEFAULT_AI_API_KEYS;
                      const configured = Object.entries(keys).filter(([k, v]) => k !== 'baseUrl' && v).length;
                      const total = Object.keys(keys).filter(k => k !== 'baseUrl').length;
                      return configured === 0
                        ? "Belum ada API Key yang dikonfigurasi. Masukkan key untuk mengaktifkan layanan AI."
                        : configured === total
                          ? `Semua ${total} API Key telah dikonfigurasi ✓`
                          : `${configured} dari ${total} API Key telah dikonfigurasi`;
                    })()}
                  </p>
                </div>
              </div>

              {/* Provider & Model */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5" />
                    Provider AI
                  </Label>
                  <select
                    value={form.copilotConfig?.provider ?? DEFAULT_COPILOT_CONFIG.provider}
                    onChange={(e) => {
                      const current = form.copilotConfig || DEFAULT_COPILOT_CONFIG;
                      setForm((prev) => ({ ...prev, copilotConfig: { ...current, provider: e.target.value } }));
                    }}
                    className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="z-ai">Z-AI (Bawaan)</option>
                    <option value="openai">OpenAI</option>
                    <option value="custom">Custom API</option>
                  </select>
                  <p className="text-[10px] text-muted-foreground">Z-AI sudah tersedia tanpa API key</p>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5" />
                    Model
                  </Label>
                  <Input
                    value={form.copilotConfig?.model ?? DEFAULT_COPILOT_CONFIG.model}
                    onChange={(e) => {
                      const current = form.copilotConfig || DEFAULT_COPILOT_CONFIG;
                      setForm((prev) => ({ ...prev, copilotConfig: { ...current, model: e.target.value } }));
                    }}
                    placeholder="default"
                  />
                  <p className="text-[10px] text-muted-foreground">Kosongkan untuk menggunakan model default</p>
                </div>
              </div>

              {/* Temperature & Max Tokens */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5">
                    <Thermometer className="w-3.5 h-3.5" />
                    Temperature
                    <span className="ml-auto text-xs font-mono text-muted-foreground">
                      {form.copilotConfig?.temperature ?? DEFAULT_COPILOT_CONFIG.temperature}
                    </span>
                  </Label>
                  <input
                    type="range"
                    min={0}
                    max={2}
                    step={0.1}
                    value={form.copilotConfig?.temperature ?? DEFAULT_COPILOT_CONFIG.temperature}
                    onChange={(e) => {
                      const current = form.copilotConfig || DEFAULT_COPILOT_CONFIG;
                      setForm((prev) => ({ ...prev, copilotConfig: { ...current, temperature: parseFloat(e.target.value) } }));
                    }}
                    className="w-full h-2 rounded-full appearance-none cursor-pointer accent-amber-500"
                    style={{
                      background: `linear-gradient(to right, ${currentPengaturan.warnaAccent} 0%, ${currentPengaturan.warnaAccent} ${((form.copilotConfig?.temperature ?? 0.7) / 2) * 100}%, #e2e8f0 ${((form.copilotConfig?.temperature ?? 0.7) / 2) * 100}%, #e2e8f0 100%)`,
                    }}
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>0 (Faktual)</span>
                    <span>1</span>
                    <span>2 (Kreatif)</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5" />
                    Max Tokens
                  </Label>
                  <Input
                    type="number"
                    min={256}
                    max={16384}
                    step={256}
                    value={form.copilotConfig?.maxTokens ?? DEFAULT_COPILOT_CONFIG.maxTokens}
                    onChange={(e) => {
                      const current = form.copilotConfig || DEFAULT_COPILOT_CONFIG;
                      setForm((prev) => ({ ...prev, copilotConfig: { ...current, maxTokens: parseInt(e.target.value) || 4096 } }));
                    }}
                  />
                  <p className="text-[10px] text-muted-foreground">Panjang maksimal respons (256-16384)</p>
                </div>
              </div>

              {/* Welcome Message */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5" />
                  Pesan Selamat Datang
                </Label>
                <Textarea
                  value={form.copilotConfig?.welcomeMessage ?? DEFAULT_COPILOT_CONFIG.welcomeMessage}
                  onChange={(e) => {
                    const current = form.copilotConfig || DEFAULT_COPILOT_CONFIG;
                    setForm((prev) => ({ ...prev, copilotConfig: { ...current, welcomeMessage: e.target.value } }));
                  }}
                  rows={2}
                  placeholder="Saya siap membantu menganalisis data keuangan daerah..."
                />
              </div>

              {/* Custom System Prompt */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  <BotMessageSquare className="w-3.5 h-3.5" />
                  System Prompt Tambahan
                </Label>
                <Textarea
                  value={form.copilotConfig?.systemPrompt ?? DEFAULT_COPILOT_CONFIG.systemPrompt}
                  onChange={(e) => {
                    const current = form.copilotConfig || DEFAULT_COPILOT_CONFIG;
                    setForm((prev) => ({ ...prev, copilotConfig: { ...current, systemPrompt: e.target.value } }));
                  }}
                  rows={4}
                  placeholder="Tambahkan instruksi khusus untuk AI, misalnya: 'Fokuskan analisis pada efisiensi belanja modal' atau 'Gunakan bahasa yang lebih sederhana'..."
                />
                <p className="text-[10px] text-muted-foreground">
                  Instruksi tambahan yang akan ditambahkan ke system prompt bawaan. Kosongkan untuk menggunakan prompt default.
                </p>
              </div>

              {/* Config Preview */}
              <div className="p-3 rounded-xl bg-muted/30 border space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Konfigurasi Saat Ini</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  <span className="text-muted-foreground">Provider:</span>
                  <span className="font-medium">{form.copilotConfig?.provider ?? DEFAULT_COPILOT_CONFIG.provider}</span>
                  <span className="text-muted-foreground">Model:</span>
                  <span className="font-medium">{form.copilotConfig?.model ?? (DEFAULT_COPILOT_CONFIG.model || "default")}</span>
                  <span className="text-muted-foreground">Temperature:</span>
                  <span className="font-medium">{form.copilotConfig?.temperature ?? DEFAULT_COPILOT_CONFIG.temperature}</span>
                  <span className="text-muted-foreground">Max Tokens:</span>
                  <span className="font-medium">{form.copilotConfig?.maxTokens ?? DEFAULT_COPILOT_CONFIG.maxTokens}</span>
                  <span className="text-muted-foreground">Status:</span>
                  <span className="font-medium text-emerald-600">✓ Aktif</span>
                </div>
              </div>
            </>
          )}

          {/* Disabled state info */}
          {!(form.copilotConfig?.enabled ?? DEFAULT_COPILOT_CONFIG.enabled) && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700">
                AI Copilot dinonaktifkan. Menu &quot;AI Copilot&quot; di sidebar akan disembunyikan dan fitur chat tidak dapat diakses.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section 8: Reset Setup Wizard */}
      <Card className="border-l-4 border-l-amber-500">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base text-amber-700">
            <RotateCcw className="w-5 h-5" />
            Setup Wizard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">
            Jalankan kembali setup wizard untuk mengkonfigurasi ulang aplikasi dari awal. Data yang sudah ada tidak akan dihapus.
          </p>
          <Button
            variant="outline"
            onClick={async () => {
              if (!confirm("Apakah Anda yakin ingin menjalankan ulang Setup Wizard? Halaman akan di-refresh setelah konfirmasi.")) return;
              setResettingSetup(true);
              try {
                const res = await fetch("/api/admin/pengaturan", {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ setupComplete: false }),
                });
                if (!res.ok) throw new Error("Gagal reset setup");
                window.location.reload();
              } catch (error) {
                toast({
                  title: "Error",
                  description: error instanceof Error ? error.message : "Gagal reset setup wizard",
                  variant: "destructive",
                });
                setResettingSetup(false);
              }
            }}
            disabled={resettingSetup}
            className="gap-2 border-amber-300 text-amber-700 hover:bg-amber-50"
          >
            {resettingSetup ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Mereset...
              </>
            ) : (
              <>
                <RotateCcw className="w-4 h-4" />
                Jalankan Ulang Setup Wizard
              </>
            )}
          </Button>
          <div className="flex items-start gap-2 mt-3 p-2 rounded-lg bg-amber-50 border border-amber-200">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700">
              Setup wizard akan muncul saat halaman di-refresh. Pastikan Anda mengingat kredensial admin yang ada.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="gap-2 text-white min-w-[160px]"
          style={{
            backgroundColor: currentPengaturan.warnaPrimary,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = currentPengaturan.warnaSecondary;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = currentPengaturan.warnaPrimary;
          }}
          size="lg"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Menyimpan...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Simpan Pengaturan
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
