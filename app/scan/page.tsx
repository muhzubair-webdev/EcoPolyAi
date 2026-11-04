"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  Camera,
  Upload,
  ScanLine,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ImageIcon,
  RefreshCw,
  Leaf,
  X,
  ZoomIn,
} from "lucide-react";
import { captureVideoSnapshot, compressImageToBase64 } from "@/lib/utils";

interface ScanResult {
  analysis: string;
  detected_plant: string;
  symptoms: string;
  organic_solution: string;
}

const SCAN_TIPS = [
  { icon: "🌿", tip: "Pastikan daun/tanaman mengisi 70% frame" },
  { icon: "☀️", tip: "Gunakan cahaya alami, hindari backlight" },
  { icon: "📏", tip: "Foto dari jarak 20–30cm untuk detail daun" },
  { icon: "⚡", tip: "1 tombol = 1 snapshot saja (hemat kuota AI)" },
];

export default function ScanPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [base64Image, setBase64Image] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"camera" | "upload">("camera");
  const [showPreviewFull, setShowPreviewFull] = useState(false);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch {
      setCameraError(
        "Kamera tidak dapat diakses. Pastikan izin kamera diberikan atau gunakan tombol unggah foto."
      );
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  }, [stream]);

  useEffect(() => {
    if (mode === "camera") startCamera();
    return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const handleSnapshot = () => {
    if (!videoRef.current) return;
    const b64 = captureVideoSnapshot(videoRef.current, 800, 0.8);
    setBase64Image(b64);
    setPreviewUrl(`data:image/jpeg;base64,${b64}`);
    setResult(null);
    setError(null);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const b64 = await compressImageToBase64(file, 800, 0.8);
      setBase64Image(b64);
      setPreviewUrl(`data:image/jpeg;base64,${b64}`);
      setResult(null);
      setError(null);
    } catch {
      setError("Gagal memproses gambar. Coba file lain.");
    }
  };

  const handleScan = async () => {
    if (!base64Image) return;
    setScanning(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ base64Image }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gagal scan");
      setResult(data as ScanResult);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Scan gagal. Pastikan gambar menampilkan tanaman."
      );
    } finally {
      setScanning(false);
    }
  };

  const handleReset = () => {
    setPreviewUrl(null);
    setBase64Image(null);
    setResult(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 md:bg-gradient-to-b md:from-emerald-50 md:via-white md:to-white overflow-x-hidden">
      {/* ── Header ── */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 px-4 pt-5 pb-6 relative overflow-hidden md:from-emerald-600 md:to-teal-700">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-4 left-8 w-16 h-16 border-2 border-white rounded-2xl rotate-12" />
          <div className="absolute top-8 right-12 w-8 h-8 border border-white rounded-full" />
        </div>
        <div className="max-w-5xl mx-auto relative">
          <h1 className="text-2xl md:text-3xl font-black text-white">📷 Scan Tanaman</h1>
          <p className="text-white/60 text-sm mt-1">
            Arahkan kamera ke daun & tekan Scan untuk diagnosis AI
          </p>
        </div>
      </div>

      <div className="w-full max-w-5xl mx-auto px-4 mt-6">
        <div className="flex flex-col lg:flex-row gap-5 min-w-0">

          {/* ── Camera / Preview column ── */}
          <div className="flex-1 min-w-0">
            {/* Mode toggle */}
            <div className="flex bg-slate-700 md:bg-white md:border md:border-gray-200 rounded-2xl p-1 gap-1 mb-3 shadow-sm">
              {(["camera", "upload"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => { setMode(m); if (m === "upload") stopCamera(); handleReset(); }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    mode === m
                      ? "bg-emerald-600 text-white shadow-md"
                      : "text-slate-300 md:text-gray-500 hover:text-white md:hover:text-gray-700"
                  }`}
                >
                  {m === "camera" ? <Camera size={16} /> : <Upload size={16} />}
                  {m === "camera" ? "Kamera" : "Unggah Foto"}
                </button>
              ))}
            </div>

            {/* Camera view */}
            {mode === "camera" && !previewUrl && (
              <div className="relative rounded-3xl overflow-hidden aspect-[4/3] bg-black shadow-2xl border border-slate-700">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />

                {/* Viewfinder overlay */}
                {!cameraError && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    {/* Corner brackets */}
                    <div className="relative w-48 h-48">
                      <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-emerald-400 rounded-tl-xl" />
                      <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-emerald-400 rounded-tr-xl" />
                      <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-emerald-400 rounded-bl-xl" />
                      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-emerald-400 rounded-br-xl" />
                      {/* Scan line */}
                      <div className="absolute left-2 right-2 h-0.5 bg-emerald-400/70 scan-line" />
                    </div>
                    <p className="absolute bottom-4 left-0 right-0 text-center text-white/60 text-xs">
                      Arahkan tanaman ke dalam bingkai
                    </p>
                  </div>
                )}

                {cameraError && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/90 text-white p-6 text-center">
                    <AlertCircle size={36} className="mb-3 text-red-400" />
                    <p className="text-sm leading-relaxed">{cameraError}</p>
                    <button
                      onClick={startCamera}
                      className="mt-4 px-4 py-2 bg-emerald-600 rounded-xl text-sm font-semibold"
                    >
                      Coba Lagi
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Upload area */}
            {mode === "upload" && !previewUrl && (
              <label className="block border-3 border-dashed border-emerald-300 bg-white rounded-3xl aspect-[4/3] flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-emerald-50 transition-colors shadow-sm">
                <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center">
                  <ImageIcon size={28} className="text-emerald-600" />
                </div>
                <div className="text-center">
                  <p className="text-base font-bold text-gray-700">Pilih Foto Tanaman</p>
                  <p className="text-sm text-gray-400 mt-1">JPG, PNG — maks. 5MB</p>
                  <div className="mt-3 px-6 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold inline-block">
                    Browse Galeri
                  </div>
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
              </label>
            )}

            {/* Preview image */}
            {previewUrl && (
              <div className="relative rounded-3xl overflow-hidden aspect-[4/3] bg-black shadow-2xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                <div className="absolute top-3 right-3 flex gap-2">
                  <button
                    onClick={() => setShowPreviewFull(true)}
                    className="w-9 h-9 bg-black/60 text-white rounded-xl hover:bg-black/80 flex items-center justify-center"
                  >
                    <ZoomIn size={16} />
                  </button>
                  <button
                    onClick={handleReset}
                    className="w-9 h-9 bg-black/60 text-white rounded-xl hover:bg-black/80 flex items-center justify-center"
                  >
                    <RefreshCw size={16} />
                  </button>
                </div>

                {/* Scanning overlay */}
                {scanning && (
                  <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
                    <div className="w-20 h-20 bg-emerald-600/20 rounded-full flex items-center justify-center border-2 border-emerald-400 animate-pulse">
                      <ScanLine size={36} className="text-emerald-400" />
                    </div>
                    <div className="text-center">
                      <p className="text-white font-bold">Menganalisis Tanaman...</p>
                      <p className="text-white/60 text-sm mt-1">AI sedang memproses gambar</p>
                    </div>
                    <div className="flex gap-1">
                      {[0, 1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce"
                          style={{ animationDelay: `${i * 0.12}s` }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-3 mt-3">
              {mode === "camera" && !previewUrl && (
                <button
                  onClick={handleSnapshot}
                  disabled={!!cameraError}
                  className="flex-1 flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-2xl font-bold text-base shadow-lg shadow-emerald-300 hover:shadow-emerald-400 transition-all active:scale-95 disabled:opacity-50"
                >
                  <Camera size={22} />
                  Ambil Foto
                </button>
              )}

              {previewUrl && !result && (
                <button
                  onClick={handleScan}
                  disabled={scanning}
                  className="flex-1 flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-2xl font-bold text-base shadow-lg shadow-emerald-300 hover:shadow-emerald-400 transition-all active:scale-95 disabled:opacity-50"
                >
                  {scanning ? (
                    <Loader2 size={22} className="animate-spin" />
                  ) : (
                    <ScanLine size={22} />
                  )}
                  {scanning ? "Memindai..." : "🔍 Scan Tanaman"}
                </button>
              )}

              {result && (
                <button
                  onClick={handleReset}
                  className="flex-1 flex items-center justify-center gap-2 py-4 border-2 border-emerald-300 text-emerald-700 rounded-2xl font-bold text-base hover:bg-emerald-50 transition-all"
                >
                  <RefreshCw size={18} />
                  Scan Tanaman Baru
                </button>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="mt-3 flex items-start gap-3 bg-red-50 border border-red-200 rounded-2xl p-4">
                <AlertCircle size={20} className="text-red-500 shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}
          </div>

          {/* ── Right column: Result & Tips ── */}
          <div className="min-w-0 lg:w-96 lg:shrink-0 flex flex-col gap-4">

            {/* Scan Result */}
            {result ? (
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3.5 bg-gradient-to-r from-emerald-500 to-emerald-600">
                  <CheckCircle2 size={20} className="text-white" />
                  <span className="font-bold text-white">Hasil Diagnosis AI</span>
                </div>

                <div className="p-4 flex flex-col gap-3">
                  <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-3">
                    <p className="text-[11px] text-emerald-600 font-bold uppercase tracking-wide mb-1.5">🌿 Tanaman Terdeteksi</p>
                    <p className="text-sm text-gray-700 leading-relaxed">{result.detected_plant}</p>
                  </div>

                  {result.symptoms && result.symptoms !== "Tidak terdeteksi" && (
                    <div className="bg-amber-50 border border-amber-100 rounded-2xl p-3">
                      <p className="text-[11px] text-amber-600 font-bold uppercase tracking-wide mb-1.5">⚠️ Gejala Terdeteksi</p>
                      <p className="text-sm text-gray-700 leading-relaxed">{result.symptoms}</p>
                    </div>
                  )}

                  <div className="bg-blue-50 border border-blue-100 rounded-2xl p-3">
                    <p className="text-[11px] text-blue-600 font-bold uppercase tracking-wide mb-1.5">💡 Solusi Organik</p>
                    <p className="text-sm text-gray-700 leading-relaxed">{result.organic_solution}</p>
                  </div>

                  {result.analysis.length > 200 && (
                    <details className="bg-gray-50 rounded-2xl p-3">
                      <summary className="text-xs font-semibold text-gray-500 cursor-pointer">📋 Lihat Analisis Lengkap</summary>
                      <p className="text-xs text-gray-600 mt-2 leading-relaxed whitespace-pre-wrap">{result.analysis}</p>
                    </details>
                  )}
                </div>
              </div>
            ) : (
              /* Tips card when no result yet */
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-4 py-3.5 border-b border-gray-100">
                  <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    <Leaf size={16} className="text-emerald-600" />
                    Tips Foto Terbaik
                  </h3>
                </div>
                <div className="p-4 flex flex-col gap-2.5">
                  {SCAN_TIPS.map((tip, i) => (
                    <div key={i} className="flex items-start gap-3 bg-gray-50 rounded-xl p-3">
                      <span className="text-xl shrink-0">{tip.icon}</span>
                      <p className="text-sm text-gray-600 leading-relaxed">{tip.tip}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* How it works */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-5 text-white">
              <p className="font-bold text-sm mb-3">🔬 Cara Kerja Scan AI</p>
              <div className="flex flex-col gap-2.5">
                {[
                  { step: "1", text: "Ambil foto / unggah gambar tanaman", icon: "📸" },
                  { step: "2", text: "Gambar dikompresi otomatis (hemat data)", icon: "⚡" },
                  { step: "3", text: "AI Gemini menganalisis secara multimodal", icon: "🤖" },
                  { step: "4", text: "Hasil diagnosis & solusi organik tampil", icon: "✅" },
                ].map((item) => (
                  <div key={item.step} className="flex items-center gap-3">
                    <div className="w-7 h-7 bg-emerald-600/30 border border-emerald-500/30 rounded-lg flex items-center justify-center text-emerald-400 text-xs font-bold shrink-0">
                      {item.step}
                    </div>
                    <p className="text-white/70 text-xs flex-1">{item.text}</p>
                    <span className="text-base shrink-0">{item.icon}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Full preview modal */}
      {showPreviewFull && previewUrl && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setShowPreviewFull(false)}
        >
          <button className="absolute top-4 right-4 w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-white">
            <X size={20} />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt="Full preview"
            className="max-w-full max-h-full rounded-2xl shadow-2xl object-contain"
          />
        </div>
      )}
    </div>
  );
}
