"use client";

import { useEffect, useState } from "react";
import {
  Globe,
  Cpu,
  Wifi,
  Activity,
  Users,
  Plus,
  Trash2,
  TrendingUp,
  X,
} from "lucide-react";
import { fetchCompostBatches, insertCompostBatch } from "@/lib/supabase";
import type { CompostBatch, CompostMethod } from "@/lib/supabase";
import { formatDate } from "@/lib/utils";

const SDG_ITEMS = [
  {
    num: "11",
    label: "Kota & Permukiman Berkelanjutan",
    color: "from-amber-500 to-orange-600",
    icon: "🏙️",
    desc: "Urban farming di lahan sempit 1m² mengoptimalkan ruang perkotaan yang terbatas.",
  },
  {
    num: "12",
    label: "Konsumsi & Produksi Bertanggung Jawab",
    color: "from-amber-600 to-amber-700",
    icon: "♻️",
    desc: "Sampah organik rumah tangga diubah jadi pupuk kompos bernilai tinggi, nol limbah.",
  },
  {
    num: "13",
    label: "Penanganan Perubahan Iklim",
    color: "from-emerald-600 to-teal-700",
    icon: "🌍",
    desc: "Mengurangi emisi gas metana (CH₄) dari sampah organik yang membusuk di TPA.",
  },
];

const ROADMAP_ITEMS = [
  {
    phase: "Fase 1",
    label: "Platform AI (Sekarang)",
    icon: "🤖",
    status: "active" as const,
    desc: "EcoPolyAI: Chat AI, Scan Penyakit, Panduan Kompos, Dashboard Cuaca",
  },
  {
    phase: "Fase 2",
    label: "Sensor Tanah IoT",
    icon: "📡",
    status: "upcoming" as const,
    desc: "Sensor kelembapan tanah (ESP32 + soil sensor) terintegrasi dashboard",
  },
  {
    phase: "Fase 3",
    label: "Otomasi Penyiraman",
    icon: "💧",
    status: "future" as const,
    desc: "Sistem penyiraman otomatis (solenoid valve) berbasis data sensor & AI",
  },
  {
    phase: "Fase 4",
    label: "Komunitas & Bank Sampah",
    icon: "🏘️",
    status: "future" as const,
    desc: "Integrasi Bank Sampah Lokal & PKK — kompos komunal skala RW",
  },
];

function AddBatchModal({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (b: Omit<CompostBatch, "id" | "created_at">) => void;
}) {
  const [form, setForm] = useState({
    waste_source: "",
    weight_kg: 1,
    method: "Takakura" as CompostMethod,
    start_date: new Date().toISOString().slice(0, 10),
    status: "Aktif",
  });

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-5 py-4 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-white text-lg">♻️ Catat Batch Kompos</h3>
            <p className="text-emerald-100 text-xs mt-0.5">Tambah data pengomposan baru</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center text-white">
            <X size={16} />
          </button>
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); onAdd(form); onClose(); }}
          className="p-5 flex flex-col gap-4"
        >
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Sumber Sampah</label>
            <input
              required
              type="text"
              className="w-full mt-1.5 border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 focus:outline-none focus:border-emerald-400 focus:bg-white transition-colors"
              placeholder="Cth: Sisa nasi & sayuran, Kulit buah..."
              value={form.waste_source}
              onChange={(e) => setForm({ ...form, waste_source: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Berat (kg)</label>
              <input
                type="number"
                min={0.1}
                step={0.1}
                className="w-full mt-1.5 border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 focus:outline-none focus:border-emerald-400 focus:bg-white"
                value={form.weight_kg}
                onChange={(e) => setForm({ ...form, weight_kg: parseFloat(e.target.value) })}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Tanggal Mulai</label>
              <input
                type="date"
                className="w-full mt-1.5 border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 focus:outline-none focus:border-emerald-400 focus:bg-white"
                value={form.start_date}
                onChange={(e) => setForm({ ...form, start_date: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">Metode Kompos</label>
            <div className="flex flex-col gap-2">
              {([
                { val: "Takakura", icon: "🧺" },
                { val: "Pupuk Cair Lindi", icon: "💧" },
                { val: "Kompos Aerob", icon: "♻️" },
              ] as { val: CompostMethod; icon: string }[]).map(({ val, icon }) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setForm({ ...form, method: val })}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border-2 text-left text-sm font-medium transition-all ${
                    form.method === val
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                      : "border-gray-200 text-gray-600"
                  }`}
                >
                  <span>{icon}</span> {val}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-2xl text-sm font-bold shadow-md shadow-emerald-200 active:scale-95 transition-transform"
          >
            ✅ Simpan Batch Kompos
          </button>
        </form>
      </div>
    </div>
  );
}

export default function DampakPage() {
  const [batches, setBatches] = useState<CompostBatch[]>([]);
  const [households, setHouseholds] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    fetchCompostBatches().then(setBatches);
  }, []);

  const totalKg = batches.reduce((s, b) => s + b.weight_kg, 0);
  const savedPerYear = households * 52;
  const methaneReduction = +(savedPerYear * 0.064 * households).toFixed(2);
  const polybagsFed = Math.floor(totalKg * 5);
  const co2Equivalent = +(methaneReduction * 25).toFixed(1);

  const handleAddBatch = async (batchData: Omit<CompostBatch, "id" | "created_at">) => {
    const newBatch: CompostBatch = {
      ...batchData,
      id: `local-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    setBatches((prev) => [newBatch, ...prev]);
    await insertCompostBatch(batchData);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-white overflow-x-hidden">
      {/* ── Header ── */}
      <div className="bg-gradient-to-br from-emerald-600 to-teal-700 px-4 pt-5 pb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="max-w-5xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-black text-white">📊 Dampak & IoT</h1>
          <p className="text-emerald-100 text-sm mt-1">
            Kalkulator SDGs & Peta Jalan Otomasi IoT
          </p>
        </div>
      </div>

      <div className="w-full max-w-5xl mx-auto px-4 mt-6">

        {/* ── Impact Metrics Grid ── */}
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-3xl p-5 mb-5 shadow-lg shadow-emerald-200">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={18} className="text-emerald-200" />
            <p className="text-white font-bold text-sm">Dampak Terukur Real-time (dari Log Kompos)</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { value: `${totalKg.toFixed(1)} kg`, label: "Sampah Diolah", icon: "🗑️" },
              { value: `${polybagsFed}`, label: "Polibag Didukung", icon: "🪴" },
              { value: `${co2Equivalent} kg`, label: "CO₂e Dicegah", icon: "🌍" },
              { value: `${batches.filter(b => b.status === "Selesai").length}`, label: "Batch Selesai", icon: "✅" },
            ].map((m, i) => (
              <div key={i} className="bg-white/15 backdrop-blur rounded-2xl p-4 text-center border border-white/10">
                <p className="text-2xl font-black text-white">{m.value}</p>
                <p className="text-emerald-200 text-xs mt-1">{m.icon} {m.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Two column layout on desktop ── */}
        <div className="flex flex-col lg:flex-row gap-5 min-w-0">

          {/* ── Left ── */}
          <div className="flex-1 min-w-0 flex flex-col gap-5">

            {/* Simulator */}
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
              <h2 className="font-black text-gray-800 mb-1 flex items-center gap-2">
                <span className="w-8 h-8 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <Users size={16} className="text-emerald-700" />
                </span>
                Simulator Dampak Komunitas
              </h2>
              <p className="text-xs text-gray-500 mb-4">
                Geser slider untuk estimasi dampak jika diimplementasikan di lebih banyak rumah tangga.
              </p>

              <div className="flex items-center gap-3 mb-5">
                <span className="text-2xl">🏠</span>
                <input
                  type="range"
                  min={1}
                  max={500}
                  value={households}
                  onChange={(e) => setHouseholds(Number(e.target.value))}
                  className="flex-1 accent-emerald-600"
                />
                <div className="bg-emerald-600 text-white text-center rounded-xl px-3 py-1.5 min-w-16">
                  <p className="text-xl font-black leading-none">{households}</p>
                  <p className="text-[10px] text-emerald-200">KK</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: `${(savedPerYear * households).toLocaleString()} kg`, label: "Sampah/tahun", color: "from-emerald-50 to-emerald-100 border-emerald-200", textColor: "text-emerald-700", icon: "♻️" },
                  { value: `${(savedPerYear * households * 5).toLocaleString()}`, label: "Polibag", color: "from-blue-50 to-blue-100 border-blue-200", textColor: "text-blue-700", icon: "🪴" },
                  { value: `${(methaneReduction * households).toFixed(1)} kg`, label: "CH₄ Dicegah", color: "from-amber-50 to-amber-100 border-amber-200", textColor: "text-amber-700", icon: "🌿" },
                ].map((stat, i) => (
                  <div key={i} className={`bg-gradient-to-br ${stat.color} border rounded-2xl p-3 text-center`}>
                    <p className="text-xl mb-1">{stat.icon}</p>
                    <p className={`text-base font-black ${stat.textColor}`}>{stat.value}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5 leading-tight">{stat.label}</p>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-gray-400 mt-3 text-center">
                * 1 kg sampah/minggu × 52 minggu × {households} KK | CH₄ factor = 0.064 kg/kg
              </p>
            </div>

            {/* SDG cards */}
            <div>
              <h2 className="font-black text-gray-800 mb-3 flex items-center gap-2">
                <Globe size={18} className="text-emerald-600" />
                Keterkaitan SDGs PBB
              </h2>
              <div className="flex flex-col gap-3">
                {SDG_ITEMS.map((sdg) => (
                  <div key={sdg.num} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex gap-4 card-hover">
                    <div className={`bg-gradient-to-br ${sdg.color} text-white rounded-2xl px-3 py-2 flex flex-col items-center justify-center shrink-0 min-w-14 shadow-md`}>
                      <span className="text-xl">{sdg.icon}</span>
                      <span className="text-[10px] font-bold mt-1">SDG {sdg.num}</span>
                    </div>
                    <div>
                      <p className="font-bold text-gray-800 text-sm">{sdg.label}</p>
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed">{sdg.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Right ── */}
          <div className="min-w-0 lg:w-96 lg:shrink-0 flex flex-col gap-5">

            {/* Compost Log */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100">
                <h2 className="font-black text-gray-800 flex items-center gap-2">
                  <Trash2 size={16} className="text-emerald-600" />
                  Log Batch Kompos
                </h2>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="flex items-center gap-1.5 bg-emerald-600 text-white px-3 py-2 rounded-xl text-xs font-bold"
                >
                  <Plus size={13} /> Tambah
                </button>
              </div>
              <div className="p-3 flex flex-col gap-2 max-h-72 overflow-y-auto scrollbar-hide">
                {batches.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <p className="text-2xl mb-2">🗑️</p>
                    <p className="text-sm">Belum ada batch kompos</p>
                  </div>
                ) : batches.map((batch) => (
                  <div key={batch.id} className="bg-gray-50 hover:bg-emerald-50 rounded-2xl p-3 flex items-center gap-3 transition-colors">
                    <span className="text-xl shrink-0">
                      {batch.method === "Takakura" ? "🧺" : batch.method === "Pupuk Cair Lindi" ? "💧" : "♻️"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{batch.waste_source}</p>
                      <p className="text-xs text-gray-500">{batch.method} · {batch.weight_kg} kg · {formatDate(batch.start_date)}</p>
                    </div>
                    <span className={`text-[11px] px-2 py-1 rounded-full font-semibold shrink-0 ${
                      batch.status === "Selesai"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-amber-100 text-amber-700"
                    }`}>
                      {batch.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* IoT Roadmap */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-4 py-3.5 border-b border-gray-100">
                <h2 className="font-black text-gray-800 flex items-center gap-2">
                  <Cpu size={16} className="text-emerald-600" />
                  Peta Jalan Otomasi IoT
                </h2>
              </div>
              <div className="p-4">
                <div className="relative">
                  <div className="absolute left-5 top-5 bottom-5 w-0.5 bg-gradient-to-b from-emerald-400 to-gray-200" />
                  <div className="flex flex-col gap-4">
                    {ROADMAP_ITEMS.map((item, idx) => (
                      <div key={idx} className="flex gap-4 relative">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 z-10 shadow-sm ${
                          item.status === "active" ? "bg-gradient-to-br from-emerald-400 to-emerald-600" :
                          item.status === "upcoming" ? "bg-gradient-to-br from-amber-400 to-amber-500" :
                          "bg-gray-200"
                        }`}>
                          {item.icon}
                        </div>
                        <div className={`flex-1 rounded-2xl p-3 border ${
                          item.status === "active" ? "bg-emerald-50 border-emerald-200" :
                          item.status === "upcoming" ? "bg-amber-50 border-amber-200" :
                          "bg-gray-50 border-gray-200"
                        }`}>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] text-gray-400 font-medium">{item.phase}</span>
                            {item.status === "active" && (
                              <span className="bg-emerald-600 text-white text-[9px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                                <Activity size={8} /> AKTIF
                              </span>
                            )}
                            {item.status === "upcoming" && (
                              <span className="bg-amber-500 text-white text-[9px] px-2 py-0.5 rounded-full font-bold">SEGERA</span>
                            )}
                          </div>
                          <p className="text-sm font-bold text-gray-800">{item.label}</p>
                          <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* IoT Preview */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="font-bold text-white text-sm">🌡️ Dashboard Sensor IoT</p>
                  <p className="text-slate-400 text-xs">Preview Fase 2 — Data Simulasi</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <Wifi size={13} className="text-amber-400" />
                  <span className="text-amber-400 text-xs font-medium">Demo</span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Cabai", value: "68%", status: "ok", icon: "🌶️" },
                  { label: "Tomat", value: "45%", status: "warn", icon: "🍅" },
                  { label: "Sawi", value: "72%", status: "ok", icon: "🥬" },
                ].map((s, i) => (
                  <div key={i} className="bg-white/10 rounded-2xl p-3 text-center border border-white/5">
                    <p className="text-xl mb-1">{s.icon}</p>
                    <p className={`text-xl font-black ${s.status === "ok" ? "text-emerald-400" : "text-amber-400"}`}>
                      {s.value}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">
                      {s.label}<br />lembap tanah
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-3 bg-amber-500/20 border border-amber-500/30 rounded-xl p-3">
                <p className="text-amber-300 text-xs text-center">
                  ⚠️ AI: Polibag Tomat perlu segera disiram (lembap &lt; 50%)
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showAddModal && (
        <AddBatchModal onClose={() => setShowAddModal(false)} onAdd={handleAddBatch} />
      )}
    </div>
  );
}
