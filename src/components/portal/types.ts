export interface News {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  thumbnail: string | null;
  categoryId: string | null;
  category: Category | null;
  author: { id: string; name: string | null };
  isFeatured: boolean;
  isPublished: boolean;
  viewCount: number;
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  order: number;
  _count?: { news: number };
}

export interface Banner {
  id: string;
  title: string;
  subtitle: string | null;
  imageUrl: string;
  link: string | null;
  order: number;
  isActive: boolean;
}

export interface Service {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  icon: string | null;
  link: string | null;
  order: number;
  isActive: boolean;
}

export interface Document {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  fileUrl: string;
  fileType: string;
  fileSize: number | null;
  thumbnail: string | null;
  category: string | null;
  downloadCount: number;
  publishedAt: string;
}

export interface Statistics {
  id: string;
  label: string;
  value: number;
  icon: string | null;
  description: string | null;
  order: number;
}

export type { Statistics as Statistic };

export interface QuickLink {
  id: string;
  title: string;
  url: string;
  icon: string | null;
  order: number;
  isActive: boolean;
}

export interface Organization {
  id: string;
  name: string;
  position: string;
  photo: string | null;
  description: string | null;
  email: string | null;
  phone: string | null;
  order: number;
  level: number;
}

export interface Gallery {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string;
  category: string | null;
  eventDate: string | null;
  isActive: boolean;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  link: string | null;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export interface SiteSettings {
  site_name: string;
  site_description: string;
  address: string;
  phone: string;
  email: string;
  working_hours: string;
}
