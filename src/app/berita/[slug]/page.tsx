'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import PortalLayout from '@/components/portal/PortalLayout';
import NewsCard from '@/components/portal/NewsCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Calendar,
  User,
  Eye,
  ChevronLeft,
  Share2,
  Facebook,
  Twitter,
  Link2,
  Tag,
  Clock,
} from 'lucide-react';
import Link from 'next/link';
import type { News, Category } from '@/components/portal/types';

export default function NewsDetailPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [news, setNews] = useState<News | null>(null);
  const [relatedNews, setRelatedNews] = useState<News[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [newsRes, relatedRes, categoriesRes] = await Promise.all([
          fetch(`/api/news/${slug}`),
          fetch('/api/news?limit=4'),
          fetch('/api/categories'),
        ]);

        if (newsRes.ok) {
          const newsData = await newsRes.json();
          setNews(newsData);

          // Fetch related news from same category
          if (newsData.categoryId) {
            const relatedByCategory = await fetch(
              `/api/news?limit=4&category=${newsData.category?.slug}`
            );
            const relatedData = await relatedByCategory.json();
            setRelatedNews(
              (relatedData.data || []).filter((n: News) => n.id !== newsData.id).slice(0, 3)
            );
          } else {
            setRelatedNews(
              (await relatedRes.json()).data?.filter((n: News) => n.id !== newsData.id).slice(0, 3) ||
                []
            );
          }
        }

        setCategories(await categoriesRes.json());
      } catch (error) {
        console.error('Error fetching news:', error);
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchData();
    }
  }, [slug]);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';

  const handleShare = (platform: string) => {
    const text = news?.title || '';
    const url = shareUrl;

    let shareLink = '';
    switch (platform) {
      case 'facebook':
        shareLink = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        break;
      case 'twitter':
        shareLink = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
        break;
      default:
        navigator.clipboard.writeText(url);
        return;
    }

    window.open(shareLink, '_blank', 'width=600,height=400');
  };

  if (loading) {
    return (
      <PortalLayout>
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto">
            <Skeleton className="h-8 w-3/4 mb-4" />
            <Skeleton className="h-4 w-1/2 mb-8" />
            <Skeleton className="h-[400px] w-full mb-8" />
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        </div>
      </PortalLayout>
    );
  }

  if (!news) {
    return (
      <PortalLayout>
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Berita Tidak Ditemukan</h1>
            <p className="text-gray-600 mb-6">Berita yang Anda cari tidak tersedia.</p>
            <Link href="/berita">
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                <ChevronLeft className="mr-2 h-4 w-4" />
                Kembali ke Daftar Berita
              </Button>
            </Link>
          </div>
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
            <Link href="/berita" className="hover:text-emerald-600">
              Berita
            </Link>
            <span>/</span>
            <span className="text-gray-900">{news.title.substring(0, 50)}...</span>
          </div>
        </div>
      </div>

      <article className="py-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-3">
              {/* Header */}
              <header className="mb-6">
                {news.category && (
                  <Link href={`/berita?category=${news.category.slug}`}>
                    <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 mb-3">
                      {news.category.name}
                    </Badge>
                  </Link>
                )}
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                  {news.title}
                </h1>
                <div className="flex flex-wrap items-center gap-4 text-gray-600 text-sm">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>{news.author?.name || 'Admin'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDate(news.publishedAt)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    <span>{news.viewCount} dilihat</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>{Math.ceil(news.content.length / 200)} menit baca</span>
                  </div>
                </div>
              </header>

              {/* Featured Image */}
              {news.thumbnail && (
                <div className="mb-8 rounded-lg overflow-hidden">
                  <img
                    src={news.thumbnail}
                    alt={news.title}
                    className="w-full h-auto max-h-[500px] object-cover"
                  />
                </div>
              )}

              {/* Content */}
              <div className="prose prose-lg max-w-none mb-8">
                {news.excerpt && (
                  <p className="lead text-xl text-gray-700 font-medium mb-6">{news.excerpt}</p>
                )}
                <div
                  className="text-gray-700 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: news.content.replace(/\n/g, '<br />') }}
                />
              </div>

              {/* Share */}
              <div className="border-t border-b py-4 mb-8">
                <div className="flex items-center gap-4">
                  <span className="text-gray-700 font-medium flex items-center gap-2">
                    <Share2 className="h-5 w-5" />
                    Bagikan:
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleShare('facebook')}
                    className="gap-2"
                  >
                    <Facebook className="h-4 w-4" />
                    Facebook
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleShare('twitter')}
                    className="gap-2"
                  >
                    <Twitter className="h-4 w-4" />
                    Twitter
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleShare('copy')}
                    className="gap-2"
                  >
                    <Link2 className="h-4 w-4" />
                    Salin Link
                  </Button>
                </div>
              </div>

              {/* Navigation */}
              <div className="flex justify-between items-center">
                <Link href="/berita">
                  <Button variant="outline">
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Kembali ke Berita
                  </Button>
                </Link>
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              {/* Categories */}
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Tag className="h-5 w-5 text-emerald-600" />
                    Kategori
                  </h3>
                  <div className="space-y-2">
                    {categories.map((cat) => (
                      <Link
                        key={cat.id}
                        href={`/berita?category=${cat.slug}`}
                        className="block px-3 py-2 rounded-lg hover:bg-gray-100 text-gray-700 text-sm"
                      >
                        {cat.name}
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Related News */}
              {relatedNews.length > 0 && (
                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-bold text-gray-900 mb-4">Berita Terkait</h3>
                    <div className="space-y-4">
                      {relatedNews.map((item) => (
                        <Link
                          key={item.id}
                          href={`/berita/${item.slug}`}
                          className="block group"
                        >
                          <div className="flex gap-3">
                            {item.thumbnail && (
                              <img
                                src={item.thumbnail}
                                alt={item.title}
                                className="w-20 h-16 object-cover rounded"
                              />
                            )}
                            <div className="flex-1">
                              <h4 className="text-sm font-medium text-gray-900 group-hover:text-emerald-600 line-clamp-2">
                                {item.title}
                              </h4>
                              <p className="text-xs text-gray-500 mt-1">
                                {formatDate(item.publishedAt)}
                              </p>
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
      </article>
    </PortalLayout>
  );
}
