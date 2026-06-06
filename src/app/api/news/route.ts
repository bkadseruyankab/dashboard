import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET all news with pagination and filtering
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const category = searchParams.get('category');
    const featured = searchParams.get('featured');
    const search = searchParams.get('search');
    const slug = searchParams.get('slug');

    const skip = (page - 1) * limit;

    // If slug is provided, get single news
    if (slug) {
      const news = await db.news.findUnique({
        where: { slug },
        include: {
          category: true,
          author: {
            select: { id: true, name: true, email: true },
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

      return NextResponse.json(news);
    }

    // Build where clause
    const where: Record<string, unknown> = { isPublished: true };
    
    if (category) {
      where.category = { slug: category };
    }
    
    if (featured === 'true') {
      where.isFeatured = true;
    }
    
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { excerpt: { contains: search } },
        { content: { contains: search } },
      ];
    }

    const [news, total] = await Promise.all([
      db.news.findMany({
        where,
        include: {
          category: true,
          author: {
            select: { id: true, name: true },
          },
        },
        orderBy: { publishedAt: 'desc' },
        skip,
        take: limit,
      }),
      db.news.count({ where }),
    ]);

    return NextResponse.json({
      data: news,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching news:', error);
    return NextResponse.json({ error: 'Failed to fetch news' }, { status: 500 });
  }
}

// POST create new news
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, slug, excerpt, content, thumbnail, categoryId, authorId, isFeatured } = body;

    // Get the first admin user if no authorId provided
    let finalAuthorId = authorId;
    if (!finalAuthorId || finalAuthorId === 'admin') {
      const admin = await db.user.findFirst({
        where: { role: 'admin' },
        select: { id: true },
      });
      if (!admin) {
        return NextResponse.json({ error: 'No admin user found' }, { status: 400 });
      }
      finalAuthorId = admin.id;
    }

    const news = await db.news.create({
      data: {
        title,
        slug,
        excerpt,
        content,
        thumbnail,
        categoryId: categoryId || null,
        authorId: finalAuthorId,
        isFeatured: isFeatured || false,
      },
      include: {
        category: true,
        author: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json(news, { status: 201 });
  } catch (error) {
    console.error('Error creating news:', error);
    return NextResponse.json({ error: 'Failed to create news' }, { status: 500 });
  }
}

// PUT update news
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...data } = body;

    const news = await db.news.update({
      where: { id },
      data,
      include: {
        category: true,
        author: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json(news);
  } catch (error) {
    console.error('Error updating news:', error);
    return NextResponse.json({ error: 'Failed to update news' }, { status: 500 });
  }
}

// DELETE news
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    await db.news.delete({ where: { id } });
    return NextResponse.json({ message: 'News deleted successfully' });
  } catch (error) {
    console.error('Error deleting news:', error);
    return NextResponse.json({ error: 'Failed to delete news' }, { status: 500 });
  }
}
