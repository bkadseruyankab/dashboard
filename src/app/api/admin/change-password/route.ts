import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { verifyPassword, hashPassword } from '@/lib/password'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// POST /api/admin/change-password — Change current user's password
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { currentPassword, newPassword } = body

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Password lama dan password baru harus diisi' },
        { status: 400 }
      )
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'Password baru minimal 6 karakter' },
        { status: 400 }
      )
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User tidak ditemukan' },
        { status: 404 }
      )
    }

    // Verify current password
    const isValid = verifyPassword(currentPassword, user.password)
    if (!isValid) {
      return NextResponse.json(
        { error: 'Password lama salah' },
        { status: 400 }
      )
    }

    // Hash new password
    const hashedPassword = hashPassword(newPassword)

    await db.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    })

    return NextResponse.json({ success: true, message: 'Password berhasil diubah' })
  } catch (error) {
    console.error('POST change-password error:', error)
    return NextResponse.json(
      { error: 'Gagal mengubah password' },
      { status: 500 }
    )
  }
}
