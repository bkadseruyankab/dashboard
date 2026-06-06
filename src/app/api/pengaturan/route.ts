import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

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

// GET /api/pengaturan — Public endpoint to fetch active application settings
export async function GET() {
  try {
    const settings = await getOrCreateSettings()
    return NextResponse.json({ data: settings })
  } catch (error) {
    console.error('GET pengaturan (public) error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch application settings' },
      { status: 500 }
    )
  }
}
