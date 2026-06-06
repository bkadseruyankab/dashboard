import Link from 'next/link';
import Image from 'next/image';
import {
  Building2,
  Phone,
  Mail,
  MapPin,
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  ExternalLink,
} from 'lucide-react';
import { QuickLink } from './types';

interface FooterProps {
  settings: {
    site_name: string;
    site_description: string;
    address: string;
    phone: string;
    email: string;
    working_hours: string;
    site_logo?: string;
  };
  quickLinks: QuickLink[];
}

export default function Footer({ settings, quickLinks }: FooterProps) {
  const currentYear = new Date().getFullYear();

  const mainLinks = [
    { name: 'Beranda', href: '/' },
    { name: 'Profil', href: '/profil' },
    { name: 'Berita', href: '/berita' },
    { name: 'Layanan', href: '/layanan' },
    { name: 'Dokumen', href: '/dokumen' },
    { name: 'Galeri', href: '/galeri' },
    { name: 'Kontak', href: '/kontak' },
  ];

  const profileLinks = [
    { name: 'Tentang BKAD', href: '/profil#tentang' },
    { name: 'Visi & Misi', href: '/profil#visi-misi' },
    { name: 'Struktur Organisasi', href: '/profil#struktur' },
    { name: 'Tugas & Fungsi', href: '/profil#tugas' },
  ];

  return (
    <footer className="bg-gray-900 text-white">
      {/* Main Footer */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* About */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              {settings?.site_logo ? (
                <Image 
                  src={settings.site_logo} 
                  alt={settings?.site_name || 'Logo'}
                  width={48}
                  height={48}
                  className="rounded-lg"
                />
              ) : (
                <div className="bg-emerald-600 rounded-lg p-2">
                  <Building2 className="h-6 w-6 text-white" />
                </div>
              )}
              <div>
                <h3 className="font-bold text-lg">{settings?.site_name || 'BKAD Kabupaten Seruyan'}</h3>
              </div>
            </div>
            <p className="text-gray-400 text-sm mb-4">
              {settings?.site_description || 'Badan Keuangan dan Aset Daerah Kabupaten Seruyan'}
            </p>
            <div className="flex gap-3">
              <a href="#" className="bg-gray-800 p-2 rounded-lg hover:bg-emerald-600 transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="bg-gray-800 p-2 rounded-lg hover:bg-emerald-600 transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="bg-gray-800 p-2 rounded-lg hover:bg-emerald-600 transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="bg-gray-800 p-2 rounded-lg hover:bg-emerald-600 transition-colors">
                <Youtube className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Navigation Links */}
          <div>
            <h3 className="font-bold text-lg mb-4">Navigasi</h3>
            <ul className="space-y-2">
              {mainLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-gray-400 hover:text-emerald-400 transition-colors flex items-center gap-2"
                  >
                    <span className="text-emerald-500">→</span> {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Profile Links */}
          <div>
            <h3 className="font-bold text-lg mb-4">Profil</h3>
            <ul className="space-y-2">
              {profileLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-gray-400 hover:text-emerald-400 transition-colors flex items-center gap-2"
                  >
                    <span className="text-emerald-500">→</span> {link.name}
                  </Link>
                </li>
              ))}
            </ul>

            <h3 className="font-bold text-lg mb-4 mt-6">Tautan Luar</h3>
            <ul className="space-y-2">
              {quickLinks.slice(0, 4).map((link) => (
                <li key={link.id}>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-emerald-400 transition-colors flex items-center gap-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    {link.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-bold text-lg mb-4">Kontak Kami</h3>
            <ul className="space-y-4">
              {settings?.address && (
                <li className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-400 text-sm">{settings.address}</span>
                </li>
              )}
              {settings?.phone && (
                <li className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                  <a href={`tel:${settings.phone}`} className="text-gray-400 text-sm hover:text-emerald-400">
                    {settings.phone}
                  </a>
                </li>
              )}
              {settings?.email && (
                <li className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                  <a href={`mailto:${settings.email}`} className="text-gray-400 text-sm hover:text-emerald-400">
                    {settings.email}
                  </a>
                </li>
              )}
            </ul>

            {/* Working Hours */}
            {settings?.working_hours && (
              <div className="mt-6 p-4 bg-gray-800 rounded-lg">
                <h4 className="font-medium text-white mb-2">Jam Kerja</h4>
                <p className="text-gray-400 text-sm">{settings.working_hours}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="border-t border-gray-800">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-gray-400 text-sm text-center md:text-left">
              © {currentYear} {settings?.site_name || 'BKAD Kabupaten Seruyan'}. Hak Cipta Dilindungi.
            </p>
            <div className="flex items-center gap-4 text-sm text-gray-400">
              <Link href="#" className="hover:text-emerald-400 transition-colors">
                Kebijakan Privasi
              </Link>
              <span>|</span>
              <Link href="#" className="hover:text-emerald-400 transition-colors">
                Syarat & Ketentuan
              </Link>
              <span>|</span>
              <Link href="/sitemap" className="hover:text-emerald-400 transition-colors">
                Peta Situs
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
