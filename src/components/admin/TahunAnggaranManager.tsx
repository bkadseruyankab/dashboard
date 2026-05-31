"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import GenericCrudTable, { type ColumnDef } from "./GenericCrudTable";
import DataFormDialog, { type FormField } from "./DataFormDialog";
import DeleteConfirmDialog from "./DeleteConfirmDialog";
import { usePengaturan } from "@/context/PengaturanContext";

type TahunAnggaran = {
  id: string;
  tahun: number;
  aktif: boolean;
};

const COLUMNS: ColumnDef[] = [
  { key: "tahun", label: "Tahun Anggaran", type: "text", width: "180px" },
  { key: "aktif", label: "Status", type: "custom", width: "140px" },
];

const FORM_FIELDS: FormField[] = [
  {
    name: "tahun",
    label: "Tahun Anggaran",
    type: "number",
    placeholder: "Contoh: 2025",
    required: true,
    min: 2000,
  },
  // aktif is always true, no need for switch
];

export default function TahunAnggaranManager() {
  const { toast } = useToast();
  const { pengaturan } = usePengaturan();
  const [data, setData] = useState<TahunAnggaran[]>([]);
  const [loading, setLoading] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<TahunAnggaran | null>(null);
  const [deletingItem, setDeletingItem] = useState<TahunAnggaran | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formKey, setFormKey] = useState(0);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/tahun-anggaran");
      if (!res.ok) throw new Error("Gagal memuat data tahun anggaran");
      const json = await res.json();
      setData(json.data || []);
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Terjadi kesalahan",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreate = () => {
    setEditingItem(null);
    setFormKey((k) => k + 1);
    setFormOpen(true);
  };

  const handleEdit = (row: Record<string, unknown>) => {
    setEditingItem(row as unknown as TahunAnggaran);
    setFormKey((k) => k + 1);
    setFormOpen(true);
  };

  const handleDelete = (row: Record<string, unknown>) => {
    setDeletingItem(row as unknown as TahunAnggaran);
    setDeleteOpen(true);
  };

  const handleSubmit = async (formData: Record<string, unknown>) => {
    setSubmitting(true);
    try {
      let res: Response;
      if (editingItem) {
        res = await fetch(`/api/admin/tahun-anggaran?id=${editingItem.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tahun: Number(formData.tahun),
            aktif: true, // Always aktif
          }),
        });
      } else {
        res = await fetch("/api/admin/tahun-anggaran", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tahun: Number(formData.tahun),
            aktif: true, // Always aktif
          }),
        });
      }
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Gagal menyimpan data");
      }
      toast({
        title: "Berhasil",
        description: editingItem
          ? "Tahun anggaran berhasil diperbarui"
          : "Tahun anggaran berhasil ditambahkan",
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
        `/api/admin/tahun-anggaran?id=${deletingItem.id}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Gagal menghapus data");
      }
      toast({
        title: "Berhasil",
        description: "Tahun anggaran berhasil dihapus",
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

  // Custom render for the aktif column - always show active badge
  const renderCustomCell = (key: string, value: unknown) => {
    if (key === "aktif") {
      return (
        <Badge
          className="text-xs font-medium"
          style={{
            backgroundColor: `${pengaturan.warnaPrimary}20`,
            color: pengaturan.warnaPrimary,
          }}
        >
          Aktif — Realtime
        </Badge>
      );
    }
    return String(value ?? "");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <div className="w-2 h-6 rounded-full" style={{ backgroundColor: pengaturan.warnaPrimary }} />
          Manajemen Tahun Anggaran
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          Semua tahun anggaran aktif dan mengikuti secara realtime tanpa terkecuali
        </p>
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
          searchPlaceholder="Cari tahun anggaran..."
          itemName="Tahun Anggaran"
          renderCustomCell={renderCustomCell}
        />

        <DataFormDialog
          open={formOpen}
          onOpenChange={setFormOpen}
          title={editingItem ? "Edit Tahun Anggaran" : "Tambah Tahun Anggaran"}
          description="Semua tahun anggaran aktif secara realtime"
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
              ? `Tahun Anggaran ${deletingItem.tahun}`
              : ""
          }
          onConfirm={handleConfirmDelete}
          loading={submitting}
        />
      </CardContent>
    </Card>
  );
}
