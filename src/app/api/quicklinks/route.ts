import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET quick links
export async function GET() {
  try {
    const links = await db.quickLink.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    });
    return NextResponse.json(links);
  } catch (error) {
    console.error('Error fetching quick links:', error);
    return NextResponse.json({ error: 'Failed to fetch quick links' }, { status: 500 });
  }
}

// POST create quick link
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, url, icon, order, isActive } = body;

    const link = await db.quickLink.create({
      data: {
        title,
        url,
        icon,
        order: order || 0,
        isActive: isActive ?? true,
      },
    });

    return NextResponse.json(link, { status: 201 });
  } catch (error) {
    console.error('Error creating quick link:', error);
    return NextResponse.json({ error: 'Failed to create quick link' }, { status: 500 });
  }
}

// PUT update quick link
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...data } = body;

    const link = await db.quickLink.update({
      where: { id },
      data,
    });

    return NextResponse.json(link);
  } catch (error) {
    console.error('Error updating quick link:', error);
    return NextResponse.json({ error: 'Failed to update quick link' }, { status: 500 });
  }
}

// DELETE quick link
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    await db.quickLink.delete({ where: { id } });
    return NextResponse.json({ message: 'Quick link deleted successfully' });
  } catch (error) {
    console.error('Error deleting quick link:', error);
    return NextResponse.json({ error: 'Failed to delete quick link' }, { status: 500 });
  }
}
