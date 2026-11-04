"use client";

import { useState, useRef, useEffect } from "react";
import {
  Send,
  Loader2,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  Sparkles,
} from "lucide-react";
import { newSessionId } from "@/lib/utils";

// ── Types ────────────────────────────────────────────────────────────────────
interface ChatMsg {
  role: "user" | "model";
  text: string;
  time: string;
}

interface HistoryItem {
  role: "user" | "model";
  parts: Array<{ text: string }>;
}

// ── Data ─────────────────────────────────────────────────────────────────────
const COMPOST_METHODS = [
  {
    icon: "🧺",
    title: "Metode Takakura",
    subtitle: "Fermentasi keranjang berpori",
    badge: "2–4 minggu",
    badgeColor: "bg-emerald-100 text-emerald-700",
    borderColor: "border-emerald-200",
    headerBg: "bg-gradient-to-r from-emerald-500 to-emerald-600",
    steps: [
      "Siapkan keranjang berlubang dilapisi kardus",
      "Campurkan starter kompos (sekam + tanah + gula merah)",
      "Masukkan sisa nasi, sayuran, buah secara merata",
      "Aduk setiap 2–3 hari & tutup rapat",
      "Kompos siap dalam 2–4 minggu",
    ],
  },
  {
    icon: "💧",
    title: "Pupuk Cair Lindi",
    subtitle: "Cairan organik kaya nutrisi",
    badge: "7–14 hari",
    badgeColor: "bg-blue-100 text-blue-700",
    borderColor: "border-blue-200",
    headerBg: "bg-gradient-to-r from-blue-500 to-blue-600",
    steps: [
      "Kumpulkan sisa sayur, buah, nasi dalam ember tertutup",
      "Tambahkan air cucian beras & gula merah (1 sdm)",
      "Tutup rapat & fermentasi 7–14 hari",
      "Saring cairannya (lindi) — pupuk siap pakai",
      "Encerkan 1:10 dengan air sebelum menyiram polibag",
    ],
  },
  {
    icon: "♻️",
    title: "Kompos Aerob",
    subtitle: "Media tanam premium polibag",
    badge: "4–8 minggu",
    badgeColor: "bg-amber-100 text-amber-700",
    borderColor: "border-amber-200",
    headerBg: "bg-gradient-to-r from-amber-500 to-orange-500",
    steps: [
      "Lapisan hijau: sisa sayur, kulit buah (N tinggi)",
      "Lapisan coklat: daun kering, kardus cincang (C tinggi)",
      "Rasio hijau:coklat = 1:3",
      "Siram secukupnya & aduk tiap 3–4 hari",
      "Kompos matang dalam 4–8 minggu",
    ],
  },
];

const QUICK_PROMPTS = [
  { text: "Cara olah sisa nasi jadi kompos", emoji: "🍚" },
  { text: "Takaran tanah & kompos untuk polibag", emoji: "⚖️" },
  { text: "Kenapa daun cabai keriting?", emoji: "🌶️" },
  { text: "Cara mengatasi busuk akar pada tomat di polibag", emoji: "🍅" },
  { text: "Berapa kali harus menyiram sawi per hari?", emoji: "🥬" },
  { text: "Cara membuat pupuk cair dari kulit pisang", emoji: "🍌" },
];

// ── Chat Bubble ───────────────────────────────────────────────────────────────
function ChatBubble({ msg }: { msg: ChatMsg }) {
  const isUser = msg.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3 gap-2`}>
      {!isUser && (
        <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center shrink-0 mt-auto shadow-sm">
          <span className="text-sm">🌿</span>
        </div>
      )}
      <div className="max-w-[82%]">
        <div
          className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
            isUser
              ? "bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-br-sm shadow-md shadow-emerald-200"
              : "bg-white text-gray-700 border border-gray-100 shadow-sm rounded-bl-sm"
          }`}
        >
          {msg.text}
        </div>
        <p className={`text-[10px] mt-1 ${isUser ? "text-right text-gray-400" : "text-gray-400"}`}>
          {msg.time}
        </p>
      </div>
    </div>
  );
}

// ── Method Card ────────────────────────────────────────────────────────────────
function MethodCard({
  method,
  isExpanded,
  onToggle,
  onAsk,
}: {
  method: typeof COMPOST_METHODS[0];
  isExpanded: boolean;
  onToggle: () => void;
  onAsk: (text: string) => void;
}) {
  return (
    <div className={`bg-white rounded-2xl border ${method.borderColor} shadow-sm overflow-hidden card-hover`}>
      <button
        className="w-full text-left"
        onClick={onToggle}
      >
        <div className={`${method.headerBg} px-4 py-3.5 flex items-center gap-3`}>
          <span className="text-2xl">{method.icon}</span>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-white text-sm">{method.title}</span>
              <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${method.badgeColor}`}>
                {method.badge}
              </span>
            </div>
            <p className="text-white/75 text-xs mt-0.5">{method.subtitle}</p>
          </div>
          {isExpanded
            ? <ChevronUp size={18} className="text-white/80 shrink-0" />
            : <ChevronDown size={18} className="text-white/80 shrink-0" />
          }
        </div>
      </button>

      {isExpanded && (
        <div className="p-4">
          <ol className="flex flex-col gap-2.5 mb-4">
            {method.steps.map((step, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-gray-600">
                <span className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white text-[11px] rounded-full w-6 h-6 flex items-center justify-center shrink-0 font-bold mt-0.5 shadow-sm">
                  {i + 1}
                </span>
                <span className="leading-relaxed">{step}</span>
              </li>
            ))}
          </ol>
          <button
            onClick={() => onAsk(`Jelaskan lebih detail tentang ${method.title} untuk polibag saya`)}
            className={`w-full py-2.5 ${method.headerBg} text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 active:scale-95 transition-transform`}
          >
            <MessageCircle size={14} />
            Tanya AI tentang {method.title}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function OlahSampahPage() {
  const now = () => new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      role: "model",
      text: "Halo! Saya Asisten EcoPolyAI 🌱\n\nSaya siap membantu Anda tentang:\n• Cara mengolah sampah organik → kompos\n• Perawatan tanaman polibag (cabai, tomat, sawi)\n• Mengatasi penyakit & hama tanaman\n\nSilakan tanya atau ketuk pertanyaan cepat di bawah!",
      time: now(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(newSessionId);
  const [expandedCard, setExpandedCard] = useState<number | null>(0);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg: ChatMsg = { role: "user", text, time: now() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    const history: HistoryItem[] = newMessages.slice(0, -1).map((m) => ({
      role: m.role,
      parts: [{ text: m.text }],
    }));

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history, session_id: sessionId }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: "model", text: data.reply ?? data.error ?? "Maaf, terjadi kesalahan.", time: now() },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "model", text: "Koneksi gagal. Periksa jaringan internet Anda.", time: now() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-white overflow-x-hidden">
      {/* ── Header ── */}
      <div className="bg-gradient-to-br from-emerald-600 to-teal-700 px-4 pt-5 pb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="max-w-5xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-black text-white">♻️ Olah Sampah</h1>
          <p className="text-emerald-100 text-sm mt-1">
            Panduan 3 metode kompos + Chat Pakar AI
          </p>
        </div>
      </div>

      <div className="w-full max-w-5xl mx-auto px-4 mt-6">
        {/* ── Layout: 2 columns on desktop ── */}
        <div className="flex flex-col lg:flex-row gap-5 min-w-0">

          {/* ── Left: Method Cards ── */}
          <div className="min-w-0 lg:w-96 lg:shrink-0">
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-4 py-4 border-b border-gray-100">
                <h2 className="font-black text-gray-800 text-base flex items-center gap-2">
                  <span className="w-7 h-7 bg-emerald-100 rounded-lg flex items-center justify-center">📚</span>
                  3 Metode Pengolahan Sampah
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">Pilih panduan & tanya AI langsung</p>
              </div>
              <div className="p-3 flex flex-col gap-2">
                {COMPOST_METHODS.map((method, idx) => (
                  <MethodCard
                    key={idx}
                    method={method}
                    isExpanded={expandedCard === idx}
                    onToggle={() => setExpandedCard(expandedCard === idx ? null : idx)}
                    onAsk={sendMessage}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* ── Right: Chat AI ── */}
          <div className="flex-1 min-w-0 flex flex-col">
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col overflow-hidden" style={{ minHeight: "520px" }}>

              {/* Chat header */}
              <div className="flex items-center gap-3 px-4 py-3.5 bg-gradient-to-r from-emerald-500 to-emerald-600 shrink-0">
                <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                  <Sparkles size={18} className="text-white" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-white text-sm truncate">Chat Pakar AI EcoPolyAI</p>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-emerald-300 rounded-full status-dot shrink-0" />
                    <span className="text-emerald-100 text-[11px]">Online · Respons cepat</span>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4" style={{ maxHeight: "400px" }}>
                {messages.map((msg, idx) => (
                  <ChatBubble key={idx} msg={msg} />
                ))}
                {loading && (
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center shadow-sm shrink-0">
                      <span className="text-sm">🌿</span>
                    </div>
                    <div className="bg-white border border-gray-100 shadow-sm rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-2">
                      <div className="flex gap-1">
                        {[0, 1, 2].map((i) => (
                          <div
                            key={i}
                            className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce"
                            style={{ animationDelay: `${i * 0.15}s` }}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-gray-400">AI sedang mengetik...</span>
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              {/* Quick prompts — scrollable horizontal, never overflows card */}
              <div className="px-3 py-2 border-t border-gray-100 shrink-0 overflow-x-auto scrollbar-hide">
                <div className="flex gap-2 w-max">
                  {QUICK_PROMPTS.map((p, idx) => (
                    <button
                      key={idx}
                      onClick={() => sendMessage(p.text)}
                      disabled={loading}
                      className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs rounded-full border border-emerald-200 hover:bg-emerald-100 transition-colors disabled:opacity-50 font-medium whitespace-nowrap"
                    >
                      <span>{p.emoji}</span>
                      <span>{p.text.split(" ").slice(0, 3).join(" ")}...</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Input */}
              <div className="flex gap-2 p-3 border-t border-gray-100 shrink-0">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage(input)}
                  placeholder="Tanya tentang tanaman atau kompos..."
                  className="flex-1 min-w-0 border border-gray-200 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all bg-gray-50"
                  disabled={loading}
                />
                <button
                  onClick={() => sendMessage(input)}
                  disabled={loading || !input.trim()}
                  className="w-10 h-10 shrink-0 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-2xl flex items-center justify-center shadow-md shadow-emerald-200 hover:shadow-emerald-300 transition-all disabled:opacity-50 disabled:shadow-none active:scale-95"
                >
                  {loading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Send size={16} />
                  )}
                </button>
              </div>
            </div>

            {/* Tips card */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100 rounded-2xl p-4 mt-3">
              <p className="text-sm font-bold text-amber-800 mb-1">🌟 Tips Penggunaan Chat AI</p>
              <ul className="text-xs text-amber-700 space-y-1">
                <li>• Tanya detail spesifik: &ldquo;Kenapa daun sawi saya kuning bagian bawah?&rdquo;</li>
                <li>• Sebutkan kondisi: &ldquo;Tanaman saya di polibag 35cm di balkon lantai 2&rdquo;</li>
                <li>• AI hanya menjawab topik pertanian polibag & kompos organik</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
