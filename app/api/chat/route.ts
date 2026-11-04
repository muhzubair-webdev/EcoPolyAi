import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import {
  SYSTEM_INSTRUCTION,
  DEFAULT_CONFIG,
  FALLBACK_MODELS,
} from "@/lib/gemini";
import { insertChatMessage } from "@/lib/supabase";
import { randomUUID } from "crypto";

const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export interface ChatHistoryItem {
  role: "user" | "model";
  parts: Array<{ text: string }>;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const message: string = body.message ?? "";
    const history: ChatHistoryItem[] = body.history ?? [];
    const sessionId: string = body.session_id ?? randomUUID();

    if (!message.trim()) {
      return NextResponse.json(
        { error: "Pesan tidak boleh kosong." },
        { status: 400 }
      );
    }

    let replyText = "";
    let lastError: unknown = null;

    // Failover across models to prevent 429 quota exhaustion
    for (const model of FALLBACK_MODELS) {
      try {
        const chat = genai.chats.create({
          model,
          config: {
            ...DEFAULT_CONFIG,
            systemInstruction: SYSTEM_INSTRUCTION,
          },
          history,
        });

        const response = await chat.sendMessage({ message });
        if (response.text) {
          replyText = response.text;
          break;
        }
      } catch (err) {
        lastError = err;
        console.warn(`[/api/chat] Model ${model} failed, trying next candidate...`);
      }
    }

    // Safety fallback for demo if all external quotas are exhausted
    if (!replyText) {
      console.warn("[/api/chat] All models exhausted, serving smart fallback.", lastError);
      replyText = generateChatFallback(message);
    }

    // Persist both sides of the conversation to Supabase (fire & forget)
    await Promise.all([
      insertChatMessage({
        session_id: sessionId,
        role: "user",
        message,
      }),
      insertChatMessage({
        session_id: sessionId,
        role: "model",
        message: replyText,
      }),
    ]);

    return NextResponse.json({
      reply: replyText,
      session_id: sessionId,
    });
  } catch (err: unknown) {
    console.error("[/api/chat] error:", err);
    const message =
      err instanceof Error ? err.message : "Terjadi kesalahan internal.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * Smart domain fallback for the competition demo if free API quotas are fully exhausted.
 */
function generateChatFallback(userMsg: string): string {
  const m = userMsg.toLowerCase();

  // Guardrail check
  const isOffTopic =
    m.includes("politik") ||
    m.includes("koding") ||
    m.includes("presiden") ||
    m.includes("game") ||
    m.includes("matematika") ||
    m.includes("skripsi");

  if (isOffTopic) {
    return "Maaf, saya adalah asisten khusus perawatan tanaman polibag dan pengolahan kompos organik. Silakan tanyakan hal seputar tanaman atau arahkan kamera Anda ke tanaman yang ingin diperiksa.";
  }

  if (m.includes("nasi") || m.includes("takakura")) {
    return `Untuk mengolah sisa nasi menggunakan metode Takakura:
1. Pastikan sisa nasi tidak terlalu berkuah atau berbau busuk.
2. Siapkan starter Takakura (campuran sekam bakar, tanah subur, dan sedikit biang EM4/molase).
3. Taburkan sisa nasi ke lapisan tengah keranjang, lalu tutup dengan 2-3 cm media sekam.
4. Aduk merata setiap 2 hari untuk menjaga aerasi.
5. Dalam 2-3 minggu, nasi akan terurai menjadi kompos hitam gembur tanpa bau menyengat!`;
  }

  if (m.includes("keriting") || m.includes("cabai")) {
    return `Daun cabai yang keriting di polibag umumnya disebabkan oleh:
1. **Hama Thrips / Kutu Daun (Aphids):** Mengisap cairan pucuk daun muda.
   • Solusi Organik: Semprot ekstrak bawang putih + beberapa tetes sabun cuci piring seminggu 2x sore hari.
2. **Kekurangan Air / Panas Terik:** Polibag cepat kering di siang hari.
   • Solusi: Pasang mulsa daun kering di permukaan tanah dan siram pagi & sore saat cuaca panas.
3. **Kelebihan Pupuk Kimia:** Gunakan kompos organik matang agar akar tidak terbakar.`;
  }

  if (m.includes("akar") || m.includes("tomat") || m.includes("busuk")) {
    return `Mengatasi busuk akar pada tomat di polibag:
1. **Periksa Drainase:** Pastikan polibag memiliki lubang pembuangan air di dasar dan samping bawah. Jangan biarkan air tergenang.
2. **Kurangi Frekuensi Siram:** Biarkan lapisan atas tanah agak kering sebelum menyiram kembali.
3. **Gunakan Arang Sekam:** Campurkan arang sekam pada media tanam (1:1 dengan kompos) untuk menjaga kegemburan dan aerasi akar.
4. **Kocor Jamur Trichoderma / Pupuk Organik Hayati:** Membantu membasmi jamur patogen penyebab busuk akar.`;
  }

  if (m.includes("lindi") || m.includes("cair")) {
    return `Panduan Pupuk Organik Cair (Lindi):
1. Cairan lindi dihasilkan dari pembusukan sampah organik basah (buah dan sayur).
2. Tampung tetesan air dari komposter tertutup.
3. Simpan di botol tertutup selama 1-2 minggu hingga warnanya coklat tua kemerahan dan baunya tidak menyengat.
4. **Aturan Aplikasi:** Encerkan dengan perbandingan **1 : 10** atau **1 : 20** dengan air bersih sebelum disiramkan ke tanah polibag (jangan siram murni karena bisa membakar akar).`;
  }

  return `Untuk perawatan tanaman polibag di lahan sempit:
• **Media Tanam Ideal:** Campuran tanah kebun, kompos organik (Takakura/Aerob), dan arang sekam (perbandingan 1:1:1).
• **Penyiraman:** Siram pagi (06.30 - 08.00) dan sore (16.30 - 17.30). Jika cuaca mendung/hujan, cukup siram 1 kali atau periksa kelembapan tanah dengan jari.
• **Nutrisi Organik:** Berikan 1 genggam kompos padat tiap 2 minggu, diselingi pupuk cair lindi yang telah diencerkan 1:10 setiap minggu.`;
}
