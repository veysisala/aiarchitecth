/**
 * Vercel serverless proxy — tarayıcı CORS olmadan Anthropic API'yi bu route üzerinden çağırır.
 * İstek gövdesi: { apiKey, messages, system?, max_tokens?, model? }
 */

export default async function handler(req: any, res: any): Promise<void> {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { apiKey, messages, system, max_tokens, model } = (req.body || {}) as {
    apiKey?: string;
    messages?: { role: string; content: string }[];
    system?: string;
    max_tokens?: number;
    model?: string;
  };

  if (!apiKey?.trim() || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "apiKey and messages required" });
  }

  try {
    const body: Record<string, unknown> = {
      model: model || "claude-sonnet-4-20250514",
      max_tokens: max_tokens ?? 1200,
      messages,
    };
    if (system) body.system = system;

    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey.trim(),
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(body),
    });

    const j = await r.json();
    res.status(r.status).json(j);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to fetch";
    res.status(500).json({ error: msg });
  }
}
