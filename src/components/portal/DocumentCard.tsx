import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  FileText,
  Download,
  Calendar,
  FileSpreadsheet,
  FileImage,
} from 'lucide-react';
import { Document } from './types';

interface DocumentCardProps {
  document: Document;
}

const fileTypeIcons: Record<string, React.ElementType> = {
  pdf: FileText,
  xls: FileSpreadsheet,
  xlsx: FileSpreadsheet,
  doc: FileText,
  docx: FileText,
  jpg: FileImage,
  jpeg: FileImage,
  png: FileImage,
};

const fileTypeColors: Record<string, string> = {
  pdf: 'bg-red-500',
  xls: 'bg-green-500',
  xlsx: 'bg-green-500',
  doc: 'bg-blue-500',
  docx: 'bg-blue-500',
  jpg: 'bg-purple-500',
  jpeg: 'bg-purple-500',
  png: 'bg-purple-500',
};

export default function DocumentCard({ document }: DocumentCardProps) {
  const Icon = fileTypeIcons[document.fileType.toLowerCase()] || FileText;
  const colorClass = fileTypeColors[document.fileType.toLowerCase()] || 'bg-gray-500';

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  return (
    <Card className="group h-full hover:shadow-lg transition-all duration-300">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className={`${colorClass} p-3 rounded-lg text-white`}>
            <Icon className="h-6 w-6" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-base mb-1 line-clamp-2 group-hover:text-emerald-600 transition-colors">
              {document.title}
            </h3>
            <p className="text-gray-500 text-sm line-clamp-2 mb-2">
              {document.description}
            </p>
            <div className="flex items-center gap-3 text-xs text-gray-400 mb-3">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDate(document.publishedAt)}
              </span>
              <span className="uppercase">{document.fileType}</span>
              {document.fileSize && <span>{formatFileSize(document.fileSize)}</span>}
            </div>
            <div className="flex items-center justify-between">
              <Badge variant="secondary" className="text-xs">
                <Download className="h-3 w-3 mr-1" />
                {document.downloadCount}
              </Badge>
              <Button size="sm" variant="outline" asChild>
                <a href={document.fileUrl} target="_blank" rel="noopener noreferrer">
                  <Download className="h-4 w-4 mr-1" />
                  Unduh
                </a>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
