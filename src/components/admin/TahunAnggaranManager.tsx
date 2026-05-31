"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import GenericCrudTable, { type ColumnDef } from "./GenericCrudTable";
import DataFormDialog, { type FormField } from "./DataFormDialog";
import DeleteConfirmDialog from "./DeleteConfirmDialog";
import { usePengaturan } from "@/context/PengaturanContext";
import { Check, X } from "lucide-react";

type TahunAnggaran = {
  id: string;
  tahun: number;
  aktif: boolean;
};

const COLUMNS: ColumnDef[] = [
  { key: "tahun", label: "Tahun Anggaran", type: "text", width: "180px" },
  { key: "aktif", label: "Status Aktif", type: "custom", width: "200px" },
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
  const [togglingId, setTogglingId] = useState<string | null>(null);

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
            aktif: editingItem.aktif, // Keep current active status
          }),
        });
      } else {
        res = await fetch("/api/admin/tahun-anggaran", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tahun: Number(formData.tahun),
            aktif: true, // New year becomes the active year
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
          : "Tahun anggaran berhasil ditambahkan dan diatur sebagai aktif",
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

  const handleToggleAktif = async (item: TahunAnggaran) => {
    if (item.aktif) {
      // Cannot deactivate the active year directly
      toast({
        title: "Tidak Dapat Menonaktifkan",
        description: "Pilih tahun lain sebagai aktif untuk menonaktifkan tahun ini. Harus ada satu tahun anggaran aktif.",
        variant: "destructive",
      });
      return;
    }
    setTogglingId(item.id);
    try {
      const res = await fetch(`/api/admin/tahun-anggaran?id=${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aktif: true }),
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Gagal mengubah status aktif");
      }
      toast({
        title: "Berhasil",
        description: `Tahun Anggaran ${item.tahun} sekarang aktif. Semua data akan mengikuti tahun ini.`,
      });
      fetchData();
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Terjadi kesalahan",
        variant: "destructive",
      });
    } finally {
      setTogglingId(null);
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

  // Custom render for the aktif column
  const renderCustomCell = (key: string, value: unknown, row?: Record<string, unknown>) => {
    if (key === "aktif") {
      const item = row as unknown as TahunAnggaran;
      const isActive = value as boolean;
      const isToggling = togglingId === item?.id;

      return (
        <div className="flex items-center gap-2">
          <Switch
            checked={isActive}
            onCheckedChange={() => {
              if (item) handleToggleAktif(item);
            }}
            disabled={isToggling}
            className="data-[state=checked]:bg-emerald-500"
          />
          {isActive ? (
            <Badge
              className="text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200"
            >
              <Check className="w-3 h-3 mr-0.5" />
              Aktif
            </Badge>
          ) : (
            <Badge
              className="text-xs font-medium bg-gray-50 text-gray-500 border border-gray-200"
            >
              <X className="w-3 h-3 mr-0.5" />
              Tidak Aktif
            </Badge>
          )}
        </div>
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
          Hanya satu tahun anggaran yang dapat aktif pada satu waktu. Semua data dashboard dan laporan akan mengikuti tahun anggaran aktif secara otomatis.
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
          description={editingItem ? "Perbarui tahun anggaran" : "Tahun anggaran baru akan otomatis diatur sebagai aktif"}
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
