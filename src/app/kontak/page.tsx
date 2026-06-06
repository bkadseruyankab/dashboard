'use client';

import { useState, useEffect } from 'react';
import PortalLayout from '@/components/portal/PortalLayout';
import ContactForm from '@/components/portal/ContactForm';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  Building2,
  Phone,
  Mail,
  MapPin,
  Clock,
  Send,
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  MessageSquare,
} from 'lucide-react';

interface SiteSettings {
  site_name: string;
  site_description: string;
  address: string;
  phone: string;
  email: string;
  working_hours: string;
}

export default function KontakPage() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetch('/api/settings')
      .then((res) => res.json())
      .then(setSettings)
      .catch(console.error);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast({
          title: 'Pesan Terkirim',
          description: 'Terima kasih! Pesan Anda telah kami terima dan akan segera diproses.',
        });
        setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
      } else {
        throw new Error('Failed to send message');
      }
    } catch (error) {
      toast({
        title: 'Gagal Mengirim',
        description: 'Maaf, terjadi kesalahan. Silakan coba lagi atau hubungi kami langsung.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const contactInfo = [
    {
      icon: MapPin,
      title: 'Alamat',
      content: settings?.address || 'Jl. H. M. Tahir, Kuala Pembuang, Kab. Seruyan, Kalimantan Tengah',
    },
    {
      icon: Phone,
      title: 'Telepon',
      content: settings?.phone || '(0532) 123456',
    },
    {
      icon: Mail,
      title: 'Email',
      content: settings?.email || 'bkad@seruyankab.go.id',
    },
    {
      icon: Clock,
      title: 'Jam Kerja',
      content: settings?.working_hours || 'Senin - Jumat: 08:00 - 16:00 WIB',
    },
  ];

  const socialMedia = [
    { icon: Facebook, name: 'Facebook', url: '#', color: 'hover:bg-blue-600' },
    { icon: Twitter, name: 'Twitter', url: '#', color: 'hover:bg-sky-500' },
    { icon: Instagram, name: 'Instagram', url: '#', color: 'hover:bg-pink-600' },
    { icon: Youtube, name: 'YouTube', url: '#', color: 'hover:bg-red-600' },
  ];

  return (
    <PortalLayout>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-emerald-700 to-emerald-800 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl">
            <Badge className="bg-emerald-500/30 text-white mb-4">Kontak</Badge>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Hubungi Kami</h1>
            <p className="text-emerald-100">
              Kami siap membantu Anda. Silakan hubungi kami melalui berbagai saluran komunikasi yang tersedia.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="bg-emerald-100 p-3 rounded-full">
                      <MessageSquare className="h-6 w-6 text-emerald-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Kirim Pesan</h2>
                      <p className="text-gray-600 text-sm">Isi formulir di bawah untuk mengirim pesan</p>
                    </div>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Nama Lengkap *
                        </label>
                        <Input
                          type="text"
                          required
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="Masukkan nama lengkap"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email *
                        </label>
                        <Input
                          type="email"
                          required
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="email@contoh.com"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          No. Telepon
                        </label>
                        <Input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="08xx-xxxx-xxxx"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Subjek *
                        </label>
                        <Input
                          type="text"
                          required
                          value={formData.subject}
                          onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                          placeholder="Subjek pesan"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Pesan *
                      </label>
                      <Textarea
                        required
                        rows={5}
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        placeholder="Tulis pesan Anda di sini..."
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-emerald-600 hover:bg-emerald-700"
                      disabled={submitting}
                    >
                      {submitting ? (
                        'Mengirim...'
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          Kirim Pesan
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Contact Info */}
            <div className="space-y-6">
              {/* Info Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {contactInfo.map((item, index) => (
                  <Card key={index}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="bg-emerald-100 p-2 rounded-lg">
                          <item.icon className="h-5 w-5 text-emerald-600" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">{item.title}</h3>
                          <p className="text-gray-600 text-sm">{item.content}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Map */}
              <Card className="overflow-hidden">
                <div className="h-64 bg-gray-200 flex items-center justify-center relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-100 to-emerald-200">
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <MapPin className="h-12 w-12 text-emerald-600 mx-auto mb-2" />
                        <p className="text-emerald-800 font-medium">Lokasi BKAD</p>
                        <p className="text-emerald-600 text-sm">Kabupaten Seruyan</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Social Media */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-bold text-gray-900 mb-4">Media Sosial</h3>
                  <div className="flex gap-3">
                    {socialMedia.map((item, index) => (
                      <a
                        key={index}
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`bg-gray-100 p-3 rounded-lg transition-colors ${item.color} hover:text-white`}
                      >
                        <item.icon className="h-5 w-5" />
                      </a>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Contact */}
              <Card className="bg-emerald-50 border-emerald-200">
                <CardContent className="p-6">
                  <h3 className="font-bold text-gray-900 mb-2">Butuh Respon Cepat?</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Untuk keperluan mendesak, silakan hubungi langsung melalui telepon pada jam kerja.
                  </p>
                  <a href={`tel:${settings?.phone}`}>
                    <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
                      <Phone className="mr-2 h-4 w-4" />
                      Hubungi Sekarang
                    </Button>
                  </a>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <Badge variant="secondary" className="mb-4">FAQ</Badge>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
              Pertanyaan Umum
            </h2>
          </div>

          <div className="max-w-3xl mx-auto space-y-4">
            {[
              {
                q: 'Bagaimana cara mengajukan permohonan informasi?',
                a: 'Anda dapat mengajukan permohonan informasi melalui formulir kontak di atas atau mengunjungi kantor BKAD langsung pada jam kerja.',
              },
              {
                q: 'Berapa lama waktu respon untuk pesan yang dikirim?',
                a: 'Kami akan berusaha merespon pesan Anda dalam waktu 1-3 hari kerja. Untuk keperluan mendesak, silakan hubungi telepon kantor.',
              },
              {
                q: 'Apakah ada biaya untuk layanan informasi?',
                a: 'Layanan informasi publik dasar tidak dipungut biaya. Untuk layanan tertentu, biaya sesuai peraturan yang berlaku.',
              },
            ].map((faq, index) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <h3 className="font-bold text-gray-900 mb-2">{faq.q}</h3>
                  <p className="text-gray-600">{faq.a}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </PortalLayout>
  );
}
