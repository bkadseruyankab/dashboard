"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import GenericCrudTable, { type ColumnDef } from "./GenericCrudTable";
import DataFormDialog, { type FormField } from "./DataFormDialog";
import DeleteConfirmDialog from "./DeleteConfirmDialog";
import { usePengaturan } from "@/context/PengaturanContext";

type Opd = {
  id: string;
  tahunAnggaranId: string;
  kodeOpd: string;
  namaOpd: string;
  kepalaOpd: string | null;
  alamat: string | null;
  telepon: string | null;
  email: string | null;
};

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

const COLUMNS: ColumnDef[] = [
  { key: "kodeOpd", label: "Kode OPD", type: "text", width: "120px" },
  { key: "namaOpd", label: "Nama OPD", type: "text" },
  { key: "kepalaOpd", label: "Kepala OPD", type: "text", width: "180px" },
  { key: "telepon", label: "Telepon", type: "text", width: "140px" },
  { key: "email", label: "Email", type: "text", width: "200px" },
];

const FORM_FIELDS: FormField[] = [
  {
    name: "kodeOpd",
    label: "Kode OPD",
    type: "text",
    placeholder: "Contoh: 1.01.01",
    required: true,
  },
  {
    name: "namaOpd",
    label: "Nama OPD",
    type: "text",
    placeholder: "Contoh: Dinas Pendidikan dan Kebudayaan",
    required: true,
  },
  {
    name: "kepalaOpd",
    label: "Kepala OPD",
    type: "text",
    placeholder: "Contoh: Dr. Ahmad, M.Si",
  },
  {
    name: "alamat",
    label: "Alamat",
    type: "text",
    placeholder: "Contoh: Jl. Trans Kalimantan No. 1",
  },
  {
    name: "telepon",
    label: "Telepon",
    type: "text",
    placeholder: "Contoh: (0513) 123456",
  },
  {
    name: "email",
    label: "Email",
    type: "text",
    placeholder: "Contoh: disdik@seruyankab.go.id",
  },
];

interface OpdManagerProps {
  tahunAnggaranId: string | null;
}

export default function OpdManager({
  tahunAnggaranId,
}: OpdManagerProps) {
  const { toast } = useToast();
  const { pengaturan } = usePengaturan();
  const [data, setData] = useState<Opd[]>([]);
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
  const [editingItem, setEditingItem] = useState<Opd | null>(null);
  const [deletingItem, setDeletingItem] = useState<Opd | null>(null);
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
      const res = await fetch(`/api/admin/opd?${params}`);
      if (!res.ok) throw new Error("Gagal memuat data OPD");
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
    setEditingItem(row as unknown as Opd);
    setFormKey((k) => k + 1);
    setFormOpen(true);
  };

  const handleDelete = (row: Record<string, unknown>) => {
    setDeletingItem(row as unknown as Opd);
    setDeleteOpen(true);
  };

  const handleSubmit = async (formData: Record<string, unknown>) => {
    if (!tahunAnggaranId) return;
    setSubmitting(true);
    try {
      const body = {
        tahunAnggaranId,
        kodeOpd: String(formData.kodeOpd),
        namaOpd: String(formData.namaOpd),
        kepalaOpd: formData.kepalaOpd ? String(formData.kepalaOpd) : null,
        alamat: formData.alamat ? String(formData.alamat) : null,
        telepon: formData.telepon ? String(formData.telepon) : null,
        email: formData.email ? String(formData.email) : null,
      };

      let res: Response;
      if (editingItem) {
        res = await fetch(`/api/admin/opd?id=${editingItem.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      } else {
        res = await fetch("/api/admin/opd", {
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
          ? "Data OPD berhasil diperbarui"
          : "Data OPD berhasil ditambahkan",
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
      const res = await fetch(`/api/admin/opd?id=${deletingItem.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Gagal menghapus data");
      }
      toast({
        title: "Berhasil",
        description: "Data OPD berhasil dihapus",
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
            Pilih tahun anggaran terlebih dahulu untuk mengelola data OPD
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <div className="w-2 h-6 rounded-full" style={{ backgroundColor: pengaturan.warnaAccent }} />
          Manajemen OPD
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
          searchPlaceholder="Cari nama, kode, atau kepala OPD..."
          searchValue={search}
          onSearchChange={(val) => {
            setSearch(val);
            setPagination((prev) => ({ ...prev, page: 1 }));
          }}
          pagination={pagination}
          onPageChange={handlePageChange}
          itemName="OPD"
        />

        <DataFormDialog
          open={formOpen}
          onOpenChange={setFormOpen}
          title={editingItem ? "Edit OPD" : "Tambah OPD"}
          description="Masukkan data Organisasi Perangkat Daerah"
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
              ? `${deletingItem.kodeOpd} - ${deletingItem.namaOpd}`
              : ""
          }
          onConfirm={handleConfirmDelete}
          loading={submitting}
        />
      </CardContent>
    </Card>
  );
}
