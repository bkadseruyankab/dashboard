"use client";

import { useState, useEffect, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Shield, Calendar, TrendingUp, TrendingDown, DollarSign, BarChart3, Building2, Settings, Landmark, Tag } from "lucide-react";
import { AdminTab } from "@/components/dashboard/types";
import TahunAnggaranManager from "./TahunAnggaranManager";
import PendapatanManager from "./PendapatanManager";
import BelanjaManager from "./BelanjaManager";
import PembiayaanManager from "./PembiayaanManager";
import RealisasiAkunManager from "./RealisasiAkunManager";
import RealisasiSkpdManager from "./RealisasiSkpdManager";
import OpdManager from "./OpdManager";
import KategoriManager from "./KategoriManager";
import SettingsManager from "./SettingsManager";
import { usePengaturan } from "@/context/PengaturanContext";

type TahunAnggaranOption = {
  id: string;
  tahun: number;
  aktif: boolean;
};

interface AdminPanelProps {
  tahun: number;
  tahunList: number[];
}

const TAB_CONFIG: { value: AdminTab; label: string; icon: React.ElementType }[] = [
  { value: "tahun-anggaran", label: "Tahun Anggaran", icon: Calendar },
  { value: "kategori", label: "Kategori", icon: Tag },
  { value: "pendapatan", label: "Pendapatan", icon: TrendingUp },
  { value: "belanja", label: "Belanja", icon: TrendingDown },
  { value: "pembiayaan", label: "Pembiayaan", icon: DollarSign },
  { value: "realisasi-akun", label: "Realisasi Akun", icon: BarChart3 },
  { value: "realisasi-skpd", label: "Realisasi SKPD", icon: Building2 },
  { value: "opd", label: "OPD", icon: Landmark },
  { value: "pengaturan", label: "Pengaturan", icon: Settings },
];

export default function AdminPanel({ tahun, tahunList }: AdminPanelProps) {
  const { pengaturan } = usePengaturan();
  const [activeTab, setActiveTab] = useState<AdminTab>("tahun-anggaran");
  const [tahunAnggaranList, setTahunAnggaranList] = useState<TahunAnggaranOption[]>([]);
  const [selectedTahunAnggaranId, setSelectedTahunAnggaranId] = useState<string | null>(null);
  const [loadingTahun, setLoadingTahun] = useState(true);

  const fetchTahunAnggaran = useCallback(async () => {
    setLoadingTahun(true);
    try {
      const res = await fetch("/api/admin/tahun-anggaran");
      if (!res.ok) throw new Error("Failed to fetch tahun anggaran");
      const json = await res.json();
      const list: TahunAnggaranOption[] = json.data || [];
      setTahunAnggaranList(list);

      // Auto-select the matching tahun or the active one
      const matchByTahun = list.find((t) => t.tahun === tahun);
      const activeOne = list.find((t) => t.aktif);
      const selected = matchByTahun || activeOne || list[0] || null;
      setSelectedTahunAnggaranId(selected?.id ?? null);
    } catch {
      // Silently fail - will show "select tahun" message
    } finally {
      setLoadingTahun(false);
    }
  }, [tahun]);

  useEffect(() => {
    fetchTahunAnggaran();
  }, [fetchTahunAnggaran]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div
        className="relative overflow-hidden rounded-xl text-white p-6"
        style={{
          background: `linear-gradient(to right, ${pengaturan.warnaPrimary}, ${pengaturan.warnaSecondary}, ${pengaturan.warnaSecondary}cc)`,
        }}
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24" />
        <div className="relative flex flex-col sm:flex-row items-center gap-4">
          <div className="flex items-center justify-center w-14 h-14 rounded-full bg-white/20 shrink-0">
            <Shield className="w-7 h-7" style={{ color: pengaturan.warnaAccent }} />
          </div>
          <div className="text-center sm:text-left">
            <h2 className="text-lg lg:text-xl font-bold tracking-wide uppercase">
              Dashboard Admin
            </h2>
            <p className="text-sm text-emerald-100 mt-1">
              Kelola data APBD, realisasi, dan tahun anggaran Kabupaten Seruyan
            </p>
          </div>
        </div>
      </div>

      {/* Year selector for data filtering */}
      {activeTab !== "tahun-anggaran" && activeTab !== "pengaturan" && activeTab !== "kategori" && (
        <div className="flex items-center gap-3 px-1">
          <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
            Tahun Anggaran:
          </span>
          <Select
            value={selectedTahunAnggaranId ?? ""}
            onValueChange={setSelectedTahunAnggaranId}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Pilih Tahun" />
            </SelectTrigger>
            <SelectContent>
              {tahunAnggaranList.map((ta) => (
                <SelectItem key={ta.id} value={ta.id}>
                  {ta.tahun} {ta.aktif ? "(Aktif)" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {tahunAnggaranList.length === 0 && !loadingTahun && (
            <span className="text-xs text-amber-600">
              Belum ada tahun anggaran. Tambahkan terlebih dahulu di tab Tahun Anggaran.
            </span>
          )}
        </div>
      )}

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as AdminTab)}
      >
        <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/50 p-1.5 rounded-xl">
          {TAB_CONFIG.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="flex items-center gap-1.5 data-[state=active]:bg-[var(--gov-primary)] data-[state=active]:text-white px-3 py-2 text-xs sm:text-sm"
            >
              <tab.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.label.split(" ").pop()}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="tahun-anggaran" className="mt-4">
          <TahunAnggaranManager />
        </TabsContent>

        <TabsContent value="kategori" className="mt-4">
          <KategoriManager />
        </TabsContent>

        <TabsContent value="pendapatan" className="mt-4">
          <PendapatanManager tahunAnggaranId={selectedTahunAnggaranId} />
        </TabsContent>

        <TabsContent value="belanja" className="mt-4">
          <BelanjaManager tahunAnggaranId={selectedTahunAnggaranId} />
        </TabsContent>

        <TabsContent value="pembiayaan" className="mt-4">
          <PembiayaanManager tahunAnggaranId={selectedTahunAnggaranId} />
        </TabsContent>

        <TabsContent value="realisasi-akun" className="mt-4">
          <RealisasiAkunManager tahunAnggaranId={selectedTahunAnggaranId} />
        </TabsContent>

        <TabsContent value="realisasi-skpd" className="mt-4">
          <RealisasiSkpdManager tahunAnggaranId={selectedTahunAnggaranId} />
        </TabsContent>

        <TabsContent value="opd" className="mt-4">
          <OpdManager tahunAnggaranId={selectedTahunAnggaranId} />
        </TabsContent>

        <TabsContent value="pengaturan" className="mt-4">
          <SettingsManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
