import { db } from '@/lib/db'
import { invalidateDashboardCache } from '@/lib/cache'
import { NextResponse } from 'next/server'

// Hex color validation regex: #RRGGBB format
const HEX_COLOR_REGEX = /^#[0-9A-Fa-f]{6}$/

// Max logo base64 size: 1MB
const MAX_LOGO_SIZE = 1_000_000

/**
 * Helper: Get or create active application settings.
 * If no active settings exist, creates one with defaults.
 */
async function getOrCreateSettings() {
  let settings = await db.pengaturanAplikasi.findFirst({
    where: { aktif: true },
  })

  if (!settings) {
    // Check if any settings exist at all
    const anySettings = await db.pengaturanAplikasi.findFirst()
    if (anySettings) {
      // Settings exist but none is active — activate the first one
      settings = await db.pengaturanAplikasi.update({
        where: { id: anySettings.id },
        data: { aktif: true },
      })
    } else {
      // No settings at all — create default
      settings = await db.pengaturanAplikasi.create({
        data: { aktif: true },
      })
    }
  }

  return settings
}

// GET /api/admin/pengaturan — Fetch active application settings
export async function GET() {
  try {
    const settings = await getOrCreateSettings()
    return NextResponse.json({ data: settings })
  } catch (error) {
    console.error('GET pengaturan error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch application settings' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/pengaturan — Update active application settings
export async function PUT(request: Request) {
  try {
    const settings = await getOrCreateSettings()

    const body = await request.json()

    // Build update data with validation
    const updateData: Record<string, unknown> = {}

    // String fields
    const stringFields = [
      'namaAplikasi',
      'namaPemerintah',
      'logoBase64',
      'logoUrl',
      'alamatInstansi',
      'teleponInstansi',
      'emailInstansi',
      'websiteInstansi',
    ] as const

    for (const field of stringFields) {
      if (body[field] !== undefined) {
        if (body[field] !== null && typeof body[field] !== 'string') {
          return NextResponse.json(
            { error: `${field} must be a string or null` },
            { status: 400 }
          )
        }
        // Validate logo base64 size
        if (field === 'logoBase64' && body[field] && body[field].length > MAX_LOGO_SIZE) {
          return NextResponse.json(
            { error: 'logoBase64 must be smaller than 1MB' },
            { status: 400 }
          )
        }
        updateData[field] = body[field]
      }
    }

    // Hex color fields — validate format
    const colorFields = [
      'warnaPrimary',
      'warnaSecondary',
      'warnaAccent',
      'warnaDark',
    ] as const

    for (const field of colorFields) {
      if (body[field] !== undefined) {
        if (typeof body[field] !== 'string') {
          return NextResponse.json(
            { error: `${field} must be a string` },
            { status: 400 }
          )
        }
        if (!HEX_COLOR_REGEX.test(body[field])) {
          return NextResponse.json(
            { error: `${field} must be a valid hex color (format: #RRGGBB)` },
            { status: 400 }
          )
        }
        updateData[field] = body[field]
      }
    }

    // Boolean fields
    if (body.aktif !== undefined) {
      if (typeof body.aktif !== 'boolean') {
        return NextResponse.json(
          { error: 'aktif must be a boolean' },
          { status: 400 }
        )
      }
      updateData.aktif = body.aktif
    }

    // If no fields to update, return current settings
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      )
    }

    const updated = await db.pengaturanAplikasi.update({
      where: { id: settings.id },
      data: updateData,
    })

    invalidateDashboardCache()

    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('PUT pengaturan error:', error)
    return NextResponse.json(
      { error: 'Failed to update application settings' },
      { status: 500 }
    )
  }
}
