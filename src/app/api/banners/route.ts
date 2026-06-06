import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET all banners
export async function GET() {
  try {
    const banners = await db.banner.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    });

    return NextResponse.json(banners);
  } catch (error) {
    console.error('Error fetching banners:', error);
    return NextResponse.json({ error: 'Failed to fetch banners' }, { status: 500 });
  }
}

// POST create banner
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, subtitle, imageUrl, link, order } = body;

    const banner = await db.banner.create({
      data: {
        title,
        subtitle,
        imageUrl,
        link,
        order: order || 0,
      },
    });

    return NextResponse.json(banner, { status: 201 });
  } catch (error) {
    console.error('Error creating banner:', error);
    return NextResponse.json({ error: 'Failed to create banner' }, { status: 500 });
  }
}

// PUT update banner
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...data } = body;

    const banner = await db.banner.update({
      where: { id },
      data,
    });

    return NextResponse.json(banner);
  } catch (error) {
    console.error('Error updating banner:', error);
    return NextResponse.json({ error: 'Failed to update banner' }, { status: 500 });
  }
}

// DELETE banner
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    await db.banner.delete({ where: { id } });
    return NextResponse.json({ message: 'Banner deleted successfully' });
  } catch (error) {
    console.error('Error deleting banner:', error);
    return NextResponse.json({ error: 'Failed to delete banner' }, { status: 500 });
  }
}
