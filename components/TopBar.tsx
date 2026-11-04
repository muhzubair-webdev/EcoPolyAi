"use client";

import { usePathname } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

const PAGE_META: Record<string, { title: string; subtitle: string; emoji: string }> = {
  "/": { title: "EcoPolyAI", subtitle: "Urban Farming × AI", emoji: "🌿" },
  "/olah-sampah": { title: "Olah Sampah", subtitle: "Kompos & Chat AI", emoji: "♻️" },
  "/scan": { title: "Scan Tanaman", subtitle: "Deteksi Penyakit AI", emoji: "📷" },
  "/dampak": { title: "Dampak & IoT", subtitle: "SDGs & Roadmap", emoji: "📊" },
};

export default function TopBar() {
  const pathname = usePathname();
  const router = useRouter();
  const meta = PAGE_META[pathname] ?? PAGE_META["/"];
  const isHome = pathname === "/";

  return (
    /* Hanya tampil di mobile (md:hidden) — desktop pakai Sidebar */
    <header className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm">
      <div className="flex items-center h-14 px-4 gap-3">
        {/* Back button (semua halaman kecuali home) */}
        {!isHome && (
          <button
            onClick={() => router.back()}
            className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-500 hover:bg-gray-100 transition-colors shrink-0"
            aria-label="Kembali"
          >
            <ArrowLeft size={18} strokeWidth={2} />
          </button>
        )}

        {/* Logo dot (hanya di home) */}
        {isHome && (
          <div className="w-8 h-8 bg-eco-gradient rounded-xl flex items-center justify-center shrink-0 shadow-sm">
            <span className="text-sm leading-none">{meta.emoji}</span>
          </div>
        )}

        {/* Title */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-900 leading-none truncate">{meta.title}</p>
          <p className="text-[10px] text-emerald-600 font-medium mt-0.5 leading-none truncate">
            {meta.subtitle}
          </p>
        </div>

        {/* Page emoji badge */}
        {!isHome && (
          <span className="text-xl shrink-0">{meta.emoji}</span>
        )}
      </div>
    </header>
  );
}
