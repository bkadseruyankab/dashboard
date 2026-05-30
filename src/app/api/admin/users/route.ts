import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

// GET /api/admin/users — List all users (excluding passwords)
export async function GET() {
  try {
    const users = await db.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        aktif: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'asc' },
    })
    return NextResponse.json({ data: users })
  } catch (error) {
    console.error('GET users error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}
