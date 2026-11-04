import { GoogleGenAI, Part, Content } from "@google/genai";

/**
 * Shared Gemini system instruction — used across /api/chat and /api/scan.
 * Enforces strict topic guardrails so the AI stays on-topic.
 */
export const SYSTEM_INSTRUCTION = `
Kamu adalah asisten AI khusus untuk platform Urban Farming Polibag & Pengolahan Limbah Organik.

RUANG LINGKUP TUGASMU HANYA MELIPUTI:
1. Panduan mengolah limbah sampah organik rumah tangga (seperti sisa makanan) menjadi pupuk kompos atau media tanam (fokus pada metode Takakura, pupuk cair lindi, dan kompos aerob).
2. Cara menanam, merawat, menyiram, dan memupuk tanaman bernilai guna (khususnya cabai, tomat, dan sawi) menggunakan media polibag di lahan sempit.
3. Menganalisis gambar dari kamera pengguna untuk mengidentifikasi jenis tanaman, gejala penyakit daun, serangan hama, defisiensi nutrisi/hara, busuk akar, serta kondisi kelayakan polibag.
4. Memberikan rekomendasi perawatan tanaman berdasarkan kondisi cuaca.

ATURAN PEMBATASAN KETAT (GUARDRAILS):
- Jika pengguna bertanya tentang hal di luar topik tanaman, pertanian polibag, pengolahan kompos organik, atau cuaca pertanian (misalnya bertanya tentang politik, matematika, koding, game, selebriti, atau tugas sekolah umum), TOLAK DENGAN SOPAN.
- Gunakan kalimat penolakan standar: "Maaf, saya adalah asisten khusus perawatan tanaman polibag dan pengolahan kompos organik. Silakan tanyakan hal seputar tanaman atau arahkan kamera Anda ke tanaman yang ingin diperiksa."
- Jika pengguna mengirimkan gambar dari kamera yang TIDAK menampilkan tanaman, daun, tanah, polibag, atau bahan kompos organik (misalnya foto wajah manusia, hewan, kendaraan, atau benda acak), JANGAN analisis benda tersebut. Balas dengan: "Objek pada kamera tidak terdeteksi sebagai tanaman atau media polibag. Mohon arahkan kamera ke daun atau tanaman Anda."
`.trim();

/** Default generation config used for all Gemini calls */
export const DEFAULT_CONFIG = {
  temperature: 0.2,
};

/**
 * Priority order of models.
 * If one hits 429 quota exhaustion or 503, the system automatically falls back
 * to the next model in the list without crashing.
 */
export const FALLBACK_MODELS = [
  "gemini-3.1-flash-lite",
  "gemini-flash-lite-latest",
  "gemini-3.1-flash-lite-preview",
  "gemini-3.5-flash",
  "gemini-3.8-flash",
];

export const GEMINI_MODEL = FALLBACK_MODELS[0];

/**
 * Generate content with automatic model failover.
 * Tries each model in FALLBACK_MODELS before throwing or falling back.
 */
export async function generateContentWithFailover(
  genai: GoogleGenAI,
  params: {
    contents: string | Content[] | Part[];
    systemInstruction?: string;
    responseMimeType?: string;
  }
): Promise<{ text: string; modelUsed: string }> {
  let lastError: unknown = null;

  for (const model of FALLBACK_MODELS) {
    try {
      const config: Record<string, unknown> = {
        ...DEFAULT_CONFIG,
      };
      if (params.systemInstruction) {
        config.systemInstruction = params.systemInstruction;
      }
      if (params.responseMimeType) {
        config.responseMimeType = params.responseMimeType;
      }

      const response = await genai.models.generateContent({
        model,
        config,
        contents: params.contents as unknown as Content[],
      });

      if (response.text) {
        return { text: response.text, modelUsed: model };
      }
    } catch (err: unknown) {
      lastError = err;
      const errMsg = err instanceof Error ? err.message : String(err);
      console.warn(`[Gemini Failover] Model ${model} failed, trying next:`, errMsg.slice(0, 100));
    }
  }

  throw lastError ?? new Error("Semua model Gemini sedang tidak tersedia.");
}
