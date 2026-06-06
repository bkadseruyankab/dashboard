'use client';

import { useState, useEffect, useRef } from 'react';
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
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  FileText,
  Building2,
  BarChart3,
  Receipt,
  CreditCard,
  MessageSquare,
  Settings,
  ExternalLink,
  Upload,
  X,
  Image as ImageIcon,
  File,
  GripVertical,
  Eye,
  Download,
  Paperclip,
} from 'lucide-react';

interface ServiceFile {
  id?: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize?: number;
  description?: string;
  order: number;
}

interface Service {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  icon: string | null;
  link: string | null;
  content: string | null;
  order: number;
  isActive: boolean;
  files?: ServiceFile[];
}

const iconOptions = [
  { value: 'file-text', label: 'File Text', icon: FileText },
  { value: 'building-2', label: 'Building', icon: Building2 },
  { value: 'bar-chart-3', label: 'Chart', icon: BarChart3 },
  { value: 'receipt', label: 'Receipt', icon: Receipt },
  { value: 'credit-card', label: 'Credit Card', icon: CreditCard },
  { value: 'message-square', label: 'Message', icon: MessageSquare },
  { value: 'settings', label: 'Settings', icon: Settings },
];

export default function ServicesTab() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [viewingFiles, setViewingFiles] = useState<Service | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const [form, setForm] = useState({
    title: '',
    slug: '',
    description: '',
    icon: 'file-text',
    link: '',
    content: '',
    order: 0,
    isActive: true,
  });

  const [files, setFiles] = useState<ServiceFile[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/services?all=true');
      const data = await res.json();
      // Ensure data is an array before setting
      if (Array.isArray(data)) {
        setServices(data);
      } else {
        console.error('API returned non-array:', data);
        setServices([]);
      }
    } catch (error) {
      console.error('Error fetching services:', error);
      setServices([]);
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

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
  };

  const getFileIcon = (fileType: string) => {
    if (fileType === 'image') return ImageIcon;
    return File;
  };

  // Handle file selection
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    setUploading(true);
    try {
      const uploadedFiles: ServiceFile[] = [];

      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', 'services');
        formData.append('category', 'all');

        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (res.ok) {
          const data = await res.json();
          uploadedFiles.push({
            fileName: data.originalName,
            fileUrl: data.url,
            fileType: data.fileType,
            fileSize: data.size,
            order: files.length + uploadedFiles.length,
          });
        }
      }

      setFiles([...files, ...uploadedFiles]);
      toast({
        title: 'Berhasil',
        description: `${uploadedFiles.length} file berhasil diupload`,
      });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Gagal', description: 'Gagal mengupload file' });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Remove file from list
  const handleRemoveFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  // Move file order
  const moveFile = (index: number, direction: 'up' | 'down') => {
    const newFiles = [...files];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= newFiles.length) return;
    [newFiles[index], newFiles[newIndex]] = [newFiles[newIndex], newFiles[index]];
    setFiles(newFiles.map((f, i) => ({ ...f, order: i })));
  };

  const handleSubmit = async () => {
    if (!form.title) {
      toast({ variant: 'destructive', title: 'Error', description: 'Judul wajib diisi' });
      return;
    }

    setSaving(true);
    try {
      const url = '/api/services';
      const method = editingService ? 'PUT' : 'POST';
      const body = editingService 
        ? { id: editingService.id, ...form, files } 
        : { ...form, files };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        toast({
          title: 'Berhasil',
          description: editingService ? 'Layanan berhasil diperbarui' : 'Layanan berhasil ditambahkan',
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
    if (!confirm('Yakin ingin menghapus layanan ini? Semua file terkait juga akan dihapus.')) return;
    try {
      const res = await fetch(`/api/services?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast({ title: 'Berhasil', description: 'Layanan berhasil dihapus' });
        fetchData();
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Gagal', description: 'Terjadi kesalahan' });
    }
  };

  const resetForm = () => {
    setForm({ title: '', slug: '', description: '', icon: 'file-text', link: '', content: '', order: 0, isActive: true });
    setFiles([]);
    setEditingService(null);
  };

  const openEditDialog = (item: Service) => {
    setEditingService(item);
    setForm({
      title: item.title,
      slug: item.slug,
      description: item.description || '',
      icon: item.icon || 'file-text',
      link: item.link || '',
      content: item.content || '',
      order: item.order,
      isActive: item.isActive,
    });
    setFiles(item.files || []);
    setDialogOpen(true);
  };

  const getIconComponent = (iconName: string) => {
    const icon = iconOptions.find((i) => i.value === iconName);
    return icon?.icon || FileText;
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
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Daftar Layanan</h3>
              <p className="text-sm text-gray-500">Kelola layanan dan file terkait</p>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm} className="bg-emerald-600 hover:bg-emerald-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Tambah Layanan
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingService ? 'Edit Layanan' : 'Tambah Layanan Baru'}</DialogTitle>
                </DialogHeader>
                <div className="space-y-6 pt-4">
                  {/* Service Info */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-sm text-gray-700 border-b pb-2">Informasi Layanan</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Judul *</Label>
                        <Input
                          value={form.title}
                          onChange={(e) => setForm({ ...form, title: e.target.value, slug: generateSlug(e.target.value) })}
                          placeholder="Nama layanan"
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
                        placeholder="Deskripsi layanan..."
                        rows={2}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Ikon</Label>
                        <Select value={form.icon} onValueChange={(v) => setForm({ ...form, icon: v })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {iconOptions.map((opt) => {
                              const Icon = opt.icon;
                              return (
                                <SelectItem key={opt.value} value={opt.value}>
                                  <div className="flex items-center gap-2">
                                    <Icon className="h-4 w-4" />
                                    {opt.label}
                                  </div>
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
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
                    <div>
                      <Label>Link</Label>
                      <Input
                        value={form.link}
                        onChange={(e) => setForm({ ...form, link: e.target.value })}
                        placeholder="/layanan/nama atau https://..."
                      />
                    </div>
                    <div>
                      <Label>Konten (opsional)</Label>
                      <Textarea
                        value={form.content}
                        onChange={(e) => setForm({ ...form, content: e.target.value })}
                        placeholder="Konten detail layanan..."
                        rows={4}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={form.isActive}
                        onCheckedChange={(v) => setForm({ ...form, isActive: v })}
                      />
                      <Label>Aktif</Label>
                    </div>
                  </div>

                  {/* File Upload Section */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-sm text-gray-700 border-b pb-2">
                      File & Dokumen
                      <span className="text-xs text-gray-500 ml-2 font-normal">
                        (Gambar, PDF, Dokumen)
                      </span>
                    </h4>

                    {/* Upload Area */}
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-emerald-500 transition-colors">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        multiple
                        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                        className="hidden"
                      />
                      <Upload className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600 mb-2">Drag & drop atau klik untuk upload</p>
                      <p className="text-xs text-gray-500 mb-4">
                        Format: JPG, PNG, GIF, PDF, DOC, XLS, TXT (Max 10MB per file)
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                      >
                        {uploading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Mengupload...
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4 mr-2" />
                            Pilih File
                          </>
                        )}
                      </Button>
                    </div>

                    {/* Uploaded Files List */}
                    {files.length > 0 && (
                      <div className="space-y-2">
                        <Label>File Terupload ({files.length})</Label>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {files.map((file, index) => {
                            const FileIcon = getFileIcon(file.fileType);
                            return (
                              <div
                                key={index}
                                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border group"
                              >
                                <GripVertical className="h-4 w-4 text-gray-400 cursor-move" />
                                <div className="bg-gray-200 p-2 rounded">
                                  <FileIcon className="h-5 w-5 text-gray-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">{file.fileName}</p>
                                  <p className="text-xs text-gray-500">
                                    {file.fileType.toUpperCase()} • {formatFileSize(file.fileSize)}
                                  </p>
                                </div>
                                <div className="flex items-center gap-1">
                                  {index > 0 && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() => moveFile(index, 'up')}
                                    >
                                      ↑
                                    </Button>
                                  )}
                                  {index < files.length - 1 && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() => moveFile(index, 'down')}
                                    >
                                      ↓
                                    </Button>
                                  )}
                                  <a
                                    href={file.fileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 hover:bg-gray-200 rounded"
                                  >
                                    <Eye className="h-4 w-4 text-gray-600" />
                                  </a>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-red-500 hover:text-red-700"
                                    onClick={() => handleRemoveFile(index)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end gap-2 pt-4 border-t">
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

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map((service) => {
          const Icon = getIconComponent(service.icon || 'file-text');
          return (
            <Card key={service.id} className={`overflow-hidden ${!service.isActive ? 'opacity-60' : ''}`}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="bg-emerald-100 p-3 rounded-lg">
                    <Icon className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-bold truncate">{service.title}</h3>
                      <Badge className={service.isActive ? 'bg-green-500' : 'bg-gray-400'}>
                        {service.isActive ? 'Aktif' : 'Nonaktif'}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2 mb-2">{service.description}</p>
                    
                    {/* Files indicator */}
                    {service.files && service.files.length > 0 && (
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-xs">
                          <Paperclip className="h-3 w-3 mr-1" />
                          {service.files.length} file
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-xs"
                          onClick={() => setViewingFiles(service)}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          Lihat
                        </Button>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Urutan: {service.order}</span>
                      <div className="flex gap-1">
                        {service.link && (
                          <Button variant="ghost" size="icon" asChild>
                            <a href={service.link} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(service)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(service.id)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {services.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center text-gray-500">
            Belum ada layanan. Klik "Tambah Layanan" untuk menambahkan.
          </CardContent>
        </Card>
      )}

      {/* View Files Dialog */}
      <Dialog open={!!viewingFiles} onOpenChange={() => setViewingFiles(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>File Layanan: {viewingFiles?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            {viewingFiles?.files && viewingFiles.files.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {viewingFiles.files.map((file) => {
                  const FileIcon = getFileIcon(file.fileType);
                  return (
                    <div key={file.id || file.fileUrl} className="border rounded-lg overflow-hidden">
                      {file.fileType === 'image' ? (
                        <img
                          src={file.fileUrl}
                          alt={file.fileName}
                          className="w-full h-32 object-cover"
                        />
                      ) : (
                        <div className="w-full h-32 bg-gray-100 flex items-center justify-center">
                          <FileIcon className="h-12 w-12 text-gray-400" />
                        </div>
                      )}
                      <div className="p-3">
                        <p className="text-sm font-medium truncate">{file.fileName}</p>
                        <p className="text-xs text-gray-500 mb-2">
                          {formatFileSize(file.fileSize)}
                        </p>
                        <a
                          href={file.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-xs text-emerald-600 hover:underline"
                        >
                          <Download className="h-3 w-3 mr-1" />
                          Download/Buka
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">Tidak ada file</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
