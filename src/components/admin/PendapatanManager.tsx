"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import GenericCrudTable, { type ColumnDef } from "./GenericCrudTable";
import DataFormDialog, { type FormField } from "./DataFormDialog";
import DeleteConfirmDialog from "./DeleteConfirmDialog";
import { safePercentage } from "@/components/dashboard/types";
import { usePengaturan } from "@/context/PengaturanContext";

type Pendapatan = {
  id: string;
  tahunAnggaranId: string;
  kodeAkun: string;
  namaAkun: string;
  kategori: string;
  anggaran: number;
  realisasi: number;
};

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

const COLUMNS: ColumnDef[] = [
  { key: "kodeAkun", label: "Kode Akun", type: "text", width: "120px" },
  { key: "namaAkun", label: "Nama Akun", type: "text" },
  { key: "kategori", label: "Kategori", type: "text", width: "120px" },
  { key: "anggaran", label: "Anggaran", type: "currency", width: "180px" },
  { key: "realisasi", label: "Realisasi", type: "currency", width: "180px" },
];

interface PendapatanManagerProps {
  tahunAnggaranId: string | null;
}

export default function PendapatanManager({
  tahunAnggaranId,
}: PendapatanManagerProps) {
  const { toast } = useToast();
  const { pengaturan } = usePengaturan();
  const [data, setData] = useState<Pendapatan[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [kategoriOptions, setKategoriOptions] = useState<{ value: string; label: string }[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Pendapatan | null>(null);
  const [deletingItem, setDeletingItem] = useState<Pendapatan | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formKey, setFormKey] = useState(0);

  // Fetch categories from Kategori API
  const fetchKategoriOptions = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/kategori?jenis=Pendapatan");
      if (!res.ok) throw new Error("Gagal memuat kategori");
      const json = await res.json();
      const kategoris: Array<{ id: string; namaKategori: string; aktif: boolean }> = json.data || [];
      // Only show active categories
      const activeKategoris = kategoris.filter((k) => k.aktif);
      setKategoriOptions(
        activeKategoris.length > 0
          ? activeKategoris.map((k) => ({ value: k.namaKategori, label: k.namaKategori }))
          : [
              { value: "PAD", label: "PAD" },
              { value: "Transfer", label: "Transfer" },
              { value: "Lainnya", label: "Lainnya" },
            ]
      );
    } catch {
      // Fallback to default options
      setKategoriOptions([
        { value: "PAD", label: "PAD" },
        { value: "Transfer", label: "Transfer" },
        { value: "Lainnya", label: "Lainnya" },
      ]);
    }
  }, []);

  const FORM_FIELDS: FormField[] = [
    {
      name: "kodeAkun",
      label: "Kode Akun",
      type: "text",
      placeholder: "Contoh: 1.01",
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
      name: "kategori",
      label: "Kategori",
      type: "select",
      required: true,
      options: kategoriOptions,
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
      const res = await fetch(`/api/admin/pendapatan?${params}`);
      if (!res.ok) throw new Error("Gagal memuat data pendapatan");
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

  // Refresh categories when form opens
  const handleCreate = () => {
    setEditingItem(null);
    setFormKey((k) => k + 1);
    fetchKategoriOptions();
    setFormOpen(true);
  };

  const handleEdit = (row: Record<string, unknown>) => {
    setEditingItem(row as unknown as Pendapatan);
    setFormKey((k) => k + 1);
    fetchKategoriOptions();
    setFormOpen(true);
  };

  const handleDelete = (row: Record<string, unknown>) => {
    setDeletingItem(row as unknown as Pendapatan);
    setDeleteOpen(true);
  };

  const handleSubmit = async (formData: Record<string, unknown>) => {
    if (!tahunAnggaranId) return;
    setSubmitting(true);
    try {
      const body = {
        tahunAnggaranId,
        kodeAkun: String(formData.kodeAkun),
        namaAkun: String(formData.namaAkun),
        kategori: String(formData.kategori),
        anggaran: Number(formData.anggaran),
        realisasi: Number(formData.realisasi),
      };

      let res: Response;
      if (editingItem) {
        res = await fetch(`/api/admin/pendapatan?id=${editingItem.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      } else {
        res = await fetch("/api/admin/pendapatan", {
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
          ? "Data pendapatan berhasil diperbarui"
          : "Data pendapatan berhasil ditambahkan",
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
      const res = await fetch(`/api/admin/pendapatan?id=${deletingItem.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Gagal menghapus data");
      }
      toast({
        title: "Berhasil",
        description: "Data pendapatan berhasil dihapus",
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
            Pilih tahun anggaran terlebih dahulu untuk mengelola data pendapatan
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <div className="w-2 h-6 rounded-full" style={{ backgroundColor: pengaturan.warnaPrimary }} />
          Manajemen Pendapatan
        </CardTitle>
      </CardHeader>
      <CardContent>
        <GenericCrudTable
          columns={COLUMNS}
          data={data as unknown as Record<string, unknown>[]}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onRefresh={fetchData}
          onCreate={handleCreate}
          loading={loading}
          searchPlaceholder="Cari nama atau kode akun..."
          searchValue={search}
          onSearchChange={(val) => {
            setSearch(val);
            setPagination((prev) => ({ ...prev, page: 1 }));
          }}
          pagination={pagination}
          onPageChange={handlePageChange}
          itemName="Pendapatan"
        />

        <DataFormDialog
          open={formOpen}
          onOpenChange={setFormOpen}
          title={editingItem ? "Edit Pendapatan" : "Tambah Pendapatan"}
          description="Masukkan data pendapatan daerah"
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
