'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, Loader2, Users, Mail, Phone } from 'lucide-react';

interface Organization {
  id: string;
  name: string;
  position: string;
  photo: string | null;
  description: string | null;
  email: string | null;
  phone: string | null;
  order: number;
  level: number;
}

export default function OrganizationTab() {
  const [organization, setOrganization] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Organization | null>(null);
  const { toast } = useToast();

  const [form, setForm] = useState({
    name: '',
    position: '',
    photo: '',
    description: '',
    email: '',
    phone: '',
    order: 0,
    level: 1,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/organization');
      const data = await res.json();
      setOrganization(data);
    } catch (error) {
      console.error('Error fetching organization:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.name || !form.position) {
      toast({ variant: 'destructive', title: 'Error', description: 'Nama dan jabatan wajib diisi' });
      return;
    }

    setSaving(true);
    try {
      const url = editingItem ? '/api/organization' : '/api/organization';
      const method = editingItem ? 'PUT' : 'POST';
      const body = editingItem
        ? { id: editingItem.id, ...form }
        : form;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        toast({
          title: 'Berhasil',
          description: editingItem ? 'Data berhasil diperbarui' : 'Data berhasil ditambahkan',
        });
        setDialogOpen(false);
        resetForm();
        fetchData();
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Gagal', description: 'Terjadi kesalahan' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus data ini?')) return;
    try {
      const res = await fetch(`/api/organization?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast({ title: 'Berhasil', description: 'Data berhasil dihapus' });
        fetchData();
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Gagal', description: 'Terjadi kesalahan' });
    }
  };

  const resetForm = () => {
    setForm({ name: '', position: '', photo: '', description: '', email: '', phone: '', order: 0, level: 1 });
    setEditingItem(null);
  };

  const openEditDialog = (item: Organization) => {
    setEditingItem(item);
    setForm({
      name: item.name,
      position: item.position,
      photo: item.photo || '',
      description: item.description || '',
      email: item.email || '',
      phone: item.phone || '',
      order: item.order,
      level: item.level,
    });
    setDialogOpen(true);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .slice(0, 2)
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  const getLevelColor = (level: number) => {
    switch (level) {
      case 1: return 'border-emerald-500';
      case 2: return 'border-blue-500';
      case 3: return 'border-orange-500';
      default: return 'border-gray-300';
    }
  };

  const getLevelLabel = (level: number) => {
    switch (level) {
      case 1: return 'Kepala';
      case 2: return 'Sekretaris';
      case 3: return 'Kabid';
      default: return 'Staff';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-end">
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm} className="bg-emerald-600 hover:bg-emerald-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Tambah Personil
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{editingItem ? 'Edit Data' : 'Tambah Data Baru'}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Nama *</Label>
                      <Input
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder="Nama lengkap"
                      />
                    </div>
                    <div>
                      <Label>Jabatan *</Label>
                      <Input
                        value={form.position}
                        onChange={(e) => setForm({ ...form, position: e.target.value })}
                        placeholder="Jabatan"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>URL Foto</Label>
                    <Input
                      value={form.photo}
                      onChange={(e) => setForm({ ...form, photo: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>
                  <div>
                    <Label>Deskripsi</Label>
                    <Textarea
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      placeholder="Deskripsi singkat..."
                      rows={2}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          type="email"
                          value={form.email}
                          onChange={(e) => setForm({ ...form, email: e.target.value })}
                          placeholder="email@seruyankab.go.id"
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Telepon</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          value={form.phone}
                          onChange={(e) => setForm({ ...form, phone: e.target.value })}
                          placeholder="(0513) 123456"
                          className="pl-10"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Level</Label>
                      <select
                        value={form.level}
                        onChange={(e) => setForm({ ...form, level: parseInt(e.target.value) })}
                        className="w-full border rounded-md p-2"
                      >
                        <option value={1}>1 - Kepala</option>
                        <option value={2}>2 - Sekretaris</option>
                        <option value={3}>3 - Kabid</option>
                        <option value={4}>4 - Staff</option>
                      </select>
                    </div>
                    <div>
                      <Label>Urutan</Label>
                      <Input
                        type="number"
                        value={form.order}
                        onChange={(e) => setForm({ ...form, order: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" onClick={() => setDialogOpen(false)}>
                      Batal
                    </Button>
                    <Button onClick={handleSubmit} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
                      {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Simpan
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Organization Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {organization.map((item) => (
          <Card key={item.id} className={`overflow-hidden border-t-4 ${getLevelColor(item.level)}`}>
            <CardContent className="p-4 text-center">
              <Avatar className="h-20 w-20 mx-auto mb-3 border-4 border-gray-100">
                <AvatarImage src={item.photo || undefined} />
                <AvatarFallback className="bg-emerald-600 text-white text-lg">
                  {getInitials(item.name)}
                </AvatarFallback>
              </Avatar>
              <h3 className="font-bold text-sm mb-1">{item.name}</h3>
              <p className="text-emerald-600 text-xs font-medium mb-1">{item.position}</p>
              <Badge variant="outline" className="text-xs mb-3">
                {getLevelLabel(item.level)}
              </Badge>
              {item.email && (
                <p className="text-xs text-gray-500 truncate">{item.email}</p>
              )}
              <div className="flex justify-center gap-1 mt-3">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditDialog(item)}>
                  <Pencil className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDelete(item.id)}>
                  <Trash2 className="h-3 w-3 text-red-500" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {organization.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center text-gray-500">
            <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            Belum ada data. Klik "Tambah Personil" untuk menambahkan.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
