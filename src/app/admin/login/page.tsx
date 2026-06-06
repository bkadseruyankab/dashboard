'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Building2, Lock, Mail } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    // Check if system is initialized
    const checkInit = async () => {
      try {
        const res = await fetch('/api/init');
        const data = await res.json();
        if (!data.initialized) {
          router.push('/setup');
        }
      } catch (error) {
        console.error('Error checking initialization:', error);
      } finally {
        setChecking(false);
      }
    };
    checkInit();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        toast({
          variant: 'destructive',
          title: 'Login Gagal',
          description: 'Email atau password salah',
        });
      } else {
        toast({
          title: 'Login Berhasil',
          description: 'Selamat datang di Panel Admin BKAD',
        });
        router.push('/admin');
        router.refresh();
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Terjadi kesalahan sistem',
      });
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-600 to-emerald-800">
        <Loader2 className="h-12 w-12 animate-spin text-white" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-600 to-emerald-800 p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center bg-white rounded-full p-4 shadow-lg mb-4">
            <Building2 className="h-12 w-12 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-white">BKAD Seruyan</h1>
          <p className="text-emerald-200 text-sm">Panel Administrator</p>
        </div>

        {/* Login Box */}
        <div className="bg-white rounded-lg shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-emerald-700 px-6 py-4">
            <h2 className="text-white text-lg font-semibold text-center">
              Masuk untuk memulai sesi Anda
            </h2>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700 font-medium">
                Email
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  id="email"
                  type="email"
                  placeholder="Masukkan email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700 font-medium">
                Password
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="Masukkan password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 h-12 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                  required
                />
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                />
                <span className="text-sm text-gray-600">Ingat saya</span>
              </label>
              <a href="#" className="text-sm text-emerald-600 hover:text-emerald-700">
                Lupa password?
              </a>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Memproses...
                </>
              ) : (
                'Masuk'
              )}
            </Button>
          </form>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t">
            <p className="text-center text-sm text-gray-600">
              Kembali ke{' '}
              <Link href="/" className="text-emerald-600 hover:text-emerald-700 font-medium">
                Portal Utama
              </Link>
            </p>
          </div>
        </div>

        {/* Copyright */}
        <p className="text-center text-emerald-200 text-sm mt-6">
          © 2024 BKAD Kabupaten Seruyan
        </p>
      </div>
    </div>
  );
}
