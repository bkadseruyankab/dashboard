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
import { RefreshCw, Zap, Loader2 } from "lucide-react";
import { usePengaturan } from "@/context/PengaturanContext";

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
};

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

const COLUMNS: ColumnDef[] = [
  { key: "kodeAkun", label: "Kode Induk", type: "text", width: "110px" },
  { key: "namaAkun", label: "Nama Akun", type: "text" },
  { key: "jenis", label: "Jenis", type: "text", width: "120px" },
  { key: "anggaran", label: "Anggaran", type: "currency", width: "160px" },
  { key: "realisasi", label: "Realisasi", type: "currency", width: "160px" },
  { key: "persentase", label: "Persentase", type: "badge-percentage", width: "110px" },
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
  const [data, setData] = useState<RealisasiAkun[]>([]);
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

  // Fetch "jenis" categories from Kategori API (RealisasiAkun jenis)
  const fetchKategoriOptions = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/kategori?jenis=RealisasiAkun");
      if (!res.ok) throw new Error("Gagal memuat kategori");
      const json = await res.json();
      const kategoris: Array<{ id: string; namaKategori: string; kodeKategori: string | null; aktif: boolean }> = json.data || [];
      const activeKategoris = kategoris.filter((k) => k.aktif);
      // Store full kategori data for auto-fill
      setKategoriData(activeKategoris);
      if (activeKategoris.length > 0) {
        setKategoriOptions(
          activeKategoris.map((k) => ({ value: k.namaKategori, label: k.namaKategori }))
        );
      }
    } catch {
      // Keep default options
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
      placeholder: "Contoh: 31.500.000.000",
      required: true,
      min: 0,
    },
    {
      name: "realisasi",
      label: "Realisasi (Rp)",
      type: "currency",
      placeholder: "Contoh: 28.000.000.000",
      required: true,
      min: 0,
    },
  ];

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
  }, [tahunAnggaranId, search, pagination.page, pagination.limit, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchKategoriOptions();
  }, [fetchKategoriOptions]);

  // Manual sync trigger
  const handleSync = async () => {
    if (!tahunAnggaranId) return;
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
        description: "Data auto-sync tidak dapat diedit. Ubah data sumber (Pendapatan/Belanja/Pembiayaan) sebagai gantinya.",
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

  // Transform data for display - add autoSync badge
  const displayData = data.map((item) => ({
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
          Manajemen Realisasi Akun
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Info Banner */}
        <div className="mb-4 p-3 rounded-lg border bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-2">
            <Zap className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
            <div className="text-sm">
              <span className="font-medium text-blue-800 dark:text-blue-300">Auto-Sync Aktif</span>
              <p className="text-blue-700 dark:text-blue-400 mt-0.5">
                Data Realisasi Akun otomatis disinkronkan dari Pendapatan, Belanja & Pembiayaan berdasarkan kode induk 2 digit (contoh: 4.1).
                Data bertanda <Badge variant="outline" className="text-[10px] px-1 py-0 ml-1 bg-blue-100 text-blue-800 border-blue-200">Auto</Badge> tidak dapat diedit/dihapus secara manual.
              </p>
            </div>
          </div>
        </div>

        <GenericCrudTable
          columns={COLUMNS}
          data={displayData as unknown as Record<string, unknown>[]}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onRefresh={fetchData}
          onCreate={handleCreate}
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
          customActions={
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
          }
        />

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
      </CardContent>
    </Card>
  );
}
