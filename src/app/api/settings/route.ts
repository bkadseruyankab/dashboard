import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Default settings values
const defaultSettings: Record<string, string> = {
  site_name: 'BKAD Kabupaten Seruyan',
  site_description: 'Badan Keuangan dan Aset Daerah Kabupaten Seruyan - Melayani dengan Integritas',
  address: 'Jl. RTA Milono No. 1, Kuala Pembuang, Kab. Seruyan, Kalimantan Tengah',
  phone: '(0513) 5321234',
  email: 'bkad@seruyankab.go.id',
  working_hours: 'Senin - Kamis: 07.30 - 16.00 WIB, Jumat: 07.30 - 16.30 WIB',
};

// GET site settings
export async function GET() {
  try {
    const settings = await db.siteSetting.findMany();
    
    // Convert to object for easier access
    const settingsObj = settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {} as Record<string, string>);

    // Merge with defaults to ensure all fields have values
    const mergedSettings = { ...defaultSettings, ...settingsObj };

    return NextResponse.json(mergedSettings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    // Return default settings on error
    return NextResponse.json(defaultSettings);
  }
}

// PUT update settings
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    
    for (const [key, value] of Object.entries(body)) {
      await db.siteSetting.upsert({
        where: { key },
        update: { value: value as string },
        create: { 
          key, 
          value: value as string,
          description: `Setting for ${key}`,
        },
      });
    }

    return NextResponse.json({ message: 'Settings updated successfully' });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
