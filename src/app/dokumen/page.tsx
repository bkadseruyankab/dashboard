'use client';

import { useState, useEffect } from 'react';
import PortalLayout from '@/components/portal/PortalLayout';
import DocumentCard from '@/components/portal/DocumentCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FileText,
  Search,
  Download,
  Calendar,
  FileIcon,
  Filter,
  Grid,
  List,
} from 'lucide-react';
import type { Document } from '@/components/portal/types';

export default function DokumenPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    fetch('/api/documents')
      .then((res) => res.json())
      .then(setDocuments)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Get unique types and categories
  const fileTypes = Array.from(new Set(documents.map((d) => d.fileType).filter(Boolean)));
  const categories = Array.from(new Set(documents.map((d) => d.category).filter(Boolean))) as string[];

  // Filter documents
  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.description?.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = selectedType === 'all' || doc.fileType === selectedType;
    const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory;
    return matchesSearch && matchesType && matchesCategory;
  });

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const getFileIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'pdf':
        return '📄';
      case 'doc':
      case 'docx':
        return '📝';
      case 'xls':
      case 'xlsx':
        return '📊';
      case 'ppt':
      case 'pptx':
        return '📊';
      default:
        return '📁';
    }
  };

  return (
    <PortalLayout>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-emerald-700 to-emerald-800 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl">
            <Badge className="bg-emerald-500/30 text-white mb-4">Dokumen</Badge>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Dokumen & Publikasi</h1>
            <p className="text-emerald-100">
              Akses dokumen keuangan daerah dan publikasi resmi BKAD Kabupaten Seruyan
            </p>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="py-6 bg-white border-b sticky top-[104px] z-30">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative w-full lg:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Cari dokumen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="flex flex-wrap gap-4 items-center">
              {/* File Type Filter */}
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Tipe File" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Tipe</SelectItem>
                  {fileTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.toUpperCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Category Filter */}
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Kategori</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* View Mode */}
              <div className="flex border rounded-lg overflow-hidden">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="icon"
                  className={viewMode === 'grid' ? 'bg-emerald-600' : ''}
                  onClick={() => setViewMode('grid')}
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="icon"
                  className={viewMode === 'list' ? 'bg-emerald-600' : ''}
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Documents */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
          ) : filteredDocuments.length > 0 ? (
            <>
              <p className="text-sm text-gray-500 mb-4">
                Menampilkan {filteredDocuments.length} dari {documents.length} dokumen
              </p>

              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredDocuments.map((doc) => (
                    <DocumentCard key={doc.id} document={doc} />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredDocuments.map((doc) => (
                    <Card key={doc.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <div className="bg-emerald-100 w-14 h-14 rounded-lg flex items-center justify-center text-2xl">
                            {getFileIcon(doc.fileType)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-gray-900 truncate">{doc.title}</h3>
                            <p className="text-sm text-gray-500 truncate">{doc.description}</p>
                            <div className="flex items-center gap-4 mt-1 text-xs text-gray-400">
                              <span className="uppercase">{doc.fileType}</span>
                              {doc.fileSize && <span>{formatFileSize(doc.fileSize)}</span>}
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatDate(doc.publishedAt)}
                              </span>
                              <span>{doc.downloadCount} unduhan</span>
                            </div>
                          </div>
                          <a
                            href={doc.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-shrink-0"
                          >
                            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                              <Download className="h-4 w-4 mr-2" />
                              Unduh
                            </Button>
                          </a>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">Tidak ada dokumen ditemukan</p>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedType('all');
                  setSelectedCategory('all');
                }}
              >
                Reset Filter
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Info Section */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Informasi Dokumen
            </h2>
            <p className="text-gray-600 mb-6">
              Dokumen yang tersedia di portal ini adalah dokumen publik yang dapat diakses oleh masyarakat.
              Untuk dokumen yang memerlukan autentikasi, silakan hubungi kantor BKAD.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="text-3xl font-bold text-emerald-600">{documents.length}</div>
                  <p className="text-gray-600 text-sm">Total Dokumen</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="text-3xl font-bold text-emerald-600">{fileTypes.length}</div>
                  <p className="text-gray-600 text-sm">Format File</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="text-3xl font-bold text-emerald-600">
                    {documents.reduce((sum, doc) => sum + (doc.downloadCount || 0), 0)}
                  </div>
                  <p className="text-gray-600 text-sm">Total Unduhan</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </PortalLayout>
  );
}
