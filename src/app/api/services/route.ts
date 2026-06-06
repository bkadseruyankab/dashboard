import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET all services (simplified - no files relation)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const all = searchParams.get('all') === 'true';

    const services = await db.service.findMany({
      where: all ? undefined : { isActive: true },
      orderBy: { order: 'asc' },
    });

    return NextResponse.json(services);
  } catch (error) {
    console.error('Error fetching services:', error);
    return NextResponse.json({ error: 'Failed to fetch services' }, { status: 500 });
  }
}

// POST create service
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, slug, description, icon, link, content, order, isActive } = body;

    // Check if slug already exists
    const existingService = await db.service.findUnique({
      where: { slug },
    });

    if (existingService) {
      return NextResponse.json({ error: 'Slug already exists' }, { status: 400 });
    }

    const service = await db.service.create({
      data: {
        title,
        slug,
        description,
        icon,
        link,
        content,
        order: order || 0,
        isActive: isActive ?? true,
      },
    });

    return NextResponse.json(service, { status: 201 });
  } catch (error) {
    console.error('Error creating service:', error);
    return NextResponse.json({ error: 'Failed to create service' }, { status: 500 });
  }
}

// PUT update service
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...data } = body;

    // Check if slug is being changed and if it conflicts
    if (data.slug) {
      const existingService = await db.service.findFirst({
        where: {
          slug: data.slug,
          NOT: { id },
        },
      });

      if (existingService) {
        return NextResponse.json({ error: 'Slug already exists' }, { status: 400 });
      }
    }

    // Update service
    const service = await db.service.update({
      where: { id },
      data,
    });

    return NextResponse.json(service);
  } catch (error) {
    console.error('Error updating service:', error);
    return NextResponse.json({ error: 'Failed to update service' }, { status: 500 });
  }
}

// DELETE service
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    await db.service.delete({ where: { id } });
    return NextResponse.json({ message: 'Service deleted successfully' });
  } catch (error) {
    console.error('Error deleting service:', error);
    return NextResponse.json({ error: 'Failed to delete service' }, { status: 500 });
  }
}
