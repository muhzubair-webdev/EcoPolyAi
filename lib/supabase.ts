import { createClient } from "@supabase/supabase-js";

// ── Types ──────────────────────────────────────────────────────────────────
export type PlantName = "Cabai" | "Tomat" | "Sawi";
export type CompostMethod = "Takakura" | "Pupuk Cair Lindi" | "Kompos Aerob";
export type MessageRole = "user" | "model";

export interface PolybagPlant {
  id: string;
  plant_name: PlantName;
  polybag_size: string;
  planted_date: string;
  compost_method: CompostMethod;
  health_status: string;
  last_watered: string | null;
  notes: string | null;
  created_at: string;
}

export interface CompostBatch {
  id: string;
  waste_source: string;
  weight_kg: number;
  method: CompostMethod;
  start_date: string;
  status: string;
  created_at: string;
}

export interface PlantScan {
  id: string;
  plant_id: string | null;
  detected_plant: string;
  symptoms: string;
  organic_solution: string;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  role: MessageRole;
  message: string;
  created_at: string;
}

// ── Supabase Client ────────────────────────────────────────────────────────
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Returns a Supabase client if env vars are set, otherwise null.
 * The app uses local/simulated state as a fallback so it never crashes.
 */
export function getSupabaseClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }
  return createClient(supabaseUrl, supabaseAnonKey);
}

export const supabase = getSupabaseClient();

// ── DB Helpers ─────────────────────────────────────────────────────────────

/** Fetch all polybag plants, newest first */
export async function fetchPlants(): Promise<PolybagPlant[]> {
  if (!supabase) return SEED_PLANTS;
  const { data, error } = await supabase
    .from("polybag_plants")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) {
    console.error("[supabase] fetchPlants:", error.message);
    return SEED_PLANTS;
  }
  return (data as PolybagPlant[]) ?? SEED_PLANTS;
}

/** Insert a new plant */
export async function insertPlant(
  plant: Omit<PolybagPlant, "id" | "created_at">
): Promise<PolybagPlant | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("polybag_plants")
    .insert(plant)
    .select()
    .single();
  if (error) {
    console.error("[supabase] insertPlant:", error.message);
    return null;
  }
  return data as PolybagPlant;
}

/** Update last_watered timestamp for a plant */
export async function waterPlant(id: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase
    .from("polybag_plants")
    .update({ last_watered: new Date().toISOString() })
    .eq("id", id);
  if (error) console.error("[supabase] waterPlant:", error.message);
}

/** Fetch all compost batches */
export async function fetchCompostBatches(): Promise<CompostBatch[]> {
  if (!supabase) return SEED_BATCHES;
  const { data, error } = await supabase
    .from("compost_batches")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) {
    console.error("[supabase] fetchCompostBatches:", error.message);
    return SEED_BATCHES;
  }
  return (data as CompostBatch[]) ?? SEED_BATCHES;
}

/** Insert a compost batch */
export async function insertCompostBatch(
  batch: Omit<CompostBatch, "id" | "created_at">
): Promise<CompostBatch | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("compost_batches")
    .insert(batch)
    .select()
    .single();
  if (error) {
    console.error("[supabase] insertCompostBatch:", error.message);
    return null;
  }
  return data as CompostBatch;
}

/** Save a plant scan result */
export async function insertPlantScan(
  scan: Omit<PlantScan, "id" | "created_at">
): Promise<PlantScan | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("plant_scans")
    .insert(scan)
    .select()
    .single();
  if (error) {
    console.error("[supabase] insertPlantScan:", error.message);
    return null;
  }
  return data as PlantScan;
}

/** Fetch chat messages for a session */
export async function fetchChatMessages(
  sessionId: string
): Promise<ChatMessage[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });
  if (error) {
    console.error("[supabase] fetchChatMessages:", error.message);
    return [];
  }
  return (data as ChatMessage[]) ?? [];
}

/** Save a chat message */
export async function insertChatMessage(
  msg: Omit<ChatMessage, "id" | "created_at">
): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from("chat_messages").insert(msg);
  if (error) console.error("[supabase] insertChatMessage:", error.message);
}

// ── Seed / Fallback Data ───────────────────────────────────────────────────
const today = new Date();
const daysAgo = (n: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() - n);
  return d.toISOString();
};

export const SEED_PLANTS: PolybagPlant[] = [
  {
    id: "seed-1",
    plant_name: "Cabai",
    polybag_size: "35cm",
    planted_date: daysAgo(42),
    compost_method: "Takakura",
    health_status: "Sehat",
    last_watered: daysAgo(1),
    notes: "Mulai berbunga minggu ini",
    created_at: daysAgo(42),
  },
  {
    id: "seed-2",
    plant_name: "Tomat",
    polybag_size: "40cm",
    planted_date: daysAgo(28),
    compost_method: "Kompos Aerob",
    health_status: "Perlu Perhatian",
    last_watered: daysAgo(2),
    notes: "Daun bawah agak menguning",
    created_at: daysAgo(28),
  },
  {
    id: "seed-3",
    plant_name: "Sawi",
    polybag_size: "30cm",
    planted_date: daysAgo(14),
    compost_method: "Pupuk Cair Lindi",
    health_status: "Sehat",
    last_watered: daysAgo(1),
    notes: null,
    created_at: daysAgo(14),
  },
];

export const SEED_BATCHES: CompostBatch[] = [
  {
    id: "batch-1",
    waste_source: "Sisa nasi & sayuran",
    weight_kg: 1.5,
    method: "Takakura",
    start_date: daysAgo(21),
    status: "Aktif",
    created_at: daysAgo(21),
  },
  {
    id: "batch-2",
    waste_source: "Kulit buah & ampas kopi",
    weight_kg: 0.8,
    method: "Pupuk Cair Lindi",
    start_date: daysAgo(14),
    status: "Aktif",
    created_at: daysAgo(14),
  },
  {
    id: "batch-3",
    waste_source: "Daun kering & sisa sayur",
    weight_kg: 2.0,
    method: "Kompos Aerob",
    start_date: daysAgo(30),
    status: "Selesai",
    created_at: daysAgo(30),
  },
];
