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
import { useToast } from '@/hooks/use-toast';
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Download,
  FileText,
  FileSpreadsheet,
  ExternalLink,
  Calendar,
} from 'lucide-react';

interface Document {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  fileUrl: string;
  fileType: string;
  fileSize: number | null;
  category: string | null;
  downloadCount: number;
  publishedAt: string;
}

const documentCategories = [
  { value: 'anggaran', label: 'Anggaran' },
  { value: 'laporan', label: 'Laporan Keuangan' },
  { value: 'regulasi', label: 'Regulasi' },
  { value: 'formulir', label: 'Formulir' },
  { value: 'lainnya', label: 'Lainnya' },
];

const fileTypeIcons: Record<string, React.ElementType> = {
  pdf: FileText,
  xls: FileSpreadsheet,
  xlsx: FileSpreadsheet,
  doc: FileText,
  docx: FileText,
};

const fileTypeColors: Record<string, string> = {
  pdf: 'bg-red-500',
  xls: 'bg-green-500',
  xlsx: 'bg-green-500',
  doc: 'bg-blue-500',
  docx: 'bg-blue-500',
};

export default function DocumentsTab() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const { toast } = useToast();

  const [form, setForm] = useState({
    title: '',
    slug: '',
    description: '',
    fileUrl: '',
    fileType: 'pdf',
    fileSize: 0,
    category: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/documents?limit=100');
      const data = await res.json();
      setDocuments(data);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .trim();
  };

  const handleSubmit = async () => {
    if (!form.title || !form.fileUrl) {
      toast({ variant: 'destructive', title: 'Error', description: 'Judul dan URL file wajib diisi' });
      return;
    }

    setSaving(true);
    try {
      const url = editingDocument ? '/api/documents' : '/api/documents';
      const method = editingDocument ? 'PUT' : 'POST';
      const body = editingDocument
        ? { id: editingDocument.id, ...form }
        : { ...form, authorId: 'admin' };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        toast({
          title: 'Berhasil',
          description: editingDocument ? 'Dokumen berhasil diperbarui' : 'Dokumen berhasil ditambahkan',
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
    if (!confirm('Yakin ingin menghapus dokumen ini?')) return;
    try {
      const res = await fetch(`/api/documents?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast({ title: 'Berhasil', description: 'Dokumen berhasil dihapus' });
        fetchData();
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Gagal', description: 'Terjadi kesalahan' });
    }
  };

  const resetForm = () => {
    setForm({ title: '', slug: '', description: '', fileUrl: '', fileType: 'pdf', fileSize: 0, category: '' });
    setEditingDocument(null);
  };

  const openEditDialog = (item: Document) => {
    setEditingDocument(item);
    setForm({
      title: item.title,
      slug: item.slug,
      description: item.description || '',
      fileUrl: item.fileUrl,
      fileType: item.fileType,
      fileSize: item.fileSize || 0,
      category: item.category || '',
    });
    setDialogOpen(true);
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '-';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

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
          <div className="flex items-center justify-end">
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm} className="bg-emerald-600 hover:bg-emerald-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Tambah Dokumen
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{editingDocument ? 'Edit Dokumen' : 'Tambah Dokumen Baru'}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Judul *</Label>
                      <Input
                        value={form.title}
                        onChange={(e) => setForm({ ...form, title: e.target.value, slug: generateSlug(e.target.value) })}
                        placeholder="Judul dokumen"
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
                    <Label>Deskripsi</Label>
                    <Textarea
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      placeholder="Deskripsi dokumen..."
                      rows={2}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>URL File *</Label>
                      <Input
                        value={form.fileUrl}
                        onChange={(e) => setForm({ ...form, fileUrl: e.target.value })}
                        placeholder="https://... atau /documents/..."
                      />
                    </div>
                    <div>
                      <Label>Kategori</Label>
                      <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih kategori" />
                        </SelectTrigger>
                        <SelectContent>
                          {documentCategories.map((cat) => (
                            <SelectItem key={cat.value} value={cat.value}>
                              {cat.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Tipe File</Label>
                      <Select value={form.fileType} onValueChange={(v) => setForm({ ...form, fileType: v })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pdf">PDF</SelectItem>
                          <SelectItem value="xls">XLS</SelectItem>
                          <SelectItem value="xlsx">XLSX</SelectItem>
                          <SelectItem value="doc">DOC</SelectItem>
                          <SelectItem value="docx">DOCX</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Ukuran File (bytes)</Label>
                      <Input
                        type="number"
                        value={form.fileSize}
                        onChange={(e) => setForm({ ...form, fileSize: parseInt(e.target.value) || 0 })}
                        placeholder="0"
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

      {/* Documents Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Dokumen ({documents.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dokumen</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Unduhan</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((doc) => {
                  const Icon = fileTypeIcons[doc.fileType.toLowerCase()] || FileText;
                  const colorClass = fileTypeColors[doc.fileType.toLowerCase()] || 'bg-gray-500';
                  return (
                    <TableRow key={doc.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className={`${colorClass} p-2 rounded text-white`}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-medium">{doc.title}</p>
                            <p className="text-xs text-gray-500">
                              {doc.fileType.toUpperCase()} • {formatFileSize(doc.fileSize)}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {documentCategories.find((c) => c.value === doc.category)?.label || doc.category || '-'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Download className="h-4 w-4" />
                          {doc.downloadCount}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-4 w-4" />
                          {formatDate(doc.publishedAt)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" asChild>
                            <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => openEditDialog(doc)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(doc.id)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {documents.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                      Tidak ada dokumen
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
