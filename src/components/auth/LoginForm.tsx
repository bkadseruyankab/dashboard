"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { usePengaturan } from "@/context/PengaturanContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, Loader2, AlertCircle, Eye, EyeOff } from "lucide-react";

export default function LoginForm() {
  const { pengaturan, logoSrc } = usePengaturan();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Email dan password harus diisi");
      return;
    }

    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error);
      }
      // If successful, the session will update automatically
    } catch {
      setError("Terjadi kesalahan saat login. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-40 -right-40 w-80 h-80 rounded-full opacity-10"
          style={{ backgroundColor: pengaturan.warnaPrimary }}
        />
        <div
          className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full opacity-10"
          style={{ backgroundColor: pengaturan.warnaSecondary }}
        />
      </div>

      <Card className="w-full max-w-md relative shadow-xl border-0">
        {/* Header with government theme */}
        <CardHeader className="text-center pb-2">
          <div
            className="mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-4 shadow-lg"
            style={{
              background: `linear-gradient(135deg, ${pengaturan.warnaPrimary}, ${pengaturan.warnaSecondary})`,
            }}
          >
            <img
              src={logoSrc}
              alt="Logo"
              className="w-14 h-14 rounded-full bg-white/90 p-0.5 object-cover"
            />
          </div>
          <CardTitle className="text-xl font-bold tracking-wide">
            Dashboard Keuangan
          </CardTitle>
          <CardDescription className="text-sm">
            {pengaturan.namaPemerintah}
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-4">
          {/* Admin badge */}
          <div
            className="flex items-center justify-center gap-2 py-2 px-4 rounded-lg mb-6 mx-auto w-fit"
            style={{
              backgroundColor: `${pengaturan.warnaPrimary}15`,
              color: pengaturan.warnaPrimary,
            }}
          >
            <Shield className="w-4 h-4" />
            <span className="text-sm font-semibold">Login Admin / OPD</span>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@seruyankab.go.id"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="h-11"
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Masukkan password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="h-11 pr-10"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 text-sm font-semibold shadow-md hover:shadow-lg transition-all"
              style={{
                background: `linear-gradient(to right, ${pengaturan.warnaPrimary}, ${pengaturan.warnaSecondary})`,
              }}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Memproses...
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4 mr-2" />
                  Masuk
                </>
              )}
            </Button>
          </form>

          <p className="text-xs text-center text-muted-foreground mt-6">
            Administrator dan OPD dapat mengakses panel pengelolaan data.
            <br />
            Hubungi BPKPD jika Anda lupa kredensial.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
