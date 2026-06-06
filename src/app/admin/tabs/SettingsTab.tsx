'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { 
  Loader2, 
  Save, 
  Building2, 
  Phone, 
  Mail, 
  Clock, 
  MapPin, 
  Upload, 
  Trash2,
  Image as ImageIcon,
  Eye,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface SiteSettings {
  site_name: string;
  site_description: string;
  address: string;
  phone: string;
  email: string;
  working_hours: string;
  site_logo: string;
  site_favicon: string;
}

export default function SettingsTab() {
  const [settings, setSettings] = useState<SiteSettings>({
    site_name: '',
    site_description: '',
    address: '',
    phone: '',
    email: '',
    working_hours: '',
    site_logo: '',
    site_favicon: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewLogo, setPreviewLogo] = useState('');
  const [logoDialogOpen, setLogoDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      setSettings({
        site_name: data.site_name || '',
        site_description: data.site_description || '',
        address: data.address || '',
        phone: data.phone || '',
        email: data.email || '',
        working_hours: data.working_hours || '',
        site_logo: data.site_logo || '',
        site_favicon: data.site_favicon || '',
      });
      setPreviewLogo(data.site_logo || '');
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        toast({ title: 'Berhasil', description: 'Pengaturan berhasil disimpan' });
      } else {
        throw new Error('Failed to save');
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Gagal', description: 'Terjadi kesalahan' });
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({ variant: 'destructive', title: 'Error', description: 'File harus berupa gambar' });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({ variant: 'destructive', title: 'Error', description: 'Ukuran file maksimal 2MB' });
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'logo');

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setSettings(prev => ({ ...prev, site_logo: data.url }));
        setPreviewLogo(data.url);
        toast({ title: 'Berhasil', description: 'Logo berhasil diupload' });
        setLogoDialogOpen(false);
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Gagal', description: 'Gagal mengupload logo' });
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveLogo = () => {
    setSettings(prev => ({ ...prev, site_logo: '' }));
    setPreviewLogo('');
    toast({ title: 'Berhasil', description: 'Logo berhasil dihapus' });
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
      {/* Logo & Branding */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-emerald-600" />
            Logo & Branding
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row items-start gap-6">
            {/* Current Logo Preview */}
            <div className="flex flex-col items-center gap-3">
              <div className="w-32 h-32 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden">
                {previewLogo ? (
                  <img 
                    src={previewLogo} 
                    alt="Site Logo" 
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="text-center p-2">
                    <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-xs text-gray-400">No Logo</p>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Dialog open={logoDialogOpen} onOpenChange={setLogoDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Upload className="h-4 w-4 mr-1" />
                      Upload
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Upload Logo</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          className="hidden"
                          id="logo-upload"
                        />
                        <label
                          htmlFor="logo-upload"
                          className="cursor-pointer"
                        >
                          <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-sm text-gray-600 mb-2">
                            Klik untuk upload atau drag & drop
                          </p>
                          <p className="text-xs text-gray-400">
                            PNG, JPG, SVG (max 2MB)
                          </p>
                        </label>
                      </div>
                      {uploading && (
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-sm">Uploading...</span>
                        </div>
                      )}
                      <div className="text-sm text-gray-500">
                        <p className="font-medium mb-1">Tips:</p>
                        <ul className="list-disc list-inside space-y-1 text-xs">
                          <li>Gunakan format PNG dengan background transparan</li>
                          <li>Ukuran ideal: 200x200 pixel hingga 500x500 pixel</li>
                          <li>Format persegi akan terlihat lebih baik</li>
                        </ul>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
                {previewLogo && (
                  <>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => window.open(previewLogo, '_blank')}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Lihat
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleRemoveLogo}
                      className="text-red-500 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Hapus
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Logo URL Input */}
            <div className="flex-1 space-y-4">
              <div>
                <Label>URL Logo</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    value={settings.site_logo}
                    onChange={(e) => {
                      setSettings({ ...settings, site_logo: e.target.value });
                      setPreviewLogo(e.target.value);
                    }}
                    placeholder="https://... atau /images/logo.png"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Masukkan URL logo atau upload file baru
                </p>
              </div>
              
              <div>
                <Label>URL Favicon</Label>
                <Input
                  value={settings.site_favicon}
                  onChange={(e) => setSettings({ ...settings, site_favicon: e.target.value })}
                  placeholder="/favicon.ico"
                />
                <p className="text-xs text-gray-500 mt-1">
                  File favicon (format .ico, .png, atau .svg)
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Site Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-emerald-600" />
            Informasi Situs
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Nama Situs</Label>
              <Input
                value={settings.site_name}
                onChange={(e) => setSettings({ ...settings, site_name: e.target.value })}
                placeholder="BKAD Kabupaten Seruyan"
              />
            </div>
            <div>
              <Label>Deskripsi Situs</Label>
              <Input
                value={settings.site_description}
                onChange={(e) => setSettings({ ...settings, site_description: e.target.value })}
                placeholder="Portal Resmi Badan Keuangan..."
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5 text-emerald-600" />
            Informasi Kontak
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Alamat
            </Label>
            <Textarea
              value={settings.address}
              onChange={(e) => setSettings({ ...settings, address: e.target.value })}
              placeholder="Jl. S. Parman No. 1, Kuala Pembuang..."
              rows={2}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Telepon
              </Label>
              <Input
                value={settings.phone}
                onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                placeholder="(0513) 123456"
              />
            </div>
            <div>
              <Label className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email
              </Label>
              <Input
                type="email"
                value={settings.email}
                onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                placeholder="bkad@seruyankab.go.id"
              />
            </div>
          </div>
          <div>
            <Label className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Jam Kerja
            </Label>
            <Input
              value={settings.working_hours}
              onChange={(e) => setSettings({ ...settings, working_hours: e.target.value })}
              placeholder="Senin - Kamis: 07.30 - 16.00 WIB, Jumat: 07.30 - 16.30 WIB"
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSubmit}
          disabled={saving}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Menyimpan...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Simpan Pengaturan
            </>
          )
          }
        </Button>
      </div>
    </div>
  );
}
