import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Eye, User } from 'lucide-react';
import { News } from './types';

interface NewsCardProps {
  news: News;
  variant?: 'default' | 'featured' | 'horizontal';
}

export default function NewsCard({ news, variant = 'default' }: NewsCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  if (variant === 'featured') {
    return (
      <Link href={`/berita/${news.slug}`}>
        <Card className="group overflow-hidden h-full hover:shadow-xl transition-all duration-300">
          <div className="relative h-64 overflow-hidden">
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
              style={{
                backgroundImage: `url(${news.thumbnail || '/images/placeholder.jpg'})`,
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
              {news.category && (
                <Badge className="mb-2 bg-emerald-600 hover:bg-emerald-700">
                  {news.category.name}
                </Badge>
              )}
              <h3 className="text-xl font-bold mb-2 line-clamp-2 group-hover:text-emerald-300 transition-colors">
                {news.title}
              </h3>
              <div className="flex items-center gap-4 text-sm text-gray-300">
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {formatDate(news.publishedAt)}
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  {news.viewCount}
                </span>
              </div>
            </div>
          </div>
        </Card>
      </Link>
    );
  }

  if (variant === 'horizontal') {
    return (
      <Link href={`/berita/${news.slug}`}>
        <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300">
          <div className="flex flex-col sm:flex-row">
            <div className="relative w-full sm:w-48 h-48 sm:h-auto flex-shrink-0 overflow-hidden">
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                style={{
                  backgroundImage: `url(${news.thumbnail || '/images/placeholder.jpg'})`,
                }}
              />
            </div>
            <CardContent className="flex-1 p-4">
              {news.category && (
                <Badge variant="secondary" className="mb-2" style={{ backgroundColor: news.category.color || undefined, color: 'white' }}>
                  {news.category.name}
                </Badge>
              )}
              <h3 className="font-bold text-lg mb-2 line-clamp-2 group-hover:text-emerald-600 transition-colors">
                {news.title}
              </h3>
              <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                {news.excerpt}
              </p>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDate(news.publishedAt)}
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  {news.viewCount}
                </span>
              </div>
            </CardContent>
          </div>
        </Card>
      </Link>
    );
  }

  return (
    <Link href={`/berita/${news.slug}`}>
      <Card className="group overflow-hidden h-full hover:shadow-lg transition-all duration-300">
        <div className="relative h-48 overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
            style={{
              backgroundImage: `url(${news.thumbnail || '/images/placeholder.jpg'})`,
            }}
          />
          {news.category && (
            <Badge
              className="absolute top-3 left-3"
              style={{ backgroundColor: news.category.color || '#10b981' }}
            >
              {news.category.name}
            </Badge>
          )}
        </div>
        <CardContent className="p-4">
          <h3 className="font-bold text-lg mb-2 line-clamp-2 group-hover:text-emerald-600 transition-colors">
            {news.title}
          </h3>
          <p className="text-gray-600 text-sm line-clamp-2 mb-3">
            {news.excerpt}
          </p>
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDate(news.publishedAt)}
            </span>
            <span className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {news.viewCount}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
