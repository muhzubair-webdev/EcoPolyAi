import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { DEFAULT_CONFIG, FALLBACK_MODELS } from "@/lib/gemini";

const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export interface WeatherAdviceRequest {
  /** Temperature in Celsius */
  temperature: number;
  /** Short weather description e.g. "Cerah", "Berawan", "Hujan Deras" */
  weather_description: string;
  /** Humidity percentage 0-100 */
  humidity: number;
  /** List of plant names the user has */
  plants: string[];
  /** Whether this is a simulated extreme weather demo */
  is_simulation?: boolean;
}

export interface WeatherAdviceResponse {
  perlu_siram: boolean;
  frekuensi: string;
  peringatan: string;
  raw_weather: {
    temperature: number;
    weather_description: string;
    humidity: number;
  };
}

/**
 * POST /api/weather-advice
 *
 * Accepts weather data (from Open-Meteo or simulated for demo) and a list of
 * user plants, then uses Gemini JSON Mode to return structured watering advice.
 */
export async function POST(req: NextRequest) {
  try {
    const body: WeatherAdviceRequest = await req.json();

    const {
      temperature,
      weather_description,
      humidity,
      plants,
      is_simulation = false,
    } = body;

    // Try to fetch real weather from Open-Meteo if caller didn't provide
    // simulation data — this is a best-effort enhancement.
    let finalTemp = temperature;
    let finalWeather = weather_description;
    let finalHumidity = humidity;

    if (!is_simulation) {
      try {
        const omData = await fetchOpenMeteo();
        if (omData) {
          finalTemp = omData.temperature;
          finalWeather = omData.weather_description;
          finalHumidity = omData.humidity;
        }
      } catch {
        // Open-Meteo unavailable — continue with caller-provided data
      }
    }

    const plantList = plants.length ? plants.join(", ") : "Cabai, Tomat, Sawi";
    const simNote = is_simulation
      ? " (INI ADALAH SKENARIO SIMULASI DEMO UNTUK JURI)"
      : "";

    const prompt = `
Kamu adalah sistem penasihat pertanian berbasis AI${simNote}.

Data cuaca saat ini:
- Suhu: ${finalTemp}°C
- Kondisi: ${finalWeather}
- Kelembapan udara: ${finalHumidity}%

Tanaman polibag pengguna: ${plantList}

Berikan saran perawatan praktis dalam format JSON PERSIS seperti ini (tanpa teks tambahan apapun di luar JSON):
{
  "perlu_siram": <true atau false>,
  "frekuensi": "<frekuensi penyiraman hari ini, contoh: '2 kali (pagi dan sore)'>",
  "peringatan": "<1 kalimat peringatan atau tips perawatan paling penting berdasarkan cuaca ini>"
}
`.trim();

    let rawJson = "";
    for (const model of FALLBACK_MODELS) {
      try {
        const response = await genai.models.generateContent({
          model,
          config: {
            ...DEFAULT_CONFIG,
            responseMimeType: "application/json",
          },
          contents: [{ role: "user", parts: [{ text: prompt }] }],
        });
        if (response.text) {
          rawJson = response.text;
          break;
        }
      } catch {
        console.warn(`[/api/weather-advice] Model ${model} failed, trying next candidate...`);
      }
    }

    let advice: Omit<WeatherAdviceResponse, "raw_weather">;
    try {
      advice = JSON.parse(rawJson);
    } catch {
      // Graceful fallback if JSON parse fails
      advice = {
        perlu_siram: finalTemp > 30,
        frekuensi: finalTemp > 30 ? "2 kali (pagi dan sore)" : "1 kali (pagi)",
        peringatan:
          finalTemp > 33
            ? "Pindahkan polybag bibit muda ke tempat teduh, suhu sangat tinggi."
            : finalWeather.toLowerCase().includes("hujan")
            ? "Kurangi penyiraman, tanah sudah lembap dari hujan."
            : "Pantau kelembapan tanah secara berkala.",
      };
    }

    const result: WeatherAdviceResponse = {
      ...advice,
      raw_weather: {
        temperature: finalTemp,
        weather_description: finalWeather,
        humidity: finalHumidity,
      },
    };

    return NextResponse.json(result);
  } catch (err: unknown) {
    console.error("[/api/weather-advice] error:", err);
    const message =
      err instanceof Error ? err.message : "Terjadi kesalahan internal.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ── Open-Meteo Integration ─────────────────────────────────────────────────
// Default location: Jakarta, Indonesia
const JAKARTA_LAT = -6.2;
const JAKARTA_LON = 106.816666;

interface OpenMeteoResponse {
  temperature: number;
  weather_description: string;
  humidity: number;
}

async function fetchOpenMeteo(): Promise<OpenMeteoResponse | null> {
  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${JAKARTA_LAT}&longitude=${JAKARTA_LON}` +
    `&current=temperature_2m,relative_humidity_2m,weather_code` +
    `&timezone=Asia%2FJakarta`;

  const res = await fetch(url, { next: { revalidate: 1800 } }); // cache 30 min
  if (!res.ok) return null;

  const data = await res.json();
  const current = data?.current;
  if (!current) return null;

  return {
    temperature: Math.round(current.temperature_2m ?? 28),
    humidity: Math.round(current.relative_humidity_2m ?? 75),
    weather_description: weatherCodeToDescription(current.weather_code ?? 0),
  };
}

/**
 * WMO Weather Code → Bahasa Indonesia description
 * https://open-meteo.com/en/docs#weathervariables
 */
function weatherCodeToDescription(code: number): string {
  if (code === 0) return "Cerah";
  if (code <= 3) return "Berawan";
  if (code <= 49) return "Berkabut";
  if (code <= 59) return "Gerimis";
  if (code <= 69) return "Hujan";
  if (code <= 79) return "Hujan Es";
  if (code <= 84) return "Hujan Lebat";
  if (code <= 94) return "Badai Petir";
  return "Cuaca Ekstrem";
}
