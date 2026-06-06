import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const news = await db.news.findUnique({
      where: { slug },
      include: {
        category: true,
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!news) {
      return NextResponse.json({ error: 'News not found' }, { status: 404 });
    }

    // Increment view count
    await db.news.update({
      where: { id: news.id },
      data: { viewCount: { increment: 1 } },
    });

    return NextResponse.json({ ...news, viewCount: news.viewCount + 1 });
  } catch (error) {
    console.error('Error fetching news:', error);
    return NextResponse.json({ error: 'Failed to fetch news' }, { status: 500 });
  }
}
