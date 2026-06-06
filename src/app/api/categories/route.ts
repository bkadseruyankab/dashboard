import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET all categories
export async function GET() {
  try {
    const categories = await db.category.findMany({
      include: {
        _count: {
          select: { news: true },
        },
      },
      orderBy: { order: 'asc' },
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}

// POST create category
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, slug, description, icon, color, order } = body;

    const category = await db.category.create({
      data: {
        name,
        slug,
        description,
        icon,
        color,
        order: order || 0,
      },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }
}

// PUT update category
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...data } = body;

    const category = await db.category.update({
      where: { id },
      data,
    });

    return NextResponse.json(category);
  } catch (error) {
    console.error('Error updating category:', error);
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 });
  }
}

// DELETE category
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    await db.category.delete({ where: { id } });
    return NextResponse.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
  }
}
