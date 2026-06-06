'use client';

import { useState, useEffect } from 'react';
import PortalLayout from '@/components/portal/PortalLayout';
import ServiceCard from '@/components/portal/ServiceCard';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  FileText,
  ClipboardList,
  Calculator,
  Building2,
  Users,
  HelpCircle,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import Link from 'next/link';
import type { Service } from '@/components/portal/types';

export default function LayananPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/services')
      .then((res) => res.json())
      .then((data) => {
        setServices(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching services:', error);
        setLoading(false);
      });
  }, []);

  const layananUnggulan = [
    {
      icon: FileText,
      title: 'Informasi APBD',
      description: 'Akses informasi Anggaran Pendapatan dan Belanja Daerah Kabupaten Seruyan',
      link: '#',
    },
    {
      icon: Calculator,
      title: 'Kalkulator Pajak',
      description: 'Hitung estimasi pajak daerah Anda dengan mudah',
      link: '#',
    },
    {
      icon: Building2,
      title: 'Data Aset',
      description: 'Informasi aset daerah Kabupaten Seruyan',
      link: '#',
    },
    {
      icon: ClipboardList,
      title: 'Laporan Keuangan',
      description: 'Akses laporan keuangan pemerintah daerah',
      link: '#',
    },
  ];

  const prosedur = [
    {
      step: 1,
      title: 'Identifikasi Layanan',
      description: 'Tentukan jenis layanan yang Anda butuhkan dari daftar layanan yang tersedia',
    },
    {
      step: 2,
      title: 'Siapkan Dokumen',
      description: 'Siapkan dokumen-dokumen persyaratan yang diperlukan untuk layanan tersebut',
    },
    {
      step: 3,
      title: 'Ajukan Permohonan',
      description: 'Kunjungi kantor BKAD atau gunakan layanan online jika tersedia',
    },
    {
      step: 4,
      title: 'Proses Verifikasi',
      description: 'Tim BKAD akan memverifikasi kelengkapan dokumen dan data Anda',
    },
    {
      step: 5,
      title: 'Terima Layanan',
      description: 'Setelah proses selesai, Anda akan menerima hasil layanan',
    },
  ];

  return (
    <PortalLayout>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-emerald-700 via-emerald-600 to-emerald-800 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="bg-emerald-500/30 text-white mb-4">Layanan</Badge>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              Layanan BKAD
            </h1>
            <p className="text-emerald-100 text-lg max-w-2xl mx-auto">
              Berbagai layanan keuangan dan pengelolaan aset daerah untuk masyarakat Kabupaten Seruyan
            </p>
          </div>
        </div>
      </section>

      {/* Featured Services */}
      <section className="py-12 bg-white -mt-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {layananUnggulan.map((item, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow group">
                <CardContent className="pt-6 text-center">
                  <div className="bg-emerald-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-emerald-200 transition-colors">
                    <item.icon className="h-8 w-8 text-emerald-600" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-gray-600 text-sm mb-4">{item.description}</p>
                  <Button variant="outline" size="sm" className="gap-1">
                    Akses
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* All Services */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <Badge variant="secondary" className="mb-4">Semua Layanan</Badge>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
              Daftar Layanan Tersedia
            </h2>
            <p className="text-gray-600 mt-2">
              Pilih layanan yang Anda butuhkan
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-48" />
              ))}
            </div>
          ) : services.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((service) => (
                <ServiceCard key={service.id} service={service} showDetail />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <HelpCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Belum ada layanan tersedia</p>
            </div>
          )}
        </div>
      </section>

      {/* Procedure */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4">Prosedur</Badge>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
              Cara Mengakses Layanan
            </h2>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-emerald-200" />

              <div className="space-y-8">
                {prosedur.map((item, index) => (
                  <div key={index} className="relative flex gap-6">
                    <div className="bg-emerald-600 text-white w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0 z-10 font-bold text-xl">
                      {item.step}
                    </div>
                    <Card className="flex-1">
                      <CardContent className="pt-6">
                        <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
                        <p className="text-gray-600">{item.description}</p>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <Badge variant="secondary" className="mb-4">FAQ</Badge>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
              Pertanyaan Umum
            </h2>
          </div>

          <div className="max-w-3xl mx-auto space-y-4">
            {[
              {
                q: 'Bagaimana cara mengakses layanan online BKAD?',
                a: 'Anda dapat mengakses layanan online melalui portal ini atau mengunjungi kantor BKAD langsung pada jam kerja.',
              },
              {
                q: 'Berapa lama waktu yang dibutuhkan untuk proses layanan?',
                a: 'Waktu proses bervariasi tergantung jenis layanan. Informasi detail dapat dilihat pada masing-masing layanan.',
              },
              {
                q: 'Apa saja dokumen yang diperlukan untuk pengajuan layanan?',
                a: 'Dokumen yang diperlukan berbeda untuk setiap layanan. Silakan lihat detail persyaratan pada layanan yang diinginkan.',
              },
              {
                q: 'Apakah ada biaya untuk layanan BKAD?',
                a: 'Sebagian besar layanan informasi tidak dipungut biaya. Untuk layanan tertentu, biaya sesuai peraturan yang berlaku.',
              },
            ].map((faq, index) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <h3 className="font-bold text-gray-900 mb-2">{faq.q}</h3>
                  <p className="text-gray-600">{faq.a}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 bg-emerald-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Butuh Bantuan Lebih Lanjut?
          </h2>
          <p className="text-emerald-100 mb-8 max-w-2xl mx-auto">
            Hubungi kami untuk informasi lebih lanjut atau kunjungi kantor kami
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/kontak">
              <Button className="bg-white text-emerald-700 hover:bg-emerald-50">
                Hubungi Kami
              </Button>
            </Link>
            <Link href="/dokumen">
              <Button variant="outline" className="border-white text-white hover:bg-white/10">
                Lihat Dokumen
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </PortalLayout>
  );
}
