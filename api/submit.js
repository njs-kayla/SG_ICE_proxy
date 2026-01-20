export default async function handler(req, res) {
  // ✅ CORS（你的 FTP / localhost 都能打）
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // ✅ Preflight
  if (req.method === "OPTIONS") return res.status(204).end();

  // ✅ GET：顯示狀態頁（讓你一眼確認 Proxy 活著）
  if (req.method === "GET") {
    const hasEnv = Boolean(process.env.GAS_WEBAPP_URL);
    const gasUrlMasked = maskUrl(process.env.GAS_WEBAPP_URL || "");

    res.setHeader("Content-Type", "text/html; charset=utf-8");

    return res.status(200).send(`
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>ICE Proxy Status</title>
  <style>
    body{font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto; background:#0b0b0f; color:#fff; padding:24px;}
    .card{max-width:820px; margin:0 auto; background:#151521; border:1px solid #2a2a40; border-radius:16px; padding:20px;}
    .row{display:flex; gap:12px; align-items:center; flex-wrap:wrap;}
    .badge{display:inline-flex; align-items:center; gap:8px; padding:6px 10px; border-radius:999px; font-size:12px;}
    .ok{background:rgba(34,197,94,.15); border:1px solid rgba(34,197,94,.35);}
    .warn{background:rgba(234,179,8,.15); border:1px solid rgba(234,179,8,.35);}
    .muted{color:#b8b8d0;}
    code{background:#0f0f17; border:1px solid #2a2a40; padding:2px 6px; border-radius:8px;}
    button{cursor:pointer; border:0; padding:10px 14px; border-radius:12px; background:#4f46e5; color:#fff; font-weight:600;}
    button:active{transform:translateY(1px);}
    .grid{display:grid; grid-template-columns:1fr; gap:12px; margin-top:14px;}
    textarea{width:100%; min-height:140px; background:#0f0f17; color:#fff; border:1px solid #2a2a40; border-radius:12px; padding:12px;}
    .small{font-size:12px;}
  </style>
</head>
<body>
  <div class="card">
    <div class="row" style="justify-content:space-between;">
      <div>
        <h2 style="margin:0 0 6px;">✅ ICE Vercel Proxy is running</h2>
        <div class="muted small">This endpoint proxies requests to Google Apps Script (GAS).</div>
      </div>
      <div class="badge ${hasEnv ? "ok" : "warn"}">
        ${hasEnv ? "ENV: GAS_WEBAPP_URL OK" : "ENV: GAS_WEBAPP_URL MISSING"}
      </div>
    </div>

    <div class="grid">
      <div>
        <div class="muted small">GAS_WEBAPP_URL (masked)</div>
        <div><code>${escapeHtml(gasUrlMasked || "Not set")}</code></div>
      </div>

      <div>
        <div class="muted small">How to use (Frontend)</div>
        <div class="small">
          POST to <code>/api/submit</code> using <code>URLSearchParams</code> or <code>x-www-form-urlencoded</code>.
        </div>
      </div>

      <div>
        <div class="muted small">Quick Test (runs in your browser)</div>
        <button id="btn">Send Test POST</button>
        <div class="muted small" style="margin-top:8px;">
          This sends a sample payload to <code>/api/submit</code> and shows the JSON response below.
        </div>
      </div>

      <div>
        <div class="muted small">Response</div>
        <textarea id="out" readonly>Click "Send Test POST" to test…</textarea>
      </div>
    </div>
  </div>

<script>
  const btn = document.getElementById("btn");
  const out = document.getElementById("out");

  btn.addEventListener("click", async () => {
    out.value = "Sending...";

    try {
      const body = new URLSearchParams();
      body.set("name", "Proxy Test");
      body.set("email", "proxy-test@example.com");
      body.set("company", "SPADEGAMING");
      body.set("phone", "0900000000");
      body.set("message", "Hello from Proxy GET page!");
      body.set("raffle_code", "TEST-" + Math.random().toString(16).slice(2, 8).toUpperCase());

      const res = await fetch("/api/submit", { method: "POST", body });
      const data = await res.json();
      out.value = JSON.stringify(data, null, 2);
    } catch (e) {
      out.value = "❌ Error: " + (e && e.message ? e.message : String(e));
    }
  });
</script>
</body>
</html>
    `);
  }

  // ✅ POST：正常代理轉發到 GAS
  if (req.method === "POST") {
    try {
      const WEBAPP_URL = process.env.GAS_WEBAPP_URL;
      if (!WEBAPP_URL) {
        return res.status(500).json({ ok: false, msg: "Missing GAS_WEBAPP_URL" });
      }

      const raw = await readRawBody(req);
      const contentType = req.headers["content-type"] || "application/x-www-form-urlencoded";

      const forwardResp = await fetch(WEBAPP_URL, {
        method: "POST",
        headers: { "content-type": contentType },
        body: raw,
        redirect: "follow",
      });

      const text = await forwardResp.text();

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

  // 其他方法
  return res.status(405).json({ ok: false, msg: "Method not allowed" });
}


// -------- helpers --------
function readRawBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}

function maskUrl(url) {
  if (!url) return "";
  // 隱藏中間段避免整條暴露
  if (url.length <= 30) return url;
  return url.slice(0, 18) + "..." + url.slice(-10);
}

function escapeHtml(s) {
  return String(s || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}