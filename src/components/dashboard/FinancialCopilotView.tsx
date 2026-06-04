"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DashboardData } from "./types";
import { usePengaturan } from "@/context/PengaturanContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  BotMessageSquare,
  Send,
  Sparkles,
  TrendingUp,
  TrendingDown,
  BarChart3,
  AlertTriangle,
  Landmark,
  Clock,
  RotateCcw,
  ChevronRight,
  Loader2,
  User,
  Bot,
  MessageCircle,
  Zap,
} from "lucide-react";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
};

type FinancialCopilotViewProps = {
  data: DashboardData;
};

const suggestedQuestions = [
  {
    question: "Berapa realisasi pendapatan saat ini?",
    icon: TrendingUp,
    color: "from-emerald-500 to-green-600",
  },
  {
    question: "OPD mana yang paling rendah penyerapannya?",
    icon: TrendingDown,
    color: "from-red-500 to-rose-600",
  },
  {
    question: "Berapa prediksi SILPA?",
    icon: BarChart3,
    color: "from-amber-500 to-orange-500",
  },
  {
    question: "Apakah ada risiko defisit?",
    icon: AlertTriangle,
    color: "from-violet-500 to-purple-600",
  },
  {
    question: "Belanja modal sudah berapa persen?",
    icon: Landmark,
    color: "from-teal-500 to-cyan-600",
  },
  {
    question: "Tampilkan 10 kegiatan terbesar.",
    icon: BarChart3,
    color: "from-blue-500 to-indigo-600",
  },
  {
    question: "Tampilkan OPD yang belum melakukan realisasi.",
    icon: AlertTriangle,
    color: "from-orange-500 to-red-500",
  },
  {
    question: "Bandingkan dengan tahun lalu.",
    icon: Clock,
    color: "from-slate-500 to-gray-600",
  },
];

function formatMessageContent(content: string): string {
  // Convert markdown-like formatting to HTML
  let html = content
    // Bold
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    // Italic
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    // Headings
    .replace(/^### (.*$)/gm, '<h4 class="text-sm font-bold mt-3 mb-1">$1</h4>')
    .replace(/^## (.*$)/gm, '<h3 class="text-base font-bold mt-3 mb-1">$1</h3>')
    // Lists
    .replace(/^- (.*$)/gm, '<li class="ml-4 text-sm">$1</li>')
    .replace(/^(\d+)\. (.*$)/gm, '<li class="ml-4 text-sm">$1. $2</li>')
    // Line breaks
    .replace(/\n\n/g, "</p><p class='text-sm leading-relaxed mt-2'>")
    .replace(/\n/g, "<br/>");

  // Wrap in paragraph if not starting with a tag
  if (!html.startsWith("<")) {
    html = `<p class="text-sm leading-relaxed">${html}</p>`;
  }

  return html;
}

export default function FinancialCopilotView({ data }: FinancialCopilotViewProps) {
  const { pengaturan } = usePengaturan();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      role: "user",
      content: text.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const history = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch("/api/dashboard/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text.trim(),
          history,
          tahun: data.tahun,
        }),
      });

      if (!res.ok) throw new Error("Gagal menghubungi AI");

      const json = await res.json();

      const aiMsg: ChatMessage = {
        id: `msg-${Date.now()}-ai`,
        role: "assistant",
        content: json.response || "Maaf, saya tidak dapat memproses pertanyaan tersebut.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      const errorMsg: ChatMessage = {
        id: `msg-${Date.now()}-error`,
        role: "assistant",
        content:
          "Maaf, terjadi kesalahan saat memproses pertanyaan Anda. Silakan coba lagi.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleSuggestionClick = (question: string) => {
    sendMessage(question);
  };

  const clearChat = () => {
    setMessages([]);
    inputRef.current?.focus();
  };

  const today = new Date();
  const months = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember",
  ];
  const todayStr = `${today.getDate()} ${months[today.getMonth()]} ${today.getFullYear()}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.4 }}
      className="flex flex-col h-[calc(100vh-180px)] min-h-[500px]"
    >
      {/* ====== HEADER ====== */}
      <div
        className="relative overflow-hidden rounded-2xl text-white p-5 lg:p-6 shrink-0"
        style={{
          background: `linear-gradient(135deg, ${pengaturan.warnaPrimary}, ${pengaturan.warnaSecondary}, ${pengaturan.warnaPrimary}dd)`,
        }}
      >
        {/* Background decoration */}
        <div className="absolute -right-12 -top-12 w-44 h-44 border border-white/10 rounded-full" />
        <div className="absolute w-32 h-32 bg-white/5 rounded-full blur-2xl -right-6 top-1/2 -translate-y-1/2" />

        <div className="relative flex items-center gap-4">
          <div className="shrink-0">
            <div className="w-12 h-12 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
              <BotMessageSquare className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
              <span className="text-[10px] font-medium text-emerald-200 uppercase tracking-widest">
                AI-Powered
              </span>
            </div>
            <h2 className="text-lg lg:text-xl font-extrabold tracking-wide">
              AI Financial Copilot
            </h2>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span className="text-[10px] text-emerald-200 bg-white/10 rounded-full px-2 py-0.5">
                <Clock className="w-3 h-3 inline mr-1" />
                {todayStr}
              </span>
              <span className="text-[10px] text-emerald-200 bg-white/10 rounded-full px-2 py-0.5">
                TA {data.tahun}
              </span>
              <Badge className="text-[9px] bg-white/15 text-white border-0 hover:bg-white/20">
                <Zap className="w-2.5 h-2.5 mr-0.5" />
                LLM Powered
              </Badge>
            </div>
          </div>
          {messages.length > 0 && (
            <Button
              onClick={clearChat}
              variant="ghost"
              size="sm"
              className="text-white/70 hover:text-white hover:bg-white/10 shrink-0"
            >
              <RotateCcw className="w-4 h-4 mr-1.5" />
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* ====== CHAT AREA ====== */}
      <Card className="flex-1 mt-4 overflow-hidden border-0 shadow-lg flex flex-col">
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          {/* Empty state with suggestions */}
          {messages.length === 0 && !isLoading && (
            <div className="flex flex-col items-center justify-center h-full min-h-[300px]">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center mb-4">
                <MessageCircle className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-1">
                Tanya AI Keuangan
              </h3>
              <p className="text-sm text-muted-foreground mb-6 text-center max-w-md">
                Saya siap membantu menganalisis data keuangan daerah. Coba tanyakan salah satu di bawah ini atau tulis pertanyaan Anda sendiri.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-2xl">
                {suggestedQuestions.map((item, idx) => (
                  <motion.button
                    key={item.question}
                    onClick={() => handleSuggestionClick(item.question)}
                    className="group flex items-center gap-3 text-left p-3 rounded-xl border border-border/50 bg-card hover:bg-muted/50 hover:shadow-md transition-all duration-200"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + idx * 0.05, duration: 0.4 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div
                      className={`w-8 h-8 rounded-lg bg-gradient-to-br ${item.color} flex items-center justify-center shrink-0 shadow-sm group-hover:scale-110 transition-transform`}
                    >
                      <item.icon className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-xs font-medium text-foreground leading-tight">
                      {item.question}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40 ml-auto shrink-0 group-hover:text-foreground/60 transition-colors" />
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          <AnimatePresence mode="popLayout">
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "assistant" && (
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shrink-0 shadow-md mt-1">
                    <Bot className="w-4 h-4 text-primary-foreground" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] sm:max-w-[75%] rounded-2xl ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-muted/80 border border-border/50 rounded-bl-md"
                  }`}
                >
                  <div className="px-4 py-3">
                    {msg.role === "assistant" ? (
                      <div
                        className="prose prose-sm max-w-none text-foreground"
                        dangerouslySetInnerHTML={{
                          __html: formatMessageContent(msg.content),
                        }}
                      />
                    ) : (
                      <p className="text-sm leading-relaxed">{msg.content}</p>
                    )}
                  </div>
                  <div
                    className={`px-4 pb-2 text-[10px] ${
                      msg.role === "user"
                        ? "text-primary-foreground/60"
                        : "text-muted-foreground"
                    }`}
                  >
                    {msg.timestamp.toLocaleTimeString("id-ID", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>

                {msg.role === "user" && (
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-400 to-slate-500 flex items-center justify-center shrink-0 shadow-md mt-1">
                    <User className="w-4 h-4 text-white" />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Loading indicator */}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-3 justify-start"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shrink-0 shadow-md">
                <Bot className="w-4 h-4 text-primary-foreground" />
              </div>
              <div className="bg-muted/80 border border-border/50 rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground">
                    Menganalisis data keuangan...
                  </span>
                </div>
                <div className="flex gap-1 mt-2">
                  <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </CardContent>

        {/* ====== INPUT AREA ====== */}
        <div className="border-t border-border/50 p-3 bg-card shrink-0">
          {/* Quick suggestions (when chat has messages) */}
          {messages.length > 0 && !isLoading && (
            <div className="flex gap-1.5 mb-2 overflow-x-auto pb-1 custom-scrollbar">
              {suggestedQuestions.slice(0, 4).map((item) => (
                <button
                  key={item.question}
                  onClick={() => handleSuggestionClick(item.question)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-border/50 bg-muted/30 text-[11px] text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors whitespace-nowrap shrink-0"
                >
                  <item.icon className="w-3 h-3" />
                  {item.question}
                </button>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Tanya AI Keuangan..."
              disabled={isLoading}
              className="flex-1 h-11 px-4 rounded-xl border border-border/50 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <Button
              type="submit"
              disabled={isLoading || !input.trim()}
              size="icon"
              className="h-11 w-11 rounded-xl shrink-0"
              style={{
                background: `linear-gradient(135deg, ${pengaturan.warnaPrimary}, ${pengaturan.warnaSecondary})`,
              }}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </form>
          <p className="text-[10px] text-muted-foreground mt-1.5 text-center">
            AI Copilot menganalisis data keuangan daerah secara real-time. Hasil dapat bervariasi.
          </p>
        </div>
      </Card>
    </motion.div>
  );
}
