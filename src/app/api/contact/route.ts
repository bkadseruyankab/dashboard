import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST create contact message
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, subject, message } = body;

    const contactMessage = await db.contactMessage.create({
      data: {
        name,
        email,
        phone,
        subject,
        message,
      },
    });

    return NextResponse.json(contactMessage, { status: 201 });
  } catch (error) {
    console.error('Error creating contact message:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}

// GET contact messages (for admin)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const unread = searchParams.get('unread');

    const where: Record<string, unknown> = {};
    
    if (unread === 'true') {
      where.isRead = false;
    }

    const messages = await db.contactMessage.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error('Error fetching contact messages:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}
