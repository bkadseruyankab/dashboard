import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET active announcements
export async function GET() {
  try {
    const now = new Date();
    const announcements = await db.announcement.findMany({
      where: {
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(announcements);
  } catch (error) {
    console.error('Error fetching announcements:', error);
    return NextResponse.json({ error: 'Failed to fetch announcements' }, { status: 500 });
  }
}
