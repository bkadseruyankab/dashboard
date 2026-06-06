import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET all documents
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '10');

    const where: Record<string, unknown> = {};
    
    if (category) {
      where.category = category;
    }

    const documents = await db.document.findMany({
      where,
      orderBy: { publishedAt: 'desc' },
      take: limit,
    });

    return NextResponse.json(documents);
  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 });
  }
}

// POST create document
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, slug, description, fileUrl, fileType, fileSize, thumbnail, category, authorId } = body;

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

    const document = await db.document.create({
      data: {
        title,
        slug,
        description,
        fileUrl,
        fileType,
        fileSize,
        thumbnail,
        category,
        authorId: finalAuthorId,
      },
    });

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    console.error('Error creating document:', error);
    return NextResponse.json({ error: 'Failed to create document' }, { status: 500 });
  }
}

// PUT update document
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...data } = body;

    const document = await db.document.update({
      where: { id },
      data,
    });

    return NextResponse.json(document);
  } catch (error) {
    console.error('Error updating document:', error);
    return NextResponse.json({ error: 'Failed to update document' }, { status: 500 });
  }
}

// DELETE document
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    await db.document.delete({ where: { id } });
    return NextResponse.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Error deleting document:', error);
    return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 });
  }
}
