import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
}

type CopilotConfig = {
  enabled: boolean
  provider: string
  model: string
  systemPrompt: string
  welcomeMessage: string
  temperature: number
  maxTokens: number
  apiKeys: {
    llm: string
    vlm: string
    tts: string
    asr: string
    imageGen: string
    webSearch: string
    baseUrl: string
  }
}

const DEFAULT_COPILOT_CONFIG: CopilotConfig = {
  enabled: true,
  provider: 'z-ai',
  model: 'default',
  systemPrompt: '',
  welcomeMessage: 'Saya siap membantu menganalisis data keuangan daerah.',
  temperature: 0.7,
  maxTokens: 4096,
  apiKeys: {
    llm: '',
    vlm: '',
    tts: '',
    asr: '',
    imageGen: '',
    webSearch: '',
    baseUrl: '',
  },
}

async function getCopilotConfig(): Promise<CopilotConfig> {
  try {
    const settings = await db.pengaturanAplikasi.findFirst({ where: { aktif: true } })
    if (settings?.copilotConfig) {
      const raw = typeof settings.copilotConfig === 'string'
        ? JSON.parse(settings.copilotConfig)
        : settings.copilotConfig
      return {
        ...DEFAULT_COPILOT_CONFIG,
        ...raw,
        apiKeys: { ...DEFAULT_COPILOT_CONFIG.apiKeys, ...(raw.apiKeys || {}) },
      }
    }
  } catch {
    // fallback to defaults
  }
  return DEFAULT_COPILOT_CONFIG
}

// Singleton ZAI instance
let zaiInstance: Awaited<ReturnType<typeof ZAI.create>> | null = null

async function getZAI() {
  if (!zaiInstance) {
    zaiInstance = await ZAI.create()
  }
  return zaiInstance
}

function safePct(num: number, den: number): number {
  if (!den || !isFinite(den)) return 0
  const r = (num / den) * 100
  return isFinite(r) ? Math.round(r * 100) / 100 : 0
}

function formatRp(value: number): string {
  if (value >= 1_000_000_000_000) return `Rp ${(value / 1_000_000_000_000).toFixed(2)} Triliun`
  if (value >= 1_000_000_000) return `Rp ${(value / 1_000_000_000).toFixed(2)} Miliar`
  if (value >= 1_000_000) return `Rp ${(value / 1_000_000).toFixed(2)} Juta`
  return `Rp ${value.toLocaleString('id-ID')}`
}

export async function POST(request: Request) {
  try {
    // Check if copilot is enabled
    const copilotConfig = await getCopilotConfig()
    if (!copilotConfig.enabled) {
      return NextResponse.json({ error: 'AI Copilot tidak aktif. Aktifkan melalui pengaturan.' }, { status: 403 })
    }

    const body = await request.json()
    const { message, history = [], tahun } = body as {
      message: string
      history: ChatMessage[]
      tahun?: number
    }

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // Get active fiscal year
    const tahunList = await db.tahunAnggaran.findMany({ orderBy: { tahun: 'asc' } })
    const targetTahun = tahun || (tahunList.find(t => t.aktif)?.tahun || (tahunList.length > 0 ? tahunList[tahunList.length - 1].tahun : 2025))
    const tahunAnggaran = await db.tahunAnggaran.findUnique({ where: { tahun: targetTahun } })

    if (!tahunAnggaran) {
      return NextResponse.json({ error: `Year ${targetTahun} not found` }, { status: 404 })
    }

    const taId = tahunAnggaran.id

    // Fetch all financial data in parallel
    const [pendapatan, belanja, pembiayaan, realisasiAkun, realisasiSkpd, opdList] =
      await Promise.all([
        db.pendapatan.findMany({ where: { tahunAnggaranId: taId }, orderBy: { kodeAkun: 'asc' } }),
        db.belanja.findMany({ where: { tahunAnggaranId: taId }, orderBy: { kodeAkun: 'asc' } }),
        db.pembiayaan.findMany({ where: { tahunAnggaranId: taId }, orderBy: { kodeAkun: 'asc' } }),
        db.realisasiAkun.findMany({ where: { tahunAnggaranId: taId }, orderBy: { kodeAkun: 'asc' } }),
        db.realisasiSkpd.findMany({ where: { tahunAnggaranId: taId }, orderBy: { kodeSkpd: 'asc' } }),
        db.opd.findMany({ where: { tahunAnggaranId: taId }, orderBy: { kodeOpd: 'asc' } }),
      ])

    // Also fetch previous year for comparison
    const prevTahun = targetTahun - 1
    const prevTahunAnggaran = await db.tahunAnggaran.findUnique({ where: { tahun: prevTahun } })
    let prevData = null
    if (prevTahunAnggaran) {
      const [prevPend, prevBel] = await Promise.all([
        db.pendapatan.findMany({ where: { tahunAnggaranId: prevTahunAnggaran.id } }),
        db.belanja.findMany({ where: { tahunAnggaranId: prevTahunAnggaran.id } }),
      ])
      prevData = {
        tahun: prevTahun,
        totalPendapatan: prevPend.reduce((s, p) => s + p.anggaran, 0),
        realisasiPendapatan: prevPend.reduce((s, p) => s + p.realisasi, 0),
        totalBelanja: prevBel.reduce((s, b) => s + b.anggaran, 0),
        realisasiBelanja: prevBel.reduce((s, b) => s + b.realisasi, 0),
      }
    }

    // Compute key metrics
    const totalPendapatan = pendapatan.reduce((s, p) => s + p.anggaran, 0)
    const realisasiPendapatan = pendapatan.reduce((s, p) => s + p.realisasi, 0)
    const totalBelanja = belanja.reduce((s, b) => s + b.anggaran, 0)
    const realisasiBelanja = belanja.reduce((s, b) => s + b.realisasi, 0)
    const totalPembiayaan = pembiayaan.reduce((s, p) => s + p.anggaran, 0)
    const realisasiPembiayaan = pembiayaan.reduce((s, p) => s + p.realisasi, 0)

    const pctPendapatan = safePct(realisasiPendapatan, totalPendapatan)
    const pctBelanja = safePct(realisasiBelanja, totalBelanja)

    const pembiayaanMasuk = pembiayaan.filter(p => p.realisasi > 0).reduce((s, p) => s + p.realisasi, 0)
    const pembiayaanKeluar = pembiayaan.filter(p => p.realisasi < 0).reduce((s, p) => s + Math.abs(p.realisasi), 0)
    const silpa = realisasiPendapatan - realisasiBelanja + pembiayaanMasuk - pembiayaanKeluar

    // Belanja modal percentage
    const belanjaModal = belanja.filter(b => b.kategori === 'Modal')
    const totalBelanjaModal = belanjaModal.reduce((s, b) => s + b.anggaran, 0)
    const realisasiBelanjaModal = belanjaModal.reduce((s, b) => s + b.realisasi, 0)
    const pctBelanjaModal = safePct(totalBelanjaModal, totalBelanja)
    const pctRealisasiModal = safePct(realisasiBelanjaModal, totalBelanjaModal)

    // Top/bottom OPD
    const sortedSkpd = [...realisasiSkpd].sort((a, b) => b.persentase - a.persentase)
    const top5Opd = sortedSkpd.slice(0, 5).map(s => `${s.namaSkpd} (${s.persentase.toFixed(1)}%)`)
    const bottom5Opd = sortedSkpd.slice(-5).reverse().map(s => `${s.namaSkpd} (${s.persentase.toFixed(1)}%)`)

    // Zero realization OPDs
    const zeroRealisasiOpd = realisasiSkpd.filter(s => s.realisasi === 0 && s.anggaran > 0)
    const zeroRealisasiBelanja = belanja.filter(b => b.anggaran > 0 && b.realisasi === 0)

    // Over-budget items
    const overBudget = belanja.filter(b => b.anggaran > 0 && b.realisasi > b.anggaran)

    // Top 10 largest budget items
    const top10Belanja = [...belanja].sort((a, b) => b.anggaran - a.anggaran).slice(0, 10)
    const top10Pendapatan = [...pendapatan].sort((a, b) => b.anggaran - a.anggaran).slice(0, 10)

    // Elapsed time in fiscal year
    const now = new Date()
    const yearStart = new Date(targetTahun, 0, 1)
    const yearEnd = new Date(targetTahun, 11, 31)
    const elapsedPct = Math.max(0, Math.min(100, ((now.getTime() - yearStart.getTime()) / (yearEnd.getTime() - yearStart.getTime())) * 100))

    // Build comprehensive context
    const financialContext = `
## DATA KEUANGAN DAERAH — TAHUN ANGGARAN ${targetTahun}
Pemerintah Kabupaten Seruyan
Tanggal analisis: ${now.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
Progress waktu tahun: ${elapsedPct.toFixed(1)}%

### RINGKASAN UTAMA
- Total Anggaran Pendapatan: ${formatRp(totalPendapatan)} | Realisasi: ${formatRp(realisasiPendapatan)} (${pctPendapatan.toFixed(2)}%)
- Total Anggaran Belanja: ${formatRp(totalBelanja)} | Realisasi: ${formatRp(realisasiBelanja)} (${pctBelanja.toFixed(2)}%)
- Total Anggaran Pembiayaan: ${formatRp(totalPembiayaan)} | Realisasi: ${formatRp(realisasiPembiayaan)}
- Pembiayaan Masuk: ${formatRp(pembiayaanMasuk)} | Pembiayaan Keluar: ${formatRp(pembiayaanKeluar)}
- SILPA (Sisa Lebih Perhitungan Anggaran): ${formatRp(silpa)} (${silpa >= 0 ? 'Surplus' : 'Defisit'})
- Cash Position: ${formatRp(totalPendapatan - realisasiBelanja)}

### BELANJA MODAL
- Anggaran Belanja Modal: ${formatRp(totalBelanjaModal)} (${pctBelanjaModal.toFixed(2)}% dari total belanja)
- Realisasi Belanja Modal: ${formatRp(realisasiBelanjaModal)} (${pctRealisasiModal.toFixed(2)}%)

### TOP 5 OPD TERBAIK (Realisasi Tertinggi)
${top5Opd.map((o, i) => `${i + 1}. ${o}`).join('\n')}

### TOP 5 OPD TERENDAH (Realisasi Terendah)
${bottom5Opd.map((o, i) => `${i + 1}. ${o}`).join('\n')}

### OPD BELUM REALISASI SAMA SEKALI (${zeroRealisasiOpd.length} OPD)
${zeroRealisasiOpd.length > 0 ? zeroRealisasiOpd.map(o => `- ${o.namaSkpd} (Anggaran: ${formatRp(o.anggaran)})`).join('\n') : 'Semua OPD sudah memiliki realisasi.'}

### REKENING BELANJA NIHIL (${zeroRealisasiBelanja.length} rekening)
${zeroRealisasiBelanja.length > 0 ? zeroRealisasiBelanja.slice(0, 20).map(b => `- ${b.kodeAkun} ${b.namaAkun} (Anggaran: ${formatRp(b.anggaran)})`).join('\n') : 'Semua rekening sudah memiliki realisasi.'}
${zeroRealisasiBelanja.length > 20 ? `...dan ${zeroRealisasiBelanja.length - 20} rekening lainnya` : ''}

### REKENING OVER-BUDGET (${overBudget.length} rekening)
${overBudget.length > 0 ? overBudget.map(b => `- ${b.kodeAkun} ${b.namaAkun} (Anggaran: ${formatRp(b.anggaran)}, Realisasi: ${formatRp(b.realisasi)}, Lebih ${safePct(b.realisasi - b.anggaran, b.anggaran).toFixed(1)}%)`).join('\n') : 'Tidak ada rekening over-budget.'}

### TOP 10 KEGIATAN BELANJA TERBESAR
${top10Belanja.map((b, i) => `${i + 1}. ${b.kodeAkun} ${b.namaAkun} — Anggaran: ${formatRp(b.anggaran)}, Realisasi: ${formatRp(b.realisasi)} (${safePct(b.realisasi, b.anggaran).toFixed(1)}%)`).join('\n')}

### TOP 10 PENDAPATAN TERBESAR
${top10Pendapatan.map((p, i) => `${i + 1}. ${p.kodeAkun} ${p.namaAkun} — Target: ${formatRp(p.anggaran)}, Realisasi: ${formatRp(p.realisasi)} (${safePct(p.realisasi, p.anggaran).toFixed(1)}%)`).join('\n')}

### DETAIL REALISASI PER SKPD (${realisasiSkpd.length} SKPD)
${realisasiSkpd.map(s => `- ${s.kodeSkpd} ${s.namaSkpd}: Anggaran ${formatRp(s.anggaran)}, Realisasi ${formatRp(s.realisasi)} (${s.persentase.toFixed(2)}%)`).join('\n')}

### DETAIL REALISASI PER AKUN
Pendapatan:
${realisasiAkun.filter(r => r.jenis === 'Pendapatan').map(r => `- ${r.kodeAkun} ${r.namaAkun}: ${formatRp(r.anggaran)} → ${formatRp(r.realisasi)} (${safePct(r.realisasi, r.anggaran).toFixed(1)}%)`).join('\n')}

Belanja:
${realisasiAkun.filter(r => r.jenis === 'Belanja').map(r => `- ${r.kodeAkun} ${r.namaAkun}: ${formatRp(r.anggaran)} → ${formatRp(r.realisasi)} (${safePct(r.realisasi, r.anggaran).toFixed(1)}%)`).join('\n')}

Pembiayaan:
${realisasiAkun.filter(r => r.jenis === 'Pembiayaan').map(r => `- ${r.kodeAkun} ${r.namaAkun}: ${formatRp(r.anggaran)} → ${formatRp(r.realisasi)} (${safePct(r.realisasi, r.anggaran).toFixed(1)}%)`).join('\n')}
${prevData ? `
### PERBANDINGAN DENGAN TAHUN LALU (${prevTahun})
- Pendapatan ${prevTahun}: Target ${formatRp(prevData.totalPendapatan)}, Realisasi ${formatRp(prevData.realisasiPendapatan)} (${safePct(prevData.realisasiPendapatan, prevData.totalPendapatan).toFixed(2)}%)
- Belanja ${prevTahun}: Target ${formatRp(prevData.totalBelanja)}, Realisasi ${formatRp(prevData.realisasiBelanja)} (${safePct(prevData.realisasiBelanja, prevData.totalBelanja).toFixed(2)}%)
- Pertumbuhan Pendapatan: ${totalPendapatan > 0 && prevData.totalPendapatan > 0 ? ((totalPendapatan - prevData.totalPendapatan) / prevData.totalPendapatan * 100).toFixed(2) + '%' : 'N/A'}
- Pertumbuhan Belanja: ${totalBelanja > 0 && prevData.totalBelanja > 0 ? ((totalBelanja - prevData.totalBelanja) / prevData.totalBelanja * 100).toFixed(2) + '%' : 'N/A'}
` : '- Data tahun lalu tidak tersedia untuk perbandingan.'}
`.trim()

    // System prompt for the AI
    const systemPrompt = `Kamu adalah AI Financial Copilot untuk Dashboard Keuangan Daerah Kabupaten Seruyan. Kamu adalah asisten keuangan daerah yang sangat ahli dan membantu.

PERAN:
- Jawab pertanyaan tentang keuangan daerah berdasarkan DATA yang diberikan
- Berikan analisis, insight, dan rekomendasi yang actionable
- Gunakan bahasa Indonesia yang formal namun mudah dipahami
- Jika ditanya sesuatu di luar konteks keuangan daerah, arahkan kembali ke topik keuangan

ATURAN:
- SELALU berdasarkan DATA FACTUAL yang disediakan di konteks
- Jangan mengarang angka — gunakan data yang ada
- Jika data tidak cukup, katakan jujur bahwa data belum tersedia
- Format angka dengan gaya Indonesia (Rp 1,5 Miliar, 92,35%)
- Berikan saran tindak lanjut yang konkret
- Untuk pertanyaan perbandingan, gunakan data tahun lalu jika tersedia
- Jika ditanya tentang risiko, rujuk ke pola data (serapan rendah, over-budget, dll)

KONTEKS DATA KEUANGAN:
${financialContext}

${copilotConfig.systemPrompt ? `INSTRUKSI TAMBAHAN DARI ADMIN:\n${copilotConfig.systemPrompt}` : ''}`

    // Build message array with history
    const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [
      { role: 'assistant', content: systemPrompt },
    ]

    // Add conversation history (keep last 10 messages to avoid token limit)
    const recentHistory = history.slice(-10)
    for (const msg of recentHistory) {
      messages.push({ role: msg.role, content: msg.content })
    }

    // Add current message
    messages.push({ role: 'user', content: message })

    // Call LLM
    const zai = await getZAI()
    
    // Build completion options with copilotConfig settings
    const completionOptions: Record<string, unknown> = {
      messages,
      thinking: { type: 'disabled' },
    }
    
    // Use custom model if configured
    if (copilotConfig.model && copilotConfig.model !== 'default') {
      completionOptions.model = copilotConfig.model
    }
    
    // Apply temperature if configured
    if (typeof copilotConfig.temperature === 'number') {
      completionOptions.temperature = copilotConfig.temperature
    }
    
    // Apply maxTokens if configured
    if (typeof copilotConfig.maxTokens === 'number') {
      completionOptions.max_tokens = copilotConfig.maxTokens
    }
    
    const completion = await zai.chat.completions.create(
      completionOptions as Parameters<typeof zai.chat.completions.create>[0]
    )

    const aiResponse = completion.choices[0]?.message?.content

    if (!aiResponse) {
      return NextResponse.json({ error: 'AI tidak dapat memberikan respons' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      response: aiResponse,
      tahun: targetTahun,
    })
  } catch (error) {
    console.error('Copilot API error:', error)
    return NextResponse.json(
      { error: 'Gagal memproses pertanyaan. Silakan coba lagi.' },
      { status: 500 }
    )
  }
}
