import ZAI from 'z-ai-web-dev-sdk'

// ---------------------------------------------------------------------------
// Unified Chat Completion — supports Z-AI SDK and direct API calls for
// non-ZAI providers (OpenAI, Google Gemini, Anthropic, Mistral, Groq,
// DeepSeek, Custom).
// ---------------------------------------------------------------------------

export type ProviderConfig = {
  provider: string      // "z-ai" | "openai" | "google" | "anthropic" | etc.
  apiKey: string        // API key for non-ZAI providers
  baseUrl: string       // Base URL for non-ZAI providers
  model: string         // Model name (or "default")
  temperature: number   // 0.0 – 2.0
  maxTokens: number     // Max response tokens
}

type ChatMessage = {
  role: 'system' | 'user' | 'assistant'
  content: string
}

type ChatCompletionResult = {
  content: string
  provider: string
  model: string
}

// ─── Provider default base URLs & models ──────────────────────────────────

const PROVIDER_DEFAULTS: Record<string, { baseUrl: string; model: string }> = {
  openai:    { baseUrl: 'https://api.openai.com/v1',                         model: 'gpt-4o-mini' },
  google:    { baseUrl: 'https://generativelanguage.googleapis.com/v1beta',  model: 'gemini-2.0-flash' },
  anthropic: { baseUrl: 'https://api.anthropic.com/v1',                      model: 'claude-3-haiku-20240307' },
  mistral:   { baseUrl: 'https://api.mistral.ai/v1',                         model: 'mistral-small-latest' },
  groq:      { baseUrl: 'https://api.groq.com/openai/v1',                    model: 'llama-3.3-70b-versatile' },
  deepseek:  { baseUrl: 'https://api.deepseek.com/v1',                       model: 'deepseek-chat' },
  custom:    { baseUrl: '',                                                   model: 'gpt-3.5-turbo' },
}

// ─── Singleton ZAI instance for z-ai provider ─────────────────────────────

let zaiInstance: Awaited<ReturnType<typeof ZAI.create>> | null = null

async function getZAI() {
  if (!zaiInstance) {
    zaiInstance = await ZAI.create()
  }
  return zaiInstance
}

// ─── Z-AI chat completion ─────────────────────────────────────────────────

async function callZAI(
  messages: ChatMessage[],
  config: ProviderConfig
): Promise<ChatCompletionResult> {
  const zai = await getZAI()

  // Z-AI SDK uses 'assistant' role for system prompts
  const zaiMessages = messages.map(m => ({
    role: m.role === 'system' ? ('assistant' as const) : (m.role as 'user' | 'assistant'),
    content: m.content,
  }))

  const completionOptions: Record<string, unknown> = {
    messages: zaiMessages,
    thinking: { type: 'disabled' },
  }

  if (config.model && config.model !== 'default') {
    completionOptions.model = config.model
  }
  if (typeof config.temperature === 'number') {
    completionOptions.temperature = config.temperature
  }
  if (typeof config.maxTokens === 'number') {
    completionOptions.max_tokens = config.maxTokens
  }

  const completion = await zai.chat.completions.create(
    completionOptions as Parameters<typeof zai.chat.completions.create>[0]
  )

  const content = completion?.choices?.[0]?.message?.content ?? ''
  return { content, provider: 'z-ai', model: config.model || 'default' }
}

// ─── OpenAI-compatible chat completion ─────────────────────────────────────

async function callOpenAICompatible(
  messages: ChatMessage[],
  config: ProviderConfig
): Promise<ChatCompletionResult> {
  const defaults = PROVIDER_DEFAULTS[config.provider] || PROVIDER_DEFAULTS.custom
  const baseUrl = config.baseUrl || defaults.baseUrl
  const model = (config.model && config.model !== 'default') ? config.model : defaults.model

  if (!baseUrl) {
    throw new Error('Base URL belum dikonfigurasi — periksa pengaturan AI Copilot')
  }
  if (!config.apiKey) {
    throw new Error('API Key belum dikonfigurasi — periksa pengaturan AI Copilot')
  }

  const url = `${baseUrl}/chat/completions`
  const body = {
    model,
    messages: messages.map(m => ({ role: m.role, content: m.content })),
    temperature: config.temperature ?? 0.7,
    max_tokens: config.maxTokens ?? 4096,
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(60000), // 60s timeout for long responses
  })

  if (!res.ok) {
    const errorText = await res.text().catch(() => '')
    if (res.status === 401 || res.status === 403) {
      throw new Error(`Autentikasi gagal (${res.status}) — API Key tidak valid untuk ${config.provider}`)
    }
    if (res.status === 429) {
      throw new Error('Rate limit tercapai — terlalu banyak permintaan, coba lagi nanti')
    }
    throw new Error(`API ${config.provider} error (${res.status}): ${errorText.substring(0, 200)}`)
  }

  const json = await res.json()
  const content = json?.choices?.[0]?.message?.content ?? ''
  return { content, provider: config.provider, model }
}

// ─── Google Gemini chat completion ─────────────────────────────────────────

async function callGoogleGemini(
  messages: ChatMessage[],
  config: ProviderConfig
): Promise<ChatCompletionResult> {
  const defaults = PROVIDER_DEFAULTS.google
  const baseUrl = config.baseUrl || defaults.baseUrl
  const model = (config.model && config.model !== 'default') ? config.model : defaults.model

  if (!baseUrl) {
    throw new Error('Base URL belum dikonfigurasi — periksa pengaturan AI Copilot')
  }
  if (!config.apiKey) {
    throw new Error('API Key belum dikonfigurasi — periksa pengaturan AI Copilot')
  }

  // Convert messages to Gemini format
  // Gemini uses "contents" array with "parts" instead of "messages"
  const systemInstruction = messages.find(m => m.role === 'system')?.content
  const nonSystemMessages = messages.filter(m => m.role !== 'system')

  const contents = nonSystemMessages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }))

  const body: Record<string, unknown> = {
    contents,
    generationConfig: {
      temperature: config.temperature ?? 0.7,
      maxOutputTokens: config.maxTokens ?? 4096,
    },
  }

  if (systemInstruction) {
    body.systemInstruction = { parts: [{ text: systemInstruction }] }
  }

  const url = `${baseUrl}/models/${model}:generateContent?key=${config.apiKey}`

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(60000),
  })

  if (!res.ok) {
    const errorText = await res.text().catch(() => '')
    if (res.status === 401 || res.status === 403) {
      throw new Error(`Autentikasi gagal (${res.status}) — API Key Google tidak valid`)
    }
    if (res.status === 429) {
      throw new Error('Rate limit tercapai — terlalu banyak permintaan, coba lagi nanti')
    }
    throw new Error(`Google Gemini API error (${res.status}): ${errorText.substring(0, 200)}`)
  }

  const json = await res.json()
  const content = json?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
  return { content, provider: 'google', model }
}

// ─── Anthropic Claude chat completion ──────────────────────────────────────

async function callAnthropic(
  messages: ChatMessage[],
  config: ProviderConfig
): Promise<ChatCompletionResult> {
  const defaults = PROVIDER_DEFAULTS.anthropic
  const baseUrl = config.baseUrl || defaults.baseUrl
  const model = (config.model && config.model !== 'default') ? config.model : defaults.model

  if (!baseUrl) {
    throw new Error('Base URL belum dikonfigurasi — periksa pengaturan AI Copilot')
  }
  if (!config.apiKey) {
    throw new Error('API Key belum dikonfigurasi — periksa pengaturan AI Copilot')
  }

  // Anthropic uses separate system parameter
  const systemContent = messages.find(m => m.role === 'system')?.content
  const nonSystemMessages = messages.filter(m => m.role !== 'system')

  const body: Record<string, unknown> = {
    model,
    messages: nonSystemMessages.map(m => ({
      role: m.role,
      content: m.content,
    })),
    max_tokens: config.maxTokens ?? 4096,
  }

  if (systemContent) {
    body.system = systemContent
  }
  if (typeof config.temperature === 'number') {
    body.temperature = config.temperature
  }

  const url = `${baseUrl}/messages`

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'x-api-key': config.apiKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(60000),
  })

  if (!res.ok) {
    const errorText = await res.text().catch(() => '')
    if (res.status === 401 || res.status === 403) {
      throw new Error(`Autentikasi gagal (${res.status}) — API Key Anthropic tidak valid`)
    }
    if (res.status === 429) {
      throw new Error('Rate limit tercapai — terlalu banyak permintaan, coba lagi nanti')
    }
    throw new Error(`Anthropic API error (${res.status}): ${errorText.substring(0, 200)}`)
  }

  const json = await res.json()
  // Anthropic returns content as array of blocks
  const content = Array.isArray(json?.content)
    ? json.content.map((block: { text?: string }) => block.text || '').join('')
    : (json?.content?.[0]?.text ?? '')
  return { content, provider: 'anthropic', model }
}

// ─── Unified chat completion function ─────────────────────────────────────

/**
 * Send chat messages to the configured AI provider and get a response.
 * Supports Z-AI (SDK), OpenAI-compatible, Google Gemini, and Anthropic.
 */
export async function chatCompletion(
  messages: ChatMessage[],
  config: ProviderConfig
): Promise<ChatCompletionResult> {
  switch (config.provider) {
    case 'z-ai':
      return callZAI(messages, config)

    case 'google':
      return callGoogleGemini(messages, config)

    case 'anthropic':
      return callAnthropic(messages, config)

    // OpenAI-compatible: openai, mistral, groq, deepseek, custom
    case 'openai':
    case 'mistral':
    case 'groq':
    case 'deepseek':
    case 'custom':
    default:
      return callOpenAICompatible(messages, config)
  }
}

/**
 * Get the effective model name for a given provider + configured model.
 */
export function getEffectiveModel(provider: string, configuredModel: string): string {
  if (configuredModel && configuredModel !== 'default') return configuredModel
  const defaults = PROVIDER_DEFAULTS[provider]
  return defaults?.model || 'gpt-3.5-turbo'
}
