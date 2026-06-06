import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET organization
export async function GET() {
  try {
    const organization = await db.organization.findMany({
      orderBy: [{ level: 'asc' }, { order: 'asc' }],
    });
    return NextResponse.json(organization);
  } catch (error) {
    console.error('Error fetching organization:', error);
    return NextResponse.json({ error: 'Failed to fetch organization' }, { status: 500 });
  }
}

// POST create organization member
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, position, photo, description, email, phone, order, level, parentId } = body;

    const item = await db.organization.create({
      data: {
        name,
        position,
        photo,
        description,
        email,
        phone,
        order: order || 0,
        level: level || 1,
        parentId,
      },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error('Error creating organization member:', error);
    return NextResponse.json({ error: 'Failed to create organization member' }, { status: 500 });
  }
}

// PUT update organization member
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...data } = body;

    const item = await db.organization.update({
      where: { id },
      data,
    });

    return NextResponse.json(item);
  } catch (error) {
    console.error('Error updating organization member:', error);
    return NextResponse.json({ error: 'Failed to update organization member' }, { status: 500 });
  }
}

// DELETE organization member
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    await db.organization.delete({ where: { id } });
    return NextResponse.json({ message: 'Organization member deleted successfully' });
  } catch (error) {
    console.error('Error deleting organization member:', error);
    return NextResponse.json({ error: 'Failed to delete organization member' }, { status: 500 });
  }
}
