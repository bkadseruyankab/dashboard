"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import GenericCrudTable, { type ColumnDef } from "./GenericCrudTable";
import DataFormDialog, { type FormField } from "./DataFormDialog";
import DeleteConfirmDialog from "./DeleteConfirmDialog";
import { safePercentage } from "@/components/dashboard/types";

type RealisasiSkpd = {
  id: string;
  tahunAnggaranId: string;
  kodeSkpd: string;
  namaSkpd: string;
  anggaran: number;
  realisasi: number;
  persentase: number;
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
];

const FORM_FIELDS: FormField[] = [
  {
    name: "kodeSkpd",
    label: "Kode SKPD",
    type: "text",
    placeholder: "Contoh: 1.01.01",
    required: true,
  },
  {
    name: "namaSkpd",
    label: "Nama SKPD",
    type: "text",
    placeholder: "Contoh: Dinas Pendidikan",
    required: true,
  },
  {
    name: "anggaran",
    label: "Anggaran (Rp)",
    type: "currency",
    placeholder: "Contoh: 100.000.000.000",
    required: true,
    min: 0,
  },
  {
    name: "realisasi",
    label: "Realisasi (Rp)",
    type: "currency",
    placeholder: "Contoh: 92.000.000.000",
    required: true,
    min: 0,
  },
];

interface RealisasiSkpdManagerProps {
  tahunAnggaranId: string | null;
}

export default function RealisasiSkpdManager({
  tahunAnggaranId,
}: RealisasiSkpdManagerProps) {
  const { toast } = useToast();
  const [data, setData] = useState<RealisasiSkpd[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
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

  const handleCreate = () => {
    setEditingItem(null);
    setFormKey((k) => k + 1);
    setFormOpen(true);
  };

  const handleEdit = (row: Record<string, unknown>) => {
    setEditingItem(row as unknown as RealisasiSkpd);
    setFormKey((k) => k + 1);
    setFormOpen(true);
  };

  const handleDelete = (row: Record<string, unknown>) => {
    setDeletingItem(row as unknown as RealisasiSkpd);
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
        kodeSkpd: String(formData.kodeSkpd),
        namaSkpd: String(formData.namaSkpd),
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
          Manajemen Realisasi SKPD
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
          searchPlaceholder="Cari nama atau kode SKPD..."
          searchValue={search}
          onSearchChange={(val) => {
            setSearch(val);
            setPagination((prev) => ({ ...prev, page: 1 }));
          }}
          pagination={pagination}
          onPageChange={handlePageChange}
          itemName="Realisasi SKPD"
        />

        <DataFormDialog
          open={formOpen}
          onOpenChange={setFormOpen}
          title={
            editingItem ? "Edit Realisasi SKPD" : "Tambah Realisasi SKPD"
          }
          description="Masukkan data realisasi per SKPD/OPD"
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
              ? `${deletingItem.kodeSkpd} - ${deletingItem.namaSkpd}`
              : ""
          }
          onConfirm={handleConfirmDelete}
          loading={submitting}
        />
      </CardContent>
    </Card>
  );
}
