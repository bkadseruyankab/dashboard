"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import GenericCrudTable, { type ColumnDef, type RowAction } from "./GenericCrudTable";
import DataFormDialog, { type FormField } from "./DataFormDialog";
import DeleteConfirmDialog from "./DeleteConfirmDialog";
import { safePercentage } from "@/components/dashboard/types";
import RupiahCell from "@/components/dashboard/RupiahCell";
import {
  RefreshCw,
  Zap,
  Loader2,
  Eye,
  PencilLine,
  History,
  CalendarClock,
  TrendingUp,
  TrendingDown,
  ArrowRight,
} from "lucide-react";
import { usePengaturan } from "@/context/PengaturanContext";
import CurrencyInput from "./CurrencyInput";
import { useAuth } from "@/hooks/use-auth";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type RealisasiAkun = {
  id: string;
  tahunAnggaranId: string;
  kodeAkun: string;
  namaAkun: string;
  jenis: string;
  anggaran: number;
  realisasi: number;
  persentase: number;
  autoSync: boolean;
  tanggalUpdate?: string;
};

/** Lightweight type for OPD-computed realisasi data (no id, no autoSync, no tanggalUpdate) */
type OpdRealisasiAkun = {
  kodeAkun: string;
  namaAkun: string;
  jenis: string;
  anggaran: number;
  realisasi: number;
  persentase: number;
};

type HistoryRecord = {
  id: string;
  realisasiAkunId: string;
  realisasiLama: number;
  realisasiBaru: number;
  persentaseBaru: number;
  tanggalUpdate: string;
  keterangan: string | null;
  updatedBy: string | null;
  createdAt: string;
};

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

const COLUMNS: ColumnDef[] = [
  { key: "kodeAkun", label: "Kode Induk", type: "text", width: "110px" },
  { key: "namaAkun", label: "Nama Akun", type: "text", wrap: true },
  { key: "jenis", label: "Jenis", type: "text", width: "120px" },
  { key: "anggaran", label: "Anggaran", type: "currency", width: "160px" },
  { key: "realisasi", label: "Realisasi", type: "currency", width: "160px" },
  { key: "persentase", label: "Persentase", type: "badge-percentage", width: "110px" },
  { key: "tanggalUpdate", label: "Tgl Update", type: "date", width: "120px" },
  { key: "autoSync", label: "Sumber", type: "text", width: "100px" },
];

interface RealisasiAkunManagerProps {
  tahunAnggaranId: string | null;
}

export default function RealisasiAkunManager({
  tahunAnggaranId,
}: RealisasiAkunManagerProps) {
  const { toast } = useToast();
  const { pengaturan } = usePengaturan();
  const { user } = useAuth();
  const isOpdRole = user?.role === "opd";
  const [data, setData] = useState<RealisasiAkun[]>([]);
  const [opdData, setOpdData] = useState<OpdRealisasiAkun[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [search, setSearch] = useState("");
  const [kategoriOptions, setKategoriOptions] = useState<{ value: string; label: string }[]>([
    { value: "Pendapatan", label: "Pendapatan" },
    { value: "Belanja", label: "Belanja" },
    { value: "Pembiayaan", label: "Pembiayaan" },
  ]);
  const [kategoriData, setKategoriData] = useState<Array<{ id: string; namaKategori: string; kodeKategori: string | null; aktif: boolean }>>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RealisasiAkun | null>(null);
  const [deletingItem, setDeletingItem] = useState<RealisasiAkun | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formKey, setFormKey] = useState(0);

  // Update realisasi dialog state
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [updateItem, setUpdateItem] = useState<RealisasiAkun | null>(null);
  const [updateRealisasiNumber, setUpdateRealisasiNumber] = useState(0);
  const [updateTanggal, setUpdateTanggal] = useState("");
  const [updateKeterangan, setUpdateKeterangan] = useState("");
  const [updateSubmitting, setUpdateSubmitting] = useState(false);

  // History dialog state
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [historyItem, setHistoryItem] = useState<RealisasiAkun | null>(null);
  const [historyData, setHistoryData] = useState<HistoryRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Fetch "jenis" categories from Kategori API (RealisasiAkun jenis)
  const fetchKategoriOptions = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/kategori?jenis=RealisasiAkun");
      if (!res.ok) throw new Error("Gagal memuat kategori");
      const json = await res.json();
      const kategoris: Array<{ id: string; namaKategori: string; kodeKategori: string | null; aktif: boolean }> = json.data || [];
      const activeKategoris = kategoris.filter((k) => k.aktif);
      setKategoriData(activeKategoris);
      if (activeKategoris.length > 0) {
        setKategoriOptions(
          activeKategoris.map((k) => ({ value: k.namaKategori, label: k.namaKategori }))
        );
      }
    } catch {
      setKategoriData([]);
    }
  }, []);

  const FORM_FIELDS: FormField[] = [
    {
      name: "jenis",
      label: "Jenis",
      type: "select",
      required: true,
      options: kategoriOptions,
      onSelect: (selectedValue, setFormData) => {
        const selected = kategoriData.find((k) => k.namaKategori === selectedValue);
        if (selected) {
          setFormData((prev) => ({
            ...prev,
            kodeAkun: selected.kodeKategori || prev.kodeAkun,
            namaAkun: selected.namaKategori || prev.namaAkun,
          }));
        }
      },
    },
    {
      name: "kodeAkun",
      label: "Kode Induk (2 digit)",
      type: "text",
      placeholder: "Contoh: 4.1",
      required: true,
    },
    {
      name: "namaAkun",
      label: "Nama Akun",
      type: "text",
      placeholder: "Contoh: PAD",
      required: true,
    },
    {
      name: "anggaran",
      label: "Anggaran (Rp)",
      type: "currency",
      placeholder: "Contoh: 31.500.000.000,50",
      required: true,
      min: 0,
    },
    {
      name: "realisasi",
      label: "Realisasi (Rp)",
      type: "currency",
      placeholder: "Contoh: 28.000.000.000,50",
      required: true,
      min: 0,
    },
  ];

  // Fetch OPD data (only depends on tahunAnggaranId, not search/pagination)
  const fetchOpdData = useCallback(async () => {
    if (!tahunAnggaranId || !isOpdRole) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ tahunAnggaranId });
      const res = await fetch(`/api/admin/realisasi-akun/opd?${params}`);
      if (!res.ok) throw new Error("Gagal memuat data realisasi akun OPD");
      const json = await res.json();
      setOpdData(json.data || []);
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Terjadi kesalahan",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [tahunAnggaranId, isOpdRole, toast]);

  // Fetch admin data (depends on search/pagination for server-side filtering)
  const fetchAdminData = useCallback(async () => {
    if (!tahunAnggaranId || isOpdRole) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        tahunAnggaranId,
        search,
        page: String(pagination.page),
        limit: String(pagination.limit),
      });
      const res = await fetch(`/api/admin/realisasi-akun?${params}`);
      if (!res.ok) throw new Error("Gagal memuat data realisasi akun");
      const json = await res.json();
      setData(json.data || []);
      if (json.pagination) {
        setPagination(json.pagination);
      }
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Terjadi kesalahan",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [tahunAnggaranId, search, pagination.page, pagination.limit, isOpdRole, toast]);

  // Unified fetch function for refresh callbacks
  const fetchData = useCallback(async () => {
    if (isOpdRole) {
      await fetchOpdData();
    } else {
      await fetchAdminData();
    }
  }, [isOpdRole, fetchOpdData, fetchAdminData]);

  // Re-fetch when dependencies change
  useEffect(() => {
    if (isOpdRole) {
      fetchOpdData();
    } else {
      fetchAdminData();
    }
  }, [isOpdRole, fetchOpdData, fetchAdminData]);

  // For OPD: update client-side pagination when search/opdData changes
  useEffect(() => {
    if (!isOpdRole) return;
    const filtered = opdData.filter((item) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        item.kodeAkun.toLowerCase().includes(q) ||
        item.namaAkun.toLowerCase().includes(q)
      );
    });
    setPagination((prev) => ({
      ...prev,
      total: filtered.length,
      totalPages: Math.max(1, Math.ceil(filtered.length / prev.limit)),
      page: Math.min(prev.page, Math.max(1, Math.ceil(filtered.length / prev.limit))),
    }));
  }, [isOpdRole, search, opdData]);

  useEffect(() => {
    fetchKategoriOptions();
  }, [fetchKategoriOptions]);

  // Manual sync trigger (admin only)
  const handleSync = async () => {
    if (!tahunAnggaranId || isOpdRole) return;
    setSyncing(true);
    try {
      const res = await fetch(`/api/admin/realisasi-akun?action=sync&tahunAnggaranId=${tahunAnggaranId}`, {
        method: "POST",
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Gagal sinkronisasi");
      }
      toast({
        title: "Berhasil",
        description: "Realisasi Akun berhasil disinkronkan dari data Pendapatan, Belanja & Pembiayaan",
      });
      fetchData();
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Terjadi kesalahan",
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  };

  const handleCreate = () => {
    setEditingItem(null);
    setFormKey((k) => k + 1);
    fetchKategoriOptions();
    setFormOpen(true);
  };

  const handleEdit = (row: Record<string, unknown>) => {
    const item = row as unknown as RealisasiAkun;
    if (item.autoSync) {
      toast({
        title: "Tidak dapat diedit",
        description: "Data auto-sync tidak dapat diedit. Gunakan tombol \"Update Realisasi\" untuk mengupdate nilai realisasi.",
        variant: "destructive",
      });
      return;
    }
    setEditingItem(item);
    setFormKey((k) => k + 1);
    fetchKategoriOptions();
    setFormOpen(true);
  };

  const handleDelete = (row: Record<string, unknown>) => {
    const item = row as unknown as RealisasiAkun;
    if (item.autoSync) {
      toast({
        title: "Tidak dapat dihapus",
        description: "Data auto-sync tidak dapat dihapus. Hapus data sumber (Pendapatan/Belanja/Pembiayaan) sebagai gantinya.",
        variant: "destructive",
      });
      return;
    }
    setDeletingItem(item);
    setDeleteOpen(true);
  };

  // ---- Update Realisasi ----
  const handleOpenUpdateDialog = (row: Record<string, unknown>) => {
    const item = row as unknown as RealisasiAkun;
    setUpdateItem(item);
    setUpdateRealisasiNumber(item.realisasi ?? 0);
    const today = new Date().toISOString().split("T")[0];
    setUpdateTanggal(today);
    setUpdateKeterangan("");
    setUpdateDialogOpen(true);
  };

  const handleSubmitUpdate = async () => {
    if (!updateItem) return;
    const realisasiValue = updateRealisasiNumber;
    if (isNaN(realisasiValue) || realisasiValue < 0) {
      toast({
        title: "Validasi",
        description: "Nilai realisasi harus berupa angka positif",
        variant: "destructive",
      });
      return;
    }
    if (!updateTanggal) {
      toast({
        title: "Validasi",
        description: "Tanggal update harus diisi",
        variant: "destructive",
      });
      return;
    }

    setUpdateSubmitting(true);
    try {
      const res = await fetch(`/api/admin/realisasi-akun?id=${updateItem.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          realisasi: realisasiValue,
          tanggalUpdate: new Date(updateTanggal).toISOString(),
          keterangan: updateKeterangan || undefined,
        }),
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Gagal mengupdate realisasi");
      }
      toast({
        title: "Berhasil",
        description: `Realisasi ${updateItem.kodeAkun} - ${updateItem.namaAkun} berhasil diperbarui`,
      });
      setUpdateDialogOpen(false);
      fetchData();
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Terjadi kesalahan",
        variant: "destructive",
      });
    } finally {
      setUpdateSubmitting(false);
    }
  };

  // ---- History ----
  const handleOpenHistory = async (row: Record<string, unknown>) => {
    const item = row as unknown as RealisasiAkun;
    setHistoryItem(item);
    setHistoryDialogOpen(true);
    setHistoryLoading(true);
    try {
      const res = await fetch(`/api/admin/realisasi-akun-history?realisasiAkunId=${item.id}`);
      if (!res.ok) throw new Error("Gagal memuat riwayat");
      const json = await res.json();
      setHistoryData(json.data || []);
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Gagal memuat riwayat",
        variant: "destructive",
      });
      setHistoryData([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleSubmit = async (formData: Record<string, unknown>) => {
    if (!tahunAnggaranId) return;
    setSubmitting(true);
    try {
      const anggaran = Number(formData.anggaran);
      const realisasi = Number(formData.realisasi);
      const persentase = safePercentage(realisasi, anggaran);

      const body = {
        tahunAnggaranId,
        kodeAkun: String(formData.kodeAkun),
        namaAkun: String(formData.namaAkun),
        jenis: String(formData.jenis),
        anggaran,
        realisasi,
        persentase,
      };

      let res: Response;
      if (editingItem) {
        res = await fetch(`/api/admin/realisasi-akun?id=${editingItem.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      } else {
        res = await fetch("/api/admin/realisasi-akun", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      }
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Gagal menyimpan data");
      }
      toast({
        title: "Berhasil",
        description: editingItem
          ? "Data realisasi akun berhasil diperbarui"
          : "Data realisasi akun berhasil ditambahkan",
      });
      setFormOpen(false);
      fetchData();
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Terjadi kesalahan",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingItem) return;
    setSubmitting(true);
    try {
      const res = await fetch(
        `/api/admin/realisasi-akun?id=${deletingItem.id}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Gagal menghapus data");
      }
      toast({
        title: "Berhasil",
        description: "Data realisasi akun berhasil dihapus",
      });
      setDeleteOpen(false);
      setDeletingItem(null);
      fetchData();
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Terjadi kesalahan",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, page }));
  };

  // Row actions for the table (only for admin — OPD views computed data, no updates)
  const rowActions: RowAction[] = isOpdRole
    ? []
    : [
        {
          key: "update-realisasi",
          label: "Update Realisasi",
          icon: PencilLine,
          className: "text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50",
          onClick: handleOpenUpdateDialog,
        },
        {
          key: "history",
          label: "Riwayat Realisasi",
          icon: History,
          className: "text-amber-600 hover:text-amber-800 hover:bg-amber-50",
          onClick: handleOpenHistory,
        },
      ];

  // Format date for display
  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  // Calculate difference
  const calcDifference = (baru: number, lama: number) => {
    return baru - lama;
  };

  // For OPD: client-side filtered & paginated data derived from opdData
  const opdFiltered = isOpdRole
    ? opdData.filter((item) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
          item.kodeAkun.toLowerCase().includes(q) ||
          item.namaAkun.toLowerCase().includes(q)
        );
      })
    : [];

  const opdPaginated = opdFiltered.slice(
    (pagination.page - 1) * pagination.limit,
    pagination.page * pagination.limit
  );

  // Convert OPD data to display format (add synthetic id, autoSync badge)
  const opdDisplayData: RealisasiAkun[] = opdPaginated.map((item, idx) => ({
    id: `opd-${item.kodeAkun}-${item.jenis}-${idx}`,
    tahunAnggaranId: tahunAnggaranId || "",
    kodeAkun: item.kodeAkun,
    namaAkun: item.namaAkun,
    jenis: item.jenis,
    anggaran: item.anggaran,
    realisasi: item.realisasi,
    persentase: item.persentase,
    autoSync: true,
    tanggalUpdate: undefined,
  }));

  // Transform data for display - add autoSync badge
  const displayData = isOpdRole
    ? opdDisplayData.map((item) => ({
        ...item,
        autoSync: item.autoSync ? "Auto" : "Manual",
      }))
    : data.map((item) => ({
        ...item,
        autoSync: item.autoSync ? "Auto" : "Manual",
      }));

  if (!tahunAnggaranId) {
    return (
      <Card>
        <CardContent className="py-12">
          <p className="text-center text-muted-foreground text-sm">
            Pilih tahun anggaran terlebih dahulu untuk mengelola data realisasi
            akun
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <div className="w-2 h-6 rounded-full bg-blue-600" />
          {isOpdRole ? "Realisasi Akun — Data Keseluruhan" : "Manajemen Realisasi Akun"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Info Banner */}
        {isOpdRole ? (
          <div className="mb-4 p-3 rounded-lg border bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-2">
              <Eye className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
              <div className="text-sm">
                <span className="font-medium text-blue-800 dark:text-blue-300">Ringkasan Realisasi Akun OPD Anda</span>
                <p className="text-blue-700 dark:text-blue-400 mt-0.5">
                  Data ini menampilkan ringkasan realisasi per akun (kode induk 2 digit) dari OPD Anda sendiri.
                  Data dihitung secara otomatis dari Pendapatan, Belanja & Pembiayaan milik OPD Anda.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-4 p-3 rounded-lg border bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-2">
              <Zap className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
              <div className="text-sm">
                <span className="font-medium text-blue-800 dark:text-blue-300">Auto-Sync Aktif</span>
                <p className="text-blue-700 dark:text-blue-400 mt-0.5">
                  Data Realisasi Akun otomatis disinkronkan dari Pendapatan, Belanja & Pembiayaan berdasarkan kode induk 2 digit (contoh: 4.1).
                  Gunakan tombol <PencilLine className="w-3 h-3 inline" /> untuk mengupdate realisasi dan{" "}
                  <History className="w-3 h-3 inline" /> untuk melihat riwayat perubahan.
                </p>
              </div>
            </div>
          </div>
        )}

        <GenericCrudTable
          columns={isOpdRole ? COLUMNS.filter((c) => c.key !== "autoSync" && c.key !== "tanggalUpdate") : COLUMNS}
          data={displayData as unknown as Record<string, unknown>[]}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onRefresh={fetchData}
          onCreate={isOpdRole ? undefined : handleCreate}
          loading={loading}
          searchPlaceholder="Cari nama atau kode induk..."
          searchValue={search}
          onSearchChange={(val) => {
            setSearch(val);
            setPagination((prev) => ({ ...prev, page: 1 }));
          }}
          pagination={pagination}
          onPageChange={handlePageChange}
          itemName="Realisasi Akun"
          hideActions={isOpdRole}
          hideCreate={isOpdRole}
          rowActions={rowActions}
          customActions={
            !isOpdRole ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleSync}
                disabled={syncing}
                className="gap-1.5"
              >
                {syncing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                <span className="hidden sm:inline">{syncing ? "Sinkronisasi..." : "Sync Sekarang"}</span>
              </Button>
            ) : undefined
          }
        />

        {/* Form dialog - only for admin */}
        {!isOpdRole && (
          <DataFormDialog
            open={formOpen}
            onOpenChange={setFormOpen}
            title={
              editingItem ? "Edit Realisasi Akun (Manual)" : "Tambah Realisasi Akun (Manual)"
            }
            description="Masukkan data realisasi per akun secara manual. Data auto-sync akan ditimpa saat sinkronisasi berikutnya."
            fields={FORM_FIELDS}
            initialData={editingItem as unknown as Record<string, unknown> | null}
            onSubmit={handleSubmit}
            loading={submitting}
            resetKey={formKey}
          />
        )}

        {/* Delete dialog - only for admin */}
        {!isOpdRole && (
          <DeleteConfirmDialog
            open={deleteOpen}
            onOpenChange={setDeleteOpen}
            itemName={
              deletingItem
                ? `${deletingItem.kodeAkun} - ${deletingItem.namaAkun}`
                : ""
            }
            onConfirm={handleConfirmDelete}
            loading={submitting}
          />
        )}

        {/* Update Realisasi Dialog */}
        <Dialog open={updateDialogOpen} onOpenChange={setUpdateDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <PencilLine className="w-5 h-5 text-emerald-600" />
                Update Realisasi
              </DialogTitle>
              <DialogDescription>
                Update nilai realisasi untuk {updateItem?.kodeAkun} — {updateItem?.namaAkun}
              </DialogDescription>
            </DialogHeader>

            {updateItem && (
              <div className="space-y-4 py-2">
                {/* Current info */}
                <div className="p-3 rounded-lg bg-muted/50 border space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Jenis</span>
                    <Badge variant="outline" className="text-xs">{updateItem.jenis}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Anggaran</span>
                    <RupiahCell value={updateItem.anggaran} className="text-sm font-medium" />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Realisasi Saat Ini</span>
                    <RupiahCell value={updateItem.realisasi} className="text-sm font-medium text-blue-600" />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Persentase Saat Ini</span>
                    <Badge variant="outline" className="text-xs">
                      {updateItem.persentase?.toFixed(2) ?? "0.00"}%
                    </Badge>
                  </div>
                </div>

                {/* New realisasi input */}
                <div className="space-y-2">
                  <Label htmlFor="new-realisasi-akun" className="text-sm font-medium">
                    Realisasi Baru (Rp)
                  </Label>
                  <CurrencyInput
                    id="new-realisasi-akun"
                    placeholder="Masukkan nilai realisasi baru"
                    value={updateRealisasiNumber}
                    onChange={(num) => setUpdateRealisasiNumber(num)}
                    min={0}
                  />
                  {updateRealisasiNumber > 0 && updateItem.anggaran > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Persentase baru:{" "}
                      <span className="font-medium">
                        {(
                          (updateRealisasiNumber /
                            updateItem.anggaran) *
                          100
                        ).toFixed(2)}
                        %
                      </span>
                    </p>
                  )}
                </div>

                {/* Tanggal update */}
                <div className="space-y-2">
                  <Label htmlFor="update-tanggal-akun" className="text-sm font-medium flex items-center gap-1.5">
                    <CalendarClock className="w-3.5 h-3.5" />
                    Tanggal Update
                  </Label>
                  <Input
                    id="update-tanggal-akun"
                    type="date"
                    value={updateTanggal}
                    onChange={(e) => setUpdateTanggal(e.target.value)}
                  />
                </div>

                {/* Keterangan */}
                <div className="space-y-2">
                  <Label htmlFor="update-keterangan-akun" className="text-sm font-medium">
                    Keterangan (Opsional)
                  </Label>
                  <Textarea
                    id="update-keterangan-akun"
                    placeholder="Contoh: Realisasi triwulan 3"
                    value={updateKeterangan}
                    onChange={(e) => setUpdateKeterangan(e.target.value)}
                    rows={2}
                  />
                </div>
              </div>
            )}

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => setUpdateDialogOpen(false)}
                disabled={updateSubmitting}
              >
                Batal
              </Button>
              <Button
                onClick={handleSubmitUpdate}
                disabled={updateSubmitting}
                className="text-white gap-1.5"
                style={{ backgroundColor: pengaturan.warnaPrimary }}
              >
                {updateSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <PencilLine className="w-4 h-4" />
                )}
                {updateSubmitting ? "Menyimpan..." : "Update Realisasi"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* History Dialog */}
        <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
          <DialogContent className="sm:max-w-lg max-h-[80vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <History className="w-5 h-5 text-amber-600" />
                Riwayat Realisasi
              </DialogTitle>
              <DialogDescription>
                Riwayat perubahan realisasi untuk {historyItem?.kodeAkun} — {historyItem?.namaAkun}
              </DialogDescription>
            </DialogHeader>

            <div className="py-2 max-h-[55vh] overflow-y-auto custom-scrollbar">
              {historyLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="p-3 rounded-lg border bg-muted/30 animate-pulse">
                      <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                      <div className="h-3 bg-muted rounded w-1/2" />
                    </div>
                  ))}
                </div>
              ) : historyData.length === 0 ? (
                <div className="text-center py-8">
                  <History className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Belum ada riwayat perubahan</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {historyData.map((record) => {
                    const diff = calcDifference(record.realisasiBaru, record.realisasiLama);
                    const isIncrease = diff > 0;
                    const isDecrease = diff < 0;

                    return (
                      <div
                        key={record.id}
                        className="relative p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
                      >
                        {/* Timeline dot */}
                        <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg"
                          style={{
                            backgroundColor: isIncrease
                              ? "#10b981"
                              : isDecrease
                              ? "#ef4444"
                              : "#6b7280",
                          }}
                        />

                        <div className="pl-3 space-y-2">
                          {/* Header: Date & User */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <CalendarClock className="w-3.5 h-3.5 text-muted-foreground" />
                              <span className="text-xs font-medium">
                                {formatDate(record.tanggalUpdate)}
                              </span>
                            </div>
                            {record.updatedBy && (
                              <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                oleh {record.updatedBy}
                              </span>
                            )}
                          </div>

                          {/* Value change */}
                          <div className="flex items-center gap-2 text-sm flex-wrap">
                            <RupiahCell value={record.realisasiLama} className="text-muted-foreground line-through" />
                            <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
                            <RupiahCell value={record.realisasiBaru} className="font-medium" />
                            {isIncrease && (
                              <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200 gap-0.5">
                                <TrendingUp className="w-2.5 h-2.5" />
                                <RupiahCell value={Math.abs(diff)} prefix="+" />
                              </Badge>
                            )}
                            {isDecrease && (
                              <Badge variant="outline" className="text-[10px] bg-red-50 text-red-700 border-red-200 gap-0.5">
                                <TrendingDown className="w-2.5 h-2.5" />
                                <RupiahCell value={Math.abs(diff)} prefix="-" />
                              </Badge>
                            )}
                          </div>

                          {/* Percentage */}
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-[10px]">
                              {record.persentaseBaru.toFixed(2)}%
                            </Badge>
                            {record.keterangan && (
                              <span className="text-xs text-muted-foreground">
                                {record.keterangan}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setHistoryDialogOpen(false)}
              >
                Tutup
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
