"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
} from "lucide-react";
import { usePengaturan } from "@/context/PengaturanContext";

interface PengaturanData {
  id: string;
  namaAplikasi: string;
  namaPemerintah: string;
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
}

const DEFAULT_SETTINGS: Omit<PengaturanData, "id"> = {
  namaAplikasi: "Dashboard Keuangan",
  namaPemerintah: "Pemerintah Kabupaten Seruyan",
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
};

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

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/pengaturan");
      if (!res.ok) throw new Error("Gagal mengambil pengaturan");
      const json = await res.json();
      const data: PengaturanData = json.data;
      setForm({
        namaAplikasi: data.namaAplikasi || DEFAULT_SETTINGS.namaAplikasi,
        namaPemerintah: data.namaPemerintah || DEFAULT_SETTINGS.namaPemerintah,
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
    setForm((prev) => ({ ...prev, [field]: value }));
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
      const res = await fetch("/api/admin/pengaturan", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  Format: PNG, JPG, atau SVG. Maksimal 500KB (rekomendasi).
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml"
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
