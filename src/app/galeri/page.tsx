'use client';

import { useState, useEffect } from 'react';
import PortalLayout from '@/components/portal/PortalLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Search, Calendar, Image as ImageIcon, X, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Gallery } from '@/components/portal/types';

export default function GaleriPage() {
  const [gallery, setGallery] = useState<Gallery[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<Gallery | null>(null);

  useEffect(() => {
    fetch('/api/gallery')
      .then((res) => res.json())
      .then(setGallery)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Get unique categories
  const categories = Array.from(new Set(gallery.map((g) => g.category).filter(Boolean))) as string[];

  // Filter gallery
  const filteredGallery = gallery.filter((item) => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const formatDate = (date: string | Date | null) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const currentImageIndex = selectedImage
    ? filteredGallery.findIndex((g) => g.id === selectedImage.id)
    : -1;

  const handlePrev = () => {
    if (currentImageIndex > 0) {
      setSelectedImage(filteredGallery[currentImageIndex - 1]);
    }
  };

  const handleNext = () => {
    if (currentImageIndex < filteredGallery.length - 1) {
      setSelectedImage(filteredGallery[currentImageIndex + 1]);
    }
  };

  return (
    <PortalLayout>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-emerald-700 to-emerald-800 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl">
            <Badge className="bg-emerald-500/30 text-white mb-4">Galeri</Badge>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Galeri Kegiatan</h1>
            <p className="text-emerald-100">
              Dokumentasi kegiatan dan acara BKAD Kabupaten Seruyan
            </p>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="py-6 bg-white border-b sticky top-[104px] z-30">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Cari galeri..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Categories */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant={!selectedCategory ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(null)}
                className={!selectedCategory ? 'bg-emerald-600' : ''}
              >
                Semua
              </Button>
              {categories.map((cat) => (
                <Button
                  key={cat}
                  variant={selectedCategory === cat ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(cat)}
                  className={selectedCategory === cat ? 'bg-emerald-600' : ''}
                >
                  {cat}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Gallery Grid */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <Skeleton key={i} className="aspect-square rounded-lg" />
              ))}
            </div>
          ) : filteredGallery.length > 0 ? (
            <>
              <p className="text-sm text-gray-500 mb-4">
                Menampilkan {filteredGallery.length} dari {gallery.length} foto
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredGallery.map((item) => (
                  <Card
                    key={item.id}
                    className="group cursor-pointer overflow-hidden hover:shadow-lg transition-all"
                    onClick={() => setSelectedImage(item)}
                  >
                    <div className="relative aspect-square">
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                          <h3 className="font-medium text-sm line-clamp-1">{item.title}</h3>
                          {item.eventDate && (
                            <p className="text-xs text-gray-200">{formatDate(item.eventDate)}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <ImageIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Tidak ada galeri ditemukan</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory(null);
                }}
              >
                Reset Filter
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Image Modal */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-5xl p-0 overflow-hidden bg-black">
          {selectedImage && (
            <div className="relative">
              <img
                src={selectedImage.imageUrl}
                alt={selectedImage.title}
                className="w-full max-h-[80vh] object-contain"
              />

              {/* Navigation */}
              {currentImageIndex > 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white hover:bg-black/70"
                  onClick={handlePrev}
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
              )}
              {currentImageIndex < filteredGallery.length - 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white hover:bg-black/70"
                  onClick={handleNext}
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              )}

              {/* Info */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 text-white">
                <h3 className="font-bold text-lg mb-1">{selectedImage.title}</h3>
                {selectedImage.description && (
                  <p className="text-gray-200 text-sm mb-2">{selectedImage.description}</p>
                )}
                <div className="flex items-center gap-4 text-sm text-gray-300">
                  {selectedImage.category && (
                    <span className="bg-emerald-600/50 px-2 py-0.5 rounded">
                      {selectedImage.category}
                    </span>
                  )}
                  {selectedImage.eventDate && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {formatDate(selectedImage.eventDate)}
                    </span>
                  )}
                </div>
              </div>

              {/* Counter */}
              <div className="absolute top-4 right-4 bg-black/50 px-3 py-1 rounded-full text-white text-sm">
                {currentImageIndex + 1} / {filteredGallery.length}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </PortalLayout>
  );
}
