import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Hash password using SHA-256 (same as auth.ts)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password } = body;

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email dan password harus diisi' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password minimal 6 karakter' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email sudah terdaftar' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await db.user.create({
      data: {
        name: name || 'Administrator',
        email,
        password: hashedPassword,
        role: 'admin',
      },
    });

    // Initialize default data if this is the first admin
    const adminCount = await db.user.count({ where: { role: 'admin' } });

    if (adminCount === 1) {
      // Create default categories
      const categories = [
        { name: 'Berita Utama', slug: 'berita-utama', description: 'Berita utama BKAD', order: 1 },
        { name: 'Pengumuman', slug: 'pengumuman', description: 'Pengumuman resmi', order: 2 },
        { name: 'Kegiatan', slug: 'kegiatan', description: 'Kegiatan dan agenda', order: 3 },
        { name: 'Regulasi', slug: 'regulasi', description: 'Peraturan dan regulasi', order: 4 },
      ];

      for (const cat of categories) {
        const existing = await db.category.findUnique({ where: { slug: cat.slug } });
        if (!existing) {
          await db.category.create({ data: cat });
        }
      }

      // Create default statistics
      const statistics = [
        { label: 'Jumlah Penduduk', value: 150000, icon: 'Users', description: 'Total penduduk Kabupaten Seruyan', order: 1 },
        { label: 'APBD', value: 850, icon: 'DollarSign', description: 'APBD dalam Miliar Rupiah', order: 2 },
        { label: 'Unit Kerja', value: 45, icon: 'Building2', description: 'Unit kerja yang dilayani', order: 3 },
        { label: 'Layanan Aktif', value: 12, icon: 'Briefcase', description: 'Jenis layanan yang tersedia', order: 4 },
      ];

      for (const stat of statistics) {
        const existing = await db.statistics.findFirst({ where: { label: stat.label } });
        if (!existing) {
          await db.statistics.create({ data: stat });
        }
      }

      // Create default site settings
      const settings = [
        { key: 'site_name', value: 'BKAD Kabupaten Seruyan', description: 'Nama situs' },
        { key: 'site_description', value: 'Badan Keuangan dan Aset Daerah Kabupaten Seruyan - Melayani dengan Integritas', description: 'Deskripsi situs' },
        { key: 'address', value: 'Jl. RTA Milono No. 1, Kuala Pembuang, Kab. Seruyan, Kalimantan Tengah', description: 'Alamat kantor' },
        { key: 'phone', value: '(0513) 5321234', description: 'Nomor telepon' },
        { key: 'email', value: 'bkad@seruyankab.go.id', description: 'Alamat email' },
        { key: 'working_hours', value: 'Senin - Kamis: 07.30 - 16.00 WIB, Jumat: 07.30 - 16.30 WIB', description: 'Jam kerja' },
      ];

      for (const setting of settings) {
        const existing = await db.siteSetting.findUnique({ where: { key: setting.key } });
        if (!existing) {
          await db.siteSetting.create({ data: setting });
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Akun berhasil dibuat',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('Error registering user:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat membuat akun' },
      { status: 500 }
    );
  }
}
