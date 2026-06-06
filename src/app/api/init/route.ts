import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Default admin credentials
const DEFAULT_ADMIN = {
  email: 'admin@bkad.seruyankab.go.id',
  name: 'Administrator',
  password: 'admin123',
  role: 'admin',
};

// Hash password using SHA-256 (same as auth.ts)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// GET - Check if system is initialized
export async function GET() {
  try {
    const adminCount = await db.user.count({
      where: { role: 'admin' },
    });

    return NextResponse.json({
      initialized: adminCount > 0,
      adminCount,
    });
  } catch (error) {
    console.error('Error checking initialization:', error);
    return NextResponse.json({ error: 'Failed to check initialization' }, { status: 500 });
  }
}

// POST - Initialize the system with default admin
export async function POST() {
  try {
    // Check if admin already exists
    const existingAdmin = await db.user.findUnique({
      where: { email: DEFAULT_ADMIN.email },
    });

    if (existingAdmin) {
      return NextResponse.json({
        success: true,
        message: 'Admin user already exists',
        admin: {
          email: existingAdmin.email,
          name: existingAdmin.name,
        },
      });
    }

    // Hash the password
    const hashedPassword = await hashPassword(DEFAULT_ADMIN.password);

    // Create admin user
    const admin = await db.user.create({
      data: {
        email: DEFAULT_ADMIN.email,
        name: DEFAULT_ADMIN.name,
        password: hashedPassword,
        role: DEFAULT_ADMIN.role,
      },
    });

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

    return NextResponse.json({
      success: true,
      message: 'System initialized successfully',
      admin: {
        email: admin.email,
        name: admin.name,
        defaultPassword: DEFAULT_ADMIN.password,
      },
    });
  } catch (error) {
    console.error('Error initializing system:', error);
    return NextResponse.json({ error: 'Failed to initialize system' }, { status: 500 });
  }
}
