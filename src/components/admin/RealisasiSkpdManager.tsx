"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import GenericCrudTable, { type ColumnDef } from "./GenericCrudTable";
import DataFormDialog, { type FormField } from "./DataFormDialog";
import DeleteConfirmDialog from "./DeleteConfirmDialog";
import { safePercentage } from "@/components/dashboard/types";
import { RefreshCw, Zap, Loader2, Eye } from "lucide-react";
import { usePengaturan } from "@/context/PengaturanContext";
import { useAuth } from "@/hooks/use-auth";

type RealisasiSkpd = {
  id: string;
  tahunAnggaranId: string;
  kodeSkpd: string;
  namaSkpd: string;
  anggaran: number;
  realisasi: number;
  persentase: number;
  autoSync?: boolean | string;
  opdId?: string;
};

type OpdOption = {
  id: string;
  kodeOpd: string;
  namaOpd: string;
};

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

const COLUMNS: ColumnDef[] = [
  { key: "kodeSkpd", label: "Kode SKPD", type: "text", width: "120px" },
  { key: "namaSkpd", label: "Nama SKPD", type: "text" },
  { key: "anggaran", label: "Anggaran", type: "currency", width: "160px" },
  { key: "realisasi", label: "Realisasi", type: "currency", width: "160px" },
  { key: "persentase", label: "Persentase", type: "badge-percentage", width: "110px" },
  { key: "autoSync", label: "Sumber", type: "text", width: "90px" },
];

interface RealisasiSkpdManagerProps {
  tahunAnggaranId: string | null;
}

export default function RealisasiSkpdManager({
  tahunAnggaranId,
}: RealisasiSkpdManagerProps) {
  const { toast } = useToast();
  const { pengaturan } = usePengaturan();
  const { user } = useAuth();
  const isOpdRole = user?.role === "opd";
  const [data, setData] = useState<RealisasiSkpd[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [search, setSearch] = useState("");
  const [opdList, setOpdList] = useState<OpdOption[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RealisasiSkpd | null>(null);
  const [deletingItem, setDeletingItem] = useState<RealisasiSkpd | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formKey, setFormKey] = useState(0);

  // Helper to check if an item is auto-synced
  const isAutoSynced = (item: RealisasiSkpd): boolean => {
    return item.autoSync === true || item.autoSync === "Auto";
  };

  // Build form fields dynamically - only for admin
  const getFormFields = useCallback((): FormField[] => {
    const opdOptions = opdList.map((opd) => ({
      value: opd.id,
      label: `${opd.kodeOpd} - ${opd.namaOpd}`,
    }));

    return [
      {
        name: "opdId",
        label: "Pilih OPD",
        type: "select" as const,
        required: true,
        options: opdOptions,
        placeholder: "Pilih OPD / SKPD",
      },
      {
        name: "anggaran",
        label: "Anggaran (Rp)",
        type: "currency" as const,
        placeholder: "Contoh: 100.000.000.000",
        required: true,
        min: 0,
      },
      {
        name: "realisasi",
        label: "Realisasi (Rp)",
        type: "currency" as const,
        placeholder: "Contoh: 92.000.000.000",
        required: true,
        min: 0,
      },
    ];
  }, [opdList]);

  // Fetch OPD list for the dropdown (admin only)
  const fetchOpdList = useCallback(async () => {
    if (!tahunAnggaranId || isOpdRole) {
      setOpdList([]);
      return;
    }
    try {
      const params = new URLSearchParams({
        tahunAnggaranId,
        limit: "100",
      });
      const res = await fetch(`/api/admin/opd?${params}`);
      if (!res.ok) throw new Error("Gagal memuat daftar OPD");
      const json = await res.json();
      setOpdList(json.data || []);
    } catch {
      setOpdList([]);
    }
  }, [tahunAnggaranId, isOpdRole]);

  const fetchData = useCallback(async () => {
    if (!tahunAnggaranId) {
      setData([]);
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams({
        tahunAnggaranId,
        search,
        page: String(pagination.page),
        limit: String(pagination.limit),
      });
      const res = await fetch(`/api/admin/realisasi-skpd?${params}`);
      if (!res.ok) throw new Error("Gagal memuat data realisasi SKPD");
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
  }, [tahunAnggaranId, search, pagination.page, pagination.limit, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchOpdList();
  }, [fetchOpdList]);

  // Manual sync trigger (admin only)
  const handleSync = async () => {
    if (!tahunAnggaranId || isOpdRole) return;
    setSyncing(true);
    try {
      const res = await fetch(`/api/admin/realisasi-skpd?action=sync&tahunAnggaranId=${tahunAnggaranId}`, {
        method: "GET",
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Gagal sinkronisasi");
      }
      toast({
        title: "Berhasil",
        description: "Realisasi SKPD berhasil disinkronkan dari data Pendapatan, Belanja & Pembiayaan",
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
    setFormOpen(true);
  };

  const handleEdit = (row: Record<string, unknown>) => {
    const item = row as unknown as RealisasiSkpd;
    if (isAutoSynced(item)) {
      toast({
        title: "Tidak dapat diedit",
        description: "Data auto-sync tidak dapat diedit. Data ini dihitung otomatis dari Pendapatan, Belanja & Pembiayaan.",
        variant: "destructive",
      });
      return;
    }
    setEditingItem(item);
    setFormKey((k) => k + 1);
    setFormOpen(true);
  };

  const handleDelete = (row: Record<string, unknown>) => {
    const item = row as unknown as RealisasiSkpd;
    if (isAutoSynced(item)) {
      toast({
        title: "Tidak dapat dihapus",
        description: "Data auto-sync tidak dapat dihapus. Data ini dihitung otomatis dari Pendapatan, Belanja & Pembiayaan.",
        variant: "destructive",
      });
      return;
    }
    setDeletingItem(item);
    setDeleteOpen(true);
  };

  const handleSubmit = async (formData: Record<string, unknown>) => {
    if (!tahunAnggaranId) return;
    setSubmitting(true);
    try {
      const anggaran = Number(formData.anggaran);
      const realisasi = Number(formData.realisasi);
      const persentase = safePercentage(realisasi, anggaran);

      let kodeSkpd = editingItem?.kodeSkpd ?? "";
      let namaSkpd = editingItem?.namaSkpd ?? "";

      const selectedOpdId = formData.opdId;
      if (selectedOpdId && String(selectedOpdId)) {
        const selectedOpd = opdList.find((opd) => opd.id === String(selectedOpdId));
        if (selectedOpd) {
          kodeSkpd = selectedOpd.kodeOpd;
          namaSkpd = selectedOpd.namaOpd;
        }
      }

      if (!kodeSkpd || !namaSkpd) {
        toast({
          title: "Validasi",
          description: "Pilih OPD terlebih dahulu",
          variant: "destructive",
        });
        setSubmitting(false);
        return;
      }

      const body = {
        tahunAnggaranId,
        kodeSkpd,
        namaSkpd,
        anggaran,
        realisasi,
        persentase,
      };

      let res: Response;
      if (editingItem) {
        res = await fetch(`/api/admin/realisasi-skpd?id=${editingItem.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      } else {
        res = await fetch("/api/admin/realisasi-skpd", {
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
          ? "Data realisasi SKPD berhasil diperbarui"
          : "Data realisasi SKPD berhasil ditambahkan",
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
        `/api/admin/realisasi-skpd?id=${deletingItem.id}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Gagal menghapus data");
      }
      toast({
        title: "Berhasil",
        description: "Data realisasi SKPD berhasil dihapus",
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

  if (!tahunAnggaranId) {
    return (
      <Card>
        <CardContent className="py-12">
          <p className="text-center text-muted-foreground text-sm">
            Pilih tahun anggaran terlebih dahulu untuk mengelola data realisasi
            SKPD
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <div className="w-2 h-6 rounded-full bg-purple-600" />
          {isOpdRole ? "Realisasi SKPD — Data OPD Anda" : "Manajemen Realisasi SKPD"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Info Banner */}
        {isOpdRole ? (
          <div className="mb-4 p-3 rounded-lg border bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800">
            <div className="flex items-start gap-2">
              <Eye className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
              <div className="text-sm">
                <span className="font-medium text-emerald-800 dark:text-emerald-300">Data OPD Anda</span>
                <p className="text-emerald-700 dark:text-emerald-400 mt-0.5">
                  Menampilkan data realisasi OPD Anda yang dihitung otomatis dari Pendapatan, Belanja & Pembiayaan yang Anda input.
                  Data ini diperbarui secara <strong>realtime</strong> setiap kali Anda mengubah data.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-4 p-3 rounded-lg border bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800">
            <div className="flex items-start gap-2">
              <Zap className="w-4 h-4 text-purple-600 mt-0.5 shrink-0" />
              <div className="text-sm">
                <span className="font-medium text-purple-800 dark:text-purple-300">Auto-Sync Aktif</span>
                <p className="text-purple-700 dark:text-purple-400 mt-0.5">
                  Data Realisasi SKPD otomatis disinkronkan dari Pendapatan, Belanja & Pembiayaan setiap kali data OPD diubah.
                  Data bertanda <Badge variant="outline" className="text-[10px] px-1 py-0 ml-1 bg-purple-100 text-purple-800 border-purple-200">Auto</Badge> tidak dapat diedit/dihapus secara manual.
                </p>
              </div>
            </div>
          </div>
        )}

        <GenericCrudTable
          columns={COLUMNS}
          data={data as unknown as Record<string, unknown>[]}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onRefresh={fetchData}
          onCreate={isOpdRole ? undefined : handleCreate}
          loading={loading}
          searchPlaceholder="Cari nama atau kode SKPD..."
          searchValue={search}
          onSearchChange={(val) => {
            setSearch(val);
            setPagination((prev) => ({ ...prev, page: 1 }));
          }}
          pagination={pagination}
          onPageChange={handlePageChange}
          itemName="Realisasi SKPD"
          hideActions={isOpdRole}
          hideCreate={isOpdRole}
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
              editingItem ? "Edit Realisasi SKPD (Manual)" : "Tambah Realisasi SKPD (Manual)"
            }
            description="Pilih OPD dan masukkan data anggaran & realisasi. Data auto-sync akan ditimpa saat sinkronisasi berikutnya."
            fields={getFormFields()}
            initialData={editingItem ? {
              ...editingItem,
              opdId: opdList.find((opd) => opd.kodeOpd === editingItem.kodeSkpd)?.id ?? "",
            } as unknown as Record<string, unknown> : null}
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
                ? `${deletingItem.kodeSkpd} - ${deletingItem.namaSkpd}`
                : ""
            }
            onConfirm={handleConfirmDelete}
            loading={submitting}
          />
        )}
      </CardContent>
    </Card>
  );
}
