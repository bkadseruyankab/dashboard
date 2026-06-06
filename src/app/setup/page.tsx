'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Building2, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

export default function SetupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    name: 'Administrator',
    email: '',
    password: '',
    confirmPassword: '',
  });

  useEffect(() => {
    checkInitialization();
  }, []);

  const checkInitialization = async () => {
    try {
      const res = await fetch('/api/init');
      const data = await res.json();
      setInitialized(data.initialized);
      if (data.initialized) {
        router.push('/admin');
      }
    } catch (err) {
      console.error('Error checking initialization:', err);
    } finally {
      setChecking(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.email) {
      setError('Email harus diisi');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Password tidak cocok');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password minimal 6 karakter');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Gagal membuat akun');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/admin');
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-emerald-100">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-emerald-600 mx-auto" />
          <p className="mt-4 text-gray-600">Memeriksa sistem...</p>
        </div>
      </div>
    );
  }

  if (initialized) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-emerald-100 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-emerald-600 rounded-lg p-3">
              <Building2 className="h-10 w-10 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl">Inisialisasi Sistem</CardTitle>
          <CardDescription>
            Buat akun administrator untuk pertama kali
          </CardDescription>
        </CardHeader>

        {success ? (
          <CardContent className="text-center py-8">
            <CheckCircle className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Akun Berhasil Dibuat!</h3>
            <p className="text-gray-600">Anda akan diarahkan ke halaman login...</p>
          </CardContent>
        ) : (
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="name">Nama Lengkap</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nama administrator"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="admin@example.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Minimal 6 karakter"
                  required
                  minLength={6}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Konfirmasi Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="Ulangi password"
                  required
                />
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
                <p className="font-medium mb-1">Catatan Penting:</p>
                <ul className="list-disc list-inside space-y-1 text-amber-700">
                  <li>Simpan credential ini dengan aman</li>
                  <li>Password akan di-hash secara otomatis</li>
                  <li>Anda dapat mengubahnya setelah login</li>
                </ul>
              </div>
            </CardContent>

            <CardFooter>
              <Button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  'Buat Akun Administrator'
                )}
              </Button>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  );
}
