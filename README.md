# EcoPolyAI 🌱

**Platform Urban Farming Polibag & Pengolahan Limbah Organik Rumah Tangga Berbasis AI**

> Dibuat untuk kompetisi **CTARSA Youth Greenovation Session II**

---

## ✨ Fitur Utama

| Modul | Fitur |
|---|---|
| 🌿 Beranda & Cuaca | Dashboard tanaman, cuaca real-time Open-Meteo, simulasi cuaca ekstrem (Demo Juri), AI watering advice |
| ♻️ Olah Sampah | Panduan 3 metode kompos (Takakura, Lindi, Aerob) + Chat AI Pakar Polibag |
| 📷 Scan Tanaman | Kamera belakang real-time, snapshot hemat kuota, diagnosis penyakit multimodal Gemini |
| 📊 Dampak & IoT | Kalkulator SDGs, simulator komunitas, log kompos, roadmap IoT + preview dashboard sensor |

---

## 🚀 Cara Menjalankan

### 1. Install dependensi
```bash
npm install
```

### 2. Setup environment variables
File `.env.local` sudah dibuat. Pastikan berisi:
```env
NEXT_PUBLIC_SUPABASE_URL=https://yvnptsqcxdigjzfxfbom.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
GEMINI_API_KEY=AQ...
```

### 3. Setup database Supabase
Buka [Supabase Dashboard](https://supabase.com/dashboard) → SQL Editor → New Query → paste isi `supabase/schema.sql` → Run.

### 4. Jalankan development server
```bash
npm run dev
```
Buka [http://localhost:3000](http://localhost:3000)

### 5. Build production
```bash
npm run build
npm start
```

---

## 🏗️ Struktur Folder

```
EcoPolyAI/
├── app/
│   ├── api/
│   │   ├── chat/route.ts           # POST /api/chat
│   │   ├── scan/route.ts           # POST /api/scan
│   │   └── weather-advice/route.ts # POST /api/weather-advice
│   ├── olah-sampah/page.tsx        # Modul 2: Kompos + Chat AI
│   ├── scan/page.tsx               # Modul 3: Kamera + Scan
│   ├── dampak/page.tsx             # Modul 4: SDGs + IoT
│   ├── layout.tsx                  # Root layout + Bottom Nav
│   ├── page.tsx                    # Modul 1: Beranda + Cuaca
│   └── globals.css
├── components/
│   └── BottomNav.tsx               # Mobile bottom nav + Desktop sidebar
├── lib/
│   ├── supabase.ts                 # DB client + helpers + seed data
│   ├── gemini.ts                   # Shared system instruction + config
│   └── utils.ts                    # Image compression, date utils
├── supabase/
│   └── schema.sql                  # SQL schema untuk Supabase
├── .env.local                      # Environment variables (jangan di-commit!)
└── README.md
```

---

## 🔒 Keamanan

- `GEMINI_API_KEY` **hanya** digunakan di Server-side API Routes — tidak pernah terekspos ke browser
- Supabase keys menggunakan `anon` key (read-write dengan RLS policies)
- Gambar hanya dikirim ke AI **sekali** saat tombol Scan ditekan (hemat token)

## 🌐 Deploy ke Vercel

```bash
vercel --prod
```

Set environment variables di Vercel Dashboard → Settings → Environment Variables.
