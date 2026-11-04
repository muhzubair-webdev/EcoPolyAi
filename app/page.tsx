"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Thermometer,
  Droplets,
  Wind,
  CloudRain,
  Sun,
  Plus,
  Check,
  RefreshCw,
  AlertTriangle,
  Zap,
  Leaf,
  Cloud,
  Clock,
  Info,
  X,
} from "lucide-react";
import { fetchPlants, insertPlant, waterPlant } from "@/lib/supabase";
import type { PolybagPlant, PlantName, CompostMethod } from "@/lib/supabase";
import type { WeatherAdviceResponse } from "@/app/api/weather-advice/route";
import { daysSince, healthStatusColor, plantEmoji, formatDate } from "@/lib/utils";

// ── Weather Presets ──────────────────────────────────────────────────────────
const WEATHER_PRESETS = [
  { label: "Cerah", icon: "☀️", temp: 28, desc: "Cerah", hum: 65, color: "bg-amber-50 border-amber-200 text-amber-700" },
  { label: "Panas Terik", icon: "🔥", temp: 34, desc: "Panas Terik", hum: 45, color: "bg-red-50 border-red-200 text-red-700" },
  { label: "Hujan Badai", icon: "⛈️", temp: 22, desc: "Hujan Deras", hum: 95, color: "bg-blue-50 border-blue-200 text-blue-700" },
  { label: "Berawan", icon: "⛅", temp: 26, desc: "Berawan", hum: 78, color: "bg-gray-50 border-gray-200 text-gray-700" },
];

// ── Add Plant Modal ──────────────────────────────────────────────────────────
function AddPlantModal({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (plant: Omit<PolybagPlant, "id" | "created_at">) => void;
}) {
  const [form, setForm] = useState({
    plant_name: "Cabai" as PlantName,
    polybag_size: "35cm",
    planted_date: new Date().toISOString().slice(0, 10),
    compost_method: "Takakura" as CompostMethod,
    health_status: "Sehat",
    notes: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({ ...form, last_watered: null });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 px-5 py-4 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-white text-lg">🌱 Tambah Tanaman Polibag</h3>
            <p className="text-emerald-100 text-xs mt-0.5">Catat tanaman baru Anda</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center text-white">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          {/* Plant Name */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Jenis Tanaman</label>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {(["Cabai", "Tomat", "Sawi"] as PlantName[]).map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => setForm({ ...form, plant_name: name })}
                  className={`py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${
                    form.plant_name === name
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                      : "border-gray-200 text-gray-600 hover:border-emerald-300"
                  }`}
                >
                  {plantEmoji(name)} {name}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Ukuran Polibag</label>
              <select
                className="w-full mt-1.5 border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 focus:outline-none focus:border-emerald-400 focus:bg-white transition-colors"
                value={form.polybag_size}
                onChange={(e) => setForm({ ...form, polybag_size: e.target.value })}
              >
                {["25cm", "30cm", "35cm", "40cm", "50cm"].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Tanggal Tanam</label>
              <input
                type="date"
                className="w-full mt-1.5 border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 focus:outline-none focus:border-emerald-400 focus:bg-white transition-colors"
                value={form.planted_date}
                onChange={(e) => setForm({ ...form, planted_date: e.target.value })}
              />
            </div>
          </div>

          {/* Compost Method */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Metode Kompos</label>
            <div className="flex flex-col gap-2 mt-2">
              {([
                { val: "Takakura", icon: "🧺", desc: "Fermentasi keranjang berpori" },
                { val: "Pupuk Cair Lindi", icon: "💧", desc: "Cairan organik kaya nutrisi" },
                { val: "Kompos Aerob", icon: "♻️", desc: "Pencampuran hijau & coklat" },
              ] as { val: CompostMethod; icon: string; desc: string }[]).map(({ val, icon, desc }) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setForm({ ...form, compost_method: val })}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                    form.compost_method === val
                      ? "border-emerald-500 bg-emerald-50"
                      : "border-gray-200 hover:border-emerald-300"
                  }`}
                >
                  <span className="text-xl">{icon}</span>
                  <div>
                    <p className={`text-sm font-semibold ${form.compost_method === val ? "text-emerald-700" : "text-gray-700"}`}>{val}</p>
                    <p className="text-xs text-gray-400">{desc}</p>
                  </div>
                  {form.compost_method === val && <Check size={16} className="ml-auto text-emerald-600 shrink-0" />}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Catatan (opsional)</label>
            <input
              type="text"
              className="w-full mt-1.5 border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 focus:outline-none focus:border-emerald-400 focus:bg-white transition-colors"
              placeholder="Cth: Mulai berbunga, perlu penyanggah..."
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>

          <button
            type="submit"
            className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-2xl text-sm font-bold shadow-md shadow-emerald-200 hover:shadow-emerald-300 transition-all active:scale-95"
          >
            ✅ Simpan Tanaman
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Plant Card ───────────────────────────────────────────────────────────────
function PlantCard({
  plant,
  onWater,
  justWatered,
}: {
  plant: PolybagPlant;
  onWater: (id: string) => void;
  justWatered: boolean;
}) {
  const age = daysSince(plant.planted_date);
  const lastWatered = plant.last_watered ? daysSince(plant.last_watered) : null;
  const needsWater = lastWatered === null || lastWatered >= 1;

  const plantColors: Record<string, string> = {
    Cabai: "from-red-50 to-orange-50 border-red-100",
    Tomat: "from-orange-50 to-red-50 border-orange-100",
    Sawi: "from-green-50 to-emerald-50 border-green-100",
  };
  const cardGradient = plantColors[plant.plant_name] || "from-emerald-50 to-teal-50 border-emerald-100";

  return (
    <div className={`bg-gradient-to-br ${cardGradient} rounded-2xl p-4 border shadow-sm card-hover overflow-hidden relative`}>
      {/* Health status indicator */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-2xl shrink-0">
            {plantEmoji(plant.plant_name)}
          </div>
          <div>
            <h3 className="font-bold text-gray-800 text-base">{plant.plant_name}</h3>
            <p className="text-xs text-gray-500">Polibag {plant.polybag_size}</p>
          </div>
        </div>
        <span className={`text-[11px] px-2.5 py-1 rounded-full font-semibold ${healthStatusColor(plant.health_status)}`}>
          {plant.health_status}
        </span>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="bg-white/70 rounded-xl p-2 text-center">
          <Leaf size={14} className="text-emerald-500 mx-auto mb-0.5" />
          <p className="text-xs font-bold text-gray-700">{age}</p>
          <p className="text-[10px] text-gray-400">hari</p>
        </div>
        <div className="bg-white/70 rounded-xl p-2 text-center">
          <span className="text-xs block mb-0.5">♻️</span>
          <p className="text-[10px] font-semibold text-gray-600 leading-tight">
            {plant.compost_method === "Pupuk Cair Lindi" ? "Lindi" : plant.compost_method.split(" ")[0]}
          </p>
        </div>
        <div className="bg-white/70 rounded-xl p-2 text-center">
          <Droplets size={14} className={`mx-auto mb-0.5 ${needsWater ? "text-blue-500" : "text-gray-300"}`} />
          <p className={`text-[10px] font-semibold ${needsWater ? "text-blue-600" : "text-gray-400"}`}>
            {lastWatered === null ? "Belum" : lastWatered === 0 ? "Hari ini" : `${lastWatered}h lalu`}
          </p>
        </div>
      </div>

      {plant.notes && (
        <div className="bg-white/60 rounded-xl px-3 py-2 mb-3 flex items-start gap-2">
          <Info size={12} className="text-gray-400 shrink-0 mt-0.5" />
          <p className="text-xs text-gray-500 italic leading-relaxed">{plant.notes}</p>
        </div>
      )}

      <button
        onClick={() => onWater(plant.id)}
        className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95 ${
          justWatered
            ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
            : "bg-blue-500 text-white shadow-sm shadow-blue-200 hover:bg-blue-600"
        }`}
      >
        {justWatered ? (
          <><Check size={15} /> Sudah Disiram ✓</>
        ) : (
          <><Droplets size={15} /> Siram Sekarang</>
        )}
      </button>

      {/* Tanam date label */}
      <p className="text-[10px] text-gray-400 text-center mt-2">
        Ditanam: {formatDate(plant.planted_date)}
      </p>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function BerandaPage() {
  const [plants, setPlants] = useState<PolybagPlant[]>([]);
  const [advice, setAdvice] = useState<WeatherAdviceResponse | null>(null);
  const [loadingWeather, setLoadingWeather] = useState(true);
  const [selectedPreset, setSelectedPreset] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);
  const [wateredIds, setWateredIds] = useState<Set<string>>(new Set());
  const [loadingPlants, setLoadingPlants] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    fetchPlants().then((p) => {
      setPlants(p);
      setLoadingPlants(false);
    });
  }, []);

  const loadWeatherAdvice = useCallback(
    async (presetIdx: number, isSimulation: boolean) => {
      setLoadingWeather(true);
      const preset = WEATHER_PRESETS[presetIdx];
      try {
        const res = await fetch("/api/weather-advice", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            temperature: preset.temp,
            weather_description: preset.desc,
            humidity: preset.hum,
            plants: plants.map((p) => p.plant_name),
            is_simulation: isSimulation,
          }),
        });
        if (res.ok) {
          const data: WeatherAdviceResponse = await res.json();
          setAdvice(data);
          setLastUpdated(new Date());
        }
      } catch {
        // fallback silently
      } finally {
        setLoadingWeather(false);
      }
    },
    [plants]
  );

  useEffect(() => {
    loadWeatherAdvice(0, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePresetChange = (idx: number) => {
    setSelectedPreset(idx);
    loadWeatherAdvice(idx, idx > 0);
  };

  const handleWater = async (id: string) => {
    setWateredIds((prev) => new Set([...prev, id]));
    await waterPlant(id);
    setPlants((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, last_watered: new Date().toISOString() } : p
      )
    );
  };

  const handleAddPlant = async (plantData: Omit<PolybagPlant, "id" | "created_at">) => {
    const newPlant: PolybagPlant = {
      ...plantData,
      id: `local-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    setPlants((prev) => [newPlant, ...prev]);
    await insertPlant(plantData);
  };

  const w = advice?.raw_weather;
  const isHot = (w?.temperature ?? 0) > 32;
  const isRainy = w?.weather_description?.toLowerCase().includes("hujan");

  const weatherIcon = isRainy ? <CloudRain size={52} className="text-blue-200" /> :
    isHot ? <Sun size={52} className="text-amber-300 animate-spin" style={{ animationDuration: "8s" }} /> :
    <Cloud size={52} className="text-white/60" />;

  const bgGradient = isRainy
    ? "from-slate-600 via-blue-700 to-blue-800"
    : isHot
    ? "from-orange-500 via-amber-600 to-yellow-600"
    : "from-emerald-600 via-emerald-700 to-teal-700";

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-emerald-50 overflow-x-hidden">
      {/* ── Page Header ── */}
      <div className={`bg-gradient-to-br ${bgGradient} px-4 pt-5 pb-6 md:pt-8 relative overflow-hidden`}>
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-10 w-24 h-24 bg-white/5 rounded-full translate-y-1/2" />

        <div className="max-w-5xl mx-auto">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-white/70 text-sm font-medium">Selamat datang di</p>
              <h1 className="text-2xl md:text-3xl font-black text-white leading-tight">
                EcoPolyAI 🌿
              </h1>
              <p className="text-white/70 text-xs mt-1">Platform Urban Farming & Kompos AI</p>
            </div>
            <button
              onClick={() => loadWeatherAdvice(selectedPreset, selectedPreset > 0)}
              className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-2xl flex items-center justify-center transition-colors"
            >
              <RefreshCw size={16} className="text-white" />
            </button>
          </div>

          {/* Weather big card */}
          <div className="bg-white/15 backdrop-blur rounded-3xl p-5 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-end gap-2 mb-1">
                  <span className="text-5xl font-black text-white">
                    {w?.temperature ?? "--"}°C
                  </span>
                  {weatherIcon}
                </div>
                <p className="text-white/90 font-semibold text-lg">
                  {w?.weather_description ?? "Memuat..."}
                </p>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-1.5 text-white/70 text-xs">
                    <Droplets size={13} />
                    <span>{w?.humidity ?? "--"}% lembap</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-white/70 text-xs">
                    <Thermometer size={13} />
                    <span>{isHot ? "Panas" : isRainy ? "Sejuk" : "Normal"}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-white/70 text-xs">
                    <Clock size={13} />
                    <span>{lastUpdated.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                </div>
              </div>
              <p className="text-white/50 text-xs text-right hidden sm:block">Jakarta,<br />Indonesia</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 mt-6">
        {/* ── Watering advice cards ── */}
        {loadingWeather ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-4 animate-pulse h-20" />
            ))}
          </div>
        ) : advice ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
            {/* Warning banner */}
            <div className={`md:col-span-3 rounded-2xl p-4 flex items-start gap-3 shadow-sm ${
              isHot ? "bg-amber-50 border border-amber-200" :
              isRainy ? "bg-blue-50 border border-blue-200" :
              "bg-emerald-50 border border-emerald-200"
            }`}>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                isHot ? "bg-amber-100" : isRainy ? "bg-blue-100" : "bg-emerald-100"
              }`}>
                <AlertTriangle size={18} className={isHot ? "text-amber-600" : isRainy ? "text-blue-600" : "text-emerald-600"} />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-800">Peringatan Dini AI</p>
                <p className="text-sm text-gray-600 mt-0.5 leading-relaxed">{advice.peringatan}</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${advice.perlu_siram ? "bg-blue-100" : "bg-gray-100"}`}>
                <Droplets size={20} className={advice.perlu_siram ? "text-blue-600" : "text-gray-400"} />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Perlu Siram?</p>
                <p className={`text-base font-black ${advice.perlu_siram ? "text-blue-600" : "text-gray-400"}`}>
                  {advice.perlu_siram ? "Ya" : "Tidak"}
                </p>
              </div>
            </div>

            <div className="md:col-span-2 bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                <Wind size={20} className="text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Jadwal Penyiraman Hari Ini</p>
                <p className="text-base font-black text-emerald-700">{advice.frekuensi}</p>
              </div>
            </div>
          </div>
        ) : null}

        {/* ── Simulation Presets ── */}
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-2">
            <Zap size={14} className="text-amber-500" />
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Simulasi Cuaca Ekstrem (Demo Juri)</p>
          </div>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            {WEATHER_PRESETS.map((preset, idx) => (
              <button
                key={idx}
                onClick={() => handlePresetChange(idx)}
                className={`shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-semibold border-2 transition-all ${
                  selectedPreset === idx
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm"
                    : "border-gray-200 bg-white text-gray-600 hover:border-emerald-300"
                }`}
              >
                <span>{preset.icon}</span>
                <span>{preset.label}</span>
                <span className="text-gray-400 font-normal">{preset.temp}°C</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Plant list header ── */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="font-black text-gray-800 text-lg">🪴 Tanaman Polibag Saya</h2>
            <p className="text-xs text-gray-500">
              {plants.length} tanaman terdaftar
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-4 py-2.5 rounded-2xl text-sm font-bold shadow-md shadow-emerald-200 hover:shadow-emerald-300 transition-all active:scale-95"
          >
            <Plus size={16} /> Tambah
          </button>
        </div>

        {/* ── Plant grid ── */}
        {loadingPlants ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-4 animate-pulse h-48" />
            ))}
          </div>
        ) : plants.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-gray-100">
            <div className="text-6xl mb-4">🌱</div>
            <h3 className="font-bold text-gray-700 text-lg mb-2">Mulai Kebun Polibag Anda!</h3>
            <p className="text-gray-400 text-sm mb-5 max-w-xs mx-auto">
              Tambahkan tanaman pertama Anda dan biarkan AI membantu merawatnya.
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-2xl text-sm font-bold"
            >
              <Plus size={16} /> Tambah Tanaman Pertama
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {plants.map((plant) => (
              <PlantCard
                key={plant.id}
                plant={plant}
                onWater={handleWater}
                justWatered={wateredIds.has(plant.id)}
              />
            ))}
          </div>
        )}

        {/* ── Tips section ── */}
        <div className="mt-6 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-3xl p-5 text-white">
          <div className="flex items-start gap-3">
            <span className="text-2xl">💡</span>
            <div>
              <p className="font-bold text-sm mb-1">Tips Polibag Hari Ini</p>
              <p className="text-white/80 text-xs leading-relaxed">
                Siram polibag di pagi hari (06.00-08.00) untuk mengurangi penguapan. Tambahkan 1 genggam kompos organik setiap 2 minggu sekali untuk hasil panen optimal.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Add Modal ── */}
      {showAddModal && (
        <AddPlantModal
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddPlant}
        />
      )}
    </div>
  );
}
