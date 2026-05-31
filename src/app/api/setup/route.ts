import { db } from '@/lib/db'
import { hashPassword } from '@/lib/password'
import { invalidateDashboardCache } from '@/lib/cache'
import { syncRealisasiAkun } from '@/lib/sync-realisasi-akun'
import { syncRealisasiSkpd } from '@/lib/sync-realisasi-skpd'
import { NextResponse } from 'next/server'

/**
 * GET /api/setup — Check if the application needs setup
 * Returns { needsSetup: boolean, step: string }
 */
export async function GET() {
  try {
    // Check if any settings exist with setupComplete = true
    const settings = await db.pengaturanAplikasi.findFirst({
      where: { aktif: true },
    })

    if (settings?.setupComplete) {
      return NextResponse.json({ needsSetup: false, step: 'complete' })
    }

    // Determine which step the setup is at
    const hasSettings = !!settings
    const hasTahun = (await db.tahunAnggaran.count()) > 0
    const hasAdmin = (await db.user.count({ where: { role: { in: ['admin', 'superadmin'] } } })) > 0
    const hasKategori = (await db.kategori.count()) > 0
    const hasOpd = (await db.opd.count()) > 0

    if (!hasSettings && !hasTahun && !hasAdmin) {
      return NextResponse.json({ needsSetup: true, step: 'welcome' })
    }
    if (!hasTahun) {
      return NextResponse.json({ needsSetup: true, step: 'tahun-anggaran' })
    }
    if (!hasAdmin) {
      return NextResponse.json({ needsSetup: true, step: 'admin-account' })
    }
    if (!hasKategori) {
      return NextResponse.json({ needsSetup: true, step: 'kategori' })
    }
    if (!hasOpd) {
      return NextResponse.json({ needsSetup: true, step: 'opd' })
    }

    // Everything exists but setup not marked complete — mark it
    if (settings) {
      await db.pengaturanAplikasi.update({
        where: { id: settings.id },
        data: { setupComplete: true },
      })
    }

    return NextResponse.json({ needsSetup: false, step: 'complete' })
  } catch (error) {
    console.error('GET setup error:', error)
    return NextResponse.json(
      { error: 'Failed to check setup status' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/setup — Save setup wizard data (each step)
 * Body: { step: string, data: Record<string, any> }
 *
 * Steps: identitas, tahun-anggaran, admin-account, kategori, opd, finish
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { step, data } = body as { step: string; data: Record<string, unknown> }

    if (!step || !data) {
      return NextResponse.json({ error: 'step and data are required' }, { status: 400 })
    }

    switch (step) {
      case 'identitas':
        return await handleIdentitas(data)
      case 'tahun-anggaran':
        return await handleTahunAnggaran(data)
      case 'admin-account':
        return await handleAdminAccount(data)
      case 'kategori':
        return await handleKategori(data)
      case 'opd':
        return await handleOpd(data)
      case 'finish':
        return await handleFinish(data)
      default:
        return NextResponse.json({ error: `Unknown step: ${step}` }, { status: 400 })
    }
  } catch (error) {
    console.error('POST setup error:', error)
    return NextResponse.json({ error: 'Failed to save setup data' }, { status: 500 })
  }
}

async function handleIdentitas(data: Record<string, unknown>) {
  const {
    namaAplikasi,
    namaPemerintah,
    namaInstansi,
    warnaPrimary,
    warnaSecondary,
    warnaAccent,
    alamatInstansi,
    teleponInstansi,
    emailInstansi,
    websiteInstansi,
    logoBase64,
  } = data

  const settings = await db.pengaturanAplikasi.findFirst({ where: { aktif: true } })

  const updateData: Record<string, unknown> = {}
  if (namaAplikasi) updateData.namaAplikasi = String(namaAplikasi)
  if (namaPemerintah) updateData.namaPemerintah = String(namaPemerintah)
  if (namaInstansi) updateData.namaInstansi = String(namaInstansi)
  if (warnaPrimary) updateData.warnaPrimary = String(warnaPrimary)
  if (warnaSecondary) updateData.warnaSecondary = String(warnaSecondary)
  if (warnaAccent) updateData.warnaAccent = String(warnaAccent)
  if (alamatInstansi !== undefined) updateData.alamatInstansi = String(alamatInstansi) || null
  if (teleponInstansi !== undefined) updateData.teleponInstansi = String(teleponInstansi) || null
  if (emailInstansi !== undefined) updateData.emailInstansi = String(emailInstansi) || null
  if (websiteInstansi !== undefined) updateData.websiteInstansi = String(websiteInstansi) || null
  if (logoBase64 !== undefined) updateData.logoBase64 = String(logoBase64) || null

  let result
  if (settings) {
    result = await db.pengaturanAplikasi.update({
      where: { id: settings.id },
      data: updateData,
    })
  } else {
    result = await db.pengaturanAplikasi.create({
      data: {
        aktif: true,
        ...updateData,
      },
    })
  }

  invalidateDashboardCache()
  return NextResponse.json({ success: true, data: result })
}

async function handleTahunAnggaran(data: Record<string, unknown>) {
  const { tahun } = data

  if (!tahun || typeof tahun !== 'number') {
    return NextResponse.json({ error: 'tahun is required and must be a number' }, { status: 400 })
  }

  // Check if already exists
  const existing = await db.tahunAnggaran.findUnique({ where: { tahun } })
  if (existing) {
    // Make it active
    await db.$transaction(async (tx) => {
      await tx.tahunAnggaran.updateMany({
        where: { aktif: true },
        data: { aktif: false },
      })
      await tx.tahunAnggaran.update({
        where: { id: existing.id },
        data: { aktif: true },
      })
    })
    invalidateDashboardCache()
    return NextResponse.json({ success: true, data: existing })
  }

  // Create new and set as active
  const record = await db.$transaction(async (tx) => {
    await tx.tahunAnggaran.updateMany({
      where: { aktif: true },
      data: { aktif: false },
    })
    return tx.tahunAnggaran.create({
      data: { tahun, aktif: true },
    })
  })

  invalidateDashboardCache()
  return NextResponse.json({ success: true, data: record })
}

async function handleAdminAccount(data: Record<string, unknown>) {
  const { name, email, password } = data

  if (!name || !email || !password) {
    return NextResponse.json({ error: 'name, email, and password are required' }, { status: 400 })
  }

  if (String(password).length < 6) {
    return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
  }

  // Check if email already exists
  const existing = await db.user.findUnique({ where: { email: String(email) } })
  if (existing) {
    return NextResponse.json({ error: 'Email sudah digunakan' }, { status: 400 })
  }

  const hashedPassword = hashPassword(String(password))

  const user = await db.user.create({
    data: {
      name: String(name),
      email: String(email),
      password: hashedPassword,
      role: 'superadmin',
      aktif: true,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      aktif: true,
    },
  })

  return NextResponse.json({ success: true, data: user })
}

async function handleKategori(data: Record<string, unknown>) {
  const { kategoriList } = data as {
    kategoriList: Array<{ jenis: string; namaKategori: string; kodeKategori?: string; urutan?: number }>
  }

  if (!kategoriList || !Array.isArray(kategoriList) || kategoriList.length === 0) {
    return NextResponse.json({ error: 'kategoriList is required and must be a non-empty array' }, { status: 400 })
  }

  const validJenis = ['Pendapatan', 'Belanja', 'Pembiayaan', 'RealisasiAkun']

  const results = []
  for (const kat of kategoriList) {
    if (!kat.jenis || !kat.namaKategori) continue
    if (!validJenis.includes(kat.jenis)) continue

    // Check unique constraint
    const exists = await db.kategori.findFirst({
      where: { jenis: kat.jenis, namaKategori: kat.namaKategori },
    })
    if (exists) {
      results.push(exists)
      continue
    }

    const record = await db.kategori.create({
      data: {
        jenis: kat.jenis,
        namaKategori: kat.namaKategori,
        kodeKategori: kat.kodeKategori || null,
        urutan: kat.urutan ?? 0,
        aktif: true,
      },
    })
    results.push(record)
  }

  invalidateDashboardCache()
  return NextResponse.json({ success: true, created: results.length, data: results })
}

async function handleOpd(data: Record<string, unknown>) {
  const { opdList, tahunAnggaranId } = data as {
    opdList: Array<{ kodeOpd: string; namaOpd: string; kepalaOpd?: string; alamat?: string; telepon?: string; email?: string }>
    tahunAnggaranId: string
  }

  if (!opdList || !Array.isArray(opdList) || opdList.length === 0) {
    return NextResponse.json({ error: 'opdList is required and must be a non-empty array' }, { status: 400 })
  }

  let taId = tahunAnggaranId
  if (!taId) {
    // Try to find active tahun anggaran
    const activeTa = await db.tahunAnggaran.findFirst({ where: { aktif: true } })
    if (!activeTa) {
      return NextResponse.json({ error: 'No active tahun anggaran found' }, { status: 400 })
    }
    taId = activeTa.id
  }

  const defaultPassword = 'seruyan2024'
  const hashedPassword = hashPassword(defaultPassword)
  const results = []
  let usersCreated = 0

  for (const opd of opdList) {
    if (!opd.kodeOpd || !opd.namaOpd) continue

    // Check if already exists
    const exists = await db.opd.findFirst({
      where: { kodeOpd: opd.kodeOpd, tahunAnggaranId: taId },
    })
    if (exists) {
      results.push(exists)
      continue
    }

    const record = await db.opd.create({
      data: {
        kodeOpd: opd.kodeOpd,
        namaOpd: opd.namaOpd,
        kepalaOpd: opd.kepalaOpd || null,
        alamat: opd.alamat || null,
        telepon: opd.telepon || null,
        email: opd.email || null,
        tahunAnggaranId: taId,
      },
    })
    results.push(record)

    // Create OPD user account
    const kodeClean = opd.kodeOpd.replace(/\./g, '')
    const opdEmail = `opd-${kodeClean}@seruyankab.go.id`
    const existingUser = await db.user.findUnique({ where: { email: opdEmail } })
    if (!existingUser) {
      await db.user.create({
        data: {
          name: `OPD ${opd.namaOpd}`,
          email: opdEmail,
          password: hashedPassword,
          role: 'opd',
          opdId: record.id,
          aktif: true,
        },
      })
      usersCreated++
    }
  }

  invalidateDashboardCache()
  return NextResponse.json({
    success: true,
    created: results.length,
    usersCreated,
    data: results,
  })
}

async function handleFinish(_data: Record<string, unknown>) {
  // Mark setup as complete
  const settings = await db.pengaturanAplikasi.findFirst({ where: { aktif: true } })

  if (settings) {
    await db.pengaturanAplikasi.update({
      where: { id: settings.id },
      data: { setupComplete: true },
    })
  } else {
    await db.pengaturanAplikasi.create({
      data: { setupComplete: true, aktif: true },
    })
  }

  // Sync realisasi for active tahun
  const activeTa = await db.tahunAnggaran.findFirst({ where: { aktif: true } })
  if (activeTa) {
    await syncRealisasiAkun(activeTa.id)
    await syncRealisasiSkpd(activeTa.id)
  }

  invalidateDashboardCache()
  return NextResponse.json({ success: true, message: 'Setup completed successfully!' })
}
