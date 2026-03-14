/**
 * Vercel serverless — OpenAI DALL·E 3 ile mimari görsel üretir.
 * Body: { apiKey, prompt }
 */

export default async function handler(req: any, res: any): Promise<void> {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { apiKey, prompt } = (req.body || {}) as { apiKey?: string; prompt?: string };

  if (!apiKey?.trim() || !prompt?.trim()) {
    return res.status(400).json({ error: "apiKey and prompt required" });
  }

  try {
    const r = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey.trim()}`,
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt: prompt.trim().slice(0, 4000),
        n: 1,
        size: "1024x1024",
        quality: "standard",
        response_format: "url",
      }),
    });

    const j = await r.json();

    if (!r.ok) {
      return res.status(r.status).json(j);
    }

    const url = j.data?.[0]?.url;
    if (!url) {
      return res.status(500).json({ error: "No image URL in response" });
    }
    res.status(200).json({ url });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to fetch";
    res.status(500).json({ error: msg });
  }
}
