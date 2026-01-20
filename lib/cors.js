/**
 * CORS 設定處理
 * 提供統一的 CORS 頭部設定和 preflight 響應
 */

export function setCorsHeaders(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

export function handlePreflightRequest(req, res) {
  if (req.method === "OPTIONS") {
    setCorsHeaders(res);
    return res.status(204).end();
  }
  return false;
}
