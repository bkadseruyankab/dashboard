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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  Loader2,
  Search,
  Calendar,
  ExternalLink,
} from 'lucide-react';

interface News {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  thumbnail: string | null;
  categoryId: string | null;
  category: { id: string; name: string; color: string } | null;
  isFeatured: boolean;
  isPublished: boolean;
  viewCount: number;
  publishedAt: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  color: string | null;
}

export default function NewsTab() {
  const [news, setNews] = useState<News[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingNews, setEditingNews] = useState<News | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  const [form, setForm] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    thumbnail: '',
    categoryId: '',
    isFeatured: false,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [newsRes, categoriesRes] = await Promise.all([
        fetch('/api/news?limit=100'),
        fetch('/api/categories'),
      ]);
      const newsData = await newsRes.json();
      const categoriesData = await categoriesRes.json();
      setNews(newsData.data || []);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleSubmit = async () => {
    if (!form.title || !form.content) {
      toast({ variant: 'destructive', title: 'Error', description: 'Judul dan konten wajib diisi' });
      return;
    }

    setSaving(true);
    try {
      const url = editingNews ? '/api/news' : '/api/news';
      const method = editingNews ? 'PUT' : 'POST';
      const body = editingNews
        ? { id: editingNews.id, ...form }
        : { ...form, authorId: 'admin' };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        toast({
          title: 'Berhasil',
          description: editingNews ? 'Berita berhasil diperbarui' : 'Berita berhasil ditambahkan',
        });
        setDialogOpen(false);
        resetForm();
        fetchData();
      } else {
        const error = await res.json();
        throw new Error(error.error || 'Failed to save');
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Gagal', description: String(error) });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus berita ini?')) return;
    try {
      const res = await fetch(`/api/news?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast({ title: 'Berhasil', description: 'Berita berhasil dihapus' });
        fetchData();
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Gagal', description: 'Terjadi kesalahan' });
    }
  };

  const resetForm = () => {
    setForm({
      title: '',
      slug: '',
      excerpt: '',
      content: '',
      thumbnail: '',
      categoryId: '',
      isFeatured: false,
    });
    setEditingNews(null);
  };

  const openEditDialog = (item: News) => {
    setEditingNews(item);
    setForm({
      title: item.title,
      slug: item.slug,
      excerpt: item.excerpt || '',
      content: item.content,
      thumbnail: item.thumbnail || '',
      categoryId: item.categoryId || '',
      isFeatured: item.isFeatured,
    });
    setDialogOpen(true);
  };

  const filteredNews = news.filter((item) =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase())
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
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Cari berita..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm} className="bg-emerald-600 hover:bg-emerald-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Tambah Berita
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingNews ? 'Edit Berita' : 'Tambah Berita Baru'}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Judul *</Label>
                      <Input
                        value={form.title}
                        onChange={(e) => setForm({ ...form, title: e.target.value, slug: generateSlug(e.target.value) })}
                        placeholder="Judul berita"
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
                  </div>
                  <div>
                    <Label>Ringkasan</Label>
                    <Textarea
                      value={form.excerpt}
                      onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
                      placeholder="Ringkasan berita..."
                      rows={2}
                    />
                  </div>
                  <div>
                    <Label>Konten (HTML) *</Label>
                    <Textarea
                      value={form.content}
                      onChange={(e) => setForm({ ...form, content: e.target.value })}
                      placeholder="<p>Konten berita...</p>"
                      rows={8}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>URL Gambar</Label>
                      <Input
                        value={form.thumbnail}
                        onChange={(e) => setForm({ ...form, thumbnail: e.target.value })}
                        placeholder="https://..."
                      />
                    </div>
                    <div>
                      <Label>Kategori</Label>
                      <Select
                        value={form.categoryId}
                        onValueChange={(v) => setForm({ ...form, categoryId: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih kategori" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={form.isFeatured}
                      onCheckedChange={(v) => setForm({ ...form, isFeatured: v })}
                    />
                    <Label>Berita Utama (Featured)</Label>
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

      {/* News Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Berita ({filteredNews.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Judul</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Views</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredNews.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {item.isFeatured && (
                          <Badge className="bg-amber-500 text-xs">Utama</Badge>
                        )}
                        <div>
                          <p className="font-medium">{item.title}</p>
                          <p className="text-xs text-gray-500">{item.slug}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {item.category && (
                        <Badge style={{ backgroundColor: item.category.color || '#10b981' }}>
                          {item.category.name}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        {item.viewCount}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="h-4 w-4" />
                        {formatDate(item.publishedAt)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => window.open(`/?news=${item.slug}`, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(item)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(item.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredNews.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                      Tidak ada berita ditemukan
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
