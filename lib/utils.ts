/**
 * Compress an image (from a File or Blob) client-side using HTML5 Canvas.
 * Resizes to max 800px wide (maintaining aspect ratio), exports as JPEG 80%,
 * and returns a pure base64 string (without the data-URL prefix).
 */
export async function compressImageToBase64(
  source: File | Blob,
  maxWidth = 800,
  quality = 0.8
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(source);

    img.onload = () => {
      URL.revokeObjectURL(url);

      // Calculate scaled dimensions
      let { width, height } = img;
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas 2D context tidak tersedia."));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      // Export as JPEG and strip the data-URL prefix
      const dataUrl = canvas.toDataURL("image/jpeg", quality);
      const base64 = dataUrl.replace(/^data:image\/jpeg;base64,/, "");
      resolve(base64);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Gagal memuat gambar untuk kompresi."));
    };

    img.src = url;
  });
}

/**
 * Capture a single snapshot from a <video> element into a hidden <canvas>,
 * then return the compressed base64 string.
 */
export function captureVideoSnapshot(
  video: HTMLVideoElement,
  maxWidth = 800,
  quality = 0.8
): string {
  const canvas = document.createElement("canvas");
  let { videoWidth: w, videoHeight: h } = video;
  if (w > maxWidth) {
    h = Math.round((h * maxWidth) / w);
    w = maxWidth;
  }
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(video, 0, 0, w, h);
  const dataUrl = canvas.toDataURL("image/jpeg", quality);
  return dataUrl.replace(/^data:image\/jpeg;base64,/, "");
}

/** Format a date string to "DD MMM YYYY" in Indonesian locale */
export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/** Calculate days since a date string */
export function daysSince(dateStr: string): number {
  const now = new Date();
  const then = new Date(dateStr);
  const diff = now.getTime() - then.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

/** Generate a random UUID-like session ID for chat */
export function newSessionId(): string {
  return `session-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Health status badge colour mapping */
export function healthStatusColor(status: string): string {
  const s = status.toLowerCase();
  if (s.includes("sehat")) return "bg-emerald-100 text-emerald-700";
  if (s.includes("perlu") || s.includes("perhatian"))
    return "bg-amber-100 text-amber-700";
  if (s.includes("sakit") || s.includes("kritis"))
    return "bg-red-100 text-red-700";
  return "bg-gray-100 text-gray-600";
}

/** Emoji for plant name */
export function plantEmoji(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("cabai")) return "🌶️";
  if (n.includes("tomat")) return "🍅";
  if (n.includes("sawi")) return "🥬";
  return "🌱";
}
