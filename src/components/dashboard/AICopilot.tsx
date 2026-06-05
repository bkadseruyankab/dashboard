"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  DashboardData,
  formatRupiah,
  formatRupiahShort,
  formatPersentase,
} from "./types";
import { usePengaturan } from "@/context/PengaturanContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Bot,
  Send,
  Sparkles,
  MessageSquare,
  Plus,
  Trash2,
  RefreshCw,
  Loader2,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  isError?: boolean;
};

type AICopilotProps = {
  data: DashboardData;
  isAuthenticated?: boolean;
};

// ─── Quick prompt suggestions ───────────────────────────────────────────────

function getQuickPrompts(tahun: number): { icon: string; label: string; prompt: string }[] {
  return [
    {
      icon: "💰",
      label: "Realisasi Pendapatan",
      prompt: `Berapa realisasi pendapatan saat ini tahun ${tahun}?`,
    },
    {
      icon: "🏢",
      label: "OPD Terendah",
      prompt: "OPD mana yang paling rendah penyerapannya?",
    },
    {
      icon: "📈",
      label: "Prediksi SILPA",
      prompt: "Berapa prediksi SILPA tahun ini?",
    },
    {
      icon: "⚠️",
      label: "Risiko Defisit",
      prompt: "Apakah ada risiko defisit?",
    },
    {
      icon: "🏗️",
      label: "Belanja Modal",
      prompt: "Belanja modal sudah berapa persen?",
    },
    {
      icon: "📋",
      label: "10 Kegiatan Terbesar",
      prompt: "Tampilkan 10 kegiatan terbesar.",
    },
    {
      icon: "🔴",
      label: "OPD Belum Realisasi",
      prompt: "Tampilkan OPD yang belum melakukan realisasi.",
    },
    {
      icon: "📊",
      label: "Bandingkan Tahun Lalu",
      prompt: "Bandingkan dengan tahun lalu.",
    },
  ];
}

// ─── Welcome message ───────────────────────────────────────────────────────

const WELCOME_MESSAGE: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content: `Selamat datang di **AI Financial Copilot**! 👋🤖

Saya adalah asisten analis keuangan AI untuk Pemerintah Kabupaten Seruyan. Saya siap membantu Anda menganalisis data APBD dan memberikan wawasan berbasis data secara real-time.

Beberapa hal yang bisa saya bantu:
• 💰 **Realisasi pendapatan** — cek pencapaian terkini
• 🏢 **Kinerja OPD** — identifikasi yang perlu perhatian
• 📈 **Prediksi SILPA** — proyeksi sisa anggaran
• ⚠️ **Risiko defisit** — deteksi dini potensi masalah
• 🏗️ **Belanja modal** — monitoring investasi daerah
• 📊 **Perbandingan tahunan** — tren APBD antar tahun

Silakan ajukan pertanyaan atau gunakan salah satu saran di bawah untuk memulai! 🚀`,
  timestamp: new Date(),
};

// ─── Utility: unique ID ─────────────────────────────────────────────────────

let msgCounter = 0;
function uniqueId(): string {
  return `msg-${Date.now()}-${++msgCounter}`;
}

// ─── Simple Markdown-like renderer ──────────────────────────────────────────

function renderMarkdownText(text: string): React.ReactNode[] {
  const lines = text.split("\n");
  const result: React.ReactNode[] = [];
  let listItems: string[] = [];
  let listKey = 0;
  let inList = false;

  const flushList = () => {
    if (listItems.length > 0) {
      result.push(
        <ul key={`list-${listKey++}`} className="space-y-1 my-1.5 ml-1">
          {listItems.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-sm leading-relaxed">
              <span className="mt-2 w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
              <span>{renderInlineMarkdown(item)}</span>
            </li>
          ))}
        </ul>
      );
      listItems = [];
      inList = false;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Unordered list items
    const listMatch = line.match(/^[\s]*[-•*]\s+(.*)$/);
    if (listMatch) {
      inList = true;
      listItems.push(listMatch[1]);
      continue;
    }

    // Ordered list items
    const orderedMatch = line.match(/^[\s]*(\d+)[.)]\s+(.*)$/);
    if (orderedMatch) {
      inList = true;
      listItems.push(`${orderedMatch[1]}. ${orderedMatch[2]}`);
      continue;
    }

    // Flush any accumulated list items
    flushList();

    // Horizontal rule
    if (/^---+$/.test(line.trim())) {
      result.push(
        <hr
          key={`hr-${i}`}
          className="my-3 border-emerald-200/50 dark:border-emerald-700/50"
        />
      );
      continue;
    }

    // Headers
    const h3Match = line.match(/^###\s+(.*)$/);
    if (h3Match) {
      result.push(
        <h4
          key={`h3-${i}`}
          className="font-bold text-sm mt-3 mb-1 text-emerald-700 dark:text-emerald-400"
        >
          {renderInlineMarkdown(h3Match[1])}
        </h4>
      );
      continue;
    }

    const h2Match = line.match(/^##\s+(.*)$/);
    if (h2Match) {
      result.push(
        <h3
          key={`h2-${i}`}
          className="font-bold text-base mt-3 mb-1.5 text-emerald-700 dark:text-emerald-400"
        >
          {renderInlineMarkdown(h2Match[1])}
        </h3>
      );
      continue;
    }

    const h1Match = line.match(/^#\s+(.*)$/);
    if (h1Match) {
      result.push(
        <h2
          key={`h1-${i}`}
          className="font-bold text-lg mt-3 mb-2 text-emerald-700 dark:text-emerald-400"
        >
          {renderInlineMarkdown(h1Match[1])}
        </h2>
      );
      continue;
    }

    // Empty line = paragraph break
    if (line.trim() === "") {
      result.push(<div key={`br-${i}`} className="h-2" />);
      continue;
    }

    // Regular paragraph
    result.push(
      <p key={`p-${i}`} className="text-sm leading-relaxed">
        {renderInlineMarkdown(line)}
      </p>
    );
  }

  // Flush remaining list items
  flushList();

  return result;
}

function renderInlineMarkdown(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  // Match bold, italic, and inline code
  const regex = /(\*\*(.+?)\*\*)|(\*(.+?)\*)|(`(.+?)`)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let keyIdx = 0;

  while ((match = regex.exec(text)) !== null) {
    // Add preceding text
    if (match.index > lastIndex) {
      parts.push(<span key={`t-${keyIdx++}`}>{text.slice(lastIndex, match.index)}</span>);
    }

    if (match[1]) {
      // Bold
      parts.push(
        <strong key={`b-${keyIdx++}`} className="font-semibold">
          {match[2]}
        </strong>
      );
    } else if (match[3]) {
      // Italic
      parts.push(
        <em key={`i-${keyIdx++}`} className="italic">
          {match[4]}
        </em>
      );
    } else if (match[5]) {
      // Inline code
      parts.push(
        <code
          key={`c-${keyIdx++}`}
          className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 text-xs font-mono"
        >
          {match[6]}
        </code>
      );
    }

    lastIndex = match.index + match[0].length;
  }

  // Remaining text
  if (lastIndex < text.length) {
    parts.push(<span key={`t-${keyIdx++}`}>{text.slice(lastIndex)}</span>);
  }

  return parts.length > 0 ? parts : [text];
}

// ─── Typing indicator component ─────────────────────────────────────────────

function TypingIndicator({ color }: { color: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex items-start gap-3 max-w-[85%]"
    >
      <Avatar className="w-8 h-8 shrink-0 shadow-md">
        <AvatarFallback
          className="text-white text-xs font-bold"
          style={{ background: `linear-gradient(135deg, ${color}, ${color}dd)` }}
        >
          <Bot className="w-4 h-4" />
        </AvatarFallback>
      </Avatar>
      <div className="bg-white dark:bg-gray-800 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-1.5">
          <motion.span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: color }}
            animate={{ scale: [1, 1.3, 1], opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1, repeat: Infinity, delay: 0 }}
          />
          <motion.span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: color }}
            animate={{ scale: [1, 1.3, 1], opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
          />
          <motion.span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: color }}
            animate={{ scale: [1, 1.3, 1], opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
          />
        </div>
      </div>
    </motion.div>
  );
}

// ─── Message bubble component ───────────────────────────────────────────────

function MessageBubble({
  message,
  primaryColor,
  onRetry,
}: {
  message: ChatMessage;
  primaryColor: string;
  onRetry?: (content: string) => void;
}) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20, y: 5 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="flex items-start gap-3 max-w-[85%] ml-auto flex-row-reverse"
      >
        <Avatar className="w-8 h-8 shrink-0 shadow-md">
          <AvatarFallback
            className="text-white text-xs font-bold"
            style={{ background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}cc)` }}
          >
            U
          </AvatarFallback>
        </Avatar>
        <div
          className="rounded-2xl rounded-tr-sm px-4 py-3 shadow-sm text-white"
          style={{
            background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)`,
          }}
        >
          <p className="text-sm leading-relaxed">{message.content}</p>
        </div>
      </motion.div>
    );
  }

  // AI message
  return (
    <motion.div
      initial={{ opacity: 0, x: -20, y: 5 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="flex items-start gap-3 max-w-[85%]"
    >
      <Avatar className="w-8 h-8 shrink-0 shadow-md">
        <AvatarFallback
          className="text-white text-xs font-bold"
          style={{ background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)` }}
        >
          <Bot className="w-4 h-4" />
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-col gap-1.5">
        <div
          className={`rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm border ${
            message.isError
              ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
              : "bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700"
          }`}
        >
          {message.isError ? (
            <div className="flex items-start gap-2">
              <p className="text-sm text-red-700 dark:text-red-300 leading-relaxed">
                {message.content}
              </p>
            </div>
          ) : (
            <div className="prose-sm text-foreground">
              {renderMarkdownText(message.content)}
            </div>
          )}
        </div>
        {message.isError && onRetry && (
          <button
            onClick={() => onRetry(message.content)}
            className="flex items-center gap-1.5 text-xs text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 font-medium ml-1 transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            Coba lagi
          </button>
        )}
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Main AICopilot Component
// ═══════════════════════════════════════════════════════════════════════════════

export default function AICopilot({ data, isAuthenticated }: AICopilotProps) {
  const { pengaturan } = usePengaturan();
  const primaryColor = pengaturan.warnaPrimary || "#1B5E20";
  const accentColor = pengaturan.warnaAccent || "#F9A825";

  // ─── State ──────────────────────────────────────────────────────────────
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showQuickPrompts, setShowQuickPrompts] = useState(true);

  // ─── Refs ───────────────────────────────────────────────────────────────
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickPrompts = getQuickPrompts(data.tahun);

  // ─── Auto-scroll to bottom ──────────────────────────────────────────────
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  // ─── Build conversation history for API ─────────────────────────────────
  const buildHistory = useCallback((): Array<{ role: "user" | "assistant"; content: string }> => {
    return messages
      .filter((m) => m.id !== "welcome" && !m.isError)
      .map((m) => ({ role: m.role, content: m.content }));
  }, [messages]);

  // ─── Send message to API ────────────────────────────────────────────────
  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isLoading) return;

      // Add user message
      const userMsg: ChatMessage = {
        id: uniqueId(),
        role: "user",
        content: trimmed,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setInputValue("");
      setIsLoading(true);
      setShowQuickPrompts(false);

      try {
        const res = await fetch("/api/ai-copilot", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: trimmed,
            history: buildHistory(),
            dashboardContext: data,
          }),
        });

        const json = await res.json();

        if (!res.ok || json.error) {
          const errorMsg: ChatMessage = {
            id: uniqueId(),
            role: "assistant",
            content: json.error || `Terjadi kesalahan (HTTP ${res.status}). Silakan coba lagi.`,
            timestamp: new Date(),
            isError: true,
          };
          setMessages((prev) => [...prev, errorMsg]);
          return;
        }

        const aiMsg: ChatMessage = {
          id: uniqueId(),
          role: "assistant",
          content: json.response || "Maaf, saya tidak dapat memberikan respons saat ini.",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, aiMsg]);
      } catch {
        const errorMsg: ChatMessage = {
          id: uniqueId(),
          role: "assistant",
          content:
            "Tidak dapat terhubung ke server. Periksa koneksi internet Anda dan coba lagi.",
          timestamp: new Date(),
          isError: true,
        };
        setMessages((prev) => [...prev, errorMsg]);
      } finally {
        setIsLoading(false);
        // Focus input after response
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    },
    [isLoading, buildHistory, data]
  );

  // ─── Retry last failed message ──────────────────────────────────────────
  const handleRetry = useCallback(
    (errorContent: string) => {
      // Remove the error message
      setMessages((prev) => {
        const lastErrorIdx = [...prev]
          .reverse()
          .findIndex((m) => m.isError && m.content === errorContent);
        if (lastErrorIdx === -1) return prev;
        const actualIdx = prev.length - 1 - lastErrorIdx;
        return prev.filter((_, i) => i !== actualIdx);
      });
      // Find the user message that preceded the error
      const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
      if (lastUserMsg) {
        // We'll re-send by building a new request
        setTimeout(() => sendMessage(lastUserMsg.content), 100);
      }
    },
    [messages, sendMessage]
  );

  // ─── New Chat ───────────────────────────────────────────────────────────
  const handleNewChat = useCallback(() => {
    setMessages([WELCOME_MESSAGE]);
    setInputValue("");
    setIsLoading(false);
    setShowQuickPrompts(true);
    setTimeout(() => inputRef.current?.focus(), 200);
  }, []);

  // ─── Handle form submit ─────────────────────────────────────────────────
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputValue);
  };

  // ─── Quick prompt click ─────────────────────────────────────────────────
  const handleQuickPrompt = (prompt: string) => {
    sendMessage(prompt);
  };

  // ─── Keyboard handler ───────────────────────────────────────────────────
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputValue);
    }
  };

  // ─── Data summary for header badge ──────────────────────────────────────
  const dataSummary = `${data.ringkasan.persentasePendapatan.toFixed(0)}% Pendapatan · ${data.ringkasan.persentaseBelanja.toFixed(0)}% Belanja · TA ${data.tahun}`;

  // ─── Not authenticated state ─────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="h-full flex flex-col"
      >
        <Card className="flex-1 flex flex-col shadow-lg border-0 overflow-hidden h-full">
          <CardHeader
            className="shrink-0 pb-3 text-white"
            style={{
              background: `linear-gradient(135deg, ${primaryColor}ee, ${primaryColor}cc)`,
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-lg"
                style={{
                  background: `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)`,
                }}
              >
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-sm font-bold flex items-center gap-2 tracking-wide uppercase">
                  <Bot className="w-4 h-4" />
                  AI Financial Copilot
                </CardTitle>
                <p className="text-[10px] text-emerald-100/80 mt-0.5">
                  Asisten Analis Keuangan AI
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex items-center justify-center p-8">
            <div className="text-center space-y-4 max-w-sm">
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto shadow-lg"
                style={{
                  background: `linear-gradient(135deg, ${primaryColor}15, ${accentColor}15)`,
                }}
              >
                <Sparkles className="w-10 h-10" style={{ color: primaryColor }} />
              </div>
              <h3 className="text-lg font-bold text-foreground">
                Login Diperlukan
              </h3>
              <p className="text-sm text-muted-foreground">
                Silakan login terlebih dahulu untuk menggunakan AI Financial Copilot. Fitur ini tersedia untuk Admin, Superadmin, dan OPD.
              </p>
              <Button
                onClick={() => window.dispatchEvent(new CustomEvent("navigate-view", { detail: "admin" }))}
                className="px-6 text-white font-semibold"
                style={{
                  background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}cc)`,
                }}
              >
                Login Sekarang
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="h-full flex flex-col"
    >
      <Card className="flex-1 flex flex-col shadow-lg border-0 overflow-hidden h-full">
        {/* ═══════════════════════════════════════════════════════════════════
            HEADER
            ═══════════════════════════════════════════════════════════════════ */}
        <CardHeader
          className="shrink-0 pb-3 text-white"
          style={{
            background: `linear-gradient(135deg, ${primaryColor}ee, ${primaryColor}cc)`,
          }}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-lg"
                style={{
                  background: `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)`,
                }}
              >
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <CardTitle className="text-sm font-bold flex items-center gap-2 tracking-wide uppercase">
                  <Bot className="w-4 h-4" />
                  AI Financial Copilot
                </CardTitle>
                <p className="text-[10px] text-emerald-100/80 mt-0.5 truncate">
                  {dataSummary}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Badge className="bg-white/15 text-white border-0 text-[10px] backdrop-blur-sm">
                <Sparkles className="w-3 h-3 mr-1" />
                AI-Powered
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleNewChat}
                className="h-8 px-2.5 text-white/80 hover:text-white hover:bg-white/15 transition-colors"
                title="Mulai percakapan baru"
              >
                <Plus className="w-4 h-4 mr-1" />
                <span className="text-xs">Baru</span>
              </Button>
            </div>
          </div>
        </CardHeader>

        {/* ═══════════════════════════════════════════════════════════════════
            CHAT AREA
            ═══════════════════════════════════════════════════════════════════ */}
        <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
          {/* Messages scroll area */}
          <ScrollArea className="flex-1 px-4 py-4" ref={scrollRef}>
            <div className="space-y-4 max-w-3xl mx-auto">
              {/* Quick prompts (shown at start or when toggled) */}
              <AnimatePresence>
                {showQuickPrompts && messages.length <= 1 && (
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10, height: 0 }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    className="space-y-3"
                  >
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span className="font-medium">Coba tanyakan:</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                      {quickPrompts.map((qp, idx) => (
                        <motion.button
                          key={idx}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.06, duration: 0.3 }}
                          onClick={() => handleQuickPrompt(qp.prompt)}
                          disabled={isLoading}
                          className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:border-emerald-300 dark:hover:border-emerald-700 transition-all duration-200 text-left group disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                        >
                          <span className="text-lg shrink-0">{qp.icon}</span>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-foreground group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                              {qp.label}
                            </p>
                            <p className="text-[11px] text-muted-foreground truncate">
                              {qp.prompt}
                            </p>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Chat messages */}
              <AnimatePresence mode="popLayout">
                {messages.map((message) => (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    primaryColor={primaryColor}
                    onRetry={message.isError ? handleRetry : undefined}
                  />
                ))}
              </AnimatePresence>

              {/* Typing indicator */}
              <AnimatePresence>
                {isLoading && <TypingIndicator color={primaryColor} />}
              </AnimatePresence>

              {/* Scroll anchor */}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* ═══════════════════════════════════════════════════════════════════
              INPUT AREA
              ═══════════════════════════════════════════════════════════════════ */}
          <div className="shrink-0 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-3">
            <div className="max-w-3xl mx-auto">
              {/* Quick prompt toggle when chat has started */}
              {!showQuickPrompts && messages.length > 1 && (
                <div className="mb-2 flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowQuickPrompts(true)}
                    className="h-7 px-2 text-[11px] text-muted-foreground hover:text-foreground"
                  >
                    <Sparkles className="w-3 h-3 mr-1" />
                    Saran pertanyaan
                  </Button>
                  {messages.length > 2 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleNewChat}
                      className="h-7 px-2 text-[11px] text-muted-foreground hover:text-red-600 dark:hover:text-red-400"
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      Hapus percakapan
                    </Button>
                  )}
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Input
                    ref={inputRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={
                      isLoading
                        ? "Menunggu respons AI..."
                        : "Tanya AI Keuangan..."
                    }
                    disabled={isLoading}
                    className="w-full h-11 pl-4 pr-10 rounded-xl border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:bg-white dark:focus:bg-gray-900 transition-colors text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                    style={{
                      // @ts-expect-error CSS custom property
                      "--tw-ring-color": primaryColor,
                    }}
                  />
                  {!isLoading && inputValue.trim() && (
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2"
                    >
                      <Button
                        type="submit"
                        size="sm"
                        className="h-8 w-8 p-0 rounded-lg"
                        style={{
                          background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}cc)`,
                        }}
                      >
                        <Send className="w-4 h-4 text-white" />
                      </Button>
                    </motion.div>
                  )}
                  {isLoading && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Loader2
                        className="w-4 h-4 animate-spin"
                        style={{ color: primaryColor }}
                      />
                    </div>
                  )}
                </div>
              </form>

              <p className="text-[10px] text-muted-foreground/60 mt-1.5 text-center">
                AI Copilot dapat memberikan analisis yang tidak selalu akurat. Verifikasi informasi penting dengan sumber resmi.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
