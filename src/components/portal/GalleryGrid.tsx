'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Gallery } from './types';

interface GalleryGridProps {
  gallery: Gallery[];
}

export default function GalleryGrid({ gallery }: GalleryGridProps) {
  const [selectedImage, setSelectedImage] = useState<Gallery | null>(null);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {gallery.map((item) => (
        <Dialog key={item.id}>
          <DialogTrigger asChild>
            <Card
              className="group overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-300"
              onClick={() => setSelectedImage(item)}
            >
              <div className="relative aspect-square">
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                    <h3 className="font-medium text-sm line-clamp-1">{item.title}</h3>
                  </div>
                </div>
              </div>
            </Card>
          </DialogTrigger>
          <DialogContent className="max-w-4xl">
            <div className="relative">
              <img
                src={item.imageUrl}
                alt={item.title}
                className="w-full max-h-[70vh] object-contain"
              />
              <div className="mt-4">
                <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                {item.description && (
                  <p className="text-gray-600 text-sm mb-2">{item.description}</p>
                )}
                {item.eventDate && (
                  <p className="text-gray-500 text-sm">
                    Tanggal: {formatDate(item.eventDate)}
                  </p>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      ))}
    </div>
  );
}
