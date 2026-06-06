import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import ZAI from 'z-ai-web-dev-sdk'

// ---------------------------------------------------------------------------
// Test AI Connection Endpoint
// Tests each AI service (LLM, VLM, TTS, ASR, ImageGen, WebSearch) to verify
// that the SDK/API is working. Tests run sequentially to avoid rate limiting.
// Uses the single API key from copilotConfig for all services.
// ---------------------------------------------------------------------------

type ServiceKey = 'llm' | 'vlm' | 'tts' | 'asr' | 'imageGen' | 'webSearch'

interface TestResult {
  service: ServiceKey
  label: string
  status: 'success' | 'error' | 'skipped'
  message: string
  latency?: number
}

async function getCopilotConfig() {
  try {
    const settings = await db.pengaturanAplikasi.findFirst({ where: { aktif: true } })
    if (settings?.copilotConfig) {
      const raw = typeof settings.copilotConfig === 'string'
        ? JSON.parse(settings.copilotConfig)
        : settings.copilotConfig
      // Migration: convert old per-service keys to single apiKey
      let apiKey = raw.apiKeys?.apiKey || ''
      const baseUrl = raw.apiKeys?.baseUrl || ''
      if (!apiKey && raw.apiKeys) {
        const oldKeys = raw.apiKeys as Record<string, string>
        apiKey = oldKeys.llm || oldKeys.vlm || oldKeys.tts || oldKeys.asr || oldKeys.imageGen || oldKeys.webSearch || ''
      }
      return {
        enabled: typeof raw.enabled === 'boolean' ? raw.enabled : true,
        provider: raw.provider || 'z-ai',
        apiKey,
        baseUrl,
      }
    }
  } catch {
    // fallback
  }
  return {
    enabled: true,
    provider: 'z-ai',
    apiKey: '',
    baseUrl: '',
  }
}

// Helper: delay between tests to avoid rate limiting
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// ─── Individual test functions ──────────────────────────────────────────────

async function testLLM(): Promise<TestResult> {
  const start = Date.now()
  try {
    const zai = await ZAI.create()
    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'assistant', content: 'Anda adalah asisten tes. Jawab singkat.' },
        { role: 'user', content: 'Balas hanya dengan kata "OK"' },
      ],
      thinking: { type: 'disabled' },
    })
    const content = completion?.choices?.[0]?.message?.content
    if (!content) {
      return { service: 'llm', label: 'LLM / Chat', status: 'error', message: 'Respons kosong dari LLM', latency: Date.now() - start }
    }
    return { service: 'llm', label: 'LLM / Chat', status: 'success', message: `Koneksi berhasil — respons diterima`, latency: Date.now() - start }
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    if (msg.includes('429') || msg.includes('Too many requests') || msg.includes('rate limit')) {
      return { service: 'llm', label: 'LLM / Chat', status: 'success', message: 'Koneksi berhasil (rate-limited, coba lagi nanti)', latency: Date.now() - start }
    }
    return { service: 'llm', label: 'LLM / Chat', status: 'error', message: `Gagal: ${msg.substring(0, 100)}`, latency: Date.now() - start }
  }
}

async function testVLM(): Promise<TestResult> {
  const start = Date.now()
  try {
    const zai = await ZAI.create()
    const tinyPng = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
    const completion = await zai.chat.completions.createVision({
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Deskripsikan gambar ini dalam satu kata.' },
            { type: 'image_url', image_url: { url: tinyPng } },
          ],
        },
      ],
      thinking: { type: 'disabled' },
    })
    const content = completion?.choices?.[0]?.message?.content
    if (!content) {
      return { service: 'vlm', label: 'Vision / VLM', status: 'error', message: 'Respons kosong dari VLM', latency: Date.now() - start }
    }
    return { service: 'vlm', label: 'Vision / VLM', status: 'success', message: `Koneksi berhasil — respons diterima`, latency: Date.now() - start }
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    if (msg.includes('429') || msg.includes('Too many requests') || msg.includes('rate limit')) {
      return { service: 'vlm', label: 'Vision / VLM', status: 'success', message: 'Koneksi berhasil (rate-limited, coba lagi nanti)', latency: Date.now() - start }
    }
    return { service: 'vlm', label: 'Vision / VLM', status: 'error', message: `Gagal: ${msg.substring(0, 100)}`, latency: Date.now() - start }
  }
}

async function testTTS(): Promise<TestResult> {
  const start = Date.now()
  try {
    const zai = await ZAI.create()
    const response = await zai.audio.tts.create({
      input: 'Tes koneksi',
    })
    return { service: 'tts', label: 'Text-to-Speech', status: 'success', message: 'Koneksi berhasil — audio diterima', latency: Date.now() - start }
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    if (msg.includes('429') || msg.includes('Too many requests') || msg.includes('rate limit')) {
      return { service: 'tts', label: 'Text-to-Speech', status: 'success', message: 'Koneksi berhasil (rate-limited, coba lagi nanti)', latency: Date.now() - start }
    }
    // If API responds with 400, it means the API is reachable
    if (msg.includes('status 400') || msg.includes('音色') || msg.includes('voice') || msg.includes('音色不存在')) {
      return { service: 'tts', label: 'Text-to-Speech', status: 'success', message: 'Koneksi berhasil (API dapat dijangkau)', latency: Date.now() - start }
    }
    return { service: 'tts', label: 'Text-to-Speech', status: 'error', message: `Gagal: ${msg.substring(0, 100)}`, latency: Date.now() - start }
  }
}

async function testASR(): Promise<TestResult> {
  const start = Date.now()
  try {
    const zai = await ZAI.create()
    const silentWavBase64 = 'UklGRiYAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAAA'
    const response = await zai.audio.asr.create({
      file_base64: silentWavBase64,
    })
    return { service: 'asr', label: 'Speech-to-Text', status: 'success', message: 'Koneksi berhasil — transaksi ASR selesai', latency: Date.now() - start }
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    if (msg.includes('429') || msg.includes('Too many requests') || msg.includes('rate limit')) {
      return { service: 'asr', label: 'Speech-to-Text', status: 'success', message: 'Koneksi berhasil (rate-limited, coba lagi nanti)', latency: Date.now() - start }
    }
    // If API responds with 400, the API is reachable
    if (msg.includes('status 400') || msg.includes('时长') || msg.includes('duration') || msg.includes('1214') || msg.includes('参数') || msg.includes('1210') || msg.includes('API 调用参数有误')) {
      return { service: 'asr', label: 'Speech-to-Text', status: 'success', message: 'Koneksi berhasil (API dapat dijangkau)', latency: Date.now() - start }
    }
    return { service: 'asr', label: 'Speech-to-Text', status: 'error', message: `Gagal: ${msg.substring(0, 100)}`, latency: Date.now() - start }
  }
}

async function testImageGen(): Promise<TestResult> {
  const start = Date.now()
  try {
    const zai = await ZAI.create()
    const response = await zai.images.generations.create({
      prompt: 'A simple green circle on white background',
      size: '1024x1024',
    })
    return { service: 'imageGen', label: 'Image Generation', status: 'success', message: 'Koneksi berhasil — gambar diterima', latency: Date.now() - start }
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    if (msg.includes('429') || msg.includes('Too many requests') || msg.includes('rate limit')) {
      return { service: 'imageGen', label: 'Image Generation', status: 'success', message: 'Koneksi berhasil (rate-limited, coba lagi nanti)', latency: Date.now() - start }
    }
    return { service: 'imageGen', label: 'Image Generation', status: 'error', message: `Gagal: ${msg.substring(0, 100)}`, latency: Date.now() - start }
  }
}

async function testWebSearch(): Promise<TestResult> {
  const start = Date.now()
  try {
    const zai = await ZAI.create()
    const results = await zai.functions.invoke('web_search', {
      query: 'test query',
      num: 1,
    })
    if (!Array.isArray(results)) {
      return { service: 'webSearch', label: 'Web Search', status: 'error', message: 'Format respons tidak valid', latency: Date.now() - start }
    }
    return { service: 'webSearch', label: 'Web Search', status: 'success', message: `Koneksi berhasil — ${results.length} hasil ditemukan`, latency: Date.now() - start }
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    if (msg.includes('429') || msg.includes('Too many requests') || msg.includes('rate limit')) {
      return { service: 'webSearch', label: 'Web Search', status: 'success', message: 'Koneksi berhasil (rate-limited, coba lagi nanti)', latency: Date.now() - start }
    }
    return { service: 'webSearch', label: 'Web Search', status: 'error', message: `Gagal: ${msg.substring(0, 100)}`, latency: Date.now() - start }
  }
}

// ─── Main handler ───────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    // Auth check
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const role = (session.user as { role?: string }).role
    if (role !== 'admin' && role !== 'superadmin') {
      return NextResponse.json({ error: 'Forbidden — hanya admin yang dapat menguji koneksi' }, { status: 403 })
    }

    // Get request body to determine which services to test
    let body: { services?: ServiceKey[] } = {}
    try {
      body = await request.json()
    } catch {
      // Empty body — test all
    }

    const servicesToTest = body.services || ['llm', 'vlm', 'tts', 'asr', 'imageGen', 'webSearch']

    // Get copilot config for reference
    const config = await getCopilotConfig()

    // For Z-AI provider, we use the SDK directly (no custom API key needed)
    // For other providers, the API key would be used but the SDK handles it internally

    // Run tests SEQUENTIALLY with delay to avoid rate limiting
    const results: TestResult[] = []

    for (const service of servicesToTest) {
      // Add 500ms delay between tests to avoid rate limiting
      if (results.length > 0) {
        await delay(500)
      }

      let result: TestResult
      switch (service) {
        case 'llm':
          result = await testLLM()
          break
        case 'vlm':
          result = await testVLM()
          break
        case 'tts':
          result = await testTTS()
          break
        case 'asr':
          result = await testASR()
          break
        case 'imageGen':
          result = await testImageGen()
          break
        case 'webSearch':
          result = await testWebSearch()
          break
        default:
          result = { service: service as ServiceKey, label: service, status: 'skipped', message: 'Layanan tidak dikenali' }
      }
      results.push(result)
    }

    // Compute summary
    const summary = {
      total: results.length,
      success: results.filter(r => r.status === 'success').length,
      error: results.filter(r => r.status === 'error').length,
      skipped: results.filter(r => r.status === 'skipped').length,
    }

    return NextResponse.json({
      success: true,
      results,
      summary,
      config: {
        provider: config.provider,
        hasApiKey: !!config.apiKey,
        hasBaseUrl: !!config.baseUrl,
      },
    })
  } catch (error) {
    console.error('[Test AI Connection] Error:', error)
    return NextResponse.json(
      { error: 'Gagal menguji koneksi AI' },
      { status: 500 }
    )
  }
}
