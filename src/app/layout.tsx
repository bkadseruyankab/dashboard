import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { PengaturanProvider } from "@/context/PengaturanContext";
import AuthProvider from "@/components/auth/AuthProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Dashboard Keuangan - Pemerintah Kabupaten Seruyan",
  description: "Dashboard Monitoring Pengelolaan Keuangan Daerah, Anggaran Pendapatan dan Belanja Daerah Pemerintah Kabupaten Seruyan, Kalimantan Tengah",
  keywords: ["Dashboard Keuangan", "APBD", "Seruyan", "Kalimantan Tengah", "Pemerintah Daerah"],
  authors: [{ name: "BKAD Kabupaten Seruyan" }],
  icons: {
    icon: "/logo-seruyan.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
        suppressHydrationWarning
      >
        <AuthProvider>
          <PengaturanProvider>
            {children}
            <Toaster />
          </PengaturanProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
