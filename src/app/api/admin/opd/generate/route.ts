import { db } from '@/lib/db'
import { hashPassword } from '@/lib/password'
import { invalidateDashboardCache } from '@/lib/cache'
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    // Auth check
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const role = (session.user as { role?: string }).role
    if (role !== 'admin' && role !== 'superadmin') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const body = await request.json()
    const { tahunAnggaranId } = body

    if (!tahunAnggaranId) {
      return NextResponse.json({ error: 'tahunAnggaranId is required' }, { status: 400 })
    }

    // Get target fiscal year
    const targetTahun = await db.tahunAnggaran.findUnique({ where: { id: tahunAnggaranId } })
    if (!targetTahun) {
      return NextResponse.json({ error: 'Tahun anggaran tidak ditemukan' }, { status: 404 })
    }

    // Find previous fiscal year
    const prevTahun = await db.tahunAnggaran.findFirst({
      where: { tahun: targetTahun.tahun - 1 },
    })
    if (!prevTahun) {
      return NextResponse.json({ error: `Tahun anggaran ${targetTahun.tahun - 1} tidak ditemukan. Tambahkan terlebih dahulu.` }, { status: 404 })
    }

    // Get OPDs from previous year
    const prevOpds = await db.opd.findMany({
      where: { tahunAnggaranId: prevTahun.id },
      orderBy: { kodeOpd: 'asc' },
    })

    if (prevOpds.length === 0) {
      return NextResponse.json({ error: `Tidak ada OPD di tahun ${prevTahun.tahun}` }, { status: 404 })
    }

    // Get existing OPDs in target year (to skip)
    const existingOpds = await db.opd.findMany({
      where: { tahunAnggaranId: targetTahun.id },
    })
    const existingKodes = new Set(existingOpds.map(o => o.kodeOpd))

    // Copy OPDs
    let created = 0
    let skipped = 0
    const newOpdIds: string[] = []

    for (const opd of prevOpds) {
      if (existingKodes.has(opd.kodeOpd)) {
        skipped++
        continue
      }

      const newOpd = await db.opd.create({
        data: {
          tahunAnggaranId: targetTahun.id,
          kodeOpd: opd.kodeOpd,
          namaOpd: opd.namaOpd,
          kepalaOpd: opd.kepalaOpd,
          alamat: opd.alamat,
          telepon: opd.telepon,
          email: opd.email,
        },
      })
      newOpdIds.push(newOpd.id)
      created++
    }

    // Create user accounts for new OPDs
    const defaultPassword = 'seruyan2024'
    let usersCreated = 0

    for (const opdId of newOpdIds) {
      const opd = await db.opd.findUnique({ where: { id: opdId } })
      if (!opd) continue

      const kodeWithoutDots = opd.kodeOpd.replace(/\./g, '')
      const email = `opd-${kodeWithoutDots}@seruyankab.go.id`

      // Check if user already exists
      const existingUser = await db.user.findUnique({ where: { email } })
      if (existingUser) {
        // Update the existing user's opdId to point to the new OPD record if needed
        if (existingUser.opdId !== opdId) {
          await db.user.update({
            where: { id: existingUser.id },
            data: { opdId, aktif: true },
          })
        }
        continue
      }

      const hashedPassword = hashPassword(defaultPassword)
      await db.user.create({
        data: {
          name: opd.namaOpd,
          email,
          password: hashedPassword,
          role: 'opd',
          opdId,
          aktif: true,
        },
      })
      usersCreated++
    }

    invalidateDashboardCache()

    return NextResponse.json({
      success: true,
      message: `Generate OPD berhasil: ${created} OPD ditambahkan, ${skipped} OPD sudah ada`,
      details: {
        targetTahun: targetTahun.tahun,
        sourceTahun: prevTahun.tahun,
        totalSource: prevOpds.length,
        created,
        skipped,
        usersCreated,
      },
    })
  } catch (error) {
    console.error('Generate OPD error:', error)
    return NextResponse.json({ error: 'Gagal generate OPD' }, { status: 500 })
  }
}
