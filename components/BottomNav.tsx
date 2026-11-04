"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Trash2, Camera, BarChart3, Leaf } from "lucide-react";

const NAV_ITEMS = [
  {
    href: "/",
    label: "Beranda",
    sublabel: "Cuaca & Tanaman",
    icon: Home,
    emoji: "🏠",
  },
  {
    href: "/olah-sampah",
    label: "Olah Sampah",
    sublabel: "Kompos & Chat AI",
    icon: Trash2,
    emoji: "♻️",
  },
  {
    href: "/scan",
    label: "Scan Tanaman",
    sublabel: "Deteksi Penyakit",
    icon: Camera,
    emoji: "📷",
  },
  {
    href: "/dampak",
    label: "Dampak & IoT",
    sublabel: "SDGs & Roadmap",
    icon: BarChart3,
    emoji: "📊",
  },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <>
      {/* ── Bottom Navigation Bar (Mobile) ── */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
        <div className="mx-3 mb-3 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="flex items-stretch justify-around h-16">
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
              const active =
                href === "/" ? pathname === "/" : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex flex-col items-center justify-center flex-1 gap-0.5 min-h-[48px] transition-all duration-200 relative
                    ${
                      active
                        ? "text-emerald-600"
                        : "text-gray-400 hover:text-emerald-500"
                    }`}
                >
                  {active && (
                    <span className="absolute top-0 inset-x-2 h-0.5 bg-emerald-500 rounded-full" />
                  )}
                  <span
                    className={`p-1.5 rounded-xl transition-colors ${
                      active ? "bg-emerald-50" : ""
                    }`}
                  >
                    <Icon
                      size={20}
                      strokeWidth={active ? 2.5 : 1.8}
                    />
                  </span>
                  <span className="text-[9px] font-semibold leading-tight tracking-wide uppercase">
                    {label.split(" ")[0]}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* ── Sidebar (Desktop) ── */}
      <aside className="hidden md:flex flex-col fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-100 shadow-sm z-50">
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-6 border-b border-gray-100">
          <div className="w-10 h-10 bg-eco-gradient rounded-2xl flex items-center justify-center shadow-md shrink-0">
            <Leaf size={20} className="text-white" strokeWidth={2.5} />
          </div>
          <div>
            <p className="font-black text-gray-800 text-base leading-none tracking-tight">
              EcoPolyAI
            </p>
            <p className="text-[11px] text-emerald-600 font-medium mt-0.5">
              Urban Farming × AI
            </p>
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex flex-col gap-1 p-3 flex-1 overflow-y-auto">
          <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-widest px-3 py-2">
            Menu Utama
          </p>
          {NAV_ITEMS.map(({ href, label, sublabel, icon: Icon }) => {
            const active =
              href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-3 rounded-2xl transition-all duration-200 group
                  ${
                    active
                      ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-md shadow-emerald-200"
                      : "text-gray-600 hover:bg-emerald-50 hover:text-emerald-700"
                  }`}
              >
                <span
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                    active
                      ? "bg-white/20"
                      : "bg-gray-100 group-hover:bg-emerald-100"
                  }`}
                >
                  <Icon
                    size={18}
                    strokeWidth={active ? 2.5 : 1.8}
                    className={active ? "text-white" : "text-gray-500 group-hover:text-emerald-600"}
                  />
                </span>
                <div>
                  <p className={`text-sm font-semibold leading-none mb-0.5 ${active ? "text-white" : ""}`}>
                    {label}
                  </p>
                  <p className={`text-[10px] leading-none ${active ? "text-emerald-100" : "text-gray-400"}`}>
                    {sublabel}
                  </p>
                </div>
                {active && (
                  <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer badge */}
        <div className="px-4 pb-5">
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">🏆</span>
              <p className="text-xs text-emerald-800 font-bold">CTARSA Youth</p>
            </div>
            <p className="text-[10px] text-emerald-600 leading-relaxed">
              Greenovation Session II<br />
              <span className="text-gray-400">© 2026 EcoPolyAI</span>
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
