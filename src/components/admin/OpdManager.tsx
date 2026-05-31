"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import GenericCrudTable, { type ColumnDef } from "./GenericCrudTable";
import DataFormDialog, { type FormField } from "./DataFormDialog";
import DeleteConfirmDialog from "./DeleteConfirmDialog";
import { usePengaturan } from "@/context/PengaturanContext";
import { CopyPlus, AlertTriangle, Loader2 } from "lucide-react";

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
    placeholder: "Contoh: 1.01",
    required: true,
  },
  {
    name: "namaOpd",
    label: "Nama OPD",
    type: "text",
    placeholder: "Contoh: Dinas Pendidikan",
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
  const [generateOpen, setGenerateOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Opd | null>(null);
  const [deletingItem, setDeletingItem] = useState<Opd | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [generating, setGenerating] = useState(false);
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

  const handleGenerateOpd = async () => {
    if (!tahunAnggaranId) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/admin/opd/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tahunAnggaranId }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Gagal generate OPD");
      }
      toast({
        title: "Generate OPD Berhasil",
        description: json.message || "OPD berhasil digenerate dari tahun sebelumnya",
      });
      setGenerateOpen(false);
      fetchData();
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Terjadi kesalahan",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
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
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="w-2 h-6 rounded-full" style={{ backgroundColor: pengaturan.warnaAccent }} />
            Manajemen OPD
          </CardTitle>
          <Button
            onClick={() => setGenerateOpen(true)}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
            style={{ borderColor: pengaturan.warnaPrimary, color: pengaturan.warnaPrimary }}
          >
            <CopyPlus className="w-4 h-4" />
            Generate OPD
          </Button>
        </div>
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

        {/* Generate OPD Confirmation Dialog */}
        <Dialog open={generateOpen} onOpenChange={setGenerateOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CopyPlus className="w-5 h-5" style={{ color: pengaturan.warnaPrimary }} />
                Generate OPD dari Tahun Sebelumnya
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground pt-2">
                Salin data OPD dari tahun anggaran sebelumnya ke tahun anggaran yang dipilih saat ini.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30">
                <div className="flex gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                      Perhatian
                    </p>
                    <ul className="text-xs text-amber-700 dark:text-amber-300 space-y-1">
                      <li>&bull; Data OPD akan disalin dari tahun anggaran sebelumnya (tahun - 1)</li>
                      <li>&bull; OPD yang sudah ada di tahun ini akan dilewati (tidak diduplikasi)</li>
                      <li>&bull; Akun pengguna OPD akan otomatis dibuat dengan password <code className="bg-amber-100 dark:bg-amber-900 px-1 rounded">seruyan2024</code></li>
                      <li>&bull; Pastikan tahun anggaran sebelumnya sudah memiliki data OPD</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => setGenerateOpen(false)}
                disabled={generating}
              >
                Batal
              </Button>
              <Button
                onClick={handleGenerateOpd}
                disabled={generating}
                style={{ backgroundColor: pengaturan.warnaPrimary }}
                className="text-white"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <CopyPlus className="w-4 h-4 mr-2" />
                    Generate OPD
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
