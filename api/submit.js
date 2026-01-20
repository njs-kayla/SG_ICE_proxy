export default async function handler(req, res) {
  // ✅ CORS（你之後可以把 * 改成你的正式網域更安全）
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ ok: false, msg: "Method not allowed" });

  try {
    const WEBAPP_URL = process.env.GAS_WEBAPP_URL;
    if (!WEBAPP_URL) {
      return res.status(500).json({ ok: false, msg: "Missing GAS_WEBAPP_URL" });
    }

    // ✅ 讀 raw body（兼容 Vercel function）
    const raw = await readRawBody(req);

    // ✅ 轉發給 GAS（用同樣的 content-type 轉過去）
    const contentType = req.headers["content-type"] || "application/x-www-form-urlencoded";

    const forwardResp = await fetch(WEBAPP_URL, {
      method: "POST",
      headers: {
        "content-type": contentType,
      },
      body: raw,
      redirect: "follow",
    });

    const text = await forwardResp.text();

    // ✅ 保證回 JSON
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch (_) {
      data = null;
    }

    if (!data) {
      return res.status(502).json({
        ok: false,
        msg: "GAS returned non-JSON",
        raw: text?.slice?.(0, 200) || "",
      });
    }

    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ ok: false, msg: String(err?.message || err) });
  }
}

// ✅ helper：讀 raw body
function readRawBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}
