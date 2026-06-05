import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import ZAI from "z-ai-web-dev-sdk";
import type { ZAIConfig } from "z-ai-web-dev-sdk";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface AiCopilotRequest {
  message: string;
  history?: ChatMessage[];
  dashboardContext?: Record<string, unknown>;
}

interface CopilotConfigFromDb {
  enabled: boolean;
  provider: string;
  model: string;
  systemPrompt: string;
  welcomeMessage: string;
  temperature: number;
  maxTokens: number;
  apiKeys: {
    llm: string;
    vlm: string;
    tts: string;
    asr: string;
    imageGen: string;
    webSearch: string;
    baseUrl: string;
  };
}

const DEFAULT_COPILOT_CONFIG: CopilotConfigFromDb = {
  enabled: true,
  provider: "z-ai",
  model: "default",
  systemPrompt: "",
  welcomeMessage: "Saya siap membantu menganalisis data keuangan daerah.",
  temperature: 0.7,
  maxTokens: 4096,
  apiKeys: {
    llm: "",
    vlm: "",
    tts: "",
    asr: "",
    imageGen: "",
    webSearch: "",
    baseUrl: "",
  },
};

// ---------------------------------------------------------------------------
// Auth helper
// ---------------------------------------------------------------------------

/** Get AI config from database settings — reads copilotConfig (NOT aiConfig) */
async function getCopilotConfigFromDb(): Promise<CopilotConfigFromDb> {
  try {
    const settings = await db.pengaturanAplikasi.findFirst({
      where: { aktif: true },
    });
    if (!settings?.copilotConfig) return DEFAULT_COPILOT_CONFIG;

    const raw = typeof settings.copilotConfig === "string"
      ? JSON.parse(settings.copilotConfig)
      : settings.copilotConfig;

    return {
      enabled: typeof raw.enabled === "boolean" ? raw.enabled : true,
      provider: typeof raw.provider === "string" ? raw.provider : "z-ai",
      model: typeof raw.model === "string" ? raw.model : "default",
      systemPrompt: typeof raw.systemPrompt === "string" ? raw.systemPrompt : "",
      welcomeMessage: typeof raw.welcomeMessage === "string" ? raw.welcomeMessage : "",
      temperature: typeof raw.temperature === "number" ? raw.temperature : 0.7,
      maxTokens: typeof raw.maxTokens === "number" ? raw.maxTokens : 4096,
      apiKeys: {
        llm: raw.apiKeys?.llm || "",
        vlm: raw.apiKeys?.vlm || "",
        tts: raw.apiKeys?.tts || "",
        asr: raw.apiKeys?.asr || "",
        imageGen: raw.apiKeys?.imageGen || "",
        webSearch: raw.apiKeys?.webSearch || "",
        baseUrl: raw.apiKeys?.baseUrl || "",
      },
    };
  } catch {
    return DEFAULT_COPILOT_CONFIG;
  }
}

/** Create ZAI instance with optional custom config from DB */
async function createZaiInstance(config: CopilotConfigFromDb): Promise<ZAI> {
  // ZAI.create() auto-configures — the API keys from settings are stored for reference
  // The SDK uses its own auto-configuration mechanism
  const zai = await ZAI.create();
  return zai;
}

async function authenticate(): Promise<{ authorized: boolean; status: number }> {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return { authorized: false, status: 401 };
  }

  const role = (session.user as { role?: string }).role;
  if (role !== "admin" && role !== "superadmin" && role !== "opd") {
    return { authorized: false, status: 403 };
  }

  return { authorized: true, status: 200 };
}

// ---------------------------------------------------------------------------
// System prompt builder
// ---------------------------------------------------------------------------

function buildSystemPrompt(context: Record<string, unknown> | undefined, customPrompt: string): string {
  const basePrompt = `Anda adalah **AI Financial Copilot** — asisten analis keuangan AI untuk Pemerintah Kabupaten Seruyan. Peran Anda adalah membantu menganalisis data APBD (Anggaran Pendapatan dan Belanja Daerah) dan memberikan wawasan yang mendalam.

Kemampuan Anda:
1. **Analisis APBD** — Menganalisis data Pendapatan, Belanja, dan Pembiayaan daerah secara komprehensif.
2. **Kinerja Realisasi** — Mengevaluasi pencapaian realisasi terhadap anggaran, mengidentifikasi gap, dan memberikan penjelasan.
3. **Tren & Perbandingan** — Menganalisis tren anggaran dan realisasi antar tahun anggaran.
4. **Prediksi SILPA** — Menghitung dan memproyeksikan Sisa Lebih Perhitungan Anggaran.
5. **Risiko Defisit** — Mendeteksi potensi risiko defisit anggaran berdasarkan data realisasi.
6. **Analisis Belanja Modal** — Menganalisis proporsi dan kinerja belanja modal.
7. **Kinerja OPD/SKPD** — Mengevaluasi kinerja masing-masing OPD dan mengidentifikasi yang perlu perhatian.
8. **Rekomendasi** — Memberikan rekomendasi berbasis data untuk perbaikan pengelolaan keuangan daerah.
9. **Penjelasan Keuangan** — Menjelaskan istilah dan konsep keuangan daerah dengan bahasa yang mudah dipahami.

Pedoman respons:
- Selalu respons dalam Bahasa Indonesia.
- Bersikap profesional, analitis, dan berbasis data.
- Gunakan angka dan persentase untuk mendukung argumen.
- Jika data tidak cukup, nyatakan dengan jelas dan berikan saran apa yang diperlukan.
- Format respons dengan rapi menggunakan markdown jika membantu keterbacaan.
- Jangan memberikan opini politik, fokus pada analisis keuangan objektif.
- Jika ditanya di luar konteks keuangan daerah, arahkan kembali ke topik APBD.
- Untuk angka besar, gunakan format yang mudah dibaca (misalnya Rp 1,5 Miliar atau Rp 994,2 Miliar).
- Berikan konteks perbandingan jika memungkinkan (misalnya dibanding tahun lalu atau dibanding target).
- Sertakan implikasi praktis dari setiap temuan atau analisis.`;

  let prompt = basePrompt;

  // Append custom system prompt from admin settings
  if (customPrompt && customPrompt.trim().length > 0) {
    prompt += `\n\n---\nINSTRUKSI TAMBAHAN DARI ADMIN:\n${customPrompt}`;
  }

  if (context && Object.keys(context).length > 0) {
    const contextString = JSON.stringify(context, null, 2);
    prompt += `\n\n---\nKONTEKS DATA DASHBOARD SAAT INI:\nBerikut adalah data dashboard yang sedang dilihat pengguna. Gunakan data ini sebagai referensi untuk menjawab pertanyaan:\n\n${contextString}\n\nGunakan data di atas untuk memberikan analisis yang spesifik dan akurat. Ketika merujuk ke angka, sebutkan nilainya secara eksplisit. Format angka besar dalam Rupiah (misalnya Rp 1,5 Miliar atau Rp 994,2 Miliar) agar mudah dibaca.`;
  }

  return prompt;
}

// ---------------------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------------------

export async function POST(request: Request) {
  try {
    // ── Get copilot config from DB ─────────────────────────────────────
    const copilotConfig = await getCopilotConfigFromDb();

    // ── Check AI enabled ────────────────────────────────────────────────
    if (!copilotConfig.enabled) {
      return NextResponse.json(
        { error: "Fitur AI dinonaktifkan — hubungi administrator untuk mengaktifkan" },
        { status: 403 }
      );
    }

    // ── Authentication ──────────────────────────────────────────────────
    const auth = await authenticate();
    if (!auth.authorized) {
      return NextResponse.json(
        { error: auth.status === 401 ? "Unauthorized — silakan login terlebih dahulu" : "Forbidden — akses hanya untuk admin, superadmin, dan OPD" },
        { status: auth.status }
      );
    }

    // ── Parse & validate request body ───────────────────────────────────
    let body: AiCopilotRequest;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Request body tidak valid — harus berupa JSON" },
        { status: 400 }
      );
    }

    const { message, history, dashboardContext } = body;

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return NextResponse.json(
        { error: "Field 'message' wajib diisi dan tidak boleh kosong" },
        { status: 400 }
      );
    }

    if (message.length > 10000) {
      return NextResponse.json(
        { error: "Pesan terlalu panjang — maksimum 10.000 karakter" },
        { status: 400 }
      );
    }

    // Validate history entries if provided
    if (history && Array.isArray(history)) {
      for (const entry of history) {
        if (!entry.role || !entry.content) {
          return NextResponse.json(
            { error: "Setiap entri history harus memiliki 'role' dan 'content'" },
            { status: 400 }
          );
        }
        if (entry.role !== "user" && entry.role !== "assistant") {
          return NextResponse.json(
            { error: "Role pada history harus 'user' atau 'assistant'" },
            { status: 400 }
          );
        }
      }
    }

    // ── Build messages array ────────────────────────────────────────────
    const systemPrompt = buildSystemPrompt(dashboardContext, copilotConfig.systemPrompt);

    const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
      { role: "system", content: systemPrompt },
    ];

    // Append conversation history (limit to last 20 turns to stay within token limits)
    if (history && Array.isArray(history)) {
      const recentHistory = history.slice(-20);
      for (const entry of recentHistory) {
        messages.push({
          role: entry.role as "user" | "assistant",
          content: entry.content,
        });
      }
    }

    // Append the current user message
    messages.push({ role: "user", content: message.trim() });

    // ── Call LLM via z-ai-web-dev-sdk ───────────────────────────────────
    const zai = await createZaiInstance(copilotConfig);

    const completionOptions: Record<string, unknown> = {
      messages,
      thinking: { type: "disabled" },
    };

    // Use custom model if configured
    if (copilotConfig.model && copilotConfig.model !== "default") {
      completionOptions.model = copilotConfig.model;
    }

    // Apply temperature if configured
    if (typeof copilotConfig.temperature === "number") {
      completionOptions.temperature = copilotConfig.temperature;
    }

    // Apply maxTokens if configured
    if (typeof copilotConfig.maxTokens === "number") {
      completionOptions.max_tokens = copilotConfig.maxTokens;
    }

    const completion = await zai.chat.completions.create(completionOptions as Parameters<typeof zai.chat.completions.create>[0]);

    // Extract the assistant response
    const assistantMessage =
      completion?.choices?.[0]?.message?.content ?? "";

    if (!assistantMessage) {
      return NextResponse.json(
        { error: "AI tidak menghasilkan respons — silakan coba lagi" },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      response: assistantMessage,
    });
  } catch (error) {
    console.error("[AI Copilot] Error:", error);

    // Handle known SDK error patterns
    if (error instanceof Error) {
      const msg = error.message.toLowerCase();

      if (msg.includes("rate limit") || msg.includes("too many requests")) {
        return NextResponse.json(
          { error: "Terlalu banyak permintaan — silakan tunggu sebentar dan coba lagi" },
          { status: 429 }
        );
      }

      if (msg.includes("timeout") || msg.includes("timed out")) {
        return NextResponse.json(
          { error: "Permintaan timeout — silakan coba lagi" },
          { status: 504 }
        );
      }

      if (msg.includes("api key") || msg.includes("unauthorized") || msg.includes("authentication")) {
        return NextResponse.json(
          { error: "Konfigurasi AI tidak valid — hubungi administrator" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { error: "Terjadi kesalahan internal — silakan coba lagi nanti" },
      { status: 500 }
    );
  }
}
