'use client';

import { useState, useEffect } from 'react';
import PortalLayout from '@/components/portal/PortalLayout';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Building2,
  Target,
  Eye,
  ChevronRight,
  Users,
  Calendar,
  Award,
  BookOpen,
  Handshake,
  ClipboardCheck,
  BarChart3,
  Shield,
  Lightbulb,
  Heart,
} from 'lucide-react';
import Link from 'next/link';
import type { Organization } from '@/components/portal/types';

export default function ProfilPage() {
  const [organization, setOrganization] = useState<Organization[]>([]);

  useEffect(() => {
    fetch('/api/organization')
      .then((res) => res.json())
      .then(setOrganization)
      .catch(console.error);
  }, []);

  const visi = "Mewujudkan pengelolaan keuangan dan aset daerah yang profesional, transparan, dan akuntabel untuk melayani masyarakat Kabupaten Seruyan.";

  const misi = [
    "Meningkatkan kualitas perencanaan dan penganggaran daerah yang berorientasi pada hasil",
    "Mengoptimalkan pendapatan daerah melalui intensifikasi dan ekstensifikasi sumber pendapatan",
    "Meningkatkan pengelolaan keuangan daerah yang transparan, akuntabel, dan sesuai standar",
    "Mengoptimalkan pengelolaan aset daerah untuk mendukung pelayanan publik",
    "Meningkatkan kualitas sumber daya manusia pengelola keuangan daerah",
    "Mengembangkan sistem informasi keuangan daerah yang terintegrasi dan handal",
  ];

  const tugasFungsi = [
    {
      title: "Perencanaan dan Penganggaran",
      icon: BarChart3,
      description: "Menyusun dokumen perencanaan dan penganggaran daerah yang berkualitas",
    },
    {
      title: "Pengelolaan Pendapatan",
      icon: Award,
      description: "Mengoptimalkan pengelolaan dan penyetoran pendapatan daerah",
    },
    {
      title: "Pengelolaan Keuangan",
      icon: ClipboardCheck,
      description: "Mengelola keuangan daerah secara transparan dan akuntabel",
    },
    {
      title: "Pengelolaan Aset",
      icon: Building2,
      description: "Mengelola aset daerah secara optimal dan efisien",
    },
  ];

  const values = [
    { icon: Shield, title: "Integritas", desc: "Jujur dan konsisten dalam setiap tindakan" },
    { icon: Lightbulb, title: "Profesionalisme", desc: "Kerja keras dan kompeten dalam pelayanan" },
    { icon: Heart, title: "Pelayanan Prima", desc: "Mengutamakan kepuasan masyarakat" },
    { icon: Handshake, title: "Transparansi", desc: "Keterbukaan informasi kepada publik" },
  ];

  const sejarah = `Badan Keuangan dan Aset Daerah (BKAD) Kabupaten Seruyan merupakan salah satu Organisasi Perangkat Daerah (OPD) yang dibentuk berdasarkan Peraturan Daerah Kabupaten Seruyan tentang Pembentukan dan Susunan Perangkat Daerah. BKAD memiliki tugas melaksanakan urusan pemerintahan di bidang pengelolaan keuangan dan aset daerah.

Dalam melaksanakan tugasnya, BKAD dibantu oleh beberapa bidang dan sub bagian yang masing-masing memiliki fungsi dan tugas spesifik. Dengan dukungan sumber daya manusia yang profesional dan sistem yang modern, BKAD berkomitmen untuk memberikan pelayanan terbaik kepada masyarakat Kabupaten Seruyan.`;

  return (
    <PortalLayout>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-emerald-700 via-emerald-600 to-emerald-800 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="bg-emerald-500/30 text-white mb-4">Profil</Badge>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              Badan Keuangan dan Aset Daerah
            </h1>
            <p className="text-emerald-100 text-lg md:text-xl">
              Kabupaten Seruyan - Kalimantan Tengah
            </p>
            <div className="flex justify-center gap-4 mt-8">
              <Link href="#visi-misi">
                <Button className="bg-white text-emerald-700 hover:bg-emerald-50">
                  Visi & Misi
                </Button>
              </Link>
              <Link href="#struktur">
                <Button variant="outline" className="border-white text-white hover:bg-white/10">
                  Struktur Organisasi
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge variant="secondary" className="mb-4">Tentang Kami</Badge>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
                Sejarah Singkat BKAD
              </h2>
              <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                {sejarah}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {values.map((value, index) => (
                <Card key={index} className="text-center p-4">
                  <CardContent className="pt-4">
                    <div className="bg-emerald-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                      <value.icon className="h-6 w-6 text-emerald-600" />
                    </div>
                    <h3 className="font-bold text-gray-900 mb-1">{value.title}</h3>
                    <p className="text-xs text-gray-500">{value.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Visi Misi Section */}
      <section id="visi-misi" className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4">Visi & Misi</Badge>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
              Arah dan Tujuan Organisasi
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {/* Visi */}
            <Card className="border-2 border-emerald-200">
              <CardHeader className="bg-emerald-600 text-white">
                <CardTitle className="flex items-center gap-3">
                  <Target className="h-6 w-6" />
                  Visi
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <p className="text-gray-700 text-lg leading-relaxed italic">
                  "{visi}"
                </p>
              </CardContent>
            </Card>

            {/* Misi */}
            <Card className="border-2 border-emerald-200">
              <CardHeader className="bg-emerald-600 text-white">
                <CardTitle className="flex items-center gap-3">
                  <Eye className="h-6 w-6" />
                  Misi
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <ul className="space-y-3">
                  {misi.map((item, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <ChevronRight className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Tugas & Fungsi Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4">Tugas & Fungsi</Badge>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
              Bidang Tugas Kami
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {tugasFungsi.map((item, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6 text-center">
                  <div className="bg-emerald-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <item.icon className="h-8 w-8 text-emerald-600" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-gray-600 text-sm">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Struktur Organisasi Section */}
      <section id="struktur" className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4">Organisasi</Badge>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
              Struktur Organisasi
            </h2>
            <p className="text-gray-600 mt-2">Pimpinan dan pejabat struktural BKAD Kabupaten Seruyan</p>
          </div>

          {organization.length > 0 ? (
            <div className="max-w-6xl mx-auto">
              {/* Kepala */}
              <div className="flex justify-center mb-8">
                {organization
                  .filter((org) => org.level === 1)
                  .map((org) => (
                    <Card key={org.id} className="w-72 border-2 border-emerald-500 shadow-lg">
                      <CardContent className="pt-6 text-center">
                        {org.photo ? (
                          <img
                            src={org.photo}
                            alt={org.name}
                            className="w-24 h-24 rounded-full object-cover mx-auto mb-4 border-4 border-emerald-500"
                          />
                        ) : (
                          <div className="w-24 h-24 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4 border-4 border-emerald-500">
                            <Users className="h-10 w-10 text-emerald-600" />
                          </div>
                        )}
                        <h3 className="font-bold text-gray-900 text-lg">{org.name}</h3>
                        <p className="text-emerald-600 font-medium">{org.position}</p>
                        {org.email && (
                          <p className="text-gray-500 text-sm mt-2">{org.email}</p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
              </div>

              {/* Level 2 */}
              {organization.filter((org) => org.level === 2).length > 0 && (
                <div className="flex flex-wrap justify-center gap-6 mb-8">
                  {organization
                    .filter((org) => org.level === 2)
                    .map((org) => (
                      <Card key={org.id} className="w-64 border border-emerald-300">
                        <CardContent className="pt-6 text-center">
                          {org.photo ? (
                            <img
                              src={org.photo}
                              alt={org.name}
                              className="w-20 h-20 rounded-full object-cover mx-auto mb-3 border-2 border-emerald-300"
                            />
                          ) : (
                            <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-3 border-2 border-emerald-300">
                              <Users className="h-8 w-8 text-emerald-500" />
                            </div>
                          )}
                          <h3 className="font-bold text-gray-900">{org.name}</h3>
                          <p className="text-emerald-600 text-sm font-medium">{org.position}</p>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              )}

              {/* Level 3+ */}
              {organization.filter((org) => org.level >= 3).length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {organization
                    .filter((org) => org.level >= 3)
                    .sort((a, b) => a.order - b.order)
                    .map((org) => (
                      <Card key={org.id} className="border">
                        <CardContent className="pt-4 text-center">
                          {org.photo ? (
                            <img
                              src={org.photo}
                              alt={org.name}
                              className="w-16 h-16 rounded-full object-cover mx-auto mb-2"
                            />
                          ) : (
                            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-2">
                              <Users className="h-6 w-6 text-gray-400" />
                            </div>
                          )}
                          <h3 className="font-medium text-gray-900 text-sm">{org.name}</h3>
                          <p className="text-gray-500 text-xs">{org.position}</p>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Data organisasi belum tersedia</p>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-emerald-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Ingin Mengetahui Lebih Lanjut?
          </h2>
          <p className="text-emerald-100 mb-8 max-w-2xl mx-auto">
            Kunjungi halaman layanan kami untuk mengetahui berbagai layanan yang tersedia atau hubungi kami langsung
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/layanan">
              <Button className="bg-white text-emerald-700 hover:bg-emerald-50">
                <BookOpen className="mr-2 h-5 w-5" />
                Lihat Layanan
              </Button>
            </Link>
            <Link href="/kontak">
              <Button variant="outline" className="border-white text-white hover:bg-white/10">
                Hubungi Kami
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </PortalLayout>
  );
}
