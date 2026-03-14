/**
 * Vercel serverless — Kie AI (gpt4o-image) ile görsel üretir.
 * Body: { apiKey, prompt }
 * Async: create task → poll record-info → return image URL
 */

const KIE_CREATE = "https://api.kie.ai/api/v1/gpt4o-image/generate";
const KIE_RECORD = "https://api.kie.ai/api/v1/gpt4o-image/record-info";
const POLL_INTERVAL_MS = 2500;
const MAX_POLLS = 48; // ~2 min

export default async function handler(req: any, res: any): Promise<void> {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { apiKey, prompt } = (req.body || {}) as { apiKey?: string; prompt?: string };

  if (!apiKey?.trim() || !prompt?.trim()) {
    return res.status(400).json({ error: "apiKey and prompt required" });
  }

  const key = apiKey.trim();
  const promptText = prompt.trim().slice(0, 4000);

  try {
    const createRes = await fetch(KIE_CREATE, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        prompt: promptText,
        size: "1:1",
        nVariants: 1,
      }),
    });

    const createJson = await createRes.json();
    if (!createRes.ok || createJson.code !== 200) {
      return res.status(createRes.status).json(createJson);
    }

    const taskId = createJson.data?.taskId;
    if (!taskId) {
      return res.status(500).json({ error: "No taskId in Kie response" });
    }

    for (let i = 0; i < MAX_POLLS; i++) {
      await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));

      const recordRes = await fetch(`${KIE_RECORD}?taskId=${encodeURIComponent(taskId)}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${key}` },
      });

      const recordJson = await recordRes.json();
      if (!recordRes.ok || recordJson.code !== 200) {
        return res.status(recordRes.status).json(recordJson);
      }

      const data = recordJson.data;
      const successFlag = data?.successFlag;

      if (successFlag === 1) {
        const urls = data?.response?.result_urls;
        const url = Array.isArray(urls) && urls.length > 0 ? urls[0] : null;
        if (url) {
          return res.status(200).json({ url });
        }
        return res.status(500).json({ error: "No image URL in Kie result" });
      }

      if (successFlag === 2) {
        const msg = data?.errorMessage || "Kie AI generation failed";
        return res.status(500).json({ error: msg });
      }
    }

    res.status(408).json({ error: "Kie AI timeout: image not ready in time" });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to call Kie AI";
    res.status(500).json({ error: msg });
  }
}
