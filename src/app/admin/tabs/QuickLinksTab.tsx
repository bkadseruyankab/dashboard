'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  ExternalLink,
  Link2,
} from 'lucide-react';

interface QuickLink {
  id: string;
  title: string;
  url: string;
  icon: string | null;
  order: number;
  isActive: boolean;
}

export default function QuickLinksTab() {
  const [links, setLinks] = useState<QuickLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<QuickLink | null>(null);
  const { toast } = useToast();

  const [form, setForm] = useState({
    title: '',
    url: '',
    icon: '',
    order: 0,
    isActive: true,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/quicklinks');
      const data = await res.json();
      setLinks(data);
    } catch (error) {
      console.error('Error fetching quick links:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.title || !form.url) {
      toast({ variant: 'destructive', title: 'Error', description: 'Judul dan URL wajib diisi' });
      return;
    }

    setSaving(true);
    try {
      const url = editingLink ? '/api/quicklinks' : '/api/quicklinks';
      const method = editingLink ? 'PUT' : 'POST';
      const body = editingLink
        ? { id: editingLink.id, ...form }
        : form;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        toast({
          title: 'Berhasil',
          description: editingLink ? 'Tautan berhasil diperbarui' : 'Tautan berhasil ditambahkan',
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
    if (!confirm('Yakin ingin menghapus tautan ini?')) return;
    try {
      const res = await fetch(`/api/quicklinks?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast({ title: 'Berhasil', description: 'Tautan berhasil dihapus' });
        fetchData();
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Gagal', description: 'Terjadi kesalahan' });
    }
  };

  const resetForm = () => {
    setForm({ title: '', url: '', icon: '', order: 0, isActive: true });
    setEditingLink(null);
  };

  const openEditDialog = (item: QuickLink) => {
    setEditingLink(item);
    setForm({
      title: item.title,
      url: item.url,
      icon: item.icon || '',
      order: item.order,
      isActive: item.isActive,
    });
    setDialogOpen(true);
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
                  Tambah Tautan
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingLink ? 'Edit Tautan' : 'Tambah Tautan Baru'}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div>
                    <Label>Judul *</Label>
                    <Input
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      placeholder="Nama tautan"
                    />
                  </div>
                  <div>
                    <Label>URL *</Label>
                    <Input
                      value={form.url}
                      onChange={(e) => setForm({ ...form, url: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Ikon (opsional)</Label>
                      <Input
                        value={form.icon}
                        onChange={(e) => setForm({ ...form, icon: e.target.value })}
                        placeholder="globe, building, dll"
                      />
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
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={form.isActive}
                      onCheckedChange={(v) => setForm({ ...form, isActive: v })}
                    />
                    <Label>Aktif</Label>
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

      {/* Quick Links List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {links.map((link) => (
          <Card key={link.id} className={`${!link.isActive ? 'opacity-60' : ''}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="bg-emerald-100 p-2 rounded-lg">
                    <Link2 className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{link.title}</p>
                    <p className="text-xs text-gray-500 truncate">{link.url}</p>
                  </div>
                </div>
                <Badge className={link.isActive ? 'bg-green-500' : 'bg-gray-400'}>
                  {link.isActive ? 'Aktif' : 'Nonaktif'}
                </Badge>
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t">
                <span className="text-xs text-gray-500">Urutan: {link.order}</span>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                    <a href={link.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(link)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(link.id)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {links.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center text-gray-500">
            <Link2 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            Belum ada tautan. Klik "Tambah Tautan" untuk menambahkan.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
