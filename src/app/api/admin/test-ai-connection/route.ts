import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import ZAI from 'z-ai-web-dev-sdk'

// ---------------------------------------------------------------------------
// Test AI Connection Endpoint
// Tests AI services to verify that the SDK/API is working.
//
// For Z-AI provider: Tests each AI service (LLM, VLM, TTS, ASR, ImageGen,
//   WebSearch) sequentially using the Z-AI SDK.
// For other providers: Makes a single HTTP connection test using the user's
//   configured API key and base URL.
// ---------------------------------------------------------------------------

type ServiceKey = 'llm' | 'vlm' | 'tts' | 'asr' | 'imageGen' | 'webSearch' | 'connection'

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

// ─── Provider default base URLs ────────────────────────────────────────────

const PROVIDER_DEFAULTS: Record<string, { baseUrl: string; model: string }> = {
  openai: { baseUrl: 'https://api.openai.com/v1', model: 'gpt-3.5-turbo' },
  google: { baseUrl: 'https://generativelanguage.googleapis.com/v1beta', model: 'gemini-2.0-flash' },
  anthropic: { baseUrl: 'https://api.anthropic.com/v1', model: 'claude-3-haiku-20240307' },
  mistral: { baseUrl: 'https://api.mistral.ai/v1', model: 'mistral-tiny' },
  groq: { baseUrl: 'https://api.groq.com/openai/v1', model: 'llama3-8b-8192' },
  deepseek: { baseUrl: 'https://api.deepseek.com/v1', model: 'deepseek-chat' },
  custom: { baseUrl: '', model: 'gpt-3.5-turbo' },
}

// ─── Non-ZAI connection test ───────────────────────────────────────────────

async function testProviderConnection(
  provider: string,
  apiKey: string,
  baseUrl: string
): Promise<TestResult> {
  const start = Date.now()
  const label = 'Koneksi'

  if (!apiKey) {
    return {
      service: 'connection',
      label,
      status: 'error',
      message: 'API Key belum dikonfigurasi',
      latency: Date.now() - start,
    }
  }

  const defaults = PROVIDER_DEFAULTS[provider] || PROVIDER_DEFAULTS.custom
  const effectiveBaseUrl = baseUrl || defaults.baseUrl

  if (!effectiveBaseUrl) {
    return {
      service: 'connection',
      label,
      status: 'error',
      message: 'Base URL belum dikonfigurasi',
      latency: Date.now() - start,
    }
  }

  try {
    if (provider === 'google') {
      // Google Gemini API
      const url = `${effectiveBaseUrl}/models/${defaults.model}:generateContent?key=${apiKey}`
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: 'OK' }] }] }),
        signal: AbortSignal.timeout(15000),
      })

      if (res.status === 401 || res.status === 403) {
        const body = await res.text().catch(() => '')
        return {
          service: 'connection',
          label,
          status: 'error',
          message: `Autentikasi gagal (${res.status}) — API Key tidak valid`,
          latency: Date.now() - start,
        }
      }

      // Any other response (including 400, 429) means the connection works
      return {
        service: 'connection',
        label,
        status: 'success',
        message: res.ok
          ? `Koneksi berhasil ke Google Gemini`
          : `Koneksi berhasil (API dapat dijangkau, status ${res.status})`,
        latency: Date.now() - start,
      }
    }

    if (provider === 'anthropic') {
      // Anthropic Claude API
      const url = `${effectiveBaseUrl}/messages`
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: defaults.model,
          messages: [{ role: 'user', content: 'OK' }],
          max_tokens: 5,
        }),
        signal: AbortSignal.timeout(15000),
      })

      if (res.status === 401 || res.status === 403) {
        return {
          service: 'connection',
          label,
          status: 'error',
          message: `Autentikasi gagal (${res.status}) — API Key tidak valid`,
          latency: Date.now() - start,
        }
      }

      return {
        service: 'connection',
        label,
        status: 'success',
        message: res.ok
          ? `Koneksi berhasil ke Anthropic`
          : `Koneksi berhasil (API dapat dijangkau, status ${res.status})`,
        latency: Date.now() - start,
      }
    }

    // OpenAI-compatible providers: openai, mistral, groq, deepseek, custom
    const url = `${effectiveBaseUrl}/chat/completions`
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: defaults.model,
        messages: [{ role: 'user', content: 'OK' }],
        max_tokens: 5,
      }),
      signal: AbortSignal.timeout(15000),
    })

    if (res.status === 401 || res.status === 403) {
      return {
        service: 'connection',
        label,
        status: 'error',
        message: `Autentikasi gagal (${res.status}) — API Key tidak valid`,
        latency: Date.now() - start,
      }
    }

    return {
      service: 'connection',
      label,
      status: 'success',
      message: res.ok
        ? `Koneksi berhasil ke ${provider}`
        : `Koneksi berhasil (API dapat dijangkau, status ${res.status})`,
      latency: Date.now() - start,
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    if (msg.includes('abort') || msg.includes('timeout') || msg.includes('AbortError')) {
      return {
        service: 'connection',
        label,
        status: 'error',
        message: 'Koneksi timeout — server tidak merespons dalam 15 detik',
        latency: Date.now() - start,
      }
    }
    return {
      service: 'connection',
      label,
      status: 'error',
      message: `Gagal terhubung: ${msg.substring(0, 120)}`,
      latency: Date.now() - start,
    }
  }
}

// ─── Z-AI individual test functions ────────────────────────────────────────

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
    // Also accepts override values for provider/apiKey/baseUrl from the form
    // so that tests use current form values (even if not saved yet)
    let body: {
      services?: ServiceKey[]
      provider?: string
      apiKey?: string
      baseUrl?: string
    } = {}
    try {
      body = await request.json()
    } catch {
      // Empty body — test all
    }

    // Get copilot config from DB as fallback
    const dbConfig = await getCopilotConfig()

    // Merge: form values override DB values (this fixes the bug where
    // unsaved API keys were not being tested)
    const config = {
      enabled: dbConfig.enabled,
      provider: body.provider || dbConfig.provider,
      apiKey: body.apiKey !== undefined ? body.apiKey : dbConfig.apiKey,
      baseUrl: body.baseUrl !== undefined ? body.baseUrl : dbConfig.baseUrl,
    }

    const results: TestResult[] = []

    // ── Non-ZAI providers: single connection test ──
    if (config.provider !== 'z-ai') {
      const requestedServices = body.services || ['connection']
      // For non-ZAI providers, we only support the 'connection' service test
      const shouldTest = requestedServices.includes('connection') || requestedServices.length === 0
      if (shouldTest || requestedServices.some(s => s !== 'connection')) {
        // Run a single connection test
        const result = await testProviderConnection(config.provider, config.apiKey, config.baseUrl)
        results.push(result)
      }
    } else {
      // ── Z-AI provider: test individual services ──
      const servicesToTest = body.services?.filter(s => s !== 'connection') as ServiceKey[] || ['llm', 'vlm', 'tts', 'asr', 'imageGen', 'webSearch']

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
