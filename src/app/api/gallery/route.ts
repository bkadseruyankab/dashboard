import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET gallery
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '10');

    const where: Record<string, unknown> = { isActive: true };
    if (category) where.category = category;

    const gallery = await db.gallery.findMany({
      where,
      orderBy: { eventDate: 'desc' },
      take: limit,
    });

    return NextResponse.json(gallery);
  } catch (error) {
    console.error('Error fetching gallery:', error);
    return NextResponse.json({ error: 'Failed to fetch gallery' }, { status: 500 });
  }
}

// POST create gallery item
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, imageUrl, category, eventDate, isActive } = body;

    const item = await db.gallery.create({
      data: {
        title,
        description,
        imageUrl,
        category,
        eventDate: eventDate ? new Date(eventDate) : null,
        isActive: isActive ?? true,
      },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error('Error creating gallery item:', error);
    return NextResponse.json({ error: 'Failed to create gallery item' }, { status: 500 });
  }
}

// PUT update gallery item
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...data } = body;

    if (data.eventDate) {
      data.eventDate = new Date(data.eventDate);
    }

    const item = await db.gallery.update({
      where: { id },
      data,
    });

    return NextResponse.json(item);
  } catch (error) {
    console.error('Error updating gallery item:', error);
    return NextResponse.json({ error: 'Failed to update gallery item' }, { status: 500 });
  }
}

// DELETE gallery item
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    await db.gallery.delete({ where: { id } });
    return NextResponse.json({ message: 'Gallery item deleted successfully' });
  } catch (error) {
    console.error('Error deleting gallery item:', error);
    return NextResponse.json({ error: 'Failed to delete gallery item' }, { status: 500 });
  }
}
