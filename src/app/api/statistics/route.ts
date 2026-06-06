import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET all statistics
export async function GET() {
  try {
    const statistics = await db.statistics.findMany({
      orderBy: { order: 'asc' },
    });

    return NextResponse.json(statistics);
  } catch (error) {
    console.error('Error fetching statistics:', error);
    return NextResponse.json({ error: 'Failed to fetch statistics' }, { status: 500 });
  }
}

// POST create new statistic
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { label, value, icon, description, order } = body;

    if (!label || value === undefined) {
      return NextResponse.json(
        { error: 'Label dan nilai harus diisi' },
        { status: 400 }
      );
    }

    // Get max order if not provided
    let finalOrder = order;
    if (finalOrder === undefined) {
      const maxOrder = await db.statistics.aggregate({
        _max: { order: true },
      });
      finalOrder = (maxOrder._max.order || 0) + 1;
    }

    const statistic = await db.statistics.create({
      data: {
        label,
        value,
        icon: icon || 'BarChart3',
        description,
        order: finalOrder,
      },
    });

    return NextResponse.json(statistic, { status: 201 });
  } catch (error) {
    console.error('Error creating statistic:', error);
    return NextResponse.json({ error: 'Failed to create statistic' }, { status: 500 });
  }
}

// PUT update statistic
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, label, value, icon, description, order } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const statistic = await db.statistics.update({
      where: { id },
      data: {
        label,
        value,
        icon,
        description,
        order,
      },
    });

    return NextResponse.json(statistic);
  } catch (error) {
    console.error('Error updating statistic:', error);
    return NextResponse.json({ error: 'Failed to update statistic' }, { status: 500 });
  }
}

// DELETE statistic
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    await db.statistics.delete({ where: { id } });

    return NextResponse.json({ message: 'Statistic deleted successfully' });
  } catch (error) {
    console.error('Error deleting statistic:', error);
    return NextResponse.json({ error: 'Failed to delete statistic' }, { status: 500 });
  }
}
