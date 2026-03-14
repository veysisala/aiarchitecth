/**
 * Merkezi API katmanı — Anthropic Claude çağrıları, hata ve API key yönetimi
 */

/** Geliştirmede Vite proxy; production'da Vercel /api/chat (CORS yok) */
const USE_PROXY = import.meta.env.DEV;
const ANTHROPIC_URL = USE_PROXY ? "/api/anthropic/v1/messages" : "/api/chat";
const ANTHROPIC_VERSION = "2023-06-01";
const STORAGE_KEY = "architect_ai_anthropic_api_key";

function getStoredKey(): string {
  try {
    return (localStorage.getItem(STORAGE_KEY) || "").trim();
  } catch {
    return "";
  }
}

function getApiKey(): string {
  return getStoredKey() || import.meta.env.VITE_ANTHROPIC_API_KEY?.trim() || "";
}

export function hasApiKey(): boolean {
  return getApiKey().length > 0;
}

/** Uygulama içinden kaydedilen API anahtarı (bir kez girilir, localStorage'da kalır) */
export function setApiKey(key: string): void {
  const v = (key || "").trim();
  try {
    if (v) localStorage.setItem(STORAGE_KEY, v);
    else localStorage.removeItem(STORAGE_KEY);
  } catch (_) {}
}

export function clearApiKey(): void {
  setApiKey("");
}

export type AnthropicResult<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export async function anthropicChat(
  messages: { role: "user" | "assistant"; content: string }[],
  options?: { system?: string; max_tokens?: number; model?: string }
): Promise<AnthropicResult<string>> {
  const key = getApiKey();
  if (!key) {
    return { ok: false, error: "API anahtarı gerekli. .env dosyasına VITE_ANTHROPIC_API_KEY ekleyin." };
  }

  try {
    const body: Record<string, unknown> = {
      model: options?.model || "claude-sonnet-4-20250514",
      max_tokens: options?.max_tokens ?? 1200,
      messages,
    };
    if (options?.system) body.system = options.system;

    const fetchOpts: RequestInit = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "",
    };

    if (USE_PROXY) {
      fetchOpts.headers = {
        "Content-Type": "application/json",
        "x-api-key": key,
        "anthropic-version": ANTHROPIC_VERSION,
      };
      fetchOpts.body = JSON.stringify(body);
    } else {
      (body as Record<string, unknown>).apiKey = key;
      fetchOpts.body = JSON.stringify(body);
    }

    const r = await fetch(ANTHROPIC_URL, fetchOpts);

    const j = await r.json();

    if (!r.ok) {
      const msg = j.error?.message || j.message || `HTTP ${r.status}`;
      if (r.status === 401) return { ok: false, error: "Geçersiz API anahtarı." };
      if (r.status === 429) return { ok: false, error: "Kota aşıldı. Daha sonra tekrar deneyin." };
      return { ok: false, error: msg };
    }

    const text = j.content?.[0]?.text ?? "";
    return { ok: true, data: text };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Bağlantı hatası.";
    return { ok: false, error: message };
  }
}

/** JSON yanıt parse et; hata olursa güvenli varsayılan döner */
export function parseJsonSafe<T>(raw: string, fallback: T): T {
  try {
    const cleaned = raw.replace(/```json|```/g, "").trim();
    return JSON.parse(cleaned) as T;
  } catch {
    return fallback;
  }
}

// ─── Görsel üretimi (Claude ile SVG) ───
export type ImageResult = { ok: true; url: string } | { ok: false; error: string };

const SVG_SYSTEM = `You are an expert at creating minimal, professional SVG illustrations for architecture and interior design.
Reply with exactly one valid SVG element: <svg>...</svg>.
- No markdown, no code fences, no explanation before or after.
- Use viewBox="0 0 400 300" or similar. Use simple shapes: rect, line, path, circle, polygon.
- Clean, schematic style (floor plan, elevation or conceptual diagram). Single color strokes/fills.`;

/** Claude ile mimari konsept için SVG görsel üretir; data URL olarak döner. */
export async function generateImage(prompt: string): Promise<ImageResult> {
  if (!getApiKey()) {
    return { ok: false, error: "Görsel için API anahtarı gerekli (🔑 menüden Anthropic)." };
  }
  const userContent = `Generate a single SVG illustration for this architectural concept. Output only the SVG code, no markdown, no explanation.\n\nConcept: ${prompt.slice(0, 3000)}`;
  const out = await anthropicChat(
    [{ role: "user", content: userContent }],
    { system: SVG_SYSTEM, max_tokens: 2500 }
  );
  if (!out.ok) return { ok: false, error: out.error };
  let raw = (out.data || "").trim();
  const codeBlock = /```(?:svg)?\s*([\s\S]*?)```/i.exec(raw);
  if (codeBlock) raw = codeBlock[1].trim();
  if (!raw.includes("<svg")) return { ok: false, error: "Claude görsel (SVG) üretemedi." };
  const start = raw.indexOf("<svg");
  const end = raw.lastIndexOf("</svg>") + 6;
  const svg = start >= 0 && end > start ? raw.slice(start, end) : raw;
  const dataUrl = "data:image/svg+xml," + encodeURIComponent(svg);
  return { ok: true, url: dataUrl };
}
