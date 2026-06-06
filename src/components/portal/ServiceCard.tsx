import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import {
  FileText,
  Building2,
  BarChart3,
  Receipt,
  CreditCard,
  MessageSquare,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { Service } from './types';

interface ServiceCardProps {
  service: Service;
  showDetail?: boolean;
}

const iconMap: Record<string, React.ElementType> = {
  'file-text': FileText,
  'building-2': Building2,
  'bar-chart-3': BarChart3,
  receipt: Receipt,
  'credit-card': CreditCard,
  'message-square': MessageSquare,
};

export default function ServiceCard({ service, showDetail }: ServiceCardProps) {
  const Icon = iconMap[service.icon || 'file-text'] || FileText;

  // If showDetail is true, link to internal detail page
  // Otherwise use the external link if available
  const href = showDetail ? `/layanan/${service.slug}` : (service.link || `/layanan/${service.slug}`);
  const isExternal = !showDetail && service.link && service.link.startsWith('http');

  const cardContent = (
    <Card className="group h-full hover:shadow-lg transition-all duration-300 border-2 hover:border-emerald-500 bg-gradient-to-br from-white to-gray-50">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="bg-emerald-100 p-3 rounded-xl group-hover:bg-emerald-600 transition-colors">
            <Icon className="h-6 w-6 text-emerald-600 group-hover:text-white transition-colors" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg mb-1 group-hover:text-emerald-600 transition-colors">
              {service.title}
            </h3>
            <p className="text-gray-600 text-sm mb-3">
              {service.description}
            </p>
            <span className="inline-flex items-center text-sm text-emerald-600 font-medium group-hover:text-emerald-700">
              {isExternal ? (
                <>
                  Akses Layanan
                  <ExternalLink className="ml-1 h-4 w-4" />
                </>
              ) : (
                <>
                  Selengkapnya
                  <ArrowRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (isExternal) {
    return (
      <a href={service.link} target="_blank" rel="noopener noreferrer">
        {cardContent}
      </a>
    );
  }

  return <Link href={href}>{cardContent}</Link>;
}
