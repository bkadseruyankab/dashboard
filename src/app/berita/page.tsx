'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import PortalLayout from '@/components/portal/PortalLayout';
import NewsCard from '@/components/portal/NewsCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Calendar, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import type { News, Category } from '@/components/portal/types';

function BeritaPageContent() {
  const searchParams = useSearchParams();
  const categorySlug = searchParams.get('category');
  const searchQuery = searchParams.get('search');

  const [news, setNews] = useState<News[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [localSearch, setLocalSearch] = useState(searchQuery || '');
  const itemsPerPage = 9;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [newsRes, categoriesRes] = await Promise.all([
          fetch(
            `/api/news?limit=${itemsPerPage}&page=${page}${categorySlug ? `&category=${categorySlug}` : ''}${searchQuery ? `&search=${searchQuery}` : ''}`
          ),
          fetch('/api/categories'),
        ]);

        const newsData = await newsRes.json();
        const categoriesData = await categoriesRes.json();

        setNews(newsData.data || []);
        setTotal(newsData.pagination?.total || 0);
        setCategories(categoriesData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [page, categorySlug, searchQuery]);

  const totalPages = Math.ceil(total / itemsPerPage);
  const selectedCategory = categorySlug
    ? categories.find((c) => c.slug === categorySlug)
    : null;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (localSearch.trim()) {
      window.location.href = `/berita?search=${encodeURIComponent(localSearch)}`;
    }
  };

  return (
    <PortalLayout>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-emerald-700 to-emerald-800 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl">
            <Badge className="bg-emerald-500/30 text-white mb-4">Berita</Badge>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              {selectedCategory ? `Berita ${selectedCategory.name}` : searchQuery ? `Hasil Pencarian` : 'Berita Terbaru'}
            </h1>
            <p className="text-emerald-100">
              {selectedCategory
                ? selectedCategory.description || `Kategori ${selectedCategory.name}`
                : searchQuery
                ? `Mencari: "${searchQuery}"`
                : 'Informasi terkini seputar kegiatan dan kebijakan BKAD'}
            </p>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              {/* Search */}
              <Card>
                <CardContent className="p-4">
                  <form onSubmit={handleSearch} className="flex gap-2">
                    <Input
                      type="text"
                      placeholder="Cari berita..."
                      value={localSearch}
                      onChange={(e) => setLocalSearch(e.target.value)}
                    />
                    <Button type="submit" size="icon" className="bg-emerald-600 hover:bg-emerald-700">
                      <Search className="h-4 w-4" />
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Categories */}
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-emerald-600" />
                    Kategori
                  </h3>
                  <div className="space-y-2">
                    <Link
                      href="/berita"
                      className={`block px-3 py-2 rounded-lg transition-colors ${
                        !categorySlug
                          ? 'bg-emerald-100 text-emerald-700 font-medium'
                          : 'hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      Semua Berita
                    </Link>
                    {categories.map((cat) => (
                      <Link
                        key={cat.id}
                        href={`/berita?category=${cat.slug}`}
                        className={`block px-3 py-2 rounded-lg transition-colors ${
                          categorySlug === cat.slug
                            ? 'bg-emerald-100 text-emerald-700 font-medium'
                            : 'hover:bg-gray-100 text-gray-700'
                        }`}
                      >
                        {cat.name}
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Archive Info */}
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-emerald-600" />
                    Statistik
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Berita</span>
                      <span className="font-medium text-emerald-600">{total}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Halaman</span>
                      <span className="font-medium">{page} dari {totalPages || 1}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="space-y-3">
                      <Skeleton className="h-48 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                  ))}
                </div>
              ) : news.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {news.map((item) => (
                      <NewsCard key={item.id} news={item} />
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex justify-center items-center gap-2 mt-8">
                      <Button
                        variant="outline"
                        size="icon"
                        disabled={page === 1}
                        onClick={() => setPage(page - 1)}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <div className="flex items-center gap-1">
                        {[...Array(Math.min(5, totalPages))].map((_, i) => {
                          let pageNum;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (page <= 3) {
                            pageNum = i + 1;
                          } else if (page >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = page - 2 + i;
                          }
                          return (
                            <Button
                              key={i}
                              variant={page === pageNum ? 'default' : 'outline'}
                              size="sm"
                              className={page === pageNum ? 'bg-emerald-600' : ''}
                              onClick={() => setPage(pageNum)}
                            >
                              {pageNum}
                            </Button>
                          );
                        })}
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        disabled={page === totalPages}
                        onClick={() => setPage(page + 1)}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12">
                  <div className="bg-gray-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="h-10 w-10 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Tidak ada berita ditemukan
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Coba ubah kata kunci pencarian atau pilih kategori lain
                  </p>
                  <Link href="/berita">
                    <Button variant="outline">Lihat Semua Berita</Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </PortalLayout>
  );
}

export default function BeritaPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
        </div>
      }
    >
      <BeritaPageContent />
    </Suspense>
  );
}
