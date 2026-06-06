'use client';

import { useState, useEffect } from 'react';
import Header from './Header';
import Footer from './Footer';
import AnnouncementBar from './AnnouncementBar';
import { Skeleton } from '@/components/ui/skeleton';
import { Category } from './types';

interface SiteSettings {
  site_name: string;
  site_description: string;
  address: string;
  phone: string;
  email: string;
  working_hours: string;
  site_logo?: string;
}

interface QuickLink {
  id: string;
  title: string;
  url: string;
}

interface PortalLayoutProps {
  children: React.ReactNode;
}

export default function PortalLayout({ children }: PortalLayoutProps) {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [quickLinks, setQuickLinks] = useState<QuickLink[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [settingsRes, categoriesRes, quickLinksRes] = await Promise.all([
          fetch('/api/settings'),
          fetch('/api/categories'),
          fetch('/api/quicklinks'),
        ]);

        const settingsData = await settingsRes.json();
        const categoriesData = await categoriesRes.json();
        const quickLinksData = await quickLinksRes.json();

        setSettings(settingsData);
        setCategories(categoriesData);
        setQuickLinks(quickLinksData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <div className="bg-emerald-700 h-8" />
        <div className="bg-white border-b py-4 px-4">
          <div className="container mx-auto flex items-center justify-between">
            <Skeleton className="h-12 w-64" />
            <Skeleton className="h-8 w-96" />
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {settings && <Header categories={categories} settings={settings} />}
      <AnnouncementBar />
      <main className="flex-1">{children}</main>
      {settings && <Footer settings={settings} quickLinks={quickLinks} />}
    </div>
  );
}
