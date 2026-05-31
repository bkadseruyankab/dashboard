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
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Building2,
  KeyRound,
  Landmark,
} from "lucide-react";
import PendapatanManager from "./PendapatanManager";
import BelanjaManager from "./BelanjaManager";
import PembiayaanManager from "./PembiayaanManager";
import UserManager from "./UserManager";
import { usePengaturan } from "@/context/PengaturanContext";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

type OpdTab = "pendapatan" | "belanja" | "pembiayaan" | "akun";

type TahunAnggaranOption = {
  id: string;
  tahun: number;
  aktif: boolean;
};

interface OpdPanelProps {
  tahun: number;
  tahunList: number[];
}

const TAB_CONFIG: { value: OpdTab; label: string; icon: React.ElementType }[] = [
  { value: "pendapatan", label: "Pendapatan", icon: TrendingUp },
  { value: "belanja", label: "Belanja", icon: TrendingDown },
  { value: "pembiayaan", label: "Pembiayaan", icon: DollarSign },
  { value: "akun", label: "Akun", icon: KeyRound },
];

export default function OpdPanel({ tahun, tahunList }: OpdPanelProps) {
  const { pengaturan } = usePengaturan();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<OpdTab>("pendapatan");
  const [tahunAnggaranList, setTahunAnggaranList] = useState<TahunAnggaranOption[]>([]);
  const [selectedTahunAnggaranId, setSelectedTahunAnggaranId] = useState<string | null>(null);
  const [loadingTahun, setLoadingTahun] = useState(true);
  const [opdInfo, setOpdInfo] = useState<{
    kodeOpd: string;
    namaOpd: string;
    kepalaOpd: string | null;
  } | null>(null);

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
      // Silently fail
    } finally {
      setLoadingTahun(false);
    }
  }, [tahun]);

  // Fetch OPD info based on user's opdId
  const fetchOpdInfo = useCallback(async () => {
    if (!user?.opdId) return;
    try {
      const res = await fetch(`/api/admin/opd?tahunAnggaranId=${selectedTahunAnggaranId || ""}`);
      if (!res.ok) return;
      const json = await res.json();
      const opds = json.data || [];
      // Find the OPD matching user's opdId
      const myOpd = opds.find((opd: { id: string }) => opd.id === user.opdId);
      if (myOpd) {
        setOpdInfo({
          kodeOpd: myOpd.kodeOpd,
          namaOpd: myOpd.namaOpd,
          kepalaOpd: myOpd.kepalaOpd,
        });
      } else {
        // OPD might not be in the selected tahun anggaran, try to get from user's original OPD
        // Fetch from the database directly
        const opdRes = await fetch(`/api/admin/opd?tahunAnggaranId=&search=`);
        // Fallback: use the user's name as OPD name
        setOpdInfo({
          kodeOpd: "",
          namaOpd: user.name || "OPD",
          kepalaOpd: null,
        });
      }
    } catch {
      setOpdInfo({
        kodeOpd: "",
        namaOpd: user?.name || "OPD",
        kepalaOpd: null,
      });
    }
  }, [user?.opdId, user?.name, selectedTahunAnggaranId]);

  useEffect(() => {
    fetchTahunAnggaran();
  }, [fetchTahunAnggaran]);

  useEffect(() => {
    fetchOpdInfo();
  }, [fetchOpdInfo]);

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
            <Landmark className="w-7 h-7" style={{ color: pengaturan.warnaAccent }} />
          </div>
          <div className="text-center sm:text-left">
            <h2 className="text-lg lg:text-xl font-bold tracking-wide uppercase">
              Dashboard OPD
            </h2>
            <p className="text-sm text-emerald-100 mt-1">
              Kelola data Pendapatan, Belanja, dan Pembiayaan OPD Anda
            </p>
            {opdInfo && (
              <div className="flex items-center gap-2 mt-2">
                <Building2 className="w-4 h-4 text-emerald-200" />
                <span className="text-xs text-emerald-200 font-medium">
                  {opdInfo.kodeOpd} — {opdInfo.namaOpd}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* OPD Info Card */}
      {opdInfo && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ backgroundColor: `${pengaturan.warnaPrimary}15`, color: pengaturan.warnaPrimary }}
              >
                <Building2 className="w-4 h-4" />
              </div>
              Informasi OPD
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Kode OPD</Label>
                <p className="text-sm font-medium">{opdInfo.kodeOpd || "-"}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Nama OPD</Label>
                <p className="text-sm font-medium">{opdInfo.namaOpd || "-"}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Kepala OPD</Label>
                <p className="text-sm font-medium">{opdInfo.kepalaOpd || "-"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Year selector */}
      {activeTab !== "akun" && (
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
              Belum ada tahun anggaran. Hubungi administrator.
            </span>
          )}
        </div>
      )}

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as OpdTab)}
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
              <span className="sm:hidden">{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="pendapatan" className="mt-4">
          <PendapatanManager tahunAnggaranId={selectedTahunAnggaranId} />
        </TabsContent>

        <TabsContent value="belanja" className="mt-4">
          <BelanjaManager tahunAnggaranId={selectedTahunAnggaranId} />
        </TabsContent>

        <TabsContent value="pembiayaan" className="mt-4">
          <PembiayaanManager tahunAnggaranId={selectedTahunAnggaranId} />
        </TabsContent>

        <TabsContent value="akun" className="mt-4">
          <UserManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
