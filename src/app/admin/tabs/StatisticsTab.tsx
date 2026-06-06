'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  BarChart3,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Users,
  DollarSign,
  Building2,
  Briefcase,
  FileText,
  Calendar,
  Eye,
  TrendingUp,
  Award,
  Target,
} from 'lucide-react';

interface Statistic {
  id: string;
  label: string;
  value: number;
  icon: string;
  description: string | null;
  order: number;
  updatedAt: string;
}

const iconOptions = [
  { value: 'Users', label: 'Users', icon: Users },
  { value: 'DollarSign', label: 'Dollar Sign', icon: DollarSign },
  { value: 'Building2', label: 'Building', icon: Building2 },
  { value: 'Briefcase', label: 'Briefcase', icon: Briefcase },
  { value: 'FileText', label: 'File Text', icon: FileText },
  { value: 'Calendar', label: 'Calendar', icon: Calendar },
  { value: 'Eye', label: 'Eye', icon: Eye },
  { value: 'TrendingUp', label: 'Trending Up', icon: TrendingUp },
  { value: 'Award', label: 'Award', icon: Award },
  { value: 'Target', label: 'Target', icon: Target },
  { value: 'BarChart3', label: 'Bar Chart', icon: BarChart3 },
];

const iconMap: Record<string, React.ElementType> = {
  Users,
  DollarSign,
  Building2,
  Briefcase,
  FileText,
  Calendar,
  Eye,
  TrendingUp,
  Award,
  Target,
  BarChart3,
};

const iconColors: Record<string, string> = {
  Users: 'bg-blue-500',
  DollarSign: 'bg-green-500',
  Building2: 'bg-purple-500',
  Briefcase: 'bg-amber-500',
  FileText: 'bg-red-500',
  Calendar: 'bg-pink-500',
  Eye: 'bg-cyan-500',
  TrendingUp: 'bg-emerald-500',
  Award: 'bg-yellow-500',
  Target: 'bg-indigo-500',
  BarChart3: 'bg-gray-500',
};

export default function StatisticsTab() {
  const [statistics, setStatistics] = useState<Statistic[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedStatistic, setSelectedStatistic] = useState<Statistic | null>(null);
  const { toast } = useToast();

  const [form, setForm] = useState({
    label: '',
    value: 0,
    icon: 'BarChart3',
    description: '',
    order: 0,
  });

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      const res = await fetch('/api/statistics');
      const data = await res.json();
      setStatistics(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching statistics:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Gagal memuat data statistik',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (statistic?: Statistic) => {
    if (statistic) {
      setSelectedStatistic(statistic);
      setForm({
        label: statistic.label,
        value: statistic.value,
        icon: statistic.icon,
        description: statistic.description || '',
        order: statistic.order,
      });
    } else {
      setSelectedStatistic(null);
      setForm({
        label: '',
        value: 0,
        icon: 'BarChart3',
        description: '',
        order: statistics.length + 1,
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedStatistic(null);
    setForm({
      label: '',
      value: 0,
      icon: 'BarChart3',
      description: '',
      order: 0,
    });
  };

  const handleSubmit = async () => {
    if (!form.label) {
      toast({ variant: 'destructive', title: 'Error', description: 'Label harus diisi' });
      return;
    }

    setSaving(true);
    try {
      if (selectedStatistic) {
        // Update
        const res = await fetch('/api/statistics', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: selectedStatistic.id,
            ...form,
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Gagal mengupdate statistik');
        }

        toast({ title: 'Berhasil', description: 'Statistik berhasil diperbarui' });
      } else {
        // Create
        const res = await fetch('/api/statistics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Gagal membuat statistik');
        }

        toast({ title: 'Berhasil', description: 'Statistik berhasil ditambahkan' });
      }

      handleCloseDialog();
      fetchStatistics();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Gagal',
        description: error instanceof Error ? error.message : 'Terjadi kesalahan',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleOpenDeleteDialog = (statistic: Statistic) => {
    setSelectedStatistic(statistic);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedStatistic) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/statistics?id=${selectedStatistic.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Gagal menghapus statistik');
      }

      toast({ title: 'Berhasil', description: 'Statistik berhasil dihapus' });
      setDeleteDialogOpen(false);
      fetchStatistics();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Gagal',
        description: error instanceof Error ? error.message : 'Terjadi kesalahan',
      });
    } finally {
      setSaving(false);
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('id-ID').format(num);
  };

  const getIconComponent = (iconName: string) => {
    return iconMap[iconName] || BarChart3;
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
            <BarChart3 className="h-6 w-6 text-emerald-600" />
            Statistik
          </h2>
          <p className="text-gray-600 mt-1">Kelola data statistik yang ditampilkan di halaman utama</p>
        </div>
        <Button
          onClick={() => handleOpenDialog()}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Tambah Statistik
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statistics.map((stat) => {
          const IconComponent = getIconComponent(stat.icon);
          const colorClass = iconColors[stat.icon] || 'bg-gray-500';

          return (
            <Card key={stat.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <CardContent className="p-0">
                <div className="flex items-center">
                  <div className={`${colorClass} p-4`}>
                    <IconComponent className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1 p-3">
                    <p className="text-gray-500 text-xs">{stat.label}</p>
                    <p className="text-xl font-bold">{formatNumber(stat.value)}</p>
                    {stat.description && (
                      <p className="text-xs text-gray-400 mt-1">{stat.description}</p>
                    )}
                  </div>
                </div>
              </CardContent>
              <div className="border-t px-3 py-2 bg-gray-50 flex justify-end gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleOpenDialog(stat)}
                >
                  <Pencil className="h-4 w-4 text-blue-600" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleOpenDeleteDialog(stat)}
                >
                  <Trash2 className="h-4 w-4 text-red-600" />
                </Button>
              </div>
            </Card>
          );
        })}

        {statistics.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-500">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>Belum ada data statistik</p>
            <p className="text-sm">Klik tombol "Tambah Statistik" untuk menambahkan</p>
          </div>
        )}
      </div>

      {/* Statistics Table */}
      {statistics.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Daftar Statistik</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Urutan</th>
                    <th className="text-left py-3 px-4">Label</th>
                    <th className="text-left py-3 px-4">Nilai</th>
                    <th className="text-left py-3 px-4">Deskripsi</th>
                    <th className="text-right py-3 px-4">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {statistics.map((stat) => (
                    <tr key={stat.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <span className="bg-gray-100 px-2 py-1 rounded text-xs font-medium">
                          {stat.order}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className={`${iconColors[stat.icon] || 'bg-gray-500'} p-1.5 rounded`}>
                            {(() => {
                              const Icon = getIconComponent(stat.icon);
                              return <Icon className="h-4 w-4 text-white" />;
                            })()}
                          </div>
                          {stat.label}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-semibold">{formatNumber(stat.value)}</td>
                      <td className="py-3 px-4 text-gray-500">{stat.description || '-'}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenDialog(stat)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenDeleteDialog(stat)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Form Dialog */}
      <Dialog open={dialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedStatistic ? 'Edit Statistik' : 'Tambah Statistik Baru'}
            </DialogTitle>
            <DialogDescription>
              {selectedStatistic
                ? 'Perbarui data statistik'
                : 'Tambahkan data statistik baru yang akan ditampilkan di halaman utama'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="label">Label *</Label>
              <Input
                id="label"
                value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
                placeholder="contoh: Jumlah Penduduk"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="value">Nilai *</Label>
              <Input
                id="value"
                type="number"
                value={form.value}
                onChange={(e) => setForm({ ...form, value: parseInt(e.target.value) || 0 })}
                placeholder="contoh: 150000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="icon">Ikon</Label>
              <Select
                value={form.icon}
                onValueChange={(value) => setForm({ ...form, icon: value })}
              >
                <SelectTrigger>
                  <SelectValue>
                    <div className="flex items-center gap-2">
                      {(() => {
                        const Icon = getIconComponent(form.icon);
                        return <Icon className="h-4 w-4" />;
                      })()}
                      {iconOptions.find((i) => i.value === form.icon)?.label || form.icon}
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {iconOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <option.icon className="h-4 w-4" />
                        {option.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Deskripsi</Label>
              <Input
                id="description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="contoh: Total penduduk Kabupaten Seruyan"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="order">Urutan</Label>
              <Input
                id="order"
                type="number"
                value={form.order}
                onChange={(e) => setForm({ ...form, order: parseInt(e.target.value) || 0 })}
                placeholder="1"
              />
              <p className="text-xs text-gray-500">Urutan tampil di halaman depan (1 = pertama)</p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Batal
            </Button>
            <Button
              onClick={handleSubmit}
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Statistik?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus statistik <strong>{selectedStatistic?.label}</strong>?
              Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
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
