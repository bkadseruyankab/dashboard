'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import PortalLayout from '@/components/portal/PortalLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, ExternalLink, Clock, FileText, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import type { Service } from '@/components/portal/types';

export default function ServiceDetailPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/services/${slug}`)
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error('Service not found');
      })
      .then(setService)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <PortalLayout>
        <div className="container mx-auto px-4 py-12">
          <Skeleton className="h-8 w-3/4 mb-4" />
          <Skeleton className="h-4 w-1/2 mb-8" />
          <Skeleton className="h-[300px] w-full" />
        </div>
      </PortalLayout>
    );
  }

  if (!service) {
    return (
      <PortalLayout>
        <div className="container mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Layanan Tidak Ditemukan</h1>
          <Link href="/layanan">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Kembali ke Daftar Layanan
            </Button>
          </Link>
        </div>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout>
      {/* Breadcrumb */}
      <div className="bg-gray-100 py-4">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Link href="/" className="hover:text-emerald-600">
              Beranda
            </Link>
            <span>/</span>
            <Link href="/layanan" className="hover:text-emerald-600">
              Layanan
            </Link>
            <span>/</span>
            <span className="text-gray-900">{service.title}</span>
          </div>
        </div>
      </div>

      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <Badge className="bg-emerald-100 text-emerald-700 mb-4">Layanan</Badge>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                {service.title}
              </h1>
              {service.description && (
                <p className="text-xl text-gray-600">{service.description}</p>
              )}
            </div>

            {/* Content */}
            <Card className="mb-8">
              <CardContent className="pt-6">
                {service.content ? (
                  <div
                    className="prose prose-lg max-w-none"
                    dangerouslySetInnerHTML={{ __html: service.content.replace(/\n/g, '<br />') }}
                  />
                ) : (
                  <p className="text-gray-600">
                    Informasi detail layanan sedang dalam proses pembaruan.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Action */}
            {service.link && (
              <div className="flex gap-4">
                <a href={service.link} target="_blank" rel="noopener noreferrer">
                  <Button className="bg-emerald-600 hover:bg-emerald-700 gap-2">
                    Akses Layanan
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </a>
                <Link href="/layanan">
                  <Button variant="outline" className="gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    Kembali
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>
    </PortalLayout>
  );
}
