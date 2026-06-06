'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, Loader2, Image, Calendar, Eye } from 'lucide-react';

interface Gallery {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string;
  category: string | null;
  eventDate: string | null;
  isActive: boolean;
}

const galleryCategories = [
  { value: 'kegiatan', label: 'Kegiatan' },
  { value: 'event', label: 'Event' },
  { value: 'rapat', label: 'Rapat' },
  { value: 'pelatihan', label: 'Pelatihan' },
  { value: 'lainnya', label: 'Lainnya' },
];

export default function GalleryTab() {
  const [gallery, setGallery] = useState<Gallery[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Gallery | null>(null);
  const { toast } = useToast();

  const [form, setForm] = useState({
    title: '',
    description: '',
    imageUrl: '',
    category: '',
    eventDate: '',
    isActive: true,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/gallery?limit=100');
      const data = await res.json();
      setGallery(data);
    } catch (error) {
      console.error('Error fetching gallery:', error);
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
      const url = editingItem ? '/api/gallery' : '/api/gallery';
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
          description: editingItem ? 'Galeri berhasil diperbarui' : 'Galeri berhasil ditambahkan',
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
    if (!confirm('Yakin ingin menghapus gambar ini?')) return;
    try {
      const res = await fetch(`/api/gallery?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast({ title: 'Berhasil', description: 'Gambar berhasil dihapus' });
        fetchData();
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Gagal', description: 'Terjadi kesalahan' });
    }
  };

  const resetForm = () => {
    setForm({ title: '', description: '', imageUrl: '', category: '', eventDate: '', isActive: true });
    setEditingItem(null);
  };

  const openEditDialog = (item: Gallery) => {
    setEditingItem(item);
    setForm({
      title: item.title,
      description: item.description || '',
      imageUrl: item.imageUrl,
      category: item.category || '',
      eventDate: item.eventDate ? item.eventDate.split('T')[0] : '',
      isActive: item.isActive,
    });
    setDialogOpen(true);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
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
                  Tambah Gambar
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{editingItem ? 'Edit Gambar' : 'Tambah Gambar Baru'}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div>
                    <Label>Judul *</Label>
                    <Input
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      placeholder="Judul gambar"
                    />
                  </div>
                  <div>
                    <Label>Deskripsi</Label>
                    <Textarea
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      placeholder="Deskripsi gambar..."
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
                      <div className="mt-2 relative h-40 rounded-lg overflow-hidden bg-gray-100">
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
                      <Label>Kategori</Label>
                      <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih kategori" />
                        </SelectTrigger>
                        <SelectContent>
                          {galleryCategories.map((cat) => (
                            <SelectItem key={cat.value} value={cat.value}>
                              {cat.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Tanggal Event</Label>
                      <Input
                        type="date"
                        value={form.eventDate}
                        onChange={(e) => setForm({ ...form, eventDate: e.target.value })}
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

      {/* Gallery Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {gallery.map((item) => (
          <Card key={item.id} className={`overflow-hidden group ${!item.isActive ? 'opacity-60' : ''}`}>
            <div className="relative aspect-square">
              <img
                src={item.imageUrl}
                alt={item.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/images/placeholder.jpg';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                  <p className="font-medium text-sm line-clamp-1">{item.title}</p>
                </div>
              </div>
              <div className="absolute top-2 right-2">
                <Badge className={item.isActive ? 'bg-green-500' : 'bg-gray-500'} variant="secondary">
                  {item.isActive ? 'Aktif' : 'Nonaktif'}
                </Badge>
              </div>
            </div>
            <CardContent className="p-3">
              <p className="font-medium text-sm truncate">{item.title}</p>
              <div className="flex items-center justify-between mt-1 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDate(item.eventDate)}
                </span>
                <Badge variant="outline" className="text-xs">
                  {galleryCategories.find((c) => c.value === item.category)?.label || item.category}
                </Badge>
              </div>
              <div className="flex justify-end gap-1 mt-2">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(item)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(item.id)}>
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {gallery.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center text-gray-500">
            <Image className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            Belum ada gambar. Klik "Tambah Gambar" untuk menambahkan.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
