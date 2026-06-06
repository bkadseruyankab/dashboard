'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import {
  Users,
  Plus,
  Pencil,
  Trash2,
  Search,
  Shield,
  Edit,
  Eye,
  Mail,
  Calendar,
  Loader2,
  KeyRound,
  UserCog,
} from 'lucide-react';

interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
  avatar: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    news: number;
    documents: number;
  };
}

const roleLabels: Record<string, { label: string; color: string }> = {
  admin: { label: 'Administrator', color: 'bg-red-100 text-red-800' },
  editor: { label: 'Editor', color: 'bg-blue-100 text-blue-800' },
  viewer: { label: 'Viewer', color: 'bg-gray-100 text-gray-800' },
};

const roleDescriptions: Record<string, string> = {
  admin: 'Akses penuh ke semua fitur dan pengaturan',
  editor: 'Dapat membuat, mengubah, dan menghapus konten',
  viewer: 'Hanya dapat melihat konten',
};

export default function UsersTab() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'editor',
  });

  const [passwordData, setPasswordData] = useState({
    password: '',
    confirmPassword: '',
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users?all=true');
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Gagal memuat data pengguna',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (user?: User) => {
    if (user) {
      setSelectedUser(user);
      setFormData({
        name: user.name || '',
        email: user.email,
        password: '',
        confirmPassword: '',
        role: user.role,
      });
    } else {
      setSelectedUser(null);
      setFormData({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'editor',
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedUser(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'editor',
    });
  };

  const handleSaveUser = async () => {
    // Validation
    if (!formData.email) {
      toast({ variant: 'destructive', title: 'Error', description: 'Email harus diisi' });
      return;
    }

    if (!selectedUser && !formData.password) {
      toast({ variant: 'destructive', title: 'Error', description: 'Password harus diisi untuk pengguna baru' });
      return;
    }

    if (formData.password && formData.password !== formData.confirmPassword) {
      toast({ variant: 'destructive', title: 'Error', description: 'Konfirmasi password tidak cocok' });
      return;
    }

    if (formData.password && formData.password.length < 6) {
      toast({ variant: 'destructive', title: 'Error', description: 'Password minimal 6 karakter' });
      return;
    }

    setSaving(true);
    try {
      if (selectedUser) {
        // Update existing user
        const updateData: Record<string, string | undefined> = {
          id: selectedUser.id,
          name: formData.name,
          email: formData.email,
          role: formData.role,
        };
        if (formData.password) {
          updateData.password = formData.password;
        }

        const res = await fetch('/api/users', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updateData),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Gagal mengupdate pengguna');
        }

        toast({ title: 'Berhasil', description: 'Pengguna berhasil diupdate' });
      } else {
        // Create new user
        const res = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            password: formData.password,
            role: formData.role,
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Gagal membuat pengguna');
        }

        toast({ title: 'Berhasil', description: 'Pengguna baru berhasil dibuat' });
      }

      handleCloseDialog();
      fetchUsers();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Terjadi kesalahan',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleOpenPasswordDialog = (user: User) => {
    setSelectedUser(user);
    setPasswordData({ password: '', confirmPassword: '' });
    setIsPasswordDialogOpen(true);
  };

  const handleChangePassword = async () => {
    if (!passwordData.password || passwordData.password.length < 6) {
      toast({ variant: 'destructive', title: 'Error', description: 'Password minimal 6 karakter' });
      return;
    }

    if (passwordData.password !== passwordData.confirmPassword) {
      toast({ variant: 'destructive', title: 'Error', description: 'Konfirmasi password tidak cocok' });
      return;
    }

    if (!selectedUser) return;

    setSaving(true);
    try {
      const res = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedUser.id,
          password: passwordData.password,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Gagal mengubah password');
      }

      toast({ title: 'Berhasil', description: 'Password berhasil diubah' });
      setIsPasswordDialogOpen(false);
      setPasswordData({ password: '', confirmPassword: '' });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Terjadi kesalahan',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleOpenDeleteDialog = (user: User) => {
    setSelectedUser(user);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/users?id=${selectedUser.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Gagal menghapus pengguna');
      }

      toast({ title: 'Berhasil', description: 'Pengguna berhasil dihapus' });
      setIsDeleteDialogOpen(false);
      fetchUsers();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Terjadi kesalahan',
      });
    } finally {
      setSaving(false);
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="h-6 w-6 text-emerald-600" />
            Manajemen Pengguna
          </h2>
          <p className="text-gray-600 mt-1">Kelola pengguna dan hak akses sistem</p>
        </div>
        <Button
          onClick={() => handleOpenDialog()}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Tambah Pengguna
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <Shield className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Administrator</p>
                <p className="text-2xl font-bold">
                  {users.filter((u) => u.role === 'admin').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Edit className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Editor</p>
                <p className="text-2xl font-bold">
                  {users.filter((u) => u.role === 'editor').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Eye className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Viewer</p>
                <p className="text-2xl font-bold">
                  {users.filter((u) => u.role === 'viewer').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Cari pengguna..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pengguna</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Konten</TableHead>
                <TableHead>Bergabung</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                    {searchQuery ? 'Tidak ada pengguna yang cocok' : 'Belum ada pengguna'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                          {user.avatar ? (
                            <img
                              src={user.avatar}
                              alt={user.name || 'User'}
                              className="h-10 w-10 rounded-full object-cover"
                            />
                          ) : (
                            <span className="text-emerald-700 font-medium">
                              {(user.name || user.email).charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{user.name || 'Tanpa Nama'}</p>
                          <p className="text-sm text-gray-500 flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={roleLabels[user.role]?.color || 'bg-gray-100'}>
                        {roleLabels[user.role]?.label || user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-3 text-sm text-gray-600">
                        <span>{user._count?.news || 0} berita</span>
                        <span>{user._count?.documents || 0} dokumen</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(user.createdAt)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenPasswordDialog(user)}
                          title="Ubah Password"
                        >
                          <KeyRound className="h-4 w-4 text-amber-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDialog(user)}
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4 text-blue-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDeleteDialog(user)}
                          title="Hapus"
                          disabled={user._count?.news || user._count?.documents ? true : false}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* User Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCog className="h-5 w-5 text-emerald-600" />
              {selectedUser ? 'Edit Pengguna' : 'Tambah Pengguna Baru'}
            </DialogTitle>
            <DialogDescription>
              {selectedUser
                ? 'Perbarui informasi pengguna'
                : 'Buat pengguna baru dengan mengisi form berikut'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nama Lengkap</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nama pengguna"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@example.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select
                value={formData.role}
                onValueChange={(value) => setFormData({ ...formData, role: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(roleLabels).map(([key, value]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex flex-col">
                        <span>{value.label}</span>
                        <span className="text-xs text-gray-500">
                          {roleDescriptions[key]}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">
                Password {selectedUser ? '(kosongkan jika tidak ingin mengubah)' : '*'}
              </Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Minimal 6 karakter"
                required={!selectedUser}
              />
            </div>

            {formData.password && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Konfirmasi Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="Ulangi password"
                  required
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Batal
            </Button>
            <Button
              onClick={handleSaveUser}
              disabled={saving}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                'Simpan'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-amber-600" />
              Ubah Password
            </DialogTitle>
            <DialogDescription>
              Ubah password untuk <strong>{selectedUser?.email}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">Password Baru</Label>
              <Input
                id="newPassword"
                type="password"
                value={passwordData.password}
                onChange={(e) => setPasswordData({ ...passwordData, password: e.target.value })}
                placeholder="Minimal 6 karakter"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmNewPassword">Konfirmasi Password Baru</Label>
              <Input
                id="confirmNewPassword"
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                }
                placeholder="Ulangi password baru"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPasswordDialogOpen(false)}>
              Batal
            </Button>
            <Button
              onClick={handleChangePassword}
              disabled={saving}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                'Ubah Password'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Pengguna?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus pengguna <strong>{selectedUser?.name || selectedUser?.email}</strong>?
              Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              className="bg-red-600 hover:bg-red-700"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Menghapus...
                </>
              ) : (
                'Hapus'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
