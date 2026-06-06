'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
import { Plus, Pencil, Trash2, Loader2, Image, ExternalLink } from 'lucide-react';

interface Banner {
  id: string;
  title: string;
  subtitle: string | null;
  imageUrl: string;
  link: string | null;
  order: number;
  isActive: boolean;
}

export default function BannersTab() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const { toast } = useToast();

  const [form, setForm] = useState({
    title: '',
    subtitle: '',
    imageUrl: '',
    link: '',
    order: 0,
    isActive: true,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/banners');
      const data = await res.json();
      setBanners(data);
    } catch (error) {
      console.error('Error fetching banners:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.title || !form.imageUrl) {
      toast({ variant: 'destructive', title: 'Error', description: 'Judul dan URL gambar wajib diisi' });
      return;
    }

    setSaving(true);
    try {
      const url = editingBanner ? '/api/banners' : '/api/banners';
      const method = editingBanner ? 'PUT' : 'POST';
      const body = editingBanner ? { id: editingBanner.id, ...form } : form;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        toast({
          title: 'Berhasil',
          description: editingBanner ? 'Banner berhasil diperbarui' : 'Banner berhasil ditambahkan',
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
    if (!confirm('Yakin ingin menghapus banner ini?')) return;
    try {
      const res = await fetch(`/api/banners?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast({ title: 'Berhasil', description: 'Banner berhasil dihapus' });
        fetchData();
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Gagal', description: 'Terjadi kesalahan' });
    }
  };

  const resetForm = () => {
    setForm({ title: '', subtitle: '', imageUrl: '', link: '', order: 0, isActive: true });
    setEditingBanner(null);
  };

  const openEditDialog = (item: Banner) => {
    setEditingBanner(item);
    setForm({
      title: item.title,
      subtitle: item.subtitle || '',
      imageUrl: item.imageUrl,
      link: item.link || '',
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
                  Tambah Banner
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{editingBanner ? 'Edit Banner' : 'Tambah Banner Baru'}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div>
                    <Label>Judul *</Label>
                    <Input
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      placeholder="Judul banner"
                    />
                  </div>
                  <div>
                    <Label>Subtitle</Label>
                    <Textarea
                      value={form.subtitle}
                      onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                      placeholder="Subtitle banner..."
                      rows={2}
                    />
                  </div>
                  <div>
                    <Label>URL Gambar *</Label>
                    <Input
                      value={form.imageUrl}
                      onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                      placeholder="https://..."
                    />
                    {form.imageUrl && (
                      <div className="mt-2 relative h-32 rounded-lg overflow-hidden bg-gray-100">
                        <img
                          src={form.imageUrl}
                          alt="Preview"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/images/placeholder.jpg';
                          }}
                        />
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Link</Label>
                      <Input
                        value={form.link}
                        onChange={(e) => setForm({ ...form, link: e.target.value })}
                        placeholder="/halaman atau https://..."
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

      {/* Banners Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {banners.map((banner) => (
          <Card key={banner.id} className="overflow-hidden">
            <div className="relative h-40 bg-gray-100">
              <img
                src={banner.imageUrl}
                alt={banner.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/images/placeholder.jpg';
                }}
              />
              <div className="absolute top-2 right-2">
                <Badge className={banner.isActive ? 'bg-green-500' : 'bg-gray-500'}>
                  {banner.isActive ? 'Aktif' : 'Nonaktif'}
                </Badge>
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                <p className="font-bold text-white">{banner.title}</p>
                {banner.subtitle && (
                  <p className="text-sm text-gray-200 line-clamp-1">{banner.subtitle}</p>
                )}
              </div>
            </div>
            <CardContent className="p-4">
              <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                <span>Urutan: {banner.order}</span>
                {banner.link && (
                  <a href={banner.link} target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline flex items-center gap-1">
                    <ExternalLink className="h-4 w-4" />
                    Link
                  </a>
                )}
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => openEditDialog(banner)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleDelete(banner.id)}>
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {banners.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center text-gray-500">
            <Image className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            Belum ada banner. Klik "Tambah Banner" untuk menambahkan.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
