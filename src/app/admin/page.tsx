'use client';

import { useEffect, useState, useMemo, Suspense } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Home,
  FileText,
  FolderOpen,
  Image,
  Settings,
  Menu,
  Bell,
  Search,
  LogOut,
  User,
  ChevronDown,
  ChevronLeft,
  Building2,
  Eye,
  MessageSquare,
  ExternalLink,
  Download,
  Users,
  Link2,
  Calendar,
  BarChart3,
  Layers,
  Database,
  Layout,
  ChevronRight,
  X,
  UserCog,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

// Import tab components
import NewsTab from './tabs/NewsTab';
import CategoriesTab from './tabs/CategoriesTab';
import BannersTab from './tabs/BannersTab';
import ServicesTab from './tabs/ServicesTab';
import DocumentsTab from './tabs/DocumentsTab';
import GalleryTab from './tabs/GalleryTab';
import OrganizationTab from './tabs/OrganizationTab';
import SettingsTab from './tabs/SettingsTab';
import QuickLinksTab from './tabs/QuickLinksTab';
import UsersTab from './tabs/UsersTab';
import StatisticsTab from './tabs/StatisticsTab';

// Menu Item Type
interface MenuItem {
  name: string;
  icon: React.ElementType;
  href?: string;
  id?: string;
  children?: MenuItem[];
  badge?: number;
}

// Menu Configuration
const menuConfig: MenuItem[] = [
  {
    name: 'Dashboard',
    icon: Home,
    href: '/admin',
    id: 'dashboard',
  },
  {
    name: 'Konten',
    icon: Layers,
    children: [
      { name: 'Berita', icon: FileText, href: '/admin?tab=news', id: 'news' },
      { name: 'Kategori', icon: FolderOpen, href: '/admin?tab=categories', id: 'categories' },
      { name: 'Banner', icon: Image, href: '/admin?tab=banners', id: 'banners' },
      { name: 'Galeri', icon: Image, href: '/admin?tab=gallery', id: 'gallery' },
    ],
  },
  {
    name: 'Layanan',
    icon: Settings,
    children: [
      { name: 'Daftar Layanan', icon: Layout, href: '/admin?tab=services', id: 'services' },
      { name: 'Dokumen', icon: Download, href: '/admin?tab=documents', id: 'documents' },
      { name: 'Tautan Cepat', icon: Link2, href: '/admin?tab=quicklinks', id: 'quicklinks' },
    ],
  },
  {
    name: 'Organisasi',
    icon: Users,
    href: '/admin?tab=organization',
    id: 'organization',
  },
  {
    name: 'Pengguna',
    icon: UserCog,
    href: '/admin?tab=users',
    id: 'users',
  },
  {
    name: 'Statistik',
    icon: BarChart3,
    href: '/admin?tab=statistics',
    id: 'statistics',
  },
  {
    name: 'Pengaturan',
    icon: Settings,
    href: '/admin?tab=settings',
    id: 'settings',
  },
];

// Sidebar Menu Item Component
function SidebarMenuItem({ 
  item, 
  activeMenu, 
  isCollapsed,
  onNavigate 
}: { 
  item: MenuItem; 
  activeMenu: string;
  isCollapsed: boolean;
  onNavigate?: () => void;
}) {
  const hasChildren = item.children && item.children.length > 0;
  const isActive = item.id === activeMenu;
  const hasActiveChild = item.children?.some(child => child.id === activeMenu);
  
  // Calculate initial open state based on active child
  const [isOpen, setIsOpen] = useState(() => hasActiveChild ?? false);

  if (hasChildren) {
    return (
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <button
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left",
              hasActiveChild 
                ? "bg-emerald-600/20 text-emerald-400" 
                : "text-gray-300 hover:bg-gray-700 hover:text-white",
              isCollapsed && "justify-center"
            )}
          >
            <item.icon className="h-5 w-5 flex-shrink-0" />
            {!isCollapsed && (
              <>
                <span className="flex-1">{item.name}</span>
                <ChevronRight 
                  className={cn(
                    "h-4 w-4 transition-transform",
                    isOpen && "rotate-90"
                  )} 
                />
              </>
            )}
          </button>
        </CollapsibleTrigger>
        {!isCollapsed && (
          <CollapsibleContent className="ml-4 mt-1 space-y-1">
            {item.children!.map((child) => (
              <Link
                key={child.id}
                href={child.href!}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-sm",
                  child.id === activeMenu
                    ? "bg-emerald-600 text-white"
                    : "text-gray-400 hover:bg-gray-700 hover:text-white"
                )}
              >
                <child.icon className="h-4 w-4" />
                <span>{child.name}</span>
                {child.badge && (
                  <Badge className="ml-auto bg-red-500 text-xs">{child.badge}</Badge>
                )}
              </Link>
            ))}
          </CollapsibleContent>
        )}
      </Collapsible>
    );
  }

  return (
    <Link
      href={item.href!}
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all",
        isActive
          ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/30"
          : "text-gray-300 hover:bg-gray-700 hover:text-white",
        isCollapsed && "justify-center"
      )}
    >
      <item.icon className="h-5 w-5 flex-shrink-0" />
      {!isCollapsed && (
        <>
          <span>{item.name}</span>
          {item.badge && (
            <Badge className="ml-auto bg-red-500 text-xs">{item.badge}</Badge>
          )}
        </>
      )}
    </Link>
  );
}

// AdminLTE-style Sidebar Component
function AdminSidebar({ 
  activeMenu, 
  isCollapsed, 
  onToggle,
  isMobileOpen,
  onMobileClose
}: { 
  activeMenu: string;
  isCollapsed: boolean;
  onToggle: () => void;
  isMobileOpen: boolean;
  onMobileClose: () => void;
}) {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed left-0 top-0 h-screen bg-gray-800 z-50 flex flex-col transition-all duration-300",
          isCollapsed ? "w-20" : "w-64",
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 bg-gray-900 border-b border-gray-700">
          <Link href="/admin" className="flex items-center gap-3">
            <div className="bg-emerald-600 rounded-lg p-1.5">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            {!isCollapsed && (
              <div>
                <h1 className="font-bold text-white text-sm leading-tight">BKAD</h1>
                <p className="text-gray-400 text-xs">Admin Panel</p>
              </div>
            )}
          </Link>
          <button
            onClick={onMobileClose}
            className="lg:hidden text-gray-400 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* User Panel */}
        {!isCollapsed && (
          <div className="p-4 border-b border-gray-700">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-600 rounded-full p-2">
                <User className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium text-sm truncate">Administrator</p>
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  <span className="text-gray-400 text-xs">Online</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search */}
        {!isCollapsed && (
          <div className="p-3 border-b border-gray-700">
            <div className="relative">
              <Input
                type="text"
                placeholder="Cari menu..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 pr-10 h-9 text-sm"
              />
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {/* Quick Link to Portal */}
          <Link
            href="/"
            target="_blank"
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all bg-gray-700/50 text-emerald-400 hover:bg-gray-700 hover:text-emerald-300",
              isCollapsed && "justify-center"
            )}
          >
            <ExternalLink className="h-5 w-5" />
            {!isCollapsed && <span>Lihat Portal</span>}
          </Link>

          <div className="h-px bg-gray-700 my-3" />

          {/* Menu Items */}
          {menuConfig.map((item) => (
            <SidebarMenuItem 
              key={item.name} 
              item={item} 
              activeMenu={activeMenu}
              isCollapsed={isCollapsed}
              onNavigate={onMobileClose}
            />
          ))}
        </nav>

        {/* Collapse Button (Desktop) */}
        <button
          onClick={onToggle}
          className="hidden lg:flex items-center justify-center gap-2 p-3 border-t border-gray-700 text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
        >
          {isCollapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <>
              <ChevronLeft className="h-5 w-5" />
              <span className="text-sm">Collapse</span>
            </>
          )}
        </button>

        {/* Version Info */}
        {!isCollapsed && (
          <div className="p-3 border-t border-gray-700 text-center">
            <p className="text-gray-500 text-xs">BKAD Portal v1.0.0</p>
            <p className="text-gray-600 text-xs">© 2024 Kab. Seruyan</p>
          </div>
        )}
      </aside>
    </>
  );
}

// Dashboard Stats
function DashboardStats() {
  const [stats, setStats] = useState({
    newsCount: 0,
    categoryCount: 0,
    viewCount: 0,
    documentCount: 0,
    galleryCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [newsRes, categoriesRes, documentsRes, galleryRes] = await Promise.all([
          fetch('/api/news?limit=100'),
          fetch('/api/categories'),
          fetch('/api/documents?limit=100'),
          fetch('/api/gallery?limit=100'),
        ]);
        
        const newsData = await newsRes.json();
        const categoriesData = await categoriesRes.json();
        const documentsData = await documentsRes.json();
        const galleryData = await galleryRes.json();
        
        const totalViews = (newsData.data || []).reduce((acc: number, n: { viewCount: number }) => acc + n.viewCount, 0);
        
        setStats({
          newsCount: (newsData.data || []).length,
          categoryCount: categoriesData.length,
          viewCount: totalViews,
          documentCount: documentsData.length,
          galleryCount: galleryData.length,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStats();
  }, []);

  const statCards = [
    { title: 'Total Berita', value: stats.newsCount, icon: FileText, color: 'bg-blue-500', id: 'news' },
    { title: 'Kategori', value: stats.categoryCount, icon: FolderOpen, color: 'bg-green-500', id: 'categories' },
    { title: 'Total Dilihat', value: stats.viewCount, icon: Eye, color: 'bg-yellow-500', id: 'views' },
    { title: 'Dokumen', value: stats.documentCount, icon: Download, color: 'bg-purple-500', id: 'documents' },
    { title: 'Galeri', value: stats.galleryCount, icon: Image, color: 'bg-pink-500', id: 'gallery' },
    { title: 'Pesan', value: 0, icon: MessageSquare, color: 'bg-red-500', id: 'messages' },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
      {statCards.map((stat) => (
        <Card key={stat.id} className="overflow-hidden hover:shadow-lg transition-shadow">
          <CardContent className="p-0">
            <div className="flex items-center">
              <div className={`${stat.color} p-4`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1 p-3">
                <p className="text-gray-500 text-xs">{stat.title}</p>
                <p className="text-xl font-bold">{stat.value.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Recent News List
function RecentNewsList() {
  const [news, setNews] = useState<Array<{
    id: string;
    title: string;
    publishedAt: string;
    viewCount: number;
  }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const res = await fetch('/api/news?limit=5');
        const data = await res.json();
        setNews(data.data || []);
      } catch (error) {
        console.error('Error fetching news:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchNews();
  }, []);

  if (loading) {
    return <Skeleton className="h-48" />;
  }

  return (
    <div className="space-y-3">
      {news.map((item) => (
        <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{item.title}</p>
            <p className="text-xs text-gray-500">
              {new Date(item.publishedAt).toLocaleDateString('id-ID')}
            </p>
          </div>
          <Badge variant="secondary" className="ml-2">
            <Eye className="h-3 w-3 mr-1" />
            {item.viewCount}
          </Badge>
        </div>
      ))}
      {news.length === 0 && (
        <p className="text-center text-gray-500 py-4">Belum ada berita</p>
      )}
    </div>
  );
}

// Dashboard Component
function DashboardContent() {
  return (
    <>
      {/* Stats */}
      <DashboardStats />

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Recent News */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg">Berita Terbaru</CardTitle>
            <Link href="/admin?tab=news">
              <Button variant="ghost" size="sm">Lihat Semua</Button>
            </Link>
          </CardHeader>
          <CardContent>
            <RecentNewsList />
          </CardContent>
        </Card>

        {/* Quick Links */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Aksi Cepat</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Link href="/admin?tab=news">
                <Button variant="outline" className="w-full justify-start h-auto py-3">
                  <FileText className="h-5 w-5 mr-2 text-blue-500" />
                  <div className="text-left">
                    <p className="font-medium">Tambah Berita</p>
                    <p className="text-xs text-gray-500">Buat berita baru</p>
                  </div>
                </Button>
              </Link>
              <Link href="/admin?tab=categories">
                <Button variant="outline" className="w-full justify-start h-auto py-3">
                  <FolderOpen className="h-5 w-5 mr-2 text-green-500" />
                  <div className="text-left">
                    <p className="font-medium">Kelola Kategori</p>
                    <p className="text-xs text-gray-500">Atur kategori berita</p>
                  </div>
                </Button>
              </Link>
              <Link href="/admin?tab=banners">
                <Button variant="outline" className="w-full justify-start h-auto py-3">
                  <Image className="h-5 w-5 mr-2 text-purple-500" />
                  <div className="text-left">
                    <p className="font-medium">Kelola Banner</p>
                    <p className="text-xs text-gray-500">Atur slider utama</p>
                  </div>
                </Button>
              </Link>
              <Link href="/admin?tab=gallery">
                <Button variant="outline" className="w-full justify-start h-auto py-3">
                  <Image className="h-5 w-5 mr-2 text-pink-500" />
                  <div className="text-left">
                    <p className="font-medium">Kelola Galeri</p>
                    <p className="text-xs text-gray-500">Upload foto kegiatan</p>
                  </div>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

// Breadcrumb Component
function Breadcrumb({ activeMenu }: { activeMenu: string }) {
  const getPageTitle = () => {
    switch (activeMenu) {
      case 'news': return 'Berita';
      case 'categories': return 'Kategori';
      case 'banners': return 'Banner';
      case 'services': return 'Layanan';
      case 'documents': return 'Dokumen';
      case 'gallery': return 'Galeri';
      case 'organization': return 'Organisasi';
      case 'users': return 'Pengguna';
      case 'statistics': return 'Statistik';
      case 'settings': return 'Pengaturan';
      case 'quicklinks': return 'Tautan Cepat';
      default: return 'Dashboard';
    }
  };

  return (
    <nav className="flex items-center gap-2 text-sm text-gray-600 mb-4">
      <Link href="/admin" className="hover:text-emerald-600">Home</Link>
      <ChevronRight className="h-4 w-4" />
      <span className="text-gray-900 font-medium">{getPageTitle()}</span>
    </nav>
  );
}

// Main Admin Page Component
function AdminPageContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  
  // Use useMemo to compute activeMenu from URL params
  const activeMenu = useMemo(() => {
    const tab = searchParams.get('tab');
    return tab || 'dashboard';
  }, [searchParams]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const renderContent = () => {
    switch (activeMenu) {
      case 'news':
        return <NewsTab />;
      case 'categories':
        return <CategoriesTab />;
      case 'banners':
        return <BannersTab />;
      case 'services':
        return <ServicesTab />;
      case 'documents':
        return <DocumentsTab />;
      case 'gallery':
        return <GalleryTab />;
      case 'organization':
        return <OrganizationTab />;
      case 'users':
        return <UsersTab />;
      case 'statistics':
        return <StatisticsTab />;
      case 'settings':
        return <SettingsTab />;
      case 'quicklinks':
        return <QuickLinksTab />;
      default:
        return <DashboardContent />;
    }
  };

  const getPageTitle = () => {
    switch (activeMenu) {
      case 'news': return 'Manajemen Berita';
      case 'categories': return 'Manajemen Kategori';
      case 'banners': return 'Manajemen Banner';
      case 'services': return 'Manajemen Layanan';
      case 'documents': return 'Manajemen Dokumen';
      case 'gallery': return 'Manajemen Galeri';
      case 'organization': return 'Struktur Organisasi';
      case 'users': return 'Manajemen Pengguna';
      case 'statistics': return 'Manajemen Statistik';
      case 'settings': return 'Pengaturan Situs';
      case 'quicklinks': return 'Tautan Cepat';
      default: return 'Dashboard';
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top Navbar */}
      <nav className={cn(
        "fixed top-0 right-0 h-16 bg-gradient-to-r from-emerald-700 to-emerald-600 z-40 flex items-center justify-between px-4 shadow-lg transition-all duration-300",
        isSidebarCollapsed ? "left-20" : "left-64",
        "lg:left-64",
        isSidebarCollapsed && "lg:left-20"
      )}>
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-emerald-600"
            onClick={() => setIsMobileOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </Button>
          <div className="hidden sm:block">
            <h1 className="font-bold text-lg text-white">{getPageTitle()}</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Portal Link */}
          <Link href="/" target="_blank">
            <Button variant="ghost" size="sm" className="text-white hover:bg-emerald-600 gap-2">
              <ExternalLink className="h-4 w-4" />
              <span className="hidden md:inline">Lihat Portal</span>
            </Button>
          </Link>

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-white hover:bg-emerald-600 relative">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-xs flex items-center justify-center text-white">
                  3
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Notifikasi</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <div className="flex flex-col">
                  <p className="font-medium">Berita baru dipublikasikan</p>
                  <p className="text-xs text-gray-500">5 menit yang lalu</p>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <div className="flex flex-col">
                  <p className="font-medium">Pesan baru dari pengunjung</p>
                  <p className="text-xs text-gray-500">1 jam yang lalu</p>
                </div>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-center text-emerald-600">
                Lihat Semua Notifikasi
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="text-white hover:bg-emerald-600 gap-2">
                <div className="bg-white/20 rounded-full p-1">
                  <User className="h-5 w-5" />
                </div>
                <span className="hidden md:inline">{session.user?.name || 'Admin'}</span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex items-center gap-3">
                  <div className="bg-emerald-100 rounded-full p-2">
                    <User className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-medium">{session.user?.name}</p>
                    <p className="text-xs text-gray-500">{session.user?.email}</p>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="h-4 w-4 mr-2" />
                Profil Saya
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="h-4 w-4 mr-2" />
                Pengaturan
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => signOut({ callbackUrl: '/admin/login' })}
                className="text-red-600"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Keluar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </nav>

      {/* Sidebar */}
      <AdminSidebar 
        activeMenu={activeMenu}
        isCollapsed={isSidebarCollapsed}
        onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        isMobileOpen={isMobileOpen}
        onMobileClose={() => setIsMobileOpen(false)}
      />

      {/* Main Content */}
      <main 
        className={cn(
          "pt-16 min-h-screen transition-all duration-300",
          isSidebarCollapsed ? "lg:ml-20" : "lg:ml-64"
        )}
      >
        <div className="p-4 md:p-6">
          {/* Breadcrumb */}
          <Breadcrumb activeMenu={activeMenu} />

          {/* Page Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-800">{getPageTitle()}</h1>
            <p className="text-gray-600 text-sm">Panel Admin BKAD Kabupaten Seruyan</p>
          </div>

          {/* Content */}
          {renderContent()}
        </div>
      </main>

      {/* Footer */}
      <footer 
        className={cn(
          "bg-white border-t py-4 px-6 transition-all duration-300",
          isSidebarCollapsed ? "lg:ml-20" : "lg:ml-64"
        )}
      >
        <div className="flex flex-col md:flex-row items-center justify-between gap-2 text-sm text-gray-500">
          <p>© 2024 BKAD Kabupaten Seruyan. All rights reserved.</p>
          <p>Version 1.0.0</p>
        </div>
      </footer>
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    }>
      <AdminPageContent />
    </Suspense>
  );
}
