import { db } from '@/lib/db'
import { hashPassword } from '@/lib/password'
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

async function checkAuth() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return null
  const role = (session.user as { role?: string }).role
  // Only admin/superadmin can manage users
  if (role !== 'admin' && role !== 'superadmin') return null
  return session
}

// GET /api/admin/users — List all users (excluding passwords)
export async function GET() {
  try {
    if (!(await checkAuth())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const users = await db.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        opdId: true,
        aktif: true,
        createdAt: true,
        updatedAt: true,
        opd: {
          select: {
            id: true,
            kodeOpd: true,
            namaOpd: true,
          },
        },
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

// POST /api/admin/users — Create new user (admin or OPD)
export async function POST(request: Request) {
  try {
    if (!(await checkAuth())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, email, password, role, opdId, aktif } = body

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'name, email, and password are required' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }

    // Check if email already exists
    const existing = await db.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json(
        { error: 'Email sudah digunakan' },
        { status: 400 }
      )
    }

    // If role is opd, opdId must be provided
    if (role === 'opd' && !opdId) {
      return NextResponse.json(
        { error: 'OPD harus dipilih untuk role OPD' },
        { status: 400 }
      )
    }

    // Verify opdId exists if provided
    if (opdId) {
      const opd = await db.opd.findUnique({ where: { id: opdId } })
      if (!opd) {
        return NextResponse.json(
          { error: 'OPD tidak ditemukan' },
          { status: 400 }
        )
      }
    }

    const hashedPassword = hashPassword(password)

    const user = await db.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role || 'admin',
        opdId: role === 'opd' ? opdId : null,
        aktif: aktif !== undefined ? aktif : true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        opdId: true,
        aktif: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return NextResponse.json({ data: user }, { status: 201 })
  } catch (error) {
    console.error('POST users error:', error)
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/users?id=xxx — Update user
export async function PUT(request: Request) {
  try {
    if (!(await checkAuth())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'id query parameter is required' },
        { status: 400 }
      )
    }

    const existing = await db.user.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { name, email, role, opdId, aktif, password } = body

    const updateData: {
      name?: string
      email?: string
      role?: string
      opdId?: string | null
      aktif?: boolean
      password?: string
    } = {}

    if (name !== undefined) updateData.name = name
    if (email !== undefined) updateData.email = email
    if (role !== undefined) {
      updateData.role = role
      // If role changes to non-opd, clear opdId
      if (role !== 'opd') {
        updateData.opdId = null
      }
    }
    if (opdId !== undefined) {
      // If role is opd, set opdId
      updateData.opdId = role === 'opd' ? opdId : null
    }
    if (aktif !== undefined) updateData.aktif = aktif
    if (password && password.length >= 6) {
      updateData.password = hashPassword(password)
    }

    // Check email uniqueness if changing
    if (email && email !== existing.email) {
      const emailTaken = await db.user.findUnique({ where: { email } })
      if (emailTaken) {
        return NextResponse.json(
          { error: 'Email sudah digunakan' },
          { status: 400 }
        )
      }
    }

    // Verify opdId exists if provided
    if (updateData.opdId) {
      const opd = await db.opd.findUnique({ where: { id: updateData.opdId } })
      if (!opd) {
        return NextResponse.json(
          { error: 'OPD tidak ditemukan' },
          { status: 400 }
        )
      }
    }

    const user = await db.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        opdId: true,
        aktif: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return NextResponse.json({ data: user })
  } catch (error) {
    console.error('PUT users error:', error)
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/users?id=xxx — Delete user
export async function DELETE(request: Request) {
  try {
    if (!(await checkAuth())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'id query parameter is required' },
        { status: 400 }
      )
    }

    const existing = await db.user.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    await db.user.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE users error:', error)
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    )
  }
}
