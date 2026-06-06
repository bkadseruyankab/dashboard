'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Calendar,
  Eye,
  User,
  ChevronLeft,
  Share2,
  Printer,
  Facebook,
  Twitter,
} from 'lucide-react';
import { News } from './types';

interface NewsDetailProps {
  slug: string;
}

export default function NewsDetail({ slug }: NewsDetailProps) {
  const [news, setNews] = useState<News | null>(null);
  const [loading, setLoading] = useState(true);
  const [relatedNews, setRelatedNews] = useState<News[]>([]);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const res = await fetch(`/api/news?slug=${slug}`);
        if (res.ok) {
          const data = await res.json();
          setNews(data);

          // Fetch related news
          if (data.categoryId) {
            const relatedRes = await fetch(`/api/news?category=${data.category?.slug}&limit=3`);
            if (relatedRes.ok) {
              const relatedData = await relatedRes.json();
              setRelatedNews(relatedData.data?.filter((n: News) => n.id !== data.id).slice(0, 3) || []);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching news:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, [slug]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const handleShare = async (platform: string) => {
    const url = window.location.href;
    const title = news?.title || '';

    switch (platform) {
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`, '_blank');
        break;
      case 'copy':
        await navigator.clipboard.writeText(url);
        alert('Link berhasil disalin!');
        break;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="h-64 bg-gray-200 rounded mb-8"></div>
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!news) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold mb-4">Berita tidak ditemukan</h2>
        <Button asChild>
          <Link href="/">Kembali ke Beranda</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link href="/" className="hover:text-emerald-600">Beranda</Link>
          <span>/</span>
          <Link href="/#berita" className="hover:text-emerald-600">Berita</Link>
          <span>/</span>
          <span className="text-gray-900">{news.title}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <article className="bg-white rounded-xl shadow-sm overflow-hidden">
              {/* Hero Image */}
              {news.thumbnail && (
                <div className="relative h-64 md:h-96 bg-gray-200">
                  <img
                    src={news.thumbnail}
                    alt={news.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div className="p-6 md:p-8">
                {/* Category & Meta */}
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  {news.category && (
                    <Badge style={{ backgroundColor: news.category.color || '#10b981' }}>
                      {news.category.name}
                    </Badge>
                  )}
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {formatDate(news.publishedAt)}
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      {news.author.name || 'Admin'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      {news.viewCount}
                    </span>
                  </div>
                </div>

                {/* Title */}
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
                  {news.title}
                </h1>

                {/* Content */}
                <div
                  className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-emerald-600"
                  dangerouslySetInnerHTML={{ __html: news.content }}
                />

                {/* Share */}
                <div className="border-t mt-8 pt-6">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600 font-medium">Bagikan:</span>
                      <Button variant="outline" size="icon" onClick={() => handleShare('facebook')}>
                        <Facebook className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon" onClick={() => handleShare('twitter')}>
                        <Twitter className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon" onClick={() => handleShare('copy')}>
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button variant="outline" onClick={() => window.print()}>
                      <Printer className="h-4 w-4 mr-2" />
                      Cetak
                    </Button>
                  </div>
                </div>
              </div>
            </article>

            {/* Back Button */}
            <div className="mt-6">
              <Button variant="ghost" asChild>
                <Link href="/#berita">
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Kembali ke Berita
                </Link>
              </Button>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Related News */}
            {relatedNews.length > 0 && (
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-bold text-lg mb-4">Berita Terkait</h3>
                  <div className="space-y-4">
                    {relatedNews.map((item) => (
                      <Link
                        key={item.id}
                        href={`/?news=${item.slug}`}
                        className="block group"
                      >
                        <div className="flex gap-3">
                          <div
                            className="w-20 h-20 bg-cover bg-center rounded-lg flex-shrink-0"
                            style={{ backgroundImage: `url(${item.thumbnail || '/images/placeholder.jpg'})` }}
                          />
                          <div>
                            <h4 className="font-medium text-sm line-clamp-2 group-hover:text-emerald-600 transition-colors">
                              {item.title}
                            </h4>
                            <span className="text-xs text-gray-500">
                              {formatDate(item.publishedAt)}
                            </span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
