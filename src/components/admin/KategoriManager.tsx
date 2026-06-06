"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pencil,
  Trash2,
  Plus,
  RefreshCw,
  Loader2,
  Inbox,
  Tag,
  Search,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { usePengaturan } from "@/context/PengaturanContext";

type Kategori = {
  id: string;
  jenis: string;
  namaKategori: string;
  kodeKategori: string | null;
  urutan: number;
  aktif: boolean;
};

const JENIS_OPTIONS = [
  { value: "Pendapatan", label: "Pendapatan", color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  { value: "Belanja", label: "Belanja", color: "bg-red-100 text-red-800 border-red-200" },
  { value: "Pembiayaan", label: "Pembiayaan", color: "bg-amber-100 text-amber-800 border-amber-200" },
  { value: "RealisasiAkun", label: "Realisasi Akun", color: "bg-blue-100 text-blue-800 border-blue-200" },
];

function getJenisBadgeClass(jenis: string): string {
  const found = JENIS_OPTIONS.find((j) => j.value === jenis);
  return found?.color ?? "bg-gray-100 text-gray-800 border-gray-200";
}

function getJenisLabel(jenis: string): string {
  const found = JENIS_OPTIONS.find((j) => j.value === jenis);
  return found?.label ?? jenis;
}

export default function KategoriManager() {
  const { toast } = useToast();
  const { pengaturan } = usePengaturan();
  const [data, setData] = useState<Kategori[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterJenis, setFilterJenis] = useState<string>("all");
  const [search, setSearch] = useState("");

  // Form state
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Kategori | null>(null);
  const [deletingItem, setDeletingItem] = useState<Kategori | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formKey, setFormKey] = useState(0);

  // Form fields
  const [formJenis, setFormJenis] = useState("Pendapatan");
  const [formNama, setFormNama] = useState("");
  const [formKode, setFormKode] = useState("");
  const [formUrutan, setFormUrutan] = useState(0);
  const [formAktif, setFormAktif] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterJenis && filterJenis !== "all") {
        params.set("jenis", filterJenis);
      }
      if (search) {
        params.set("search", search);
      }
      const res = await fetch(`/api/admin/kategori?${params}`);
      if (!res.ok) throw new Error("Gagal memuat data kategori");
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
  }, [filterJenis, search, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const resetForm = () => {
    setFormJenis("Pendapatan");
    setFormNama("");
    setFormKode("");
    setFormUrutan(0);
    setFormAktif(true);
  };

  const handleCreate = () => {
    setEditingItem(null);
    resetForm();
    setFormKey((k) => k + 1);
    setFormOpen(true);
  };

  const handleEdit = (item: Kategori) => {
    setEditingItem(item);
    setFormJenis(item.jenis);
    setFormNama(item.namaKategori);
    setFormKode(item.kodeKategori ?? "");
    setFormUrutan(item.urutan);
    setFormAktif(item.aktif);
    setFormKey((k) => k + 1);
    setFormOpen(true);
  };

  const handleDelete = (item: Kategori) => {
    setDeletingItem(item);
    setDeleteOpen(true);
  };

  const handleSubmit = async () => {
    if (!formNama.trim()) {
      toast({
        title: "Validasi",
        description: "Nama kategori wajib diisi",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const body = {
        jenis: formJenis,
        namaKategori: formNama.trim(),
        kodeKategori: formKode.trim() || null,
        urutan: formUrutan,
        aktif: formAktif,
      };

      let res: Response;
      if (editingItem) {
        res = await fetch(`/api/admin/kategori?id=${editingItem.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      } else {
        res = await fetch("/api/admin/kategori", {
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
          ? "Kategori berhasil diperbarui"
          : "Kategori berhasil ditambahkan",
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
      const res = await fetch(`/api/admin/kategori?id=${deletingItem.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Gagal menghapus data");
      }
      toast({
        title: "Berhasil",
        description: "Kategori berhasil dihapus",
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

  // Group data by jenis
  const groupedData = data.reduce<Record<string, Kategori[]>>((acc, item) => {
    if (!acc[item.jenis]) acc[item.jenis] = [];
    acc[item.jenis].push(item);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="w-2 h-6 rounded-full" style={{ backgroundColor: pengaturan.warnaAccent }} />
            Manajemen Kategori
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Cari kategori..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={filterJenis}
                onValueChange={setFilterJenis}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter Jenis" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Jenis</SelectItem>
                  {JENIS_OPTIONS.map((j) => (
                    <SelectItem key={j.value} value={j.value}>
                      {j.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchData}
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
              <Button
                size="sm"
                onClick={handleCreate}
                className="text-white hover:opacity-90"
                style={{ backgroundColor: pengaturan.warnaPrimary }}
              >
                <Plus className="w-4 h-4" />
                Tambah Kategori
              </Button>
            </div>
          </div>

          {/* Display by group or flat */}
          {filterJenis === "all" ? (
            // Grouped display
            Object.entries(groupedData).map(([jenis, items]) => (
              <div key={jenis} className="mb-6 last:mb-0">
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="outline" className={getJenisBadgeClass(jenis)}>
                    <Tag className="w-3 h-3 mr-1" />
                    {getJenisLabel(jenis)}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    ({items.length} kategori)
                  </span>
                </div>
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="w-10 text-center">#</TableHead>
                        <TableHead className="w-32">Kode</TableHead>
                        <TableHead>Nama Kategori</TableHead>
                        <TableHead className="w-20 text-center">Urutan</TableHead>
                        <TableHead className="w-24 text-center">Status</TableHead>
                        <TableHead className="text-center w-28">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8">
                            <div className="flex flex-col items-center gap-2 text-muted-foreground">
                              <Inbox className="w-8 h-8" />
                              <p className="text-sm">Belum ada kategori</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        items.map((item, idx) => (
                          <TableRow key={item.id}>
                            <TableCell className="text-center text-muted-foreground text-xs">
                              {idx + 1}
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {item.kodeKategori || "-"}
                            </TableCell>
                            <TableCell className="font-medium">
                              {item.namaKategori}
                            </TableCell>
                            <TableCell className="text-center font-mono text-sm">
                              {item.urutan}
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge
                                variant="outline"
                                className={
                                  item.aktif
                                    ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                                    : "bg-gray-100 text-gray-600 border-gray-200"
                                }
                              >
                                {item.aktif ? "Aktif" : "Nonaktif"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex items-center justify-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                                  onClick={() => handleEdit(item)}
                                  title="Edit"
                                >
                                  <Pencil className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-red-600 hover:text-red-800 hover:bg-red-50"
                                  onClick={() => handleDelete(item)}
                                  title="Hapus"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ))
          ) : (
            // Flat display for filtered jenis
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-10 text-center">#</TableHead>
                    <TableHead className="w-32">Kode</TableHead>
                    <TableHead>Nama Kategori</TableHead>
                    <TableHead className="w-20 text-center">Urutan</TableHead>
                    <TableHead className="w-24 text-center">Status</TableHead>
                    <TableHead className="text-center w-28">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12">
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                          <Inbox className="w-10 h-10" />
                          <p className="text-sm font-medium">Tidak ada data</p>
                          <p className="text-xs">Belum ada kategori untuk jenis ini</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.map((item, idx) => (
                      <TableRow key={item.id}>
                        <TableCell className="text-center text-muted-foreground text-xs">
                          {idx + 1}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {item.kodeKategori || "-"}
                        </TableCell>
                        <TableCell className="font-medium">
                          {item.namaKategori}
                        </TableCell>
                        <TableCell className="text-center font-mono text-sm">
                          {item.urutan}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant="outline"
                            className={
                              item.aktif
                                ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                                : "bg-gray-100 text-gray-600 border-gray-200"
                            }
                          >
                            {item.aktif ? "Aktif" : "Nonaktif"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                              onClick={() => handleEdit(item)}
                              title="Edit"
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-600 hover:text-red-800 hover:bg-red-50"
                              onClick={() => handleDelete(item)}
                              title="Hapus"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          {loading && data.length > 0 && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">Memuat...</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? "Edit Kategori" : "Tambah Kategori"}
            </DialogTitle>
            <DialogDescription>
              Kelola kategori untuk pengelompokan data keuangan daerah
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Jenis <span className="text-red-500">*</span></Label>
              <Select
                value={formJenis}
                onValueChange={setFormJenis}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih Jenis" />
                </SelectTrigger>
                <SelectContent>
                  {JENIS_OPTIONS.map((j) => (
                    <SelectItem key={j.value} value={j.value}>
                      {j.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="namaKategori">Nama Kategori <span className="text-red-500">*</span></Label>
              <Input
                id="namaKategori"
                value={formNama}
                onChange={(e) => setFormNama(e.target.value)}
                placeholder="Contoh: PAD, Operasi, Penerimaan"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="kodeKategori">Kode Kategori</Label>
              <Input
                id="kodeKategori"
                value={formKode}
                onChange={(e) => setFormKode(e.target.value)}
                placeholder="Contoh: 4.1 (opsional)"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="urutan">Urutan</Label>
              <Input
                id="urutan"
                type="number"
                min={0}
                value={formUrutan}
                onChange={(e) => setFormUrutan(parseInt(e.target.value) || 0)}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <Label htmlFor="aktif" className="cursor-pointer">Status Aktif</Label>
              <Switch
                id="aktif"
                checked={formAktif}
                onCheckedChange={setFormAktif}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setFormOpen(false)}
              disabled={submitting}
            >
              Batal
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="text-white hover:opacity-90"
              style={{ backgroundColor: pengaturan.warnaPrimary }}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Menyimpan...
                </>
              ) : editingItem ? (
                "Simpan Perubahan"
              ) : (
                "Tambah Kategori"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Hapus Kategori</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus kategori{" "}
              <strong>{deletingItem?.namaKategori}</strong> ({getJenisLabel(deletingItem?.jenis ?? "")})?
              Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              disabled={submitting}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Menghapus...
                </>
              ) : (
                "Hapus"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
