'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Menu,
  Search,
  ChevronDown,
  Phone,
  Mail,
  Clock,
  Building2,
  Newspaper,
  Briefcase,
  FileText,
  Image,
  Users,
  Info,
  Phone as PhoneIcon,
} from 'lucide-react';
import { Category } from './types';

interface HeaderProps {
  categories: Category[];
  settings: {
    site_name: string;
    phone: string;
    email: string;
    address: string;
    working_hours: string;
    site_logo?: string;
  };
}

const navigation = [
  { name: 'Beranda', href: '/' },
  {
    name: 'Profil',
    href: '/profil',
    children: [
      { name: 'Tentang BKAD', href: '/profil#tentang', icon: Info },
      { name: 'Visi & Misi', href: '/profil#visi-misi', icon: Building2 },
      { name: 'Struktur Organisasi', href: '/profil#struktur', icon: Users },
    ],
  },
  {
    name: 'Berita',
    href: '/berita',
    icon: Newspaper,
  },
  {
    name: 'Layanan',
    href: '/layanan',
    children: [
      { name: 'Semua Layanan', href: '/layanan', icon: Briefcase },
      { name: 'Prosedur Layanan', href: '/layanan#prosedur', icon: FileText },
    ],
  },
  { name: 'Dokumen', href: '/dokumen', icon: FileText },
  { name: 'Galeri', href: '/galeri', icon: Image },
  { name: 'Kontak', href: '/kontak', icon: PhoneIcon },
];

export default function Header({ categories, settings }: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/berita?search=${encodeURIComponent(searchQuery)}`;
    }
  };

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <header className={`sticky top-0 z-50 w-full bg-white transition-shadow ${isScrolled ? 'shadow-lg' : 'shadow-md'}`}>
      {/* Top bar */}
      <div className="bg-emerald-700 text-white">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between py-2 text-sm">
            <div className="hidden md:flex items-center gap-6">
              {settings?.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  <span>{settings.phone}</span>
                </div>
              )}
              {settings?.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <span>{settings.email}</span>
                </div>
              )}
              {settings?.working_hours && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>{settings.working_hours.split(',')[0]}</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-4 ml-auto">
              <Link href="/admin" className="hover:text-emerald-200 transition-colors">
                Admin
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between py-4">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3">
              {settings?.site_logo ? (
                <img 
                  src={settings.site_logo} 
                  alt={settings?.site_name || 'BKAD'}
                  className="h-12 w-12 object-contain"
                />
              ) : (
                <div className="bg-emerald-600 rounded-lg p-2">
                  <Building2 className="h-8 w-8 text-white" />
                </div>
              )}
              <div>
                <h1 className="text-xl font-bold text-gray-900">{settings?.site_name || 'BKAD Kabupaten Seruyan'}</h1>
                <p className="text-xs text-gray-500">Kabupaten Seruyan</p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              {navigation.map((item) => {
                if (item.name === 'Berita') {
                  return (
                    <DropdownMenu key={item.name}>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          className={`flex items-center gap-1 ${isActive(item.href) ? 'text-emerald-600' : ''}`}
                        >
                          {item.name}
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-56">
                        <DropdownMenuItem asChild>
                          <Link href="/berita" className="w-full flex items-center gap-2">
                            <Newspaper className="h-4 w-4" />
                            Semua Berita
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {categories.map((category) => (
                          <DropdownMenuItem key={category.id} asChild>
                            <Link href={`/berita?category=${category.slug}`} className="w-full">
                              {category.name}
                            </Link>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  );
                }

                if (item.children) {
                  return (
                    <DropdownMenu key={item.name}>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          className={`flex items-center gap-1 ${isActive(item.href) ? 'text-emerald-600' : ''}`}
                        >
                          {item.name}
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-56">
                        {item.children.map((child) => (
                          <DropdownMenuItem key={child.name} asChild>
                            <Link href={child.href} className="w-full flex items-center gap-2">
                              {child.icon && <child.icon className="h-4 w-4" />}
                              {child.name}
                            </Link>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  );
                }

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`px-4 py-2 font-medium transition-colors rounded-lg ${
                      isActive(item.href)
                        ? 'text-emerald-600 bg-emerald-50'
                        : 'text-gray-700 hover:text-emerald-600 hover:bg-gray-50'
                    }`}
                  >
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            {/* Search & Mobile Menu */}
            <div className="flex items-center gap-2">
              {/* Search */}
              <div className="relative">
                {isSearchOpen ? (
                  <form onSubmit={handleSearch} className="flex items-center gap-2">
                    <Input
                      type="text"
                      placeholder="Cari berita..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-48 md:w-64"
                      autoFocus
                    />
                    <Button type="submit" size="icon" variant="ghost">
                      <Search className="h-5 w-5" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => setIsSearchOpen(false)}
                    >
                      ×
                    </Button>
                  </form>
                ) : (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsSearchOpen(true)}
                  >
                    <Search className="h-5 w-5" />
                  </Button>
                )}
              </div>

              {/* Mobile Menu */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="lg:hidden">
                    <Menu className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-80 overflow-y-auto">
                  <nav className="flex flex-col gap-1 mt-8">
                    {navigation.map((item) => (
                      <div key={item.name}>
                        <Link
                          href={item.href}
                          className={`px-4 py-3 rounded-lg font-medium transition-colors ${
                            isActive(item.href)
                              ? 'bg-emerald-50 text-emerald-600'
                              : 'text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {item.name}
                        </Link>
                        {item.name === 'Berita' && (
                          <div className="ml-4 mt-1 space-y-1">
                            {categories.map((category) => (
                              <Link
                                key={category.id}
                                href={`/berita?category=${category.slug}`}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg block text-sm"
                              >
                                {category.name}
                              </Link>
                            ))}
                          </div>
                        )}
                        {item.children && item.name !== 'Berita' && (
                          <div className="ml-4 mt-1 space-y-1">
                            {item.children.map((child) => (
                              <Link
                                key={child.name}
                                href={child.href}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg block text-sm"
                              >
                                {child.name}
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                    
                    <div className="border-t my-4 pt-4">
                      <p className="px-4 text-sm font-medium text-gray-500 mb-2">Informasi</p>
                      <div className="space-y-2 text-sm">
                        {settings?.phone && (
                          <div className="px-4 text-gray-600 flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            {settings.phone}
                          </div>
                        )}
                        {settings?.email && (
                          <div className="px-4 text-gray-600 flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            {settings.email}
                          </div>
                        )}
                      </div>
                    </div>
                  </nav>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
