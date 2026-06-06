'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, Loader2, FolderOpen } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string | null;
  order: number;
  _count?: { news: number };
}

export default function CategoriesTab() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const { toast } = useToast();

  const [form, setForm] = useState({
    name: '',
    slug: '',
    description: '',
    color: '#10b981',
    order: 0,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleSubmit = async () => {
    if (!form.name) {
      toast({ variant: 'destructive', title: 'Error', description: 'Nama kategori wajib diisi' });
      return;
    }

    setSaving(true);
    try {
      const url = editingCategory ? '/api/categories' : '/api/categories';
      const method = editingCategory ? 'PUT' : 'POST';
      const body = editingCategory ? { id: editingCategory.id, ...form } : form;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        toast({
          title: 'Berhasil',
          description: editingCategory ? 'Kategori berhasil diperbarui' : 'Kategori berhasil ditambahkan',
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
    if (!confirm('Yakin ingin menghapus kategori ini?')) return;
    try {
      const res = await fetch(`/api/categories?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast({ title: 'Berhasil', description: 'Kategori berhasil dihapus' });
        fetchData();
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Gagal', description: 'Terjadi kesalahan' });
    }
  };

  const resetForm = () => {
    setForm({ name: '', slug: '', description: '', color: '#10b981', order: 0 });
    setEditingCategory(null);
  };

  const openEditDialog = (item: Category) => {
    setEditingCategory(item);
    setForm({
      name: item.name,
      slug: item.slug,
      description: item.description || '',
      color: item.color || '#10b981',
      order: item.order,
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
                  Tambah Kategori
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingCategory ? 'Edit Kategori' : 'Tambah Kategori Baru'}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div>
                    <Label>Nama Kategori *</Label>
                    <Input
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value, slug: generateSlug(e.target.value) })}
                      placeholder="Nama kategori"
                    />
                  </div>
                  <div>
                    <Label>Slug</Label>
                    <Input
                      value={form.slug}
                      onChange={(e) => setForm({ ...form, slug: e.target.value })}
                      placeholder="url-slug"
                    />
                  </div>
                  <div>
                    <Label>Deskripsi</Label>
                    <Textarea
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      placeholder="Deskripsi kategori..."
                      rows={2}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Warna</Label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={form.color}
                          onChange={(e) => setForm({ ...form, color: e.target.value })}
                          className="w-16 h-10"
                        />
                        <Input value={form.color} readOnly />
                      </div>
                    </div>
                    <div>
                      <Label>Urutan</Label>
                      <Input
                        type="number"
                        value={form.order}
                        onChange={(e) => setForm({ ...form, order: parseInt(e.target.value) })}
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

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((cat) => (
          <Card key={cat.id} className="overflow-hidden">
            <div className="h-2" style={{ backgroundColor: cat.color || '#10b981' }} />
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FolderOpen className="h-5 w-5" style={{ color: cat.color || '#10b981' }} />
                  <CardTitle className="text-lg">{cat.name}</CardTitle>
                </div>
                <Badge variant="secondary">{cat._count?.news || 0} berita</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">{cat.description || 'Tidak ada deskripsi'}</p>
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => openEditDialog(cat)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleDelete(cat.id)}>
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {categories.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center text-gray-500">
            Belum ada kategori. Klik "Tambah Kategori" untuk menambahkan.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
