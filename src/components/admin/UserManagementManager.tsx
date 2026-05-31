"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import { useToast } from "@/hooks/use-toast";
import { usePengaturan } from "@/context/PengaturanContext";
import DeleteConfirmDialog from "./DeleteConfirmDialog";
import {
  UserCog,
  Plus,
  Pencil,
  Trash2,
  Shield,
  Building2,
  Loader2,
} from "lucide-react";

type UserRecord = {
  id: string;
  name: string;
  email: string;
  role: string;
  opdId: string | null;
  aktif: boolean;
  createdAt: string;
  updatedAt: string;
  opd?: {
    id: string;
    kodeOpd: string;
    namaOpd: string;
  } | null;
};

type OpdOption = {
  id: string;
  kodeOpd: string;
  namaOpd: string;
};

export default function UserManagementManager() {
  const { toast } = useToast();
  const { pengaturan } = usePengaturan();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [opdOptions, setOpdOptions] = useState<OpdOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);
  const [deletingUser, setDeletingUser] = useState<UserRecord | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formKey, setFormKey] = useState(0);

  // Form state
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formRole, setFormRole] = useState("admin");
  const [formOpdId, setFormOpdId] = useState("");
  const [formAktif, setFormAktif] = useState(true);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      if (!res.ok) throw new Error("Gagal memuat data pengguna");
      const json = await res.json();
      setUsers(json.data || []);
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

  const fetchOpdOptions = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/opd-list");
      if (!res.ok) throw new Error("Gagal memuat daftar OPD");
      const json = await res.json();
      setOpdOptions(json.data || []);
    } catch {
      setOpdOptions([]);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
    fetchOpdOptions();
  }, [fetchUsers, fetchOpdOptions]);

  const handleCreate = () => {
    setEditingUser(null);
    setFormName("");
    setFormEmail("");
    setFormPassword("");
    setFormRole("admin");
    setFormOpdId("");
    setFormAktif(true);
    setFormKey((k) => k + 1);
    fetchOpdOptions();
    setFormOpen(true);
  };

  const handleEdit = (user: UserRecord) => {
    setEditingUser(user);
    setFormName(user.name);
    setFormEmail(user.email);
    setFormPassword("");
    setFormRole(user.role);
    setFormOpdId(user.opdId || "");
    setFormAktif(user.aktif);
    setFormKey((k) => k + 1);
    fetchOpdOptions();
    setFormOpen(true);
  };

  const handleDelete = (user: UserRecord) => {
    setDeletingUser(user);
    setDeleteOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        name: formName,
        email: formEmail,
        role: formRole,
        aktif: formAktif,
      };

      if (formRole === "opd" && formOpdId) {
        body.opdId = formOpdId;
      }

      if (!editingUser && formPassword) {
        body.password = formPassword;
      } else if (editingUser && formPassword) {
        body.password = formPassword;
      }

      if (!editingUser && !formPassword) {
        toast({
          title: "Error",
          description: "Password wajib diisi untuk pengguna baru",
          variant: "destructive",
        });
        setSubmitting(false);
        return;
      }

      let res: Response;
      if (editingUser) {
        res = await fetch(`/api/admin/users?id=${editingUser.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      } else {
        res = await fetch("/api/admin/users", {
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
        description: editingUser
          ? "Data pengguna berhasil diperbarui"
          : "Pengguna berhasil ditambahkan",
      });
      setFormOpen(false);
      fetchUsers();
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
    if (!deletingUser) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/users?id=${deletingUser.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Gagal menghapus pengguna");
      }
      toast({
        title: "Berhasil",
        description: "Pengguna berhasil dihapus",
      });
      setDeleteOpen(false);
      setDeletingUser(null);
      fetchUsers();
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

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "superadmin":
        return (
          <Badge
            className="text-[10px] font-semibold"
            style={{
              backgroundColor: `${pengaturan.warnaPrimary}15`,
              color: pengaturan.warnaPrimary,
            }}
          >
            <Shield className="w-3 h-3 mr-1" />
            Super Admin
          </Badge>
        );
      case "opd":
        return (
          <Badge className="text-[10px] font-semibold bg-amber-100 text-amber-800">
            <Building2 className="w-3 h-3 mr-1" />
            OPD
          </Badge>
        );
      default:
        return (
          <Badge className="text-[10px] font-semibold bg-blue-100 text-blue-800">
            <Shield className="w-3 h-3 mr-1" />
            Admin
          </Badge>
        );
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ backgroundColor: `${pengaturan.warnaPrimary}15`, color: pengaturan.warnaPrimary }}
            >
              <UserCog className="w-4 h-4" />
            </div>
            Manajemen Pengguna
          </CardTitle>
          <Button
            onClick={handleCreate}
            className="gap-2"
            style={{
              background: `linear-gradient(to right, ${pengaturan.warnaPrimary}, ${pengaturan.warnaSecondary})`,
            }}
          >
            <Plus className="w-4 h-4" />
            Tambah Pengguna
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : users.length === 0 ? (
          <p className="text-center text-muted-foreground text-sm py-12">
            Belum ada data pengguna
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Nama</TableHead>
                  <TableHead className="w-[220px]">Email</TableHead>
                  <TableHead className="w-[120px]">Role</TableHead>
                  <TableHead>OPD</TableHead>
                  <TableHead className="w-[80px]">Status</TableHead>
                  <TableHead className="w-[100px] text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium text-sm">
                      {user.name}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {user.email}
                    </TableCell>
                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                    <TableCell className="text-sm">
                      {user.opd ? (
                        <span className="text-xs">
                          {user.opd.kodeOpd} — {user.opd.namaOpd}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          user.aktif
                            ? "border-emerald-200 text-emerald-700 text-[10px]"
                            : "border-red-200 text-red-700 text-[10px]"
                        }
                      >
                        {user.aktif ? "Aktif" : "Nonaktif"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(user)}
                          className="h-8 w-8 p-0"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(user)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* User Form Dialog */}
        <Dialog open={formOpen} onOpenChange={setFormOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingUser ? "Edit Pengguna" : "Tambah Pengguna"}
              </DialogTitle>
              <DialogDescription>
                {editingUser
                  ? "Perbarui data pengguna"
                  : "Tambahkan pengguna baru (Admin atau OPD)"}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nama</Label>
                <Input
                  id="name"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Nama lengkap"
                  required
                  disabled={submitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="email@seruyankab.go.id"
                  required
                  disabled={submitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">
                  Password {editingUser && "(kosongkan jika tidak diubah)"}
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  placeholder={editingUser ? "Kosongkan jika tidak diubah" : "Minimal 6 karakter"}
                  required={!editingUser}
                  disabled={submitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={formRole}
                  onValueChange={(val) => {
                    setFormRole(val);
                    if (val !== "opd") setFormOpdId("");
                  }}
                >
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Pilih role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="superadmin">Super Admin</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="opd">OPD</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formRole === "opd" && (
                <div className="space-y-2">
                  <Label htmlFor="opdId">OPD</Label>
                  <Select
                    value={formOpdId}
                    onValueChange={setFormOpdId}
                  >
                    <SelectTrigger id="opdId">
                      <SelectValue placeholder="Pilih OPD" />
                    </SelectTrigger>
                    <SelectContent>
                      {opdOptions.map((opd) => (
                        <SelectItem key={opd.id} value={opd.id}>
                          {opd.kodeOpd} — {opd.namaOpd}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {opdOptions.length === 0 && (
                    <p className="text-xs text-amber-600">
                      Belum ada data OPD. Tambahkan OPD terlebih dahulu.
                    </p>
                  )}
                </div>
              )}

              <div className="flex items-center gap-2">
                <Switch
                  id="aktif"
                  checked={formAktif}
                  onCheckedChange={setFormAktif}
                  disabled={submitting}
                />
                <Label htmlFor="aktif">Aktif</Label>
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
                  type="submit"
                  disabled={submitting}
                  style={{
                    background: `linear-gradient(to right, ${pengaturan.warnaPrimary}, ${pengaturan.warnaSecondary})`,
                  }}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    "Simpan"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <DeleteConfirmDialog
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          itemName={
            deletingUser
              ? `${deletingUser.name} (${deletingUser.email})`
              : ""
          }
          onConfirm={handleConfirmDelete}
          loading={submitting}
        />
      </CardContent>
    </Card>
  );
}
