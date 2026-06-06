import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Hash password using SHA-256
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// GET - List all users
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const all = searchParams.get('all') === 'true';

    const users = await db.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            news: true,
            documents: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      ...(all ? {} : { take: 50 }),
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

// POST - Create new user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password, role, avatar } = body;

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email dan password harus diisi' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password minimal 6 karakter' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email sudah terdaftar' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await db.user.create({
      data: {
        name: name || 'User',
        email,
        password: hashedPassword,
        role: role || 'editor',
        avatar,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        createdAt: true,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}

// PUT - Update user
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, email, password, role, avatar } = body;

    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Check if user exists
    const existingUser = await db.user.findUnique({ where: { id } });
    if (!existingUser) {
      return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 });
    }

    // Check email uniqueness if changing email
    if (email && email !== existingUser.email) {
      const emailExists = await db.user.findUnique({ where: { email } });
      if (emailExists) {
        return NextResponse.json({ error: 'Email sudah digunakan' }, { status: 400 });
      }
    }

    // Prepare update data
    const updateData: Record<string, string | undefined> = {
      name: name ?? existingUser.name,
      email: email ?? existingUser.email,
      role: role ?? existingUser.role,
      avatar: avatar ?? existingUser.avatar,
    };

    // Hash new password if provided
    if (password && password.length >= 6) {
      updateData.password = await hashPassword(password);
    }

    // Update user
    const user = await db.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

// DELETE - Delete user
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Check if user exists
    const existingUser = await db.user.findUnique({ 
      where: { id },
      include: { _count: { select: { news: true, documents: true } } }
    });

    if (!existingUser) {
      return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 });
    }

    // Check if user has content
    if (existingUser._count.news > 0 || existingUser._count.documents > 0) {
      return NextResponse.json(
        { error: `User memiliki ${existingUser._count.news} berita dan ${existingUser._count.documents} dokumen. Hapus atau transfer konten terlebih dahulu.` },
        { status: 400 }
      );
    }

    // Delete user
    await db.user.delete({ where: { id } });

    return NextResponse.json({ message: 'User berhasil dihapus' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
