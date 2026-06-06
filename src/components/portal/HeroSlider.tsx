'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Banner } from './types';

interface HeroSliderProps {
  banners: Banner[];
}

export default function HeroSlider({ banners }: HeroSliderProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % banners.length);
  }, [banners.length]);

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + banners.length) % banners.length);
  };

  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(nextSlide, 5000);
    return () => clearInterval(interval);
  }, [nextSlide, banners.length]);

  if (!banners.length) return null;

  return (
    <section className="relative h-[400px] md:h-[500px] lg:h-[600px] overflow-hidden bg-gray-900">
      {/* Slides */}
      {banners.map((banner, index) => (
        <div
          key={banner.id}
          className={`absolute inset-0 transition-all duration-700 ease-in-out ${
            index === currentSlide ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
          }`}
        >
          {/* Background Image with Overlay */}
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url(${banner.imageUrl})`,
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent" />
          
          {/* Content */}
          <div className="relative h-full container mx-auto px-4 flex items-center">
            <div className="max-w-2xl text-white">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 leading-tight animate-fade-in-up">
                {banner.title}
              </h2>
              {banner.subtitle && (
                <p className="text-lg md:text-xl text-gray-200 mb-6 animate-fade-in-up animation-delay-200">
                  {banner.subtitle}
                </p>
              )}
              {banner.link && (
                <Button
                  asChild
                  size="lg"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white animate-fade-in-up animation-delay-400"
                >
                  <Link href={banner.link}>Selengkapnya</Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      ))}

      {/* Navigation Arrows */}
      {banners.length > 1 && (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white rounded-full h-12 w-12"
            onClick={prevSlide}
          >
            <ChevronLeft className="h-8 w-8" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white rounded-full h-12 w-12"
            onClick={nextSlide}
          >
            <ChevronRight className="h-8 w-8" />
          </Button>
        </>
      )}

      {/* Dots Indicator */}
      {banners.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`h-2 rounded-full transition-all ${
                index === currentSlide
                  ? 'w-8 bg-emerald-500'
                  : 'w-2 bg-white/50 hover:bg-white/75'
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
